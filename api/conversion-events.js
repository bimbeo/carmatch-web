import { createClient } from '@supabase/supabase-js';
import { applyCors, rateLimit } from './_security.js';
import { buildConversionEventInsert } from './_conversion.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const COMPANY_CODE = 'carmatch';

export default async function handler(req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { id: 'conversion-events:create', windowMs: 10 * 60_000, max: 240 })) return;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(503).json({ error: 'Service unavailable' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('code', COMPANY_CODE)
    .maybeSingle();
  if (companyError || !company?.id) return res.status(503).json({ error: 'Company unavailable' });

  let insert;
  try {
    insert = buildConversionEventInsert({ companyId: company.id, body });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Invalid event' });
  }

  const { error } = await supabase.from('website_conversion_events').insert(insert);
  if (error?.code === '23505') return res.status(202).json({ ok: true, duplicate: true });
  if (error) {
    console.error('[conversion-events] insert error:', error.message);
    return res.status(503).json({ error: 'Analytics temporarily unavailable' });
  }
  return res.status(202).json({ ok: true });
}
