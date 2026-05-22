import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * POST /api/promo-validate
 * Body: { code: string, orderTotal: number }
 * Response: { valid: true, discount: number, description: string, code: string }
 *        or { valid: false, error: string }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ valid: false, error: 'Method not allowed' });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({ valid: false, error: 'Dịch vụ chưa khả dụng' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ valid: false, error: 'Invalid JSON' });
  }

  const code = (body?.code || '').toString().trim().toUpperCase();
  const orderTotal = Number(body?.orderTotal) || 0;
  const shouldCountUsage = body?.countUsage !== false;

  if (!code) return res.status(400).json({ valid: false, error: 'Vui lòng nhập mã' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('[promo-validate] Supabase error:', error.message);
    return res.status(200).json({ valid: false, error: 'Lỗi hệ thống, thử lại sau' });
  }

  if (!data) {
    return res.status(200).json({ valid: false, error: 'Mã khuyến mãi không tồn tại hoặc đã hết hạn' });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(200).json({ valid: false, error: 'Mã khuyến mãi đã hết hạn' });
  }

  if (data.uses_limit !== null && data.uses_count >= data.uses_limit) {
    return res.status(200).json({ valid: false, error: 'Mã khuyến mãi đã hết lượt sử dụng' });
  }

  if (orderTotal < (data.min_order || 0)) {
    const minFmt = (data.min_order || 0).toLocaleString('vi-VN') + 'đ';
    return res.status(200).json({ valid: false, error: `Đơn hàng tối thiểu ${minFmt} để áp dụng mã này` });
  }

  let discount = 0;
  if (data.discount_type === 'percent') {
    discount = Math.round(orderTotal * data.discount_value / 100);
    if (data.max_discount) discount = Math.min(discount, data.max_discount);
  } else {
    discount = Math.min(data.discount_value, orderTotal);
  }

  if (shouldCountUsage) {
    supabase
      .from('promo_codes')
      .update({ uses_count: data.uses_count + 1 })
      .eq('id', data.id)
      .then(({ error }) => {
        if (error) console.error('[promo-validate] Failed to increment uses_count:', error.message);
      });
  }

  let expiresInDays = null;
  if (data.expires_at) {
    expiresInDays = Math.ceil((new Date(data.expires_at) - new Date()) / 86_400_000);
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    valid: true,
    code: data.code,
    description: data.description,
    discount,
    expiresInDays,
  });
}
