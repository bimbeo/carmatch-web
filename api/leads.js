import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    if (!payload || !payload.phone || !payload.name) {
      return res.status(400).json({ error: 'Missing required fields: name, phone' });
    }

    const { error } = await supabase.from('website_leads').insert([payload]);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/leads]', err);
    res.status(500).json({ ok: false, error: 'Failed to submit lead' });
  }
}
