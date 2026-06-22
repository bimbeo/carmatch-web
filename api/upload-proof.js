import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { booking_ref, file_base64, file_name } = body || {};
  if (!booking_ref || !file_base64) {
    return res.status(400).json({ error: 'Missing booking_ref or file_base64' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Decode base64 → buffer
  const base64Clean = file_base64.replace(/^data:image\/[a-z+]+;base64,/i, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  const ext = (file_name?.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const safeName = booking_ref.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${safeName}.${ext}`;

  const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
  const contentType = mimeMap[ext] || 'image/jpeg';

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(path, buffer, { contentType, upsert: true });

  if (uploadError) {
    console.error('[upload-proof] Storage error:', uploadError.message);
    return res.status(500).json({ error: 'Upload thất bại, vui lòng thử lại' });
  }

  const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path);

  // Lưu URL vào website_leads
  await supabase.from('website_leads')
    .update({ payment_proof_url: publicUrl })
    .eq('booking_ref', booking_ref.trim().toUpperCase());

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ url: publicUrl });
}
