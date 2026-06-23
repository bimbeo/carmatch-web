import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PTS-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Thiếu số điện thoại' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalized = String(phone).replace(/^0/, '84');

  // Find customer
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('id, full_name')
    .or(`phone.eq.${phone},phone.eq.${normalized},normalized_phone.eq.${normalized}`)
    .eq('status', 'active')
    .maybeSingle();

  if (custErr || !customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  // Load points settings
  const { data: settings } = await supabase
    .from('points_settings')
    .select('redeem_points, redeem_value, enabled')
    .limit(1)
    .maybeSingle();

  const redeemPoints = settings?.redeem_points ?? 200;
  const redeemValue = settings?.redeem_value ?? 50000;

  if (!settings?.enabled) return res.status(400).json({ error: 'Tính năng điểm tạm thời không hoạt động' });

  // Check current balance
  const { data: ledger } = await supabase
    .from('customer_points_ledger')
    .select('points')
    .eq('customer_id', customer.id);

  const balance = (ledger || []).reduce((s, r) => s + Number(r.points || 0), 0);
  if (balance < redeemPoints) {
    return res.status(400).json({ error: `Cần ít nhất ${redeemPoints} điểm để đổi (hiện có ${balance} điểm)` });
  }

  // Calculate how many multiples to redeem (redeem all available multiples at once)
  const multiples = Math.floor(balance / redeemPoints);
  const pointsToRedeem = multiples * redeemPoints;
  const discountValue = multiples * redeemValue;

  // Generate unique code
  let code = generateCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase.from('promo_codes').select('code').eq('code', code).maybeSingle();
    if (!existing) break;
    code = generateCode();
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  // Deduct points first
  const { error: deductErr } = await supabase.from('customer_points_ledger').insert({
    customer_id: customer.id,
    points: -pointsToRedeem,
    type: 'redeem',
    description: `Đổi ${pointsToRedeem} điểm lấy mã giảm giá ${code}`,
  });

  if (deductErr) {
    console.error('[customer-points-redeem] deduct error:', deductErr.message);
    return res.status(500).json({ error: 'Lỗi hệ thống, thử lại sau' });
  }

  // Create promo code
  const { error: promoErr } = await supabase.from('promo_codes').insert({
    code,
    description: `Điểm tích lũy - ${customer.full_name || phone}`,
    discount_type: 'fixed',
    discount_value: discountValue,
    uses_limit: 1,
    uses_count: 0,
    active: true,
    secret_only: true,
    phone_restriction: String(phone),
    expires_at: expiresAt,
  });

  if (promoErr) {
    console.error('[customer-points-redeem] promo insert error:', promoErr.message);
    // Rollback points deduction
    await supabase.from('customer_points_ledger').insert({
      customer_id: customer.id,
      points: pointsToRedeem,
      type: 'earn',
      description: `Hoàn điểm do lỗi tạo mã giảm giá`,
    });
    return res.status(500).json({ error: 'Lỗi tạo mã giảm giá, điểm chưa bị trừ' });
  }

  return res.status(200).json({
    code,
    points_redeemed: pointsToRedeem,
    discount_value: discountValue,
    expires_at: expiresAt,
    new_balance: balance - pointsToRedeem,
  });
}
