import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Prefer service role key (bypasses RLS). Falls back to anon key if not configured.
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

// Event types that should appear as "blocked" to customers
const BLOCKING_TYPES = new Set([
  'rental',
  'blocked',
  'maintenance',
  'cleaning',
  'inspection',
  'transfer',
  'charging',
]);

// Statuses that mean the slot is definitely taken
const ACTIVE_STATUSES = ['planned', 'confirmed', 'in_progress', 'completed'];

/**
 * GET /api/vehicle-availability?vehicleId=UUID&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Public endpoint — returns only date ranges + event type. No PII.
 * Cached 2 min at edge, stale-while-revalidate 5 min.
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { vehicleId, from, to } = req.query;

  if (!vehicleId) {
    return res.status(400).json({ error: 'vehicleId is required' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Gracefully return empty when not configured (dev fallback)
    return res.status(200).json({ blockedRanges: [] });
  }

  // Default window: today → 90 days ahead
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDays = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
  const fromDate = from || today;
  const toDate = to || ninetyDays;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('vehicle_schedule_events')
      .select('event_type, starts_at, ends_at, all_day, status')
      .eq('vehicle_id', vehicleId)
      .in('status', ACTIVE_STATUSES)
      .lt('starts_at', `${toDate}T23:59:59Z`)
      .gt('ends_at', `${fromDate}T00:00:00Z`)
      .order('starts_at');

    if (error) {
      console.error('[vehicle-availability] Supabase error:', error.message);
      return res.status(200).json({ blockedRanges: [] }); // graceful fallback
    }

    const blockedRanges = (data || [])
      .filter((e) => BLOCKING_TYPES.has(e.event_type))
      .map((e) => ({
        from: e.starts_at.slice(0, 10),
        to: e.ends_at.slice(0, 10),
        type: e.event_type,
        allDay: e.all_day,
      }));

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({ blockedRanges });
  } catch (err) {
    console.error('[vehicle-availability] Error:', err?.message);
    return res.status(200).json({ blockedRanges: [] }); // always graceful
  }
}
