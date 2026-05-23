import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

function parseDateTimePart(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (isoMatch) {
    const [, y, m, d, hh = '20', mm = '00'] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
  }

  const vnMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (vnMatch) {
    const [, d, m, y, hh = '20', mm = '00'] = vnMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDuration(duration) {
  const [fromRaw, toRaw] = String(duration || '').split('→').map(part => part.trim());
  if (!fromRaw || !toRaw) return null;
  const from = parseDateTimePart(fromRaw);
  const to = parseDateTimePart(toRaw);
  return from && to ? { from, to } : null;
}

function requestedDateAt20(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return null;
  return parseDateTimePart(`${dateString} 20:00`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pickup = req.query.pickup;
  const returnDate = req.query.return;
  const requestedPickup = requestedDateAt20(pickup);
  const requestedReturn = requestedDateAt20(returnDate);

  if (!requestedPickup || !requestedReturn || requestedReturn <= requestedPickup) {
    return res.status(400).json({ error: 'Invalid date range' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({ unavailable_models: [] });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('website_leads')
      .select('car_model, duration')
      .eq('form_type', 'booking')
      .not('status', 'in', '("cancelled","completed")');

    if (error) {
      console.error('[availability] Supabase error:', error.message);
      return res.status(500).json({ error: 'Không kiểm tra được lịch xe' });
    }

    const unavailable = new Set();
    for (const row of data || []) {
      if (!row.car_model || !row.duration) continue;
      const existing = parseDuration(row.duration);
      if (!existing) continue;
      if (existing.from < requestedReturn && existing.to > requestedPickup) {
        unavailable.add(row.car_model);
      }
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ unavailable_models: Array.from(unavailable) });
  } catch (err) {
    console.error('[availability] Error:', err?.message);
    return res.status(500).json({ error: 'Không kiểm tra được lịch xe' });
  }
}
