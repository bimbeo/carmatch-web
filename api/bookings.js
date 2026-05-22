import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

function generateRef() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CM-${date}-${rand}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Dịch vụ chưa khả dụng' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const required = ['car_name', 'customer_name', 'customer_phone', 'pickup_date', 'pickup_hour', 'return_date', 'return_hour', 'delivery_mode', 'total_amount'];
  for (const f of required) {
    if (!body?.[f] && body?.[f] !== 0) return res.status(400).json({ error: `Missing field: ${f}` });
  }

  const depositAmount = Math.max(200_000, Math.round(body.total_amount * 0.3 / 10_000) * 10_000);
  const bookingRef = generateRef();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('web_bookings').insert({
    booking_ref: bookingRef,
    vehicle_id: body.vehicle_id || null,
    car_name: body.car_name,
    customer_name: body.customer_name.trim(),
    customer_phone: body.customer_phone.trim(),
    customer_note: body.customer_note || null,
    pickup_date: body.pickup_date,
    pickup_hour: body.pickup_hour,
    return_date: body.return_date,
    return_hour: body.return_hour,
    delivery_mode: body.delivery_mode,
    location_name: body.location_name || null,
    base_amount: body.base_amount,
    delivery_fee: body.delivery_fee || 0,
    promo_code: body.promo_code || null,
    promo_discount: body.promo_discount || 0,
    total_amount: body.total_amount,
    deposit_amount: depositAmount,
  });

  if (error) {
    console.error('[bookings] Supabase error:', error.message);
    return res.status(500).json({ error: 'Không thể tạo đơn đặt xe, vui lòng thử lại' });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ bookingRef, depositAmount });
}
