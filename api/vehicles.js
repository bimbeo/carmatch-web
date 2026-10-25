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

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function slugify(value, fallback = '') {
  const slug = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function publicModelSlug(vehicle) {
  if (typeof vehicle?.seo_slug === 'string' && vehicle.seo_slug.trim()) {
    return vehicle.seo_slug.trim();
  }
  const model = vehicle?.vehicle_models || {};
  return slugify(
    vehicle?.display_name || [model.make, model.model, model.variant, vehicle?.model_year].filter(Boolean).join(' '),
    vehicle?.id,
  );
}

function hasPublicImages(vehicle) {
  const refs = vehicle?.external_refs;
  return Boolean(
    refs &&
    typeof refs === 'object' &&
    (refs.coverImageUrl || refs.vehiclePhotoUrl || refs.imageUrl || refs.image_url ||
      (Array.isArray(refs.mediaFiles) && refs.mediaFiles.some(isVehicleImageMedia)))
  );
}

/** Collapse physical inventory into stable public model pages. */
export function collapsePublicVehicles(vehicles = []) {
  const groups = new Map();
  for (const vehicle of vehicles) {
    const slug = publicModelSlug(vehicle);
    const existing = groups.get(slug) || [];
    existing.push(vehicle);
    groups.set(slug, existing);
  }

  return Array.from(groups.entries()).map(([slug, group]) => {
    const sorted = [...group].sort((left, right) => {
      const score = (vehicle) =>
        (vehicle.status === 'available' && vehicle.published !== false ? 4 : 0) +
        (hasPublicImages(vehicle) ? 2 : 0) +
        (Number(vehicle.daily_base_price || 0) > 0 ? 1 : 0);
      return score(right) - score(left);
    });
    const representative = sorted[0];
    return {
      ...representative,
      slug,
      inventory_count: group.length,
      available_inventory_count: group.filter(
        (vehicle) => vehicle.status === 'available' && vehicle.published !== false,
      ).length,
    };
  });
}

function isVehicleImageMedia(file) {
  return Boolean(
    file &&
      typeof file === 'object' &&
      file.fileUrl &&
      file.category === 'vehicle_photos' &&
      (!file.mimeType || String(file.mimeType).startsWith('image/'))
  );
}

function imageProxyUrl(vehicleId, params = {}) {
  const query = new URLSearchParams({ vehicleId: String(vehicleId) });
  if (params.mediaId) query.set('mediaId', String(params.mediaId));
  if (params.version) query.set('v', String(params.version));
  return `/api/vehicles?${query.toString()}`;
}

export function isAllowedPublicVehicleImageUrl(value, configuredSupabaseUrl = supabaseUrl) {
  try {
    const imageUrl = new URL(String(value || ''));
    const projectUrl = new URL(String(configuredSupabaseUrl || ''));
    if (imageUrl.protocol !== 'https:' || imageUrl.origin !== projectUrl.origin) return false;
    return (
      imageUrl.pathname.includes('/storage/v1/object/public/vehicle-photos/') ||
      imageUrl.pathname.includes('/storage/v1/object/public/vehicle-media/') ||
      imageUrl.pathname.includes('/storage/v1/render/image/public/vehicle-photos/') ||
      imageUrl.pathname.includes('/storage/v1/render/image/public/vehicle-media/')
    );
  } catch {
    return false;
  }
}

export function resolveVehicleImageSource(externalRefs, mediaId = '') {
  const refs = externalRefs && typeof externalRefs === 'object' ? externalRefs : {};
  const mediaFiles = Array.isArray(refs.mediaFiles)
    ? refs.mediaFiles.filter(isVehicleImageMedia)
    : [];

  if (mediaId) {
    return mediaFiles.find((file) => String(file.id || '') === mediaId)?.fileUrl || '';
  }

  return (
    refs.coverImageUrl ||
    refs.vehiclePhotoUrl ||
    refs.imageUrl ||
    refs.image_url ||
    mediaFiles[0]?.fileUrl ||
    ''
  );
}

async function fetchImage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function serveVehicleImage(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const vehicleId = String(req.query?.vehicleId || '').trim();
  const mediaId = String(req.query?.mediaId || '').trim();
  if (!UUID_RE.test(vehicleId) || mediaId.length > 120) {
    return res.status(400).json({ error: 'Invalid vehicle image request' });
  }

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('id,external_refs')
    .eq('id', vehicleId)
    .eq('status', 'available')
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  if (!vehicle) return res.status(404).json({ error: 'Vehicle image not found' });

  const sourceUrl = resolveVehicleImageSource(vehicle.external_refs, mediaId);
  if (!sourceUrl || !isAllowedPublicVehicleImageUrl(sourceUrl)) {
    return res.status(404).json({ error: 'Vehicle image not found' });
  }

  const response = await fetchImage(sourceUrl);
  if (!response.ok) return res.status(502).json({ error: 'Vehicle image unavailable' });
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (!contentType.startsWith('image/') || contentLength > MAX_IMAGE_BYTES) {
    return res.status(415).json({ error: 'Invalid vehicle image' });
  }

  const image = Buffer.from(await response.arrayBuffer());
  if (image.length > MAX_IMAGE_BYTES) return res.status(413).json({ error: 'Vehicle image is too large' });

  res.setHeader('Content-Type', contentType || 'image/jpeg');
  res.setHeader('Content-Length', String(image.length));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(image);
}

export function pruneExternalRefs(vehicleId, externalRefs, vehicleUpdatedAt = '') {
  const refs = externalRefs && typeof externalRefs === 'object' ? externalRefs : {};
  const mediaFiles = Array.isArray(refs.mediaFiles)
    ? refs.mediaFiles
        .filter(isVehicleImageMedia)
        .filter((file) => file.id)
        .slice(0, 8)
        .map((file) => ({
          category: 'vehicle_photos',
          fileUrl: imageProxyUrl(vehicleId, {
            mediaId: file.id,
            version: file.uploadedAt || refs.mediaUpdatedAt || vehicleUpdatedAt,
          }),
          mimeType: file.mimeType || 'image/jpeg',
        }))
    : [];
  const hasCover = Boolean(
    refs.coverImageUrl || refs.vehiclePhotoUrl || refs.imageUrl || refs.image_url || mediaFiles[0],
  );
  const coverVersion = refs.vehiclePhotoUpdatedAt || refs.mediaUpdatedAt || vehicleUpdatedAt;

  return {
    ...(hasCover ? { coverImageUrl: imageProxyUrl(vehicleId, { version: coverVersion }) } : {}),
    ...(mediaFiles.length > 0 ? { mediaFiles } : {}),
  };
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
    status: vehicle.status ?? null,
    published: vehicle.published ?? null,
    slug: vehicle.slug ?? vehicle.seo_slug ?? null,
    inventory_count: vehicle.inventory_count ?? 1,
    available_inventory_count: vehicle.available_inventory_count ?? 0,
    external_refs: pruneExternalRefs(vehicle.id, vehicle.external_refs, vehicle.updated_at),
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
  const startedAt = Date.now();
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
    if (req.query?.vehicleId) {
      return await serveVehicleImage(req, res);
    }
    const baseSelect =
      'id,display_name,color,model_year,daily_base_price,external_refs,updated_at,website_description,km_per_day,km_surcharge,rental_conditions,status,published,vehicle_models(make,model,variant,seats,fuel_type,transmission)';
    let result = await supabase
      .from('vehicles')
      .select(`seo_slug,${baseSelect}`)
      .eq('status', 'available')
      .eq('published', true)
      .order('daily_base_price', { ascending: true });

    if (result.error && /seo_slug/i.test(result.error.message)) {
      result = await supabase
        .from('vehicles')
        .select(baseSelect)
        .eq('status', 'available')
        .eq('published', true)
        .order('daily_base_price', { ascending: true });
    }

    const { data, error } = result;

    if (error) throw error;

    // The build snapshot renders immediately, while the edge serves stale data
    // during background revalidation instead of making the first visitor wait
    // for a cold function. Availability is checked by its dedicated endpoint.
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('Server-Timing', `vehicles;dur=${Date.now() - startedAt}`);
    res.status(200).json(collapsePublicVehicles(data || []).map(pruneVehicle));
  } catch (err) {
    console.error('[api/vehicles]', err);
    const message = req.query?.vehicleId ? 'Failed to fetch vehicle image' : 'Failed to fetch vehicles';
    res.status(500).json({ error: message });
  }
}
