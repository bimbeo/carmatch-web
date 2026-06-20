import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Discount amount per loyalty tier (VND)
const TIER_DISCOUNTS = {
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

  // Normalize phone: 0xxx → 84xxx
  const normalized = phone.replace(/^0/, '84');

  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, full_name, loyalty_tier, referral_code, status')
    .or(`phone.eq.${phone},phone.eq.${normalized},normalized_phone.eq.${normalized}`)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('[customer-discount] lookup error:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }

  if (!customer) {
    return res.status(200).json({ tier: 'lead', discount_amount: 0, eligible: false });
  }

  const tier = customer.loyalty_tier || 'lead';
  const discountAmount = TIER_DISCOUNTS[tier] ?? 0;

  return res.status(200).json({
    tier,
    eligible: discountAmount > 0,
    discount_amount: discountAmount,
    customer_name: customer.full_name,
    referral_code: customer.referral_code || null,
  });
}
