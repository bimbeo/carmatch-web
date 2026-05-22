import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(200).json([]);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('code, description, discount_type, discount_value, max_discount, min_order, uses_limit, uses_count, expires_at')
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const list = (data || [])
      .filter(c => c.uses_limit === null || c.uses_count < c.uses_limit)
      .map(c => ({
        code: c.code,
        description: c.description,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        max_discount: c.max_discount,
        min_order: c.min_order ?? 0,
        expiresInDays: c.expires_at
          ? Math.ceil((new Date(c.expires_at) - new Date()) / 86_400_000)
          : null,
      }));
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(list);
  } catch (err) {
    console.error('[promo-list]', err?.message);
    return res.status(200).json([]);
  }
}
