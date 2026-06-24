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
const DEFAULT_TIMEZONE_OFFSET = '+07:00';

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayInVietnam() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateToStartAt(dateString) {
  return `${dateString}T00:00:00${DEFAULT_TIMEZONE_OFFSET}`;
}

function dateToExclusiveEndAt(dateString) {
  return `${addDays(dateString, 1)}T00:00:00${DEFAULT_TIMEZONE_OFFSET}`;
}

function datePartInVietnam(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text.slice(0, 10);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

/**
 * GET /api/vehicle-availability?vehicleId=UUID&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Public endpoint — returns only date ranges + event type. No PII.
 * Dynamic: availability must reflect admin calendar changes immediately.
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

  // Default window: today → 90 days ahead, in Vietnam local dates.
  const today = todayInVietnam();
  const ninetyDays = addDays(today, 90);
  const fromDate = from || today;
  const toDate = to || ninetyDays;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('vehicle_schedule_events')
      .select('event_type, starts_at, ends_at, all_day, status, note, location_text')
      .eq('vehicle_id', vehicleId)
      .in('status', ACTIVE_STATUSES)
      .lt('starts_at', dateToExclusiveEndAt(toDate))
      .gt('ends_at', dateToStartAt(fromDate))
      .order('starts_at');

    if (error) {
      console.error('[vehicle-availability] Supabase error:', error.message);
      return res.status(200).json({ blockedRanges: [] }); // graceful fallback
    }

    const blockedRanges = (data || [])
      .filter((e) => {
        // Exclude internal cost-tracking entries created by /vehicle-assignment-review.
        // These have note='FALSE' and location_text='Chi phí' — they are NOT real customer bookings.
        if (e.note === 'FALSE' || e.location_text === 'Chi phí') return false;
        return BLOCKING_TYPES.has(e.event_type);
      })
      .map((e) => ({
        from: datePartInVietnam(e.starts_at),
        to: e.ends_at ? addDays(datePartInVietnam(e.ends_at), -1) : datePartInVietnam(e.starts_at),
        type: e.event_type,
        allDay: e.all_day,
      }));

    // Count website_leads (customer bookings) in last 7 days for social proof
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('website_leads')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .gte('created_at', sevenDaysAgo);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ blockedRanges, recent_bookings_count: recentCount || 0 });
  } catch (err) {
    console.error('[vehicle-availability] Error:', err?.message);
    return res.status(200).json({ blockedRanges: [] }); // always graceful
  }
}
