import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const TIER_DISCOUNTS_FALLBACK = {
  vip: Number(process.env.VIP_DISCOUNT_AMOUNT || 100000),
  returning: Number(process.env.RETURNING_DISCOUNT_AMOUNT || 50000),
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PTS-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function handleRedeem(req, res) {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Thiếu số điện thoại' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalized = String(phone).replace(/^0/, '84');

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('id, full_name, company_id')
    .or(`phone.eq.${phone},phone.eq.${normalized},normalized_phone.eq.${normalized}`)
    .eq('status', 'active')
    .maybeSingle();

  if (custErr || !customer) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });

  const { data: settings } = await supabase
    .from('points_settings')
    .select('redeem_points, redeem_value, enabled')
    .limit(1)
    .maybeSingle();

  const redeemPoints = settings?.redeem_points ?? 200;
  const redeemValue = settings?.redeem_value ?? 50000;

  if (!settings?.enabled) return res.status(400).json({ error: 'Tính năng điểm tạm thời không hoạt động' });

  const { data: ledger } = await supabase
    .from('customer_points_ledger')
    .select('points')
    .eq('customer_id', customer.id);

  const balance = (ledger || []).reduce((s, r) => s + Number(r.points || 0), 0);
  if (balance < redeemPoints) {
    return res.status(400).json({ error: `Cần ít nhất ${redeemPoints} điểm để đổi (hiện có ${balance} điểm)` });
  }

  const multiples = Math.floor(balance / redeemPoints);
  const pointsToRedeem = multiples * redeemPoints;
  const discountValue = multiples * redeemValue;

  let code = generateCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase.from('promo_codes').select('code').eq('code', code).maybeSingle();
    if (!existing) break;
    code = generateCode();
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: deductErr } = await supabase.from('customer_points_ledger').insert({
    customer_id: customer.id,
    company_id: customer.company_id,
    points: -pointsToRedeem,
    type: 'redeem',
    description: `Đổi ${pointsToRedeem} điểm lấy mã giảm giá ${code}`,
  });

  if (deductErr) {
    console.error('[customer-discount:redeem] deduct error:', deductErr.message);
    return res.status(500).json({ error: 'Lỗi hệ thống, thử lại sau' });
  }

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
    console.error('[customer-discount:redeem] promo insert error:', promoErr.message);
    await supabase.from('customer_points_ledger').insert({
      customer_id: customer.id,
      company_id: customer.company_id,
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') return handleRedeem(req, res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const phone = String(req.query.phone || '').trim();
  if (!phone) return res.status(400).json({ error: 'Thiếu số điện thoại' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalized = phone.replace(/^0/, '84');

  const [{ data: customer, error }, { data: settings }, { data: pointsSettings }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, full_name, loyalty_tier, referral_code, status')
      .or(`phone.eq.${phone},phone.eq.${normalized},normalized_phone.eq.${normalized}`)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('loyalty_discount_settings')
      .select('tier, discount_amount, enabled'),
    supabase
      .from('points_settings')
      .select('points_per_10k, redeem_points, redeem_value, referral_bonus_points, enabled')
      .limit(1)
      .maybeSingle(),
  ]);

  if (error) {
    console.error('[customer-discount] lookup error:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }

  if (!customer) {
    return res.status(200).json({ tier: 'lead', discount_amount: 0, eligible: false, referral_credit: 0, points_balance: 0, points_value: 0 });
  }

  const tierDiscounts = { ...TIER_DISCOUNTS_FALLBACK };
  if (Array.isArray(settings)) {
    for (const row of settings) {
      if (row.enabled) tierDiscounts[row.tier] = row.discount_amount;
      else tierDiscounts[row.tier] = 0;
    }
  }

  const tier = customer.loyalty_tier || 'lead';
  const discountAmount = tierDiscounts[tier] ?? 0;

  const [{ data: rewards }, { data: pointsLedger }] = await Promise.all([
    supabase
      .from('referral_rewards')
      .select('reward_value')
      .eq('referrer_customer_id', customer.id)
      .eq('status', 'paid')
      .is('used_at', null),
    supabase
      .from('customer_points_ledger')
      .select('points')
      .eq('customer_id', customer.id),
  ]);

  const referralCredit = (rewards || []).reduce((s, r) => s + Number(r.reward_value || 0), 0);
  const pointsBalance = (pointsLedger || []).reduce((s, r) => s + Number(r.points || 0), 0);
  const ps = pointsSettings || { redeem_points: 200, redeem_value: 50000 };
  const pointsValue = pointsBalance >= ps.redeem_points
    ? Math.floor(pointsBalance / ps.redeem_points) * ps.redeem_value
    : 0;

  return res.status(200).json({
    tier,
    eligible: discountAmount > 0,
    discount_amount: discountAmount,
    customer_name: customer.full_name,
    referral_code: customer.referral_code || null,
    referral_credit: referralCredit,
    points_balance: pointsBalance,
    points_value: pointsValue,
    points_settings: ps,
  });
}
