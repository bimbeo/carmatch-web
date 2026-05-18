import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select(
        'id,display_name,plate_number,color,model_year,daily_base_price,current_km,status,published,external_refs,vehicle_models(make,model,variant,seats,fuel_type,transmission)'
      )
      .eq('status', 'available')
      .eq('published', true)
      .order('daily_base_price', { ascending: true });

    if (error) throw error;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(data || []);
  } catch (err) {
    console.error('[api/vehicles]', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}
