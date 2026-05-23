import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const ALLOWED_STATUSES = new Set(['confirmed', 'completed', 'cancelled']);

function isAuthorized(pin) {
  return Boolean(process.env.ADMIN_PIN) && String(pin || '') === process.env.ADMIN_PIN;
}

function endOfDate(dateStr) {
  return `${dateStr}T23:59:59.999Z`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { pin } = req.query;
  if (!isAuthorized(pin)) return res.status(401).json({ error: 'Unauthorized' });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Service unavailable' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'GET') {
    const { status, from, to } = req.query;
    let query = supabase
      .from('website_leads')
      .select('booking_ref, deposit_amount, source, name, phone, customer_type, form_type, quantity, duration, car_model, building, note, status, created_at')
      .eq('form_type', 'booking')
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') query = query.eq('status', status);
    if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`);
    if (to) query = query.lte('created_at', endOfDate(to));

    const { data, error } = await query;
    if (error) {
      console.error('[admin-bookings] GET error:', error.message);
      return res.status(500).json({ error: 'Không thể tải danh sách booking' });
    }

    return res.status(200).json(data || []);
  }

  if (req.method === 'PATCH') {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const bookingRef = String(body?.booking_ref || '').trim().toUpperCase();
    const nextStatus = String(body?.status || '').trim();
    if (!bookingRef) return res.status(400).json({ error: 'Missing booking_ref' });
    if (!ALLOWED_STATUSES.has(nextStatus)) return res.status(400).json({ error: 'Invalid status' });

    const { data, error } = await supabase
      .from('website_leads')
      .update({ status: nextStatus })
      .eq('form_type', 'booking')
      .eq('booking_ref', bookingRef)
      .select('booking_ref, deposit_amount, source, name, phone, customer_type, form_type, quantity, duration, car_model, building, note, status, created_at')
      .maybeSingle();

    if (error) {
      console.error('[admin-bookings] PATCH error:', error.message);
      return res.status(500).json({ error: 'Không thể cập nhật trạng thái' });
    }
    if (!data) return res.status(404).json({ error: 'Không tìm thấy booking' });

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
