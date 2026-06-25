/**
 * Build-time script: fetch published vehicles from Supabase and write
 * dist/data/vehicles.json so the web app can load it instantly from CDN
 * instead of waiting for a serverless function cold-start.
 *
 * Run after `vite build` (the dist/ folder must already exist).
 */

import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDataDir = path.join(__dirname, '..', 'dist', 'data');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[generate-vehicles-json] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — skipping static JSON generation.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

const { data, error } = await supabase
  .from('vehicles')
  .select(
    'id,display_name,plate_number,color,model_year,daily_base_price,current_km,status,published,external_refs,website_description,vehicle_models(make,model,variant,seats,fuel_type,transmission)'
  )
  .eq('status', 'available')
  .eq('published', true)
  .order('daily_base_price', { ascending: true });

if (error) {
  console.error('[generate-vehicles-json] Supabase error:', error.message);
  process.exit(0); // Don't fail the build
}

const vehicles = (data || []).map(pruneVehicle);

await mkdir(distDataDir, { recursive: true });
await writeFile(
  path.join(distDataDir, 'vehicles.json'),
  JSON.stringify(vehicles),
);
console.log(`[generate-vehicles-json] Wrote ${vehicles.length} vehicles → dist/data/vehicles.json`);
