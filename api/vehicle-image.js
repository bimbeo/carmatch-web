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

function isVehicleImageMedia(file) {
  return Boolean(
    file &&
      typeof file === 'object' &&
      file.fileUrl &&
      file.category === 'vehicle_photos' &&
      (!file.mimeType || String(file.mimeType).startsWith('image/'))
  );
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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabase) return res.status(503).json({ error: 'Vehicle image service is not configured' });

  const vehicleId = String(req.query?.vehicleId || '').trim();
  const mediaId = String(req.query?.mediaId || '').trim();
  if (!UUID_RE.test(vehicleId) || mediaId.length > 120) {
    return res.status(400).json({ error: 'Invalid vehicle image request' });
  }

  try {
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
  } catch (error) {
    console.error('[api/vehicle-image]', error);
    return res.status(500).json({ error: 'Failed to fetch vehicle image' });
  }
}
