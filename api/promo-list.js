import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const totalAmount = Number(req.query.total || 0);

  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(200).json({ promos: [] });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('promo_codes')
    .select('code, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, active')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[promo-list] Supabase error:', error.message);
    return res.status(200).json({ promos: [] });
  }

  const now = new Date();

  const promos = (data || []).map(p => {
    let applicable = true;
    let reason = null;

    if (p.expires_at && new Date(p.expires_at) < now) {
      applicable = false;
      reason = 'Đã hết hạn';
    } else if (p.max_uses !== null && p.max_uses !== undefined && Number(p.used_count || 0) >= Number(p.max_uses)) {
      applicable = false;
      reason = 'Đã hết lượt sử dụng';
    } else if (p.min_order_amount && totalAmount > 0 && totalAmount < Number(p.min_order_amount)) {
      applicable = false;
      reason = `Đơn tối thiểu ${Number(p.min_order_amount).toLocaleString('vi-VN')}đ`;
    }

    const discountValue = Number(p.discount_value || 0);
    let discountAmount = 0;
    if (applicable && totalAmount > 0) {
      if (p.discount_type === 'percent') {
        discountAmount = Math.round((totalAmount * discountValue) / 100 / 10000) * 10000;
      } else {
        discountAmount = discountValue;
      }
      discountAmount = Math.max(0, Math.min(discountAmount, totalAmount));
    }

    const description = p.discount_type === 'percent'
      ? `Giảm ${discountValue}%`
      : `Giảm ${Number(discountValue).toLocaleString('vi-VN')}đ`;

    let expiresWarning = null;
    if (p.expires_at && applicable) {
      const daysLeft = Math.ceil((new Date(p.expires_at) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && daysLeft > 0) expiresWarning = `Hết hạn sau ${daysLeft} ngày`;
    }

    return {
      code: p.code,
      discount_type: p.discount_type,
      discount_value: discountValue,
      discount_amount: discountAmount,
      description,
      applicable,
      reason,
      expires_warning: expiresWarning,
    };
  });

  promos.sort((a, b) => Number(b.applicable) - Number(a.applicable));

  return res.status(200).json({ promos });
}
