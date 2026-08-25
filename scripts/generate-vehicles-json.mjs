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
import {
  cacheVehicleCoverImages,
  cacheVehicleGalleryImages,
} from './vehicle-cover-cache.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDataDir = path.join(__dirname, '..', 'dist', 'data');
const distDir = path.join(__dirname, '..', 'dist');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[generate-vehicles-json] Missing Supabase server credentials — skipping static JSON generation.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function pruneExternalRefs(cachedCoverUrl, cachedMediaFiles = []) {
  const coverImageUrl = cachedCoverUrl || cachedMediaFiles[0]?.fileUrl || '';
  return {
    ...(coverImageUrl ? { coverImageUrl } : {}),
    ...(cachedMediaFiles.length > 0 ? { mediaFiles: cachedMediaFiles } : {}),
  };
}

function pruneVehicle(vehicle, coverUrls, galleryUrls) {
  const vehicleId = String(vehicle.id);
  const mediaFiles = galleryUrls.get(vehicleId) || [];

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
    external_refs: pruneExternalRefs(coverUrls.get(vehicleId), mediaFiles),
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
    'id,display_name,color,model_year,daily_base_price,external_refs,website_description,km_per_day,km_surcharge,rental_conditions,vehicle_models(make,model,variant,seats,fuel_type,transmission)'
  )
  .eq('status', 'available')
  .eq('published', true)
  .order('daily_base_price', { ascending: true });

if (error) {
  console.error('[generate-vehicles-json] Supabase error:', error.message);
  process.exit(0); // Don't fail the build
}

const rawVehicles = data || [];
const coverUrls = await cacheVehicleCoverImages(rawVehicles, distDir, {
  loggerPrefix: 'generate-vehicles-json',
});
const galleryUrls = await cacheVehicleGalleryImages(rawVehicles, distDir, {
  loggerPrefix: 'generate-vehicles-json',
});
const vehicles = rawVehicles.map((vehicle) => pruneVehicle(vehicle, coverUrls, galleryUrls));

await mkdir(distDataDir, { recursive: true });
await writeFile(
  path.join(distDataDir, 'vehicles.json'),
  JSON.stringify(vehicles),
);
console.log(`[generate-vehicles-json] Wrote ${vehicles.length} vehicles → dist/data/vehicles.json`);
