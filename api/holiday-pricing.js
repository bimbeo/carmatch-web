import { createClient } from '@supabase/supabase-js';
import { applyCors, isPreflightAllowed, rateLimit } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const COMPANY_CODE = 'carmatch';

export default async function handler(req, res) {
  applyCors(req, res, { methods: 'GET,OPTIONS' });
  if (req.method === 'OPTIONS') return isPreflightAllowed(req) ? res.status(204).end() : res.status(403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { id: 'holiday-pricing:list', windowMs: 60_000, max: 120 })) return;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({ rules: [] });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('code', COMPANY_CODE)
      .single();
    if (companyError) throw companyError;

    let { data, error } = await supabase
      .from('holiday_pricing_rules')
      .select('id,name,start_date,end_date,adjustment_type,adjustment_value,booking_windows,note')
      .eq('company_id', company.id)
      .eq('active', true)
      .order('start_date', { ascending: true });
    if (error && /booking_windows|column/i.test(error.message || '')) {
      ({ data, error } = await supabase
        .from('holiday_pricing_rules')
        .select('id,name,start_date,end_date,adjustment_type,adjustment_value,note')
        .eq('company_id', company.id)
        .eq('active', true)
        .order('start_date', { ascending: true }));
    }
    if (error) throw error;

    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=120');
    return res.status(200).json({
      rules: (data || []).map((rule) => ({
        ...rule,
        adjustment_value: Number(rule.adjustment_value),
        booking_windows: Array.isArray(rule.booking_windows) ? rule.booking_windows : [],
      })),
    });
  } catch (error) {
    console.error('[holiday-pricing]', error);
    return res.status(200).json({ rules: [] });
  }
}
