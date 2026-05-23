import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Missing slug' });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json([]);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('vehicle_reviews')
      .select('reviewer_name, rating, comment, trip_date, created_at')
      .eq('car_slug', slug)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[reviews] Supabase error:', error.message);
      return res.status(500).json({ error: 'Không tải được đánh giá' });
    }

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('[reviews] Error:', err?.message);
    return res.status(500).json({ error: 'Không tải được đánh giá' });
  }
}
