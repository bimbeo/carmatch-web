import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('id,title,subtitle,image_url,link_url,badge_text,sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data || []);
  } catch (err) {
    console.error('[api/promotions]', err);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
}
