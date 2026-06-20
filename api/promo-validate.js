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
  const customerPhone = String(req.query.phone || '').trim();
  const pickupDate = String(req.query.pickup_date || '').trim();

  if (!code) return res.status(400).json({ error: 'Mã không hợp lệ' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('promo_codes')
    .select('code, discount_type, discount_value, max_discount, min_order, uses_limit, uses_count, expires_at, active, first_time_only, weekends_only')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('[promo-validate] Supabase error:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống, thử lại sau' });
  }

  // Không tìm thấy promo code → thử tra referral code của khách hàng
  if (!data) {
    const { data: referrer, error: refError } = await supabase
      .from('customers')
      .select('id, full_name, referral_code')
      .eq('referral_code', code)
      .eq('status', 'active')
      .maybeSingle();

    if (refError) {
      console.error('[promo-validate] Referral lookup error:', refError.message);
      return res.status(500).json({ error: 'Lỗi hệ thống, thử lại sau' });
    }

    if (!referrer) return res.status(404).json({ error: 'Mã không hợp lệ' });

    const referralDiscount = Number(process.env.REFERRAL_DISCOUNT_AMOUNT || 50000);
    const discountAmount = Math.max(0, Math.min(referralDiscount, totalAmount));
    return res.status(200).json({
      code: referrer.referral_code,
      discount_type: 'referral',
      discount_value: referralDiscount,
      max_discount: null,
      discount_amount: discountAmount,
      referrer_id: referrer.id,
      referrer_name: referrer.full_name,
    });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Mã đã hết hạn' });
  }

  const usesLimit = data.uses_limit;
  const usesCount = Number(data.uses_count || 0);
  if (usesLimit !== null && usesLimit !== undefined && usesCount >= Number(usesLimit)) {
    return res.status(400).json({ error: 'Mã đã hết lượt sử dụng' });
  }

  const minOrder = data.min_order === null || data.min_order === undefined ? null : Number(data.min_order);
  if (minOrder !== null && minOrder > 0 && totalAmount < minOrder) {
    return res.status(400).json({ error: `Đơn tối thiểu ${formatVND(minOrder)}` });
  }

  // Weekends-only rule
  if (data.weekends_only && pickupDate) {
    const day = new Date(pickupDate).getDay();
    if (day !== 0 && day !== 6) {
      return res.status(400).json({ error: 'Mã chỉ áp dụng cho đặt xe cuối tuần (Thứ 7 & Chủ nhật)' });
    }
  }

  // First-time-only rule
  if (data.first_time_only && customerPhone) {
    const normalizedPhone = customerPhone.replace(/[\s\-().+]/g, '').replace(/^0/, '84');
    const { count } = await supabase
      .from('website_leads')
      .select('id', { count: 'exact', head: true })
      .or(`phone.eq.${customerPhone},phone.eq.${normalizedPhone}`);
    if (count && count > 0) {
      return res.status(400).json({ error: 'Mã chỉ dành cho khách đặt xe lần đầu' });
    }
  }

  const discountValue = Number(data.discount_value || 0);
  const maxDiscount = data.max_discount ? Number(data.max_discount) : null;

  let discountAmount = 0;
  if (data.discount_type === 'percent') {
    discountAmount = Math.round((totalAmount * discountValue) / 100 / 10000) * 10000;
    if (maxDiscount !== null) discountAmount = Math.min(discountAmount, maxDiscount);
  } else {
    discountAmount = discountValue;
  }
  discountAmount = Math.max(0, Math.min(discountAmount, totalAmount));

  return res.status(200).json({
    code: data.code,
    discount_type: data.discount_type,
    discount_value: discountValue,
    max_discount: maxDiscount,
    discount_amount: discountAmount,
  });
}
