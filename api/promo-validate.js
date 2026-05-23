import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

function formatVND(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const code = String(req.query.code || '').trim().toUpperCase();
  const totalAmount = Number(req.query.total || 0);

  if (!code) return res.status(400).json({ error: 'Mã không hợp lệ' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('promo_codes')
    .select('code, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, active')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('[promo-validate] Supabase error:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống, thử lại sau' });
  }

  if (!data) return res.status(404).json({ error: 'Mã không hợp lệ' });

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Mã đã hết hạn' });
  }

  const maxUses = data.max_uses;
  const usedCount = Number(data.used_count || 0);
  if (maxUses !== null && maxUses !== undefined && usedCount >= Number(maxUses)) {
    return res.status(400).json({ error: 'Mã đã hết lượt sử dụng' });
  }

  const minOrderAmount = data.min_order_amount === null || data.min_order_amount === undefined
    ? null
    : Number(data.min_order_amount);
  if (minOrderAmount !== null && totalAmount < minOrderAmount) {
    return res.status(400).json({ error: `Đơn tối thiểu ${formatVND(minOrderAmount)}` });
  }

  const discountValue = Number(data.discount_value || 0);
  let discountAmount = 0;
  if (data.discount_type === 'percent') {
    discountAmount = Math.round((totalAmount * discountValue) / 100 / 10000) * 10000;
  } else {
    discountAmount = discountValue;
  }
  discountAmount = Math.max(0, Math.min(discountAmount, totalAmount));

  return res.status(200).json({
    code: data.code,
    discount_type: data.discount_type,
    discount_value: discountValue,
    discount_amount: discountAmount,
  });
}
