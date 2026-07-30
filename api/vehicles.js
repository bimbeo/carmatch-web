import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';
const supabase = supabaseUrl && supabaseServerKey
  ? createClient(supabaseUrl, supabaseServerKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function isVehicleImageMedia(file) {
  return Boolean(
    file &&
      typeof file === 'object' &&
      file.fileUrl &&
      file.category === 'vehicle_photos' &&
      (!file.mimeType || String(file.mimeType).startsWith('image/'))
  );
}

function isSupabaseStorageUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.supabase.co') && parsed.pathname.includes('/storage/v1/');
  } catch {
    return false;
  }
}

function pruneExternalRefs(externalRefs) {
  const refs = externalRefs && typeof externalRefs === 'object' ? externalRefs : {};
  const firstMediaImage = Array.isArray(refs.mediaFiles)
    ? refs.mediaFiles.find(isVehicleImageMedia)?.fileUrl
    : '';
  const coverImageUrl = refs.coverImageUrl || refs.vehiclePhotoUrl || refs.imageUrl || firstMediaImage;

  if (!coverImageUrl || isSupabaseStorageUrl(coverImageUrl)) return {};

  return { coverImageUrl };
}

function pruneVehicle(vehicle) {
  return {
    id: vehicle.id,
    display_name: vehicle.display_name ?? null,
    color: vehicle.color ?? null,
    model_year: vehicle.model_year ?? null,
    daily_base_price: vehicle.daily_base_price ?? null,
    website_description: vehicle.website_description ?? null,
    km_per_day: vehicle.km_per_day ?? null,
    km_surcharge: vehicle.km_surcharge ?? null,
    rental_conditions: vehicle.rental_conditions ?? null,
    external_refs: pruneExternalRefs(vehicle.external_refs),
    vehicle_models: vehicle.vehicle_models
      ? {
          make: vehicle.vehicle_models.make ?? null,
          model: vehicle.vehicle_models.model ?? null,
          variant: vehicle.vehicle_models.variant ?? null,
          seats: vehicle.vehicle_models.seats ?? null,
          fuel_type: vehicle.vehicle_models.fuel_type ?? null,
          transmission: vehicle.vehicle_models.transmission ?? null,
        }
      : null,
  };
}

export default async function handler(req, res) {
  if (req.query?.cleanXe === '1') {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.writeHead(301, { Location: 'https://www.carmatch.vn/xe' });
    res.end('Redirecting to /xe');
    return;
  }

  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Vehicle data service is not configured' });
    }
    const { data, error } = await supabase
      .from('vehicles')
      .select(
        'id,display_name,color,model_year,daily_base_price,external_refs,website_description,km_per_day,km_surcharge,rental_conditions,vehicle_models(make,model,variant,seats,fuel_type,transmission)'
      )
      .eq('status', 'available')
      .eq('published', true)
      .order('daily_base_price', { ascending: true });

    if (error) throw error;

    // Vehicle visibility and rental policy are edited from the internal app.
    // Never let the CDN keep showing a hidden vehicle or outdated pricing rules.
    res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    res.status(200).json((data || []).map(pruneVehicle));
  } catch (err) {
    console.error('[api/vehicles]', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}
