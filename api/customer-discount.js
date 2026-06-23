import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback in case DB is unavailable
const TIER_DISCOUNTS_FALLBACK = {
  vip: Number(process.env.VIP_DISCOUNT_AMOUNT || 100000),
  returning: Number(process.env.RETURNING_DISCOUNT_AMOUNT || 50000),
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const phone = String(req.query.phone || '').trim();
  if (!phone) return res.status(400).json({ error: 'Thiếu số điện thoại' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const normalized = phone.replace(/^0/, '84');

  // Fetch customer + discount settings + points settings in parallel
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

  // Build tier → amount map from DB; fallback to env var if missing
  const tierDiscounts = { ...TIER_DISCOUNTS_FALLBACK };
  if (Array.isArray(settings)) {
    for (const row of settings) {
      if (row.enabled) tierDiscounts[row.tier] = row.discount_amount;
      else tierDiscounts[row.tier] = 0;
    }
  }

  const tier = customer.loyalty_tier || 'lead';
  const discountAmount = tierDiscounts[tier] ?? 0;

  // Referral credit: sum of paid rewards not yet used
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
