import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function isVehicleImageMedia(file) {
  return Boolean(
    file &&
      typeof file === 'object' &&
      file.fileUrl &&
      file.category === 'vehicle_photos' &&
      (!file.mimeType || String(file.mimeType).startsWith('image/'))
  );
}

function pruneExternalRefs(externalRefs) {
  const refs = externalRefs && typeof externalRefs === 'object' ? externalRefs : {};
  const mediaFiles = Array.isArray(refs.mediaFiles)
    ? refs.mediaFiles
        .filter(isVehicleImageMedia)
        .slice(0, 8)
        .map((file) => ({
          category: file.category,
          fileUrl: file.fileUrl,
          mimeType: file.mimeType || null,
        }))
    : [];

  return {
    ...(refs.coverImageUrl ? { coverImageUrl: refs.coverImageUrl } : {}),
    ...(refs.vehiclePhotoUrl ? { vehiclePhotoUrl: refs.vehiclePhotoUrl } : {}),
    ...(refs.imageUrl ? { imageUrl: refs.imageUrl } : {}),
    ...(mediaFiles.length ? { mediaFiles } : {}),
  };
}

function pruneVehicle(vehicle) {
  return {
    id: vehicle.id,
    display_name: vehicle.display_name ?? null,
    plate_number: vehicle.plate_number ?? null,
    color: vehicle.color ?? null,
    model_year: vehicle.model_year ?? null,
    daily_base_price: vehicle.daily_base_price ?? null,
    current_km: vehicle.current_km ?? null,
    status: vehicle.status,
    published: vehicle.published,
    website_description: vehicle.website_description ?? null,
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
    const { data, error } = await supabase
      .from('vehicles')
      .select(
        'id,display_name,plate_number,color,model_year,daily_base_price,current_km,status,published,external_refs,website_description,vehicle_models(make,model,variant,seats,fuel_type,transmission)'
      )
      .eq('status', 'available')
      .eq('published', true)
      .order('daily_base_price', { ascending: true });

    if (error) throw error;

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json((data || []).map(pruneVehicle));
  } catch (err) {
    console.error('[api/vehicles]', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}
