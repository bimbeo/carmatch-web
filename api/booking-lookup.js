import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { ref } = req.query;
  if (!ref || typeof ref !== 'string') return res.status(400).json({ error: 'Missing ref' });

  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('website_leads')
    .select('booking_ref, name, phone, car_model, duration, deposit_amount, note, status, created_at, building')
    .eq('booking_ref', ref.trim().toUpperCase())
    .eq('form_type', 'booking')
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Lỗi tra cứu' });
  if (!data) return res.status(404).json({ error: 'Không tìm thấy đơn đặt xe này' });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(data);
}
