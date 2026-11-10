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
const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SITE_URL = 'https://www.carmatch.vn';
const ZALO_URL = 'https://zalo.me/0971163290';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function vehicleName(vehicle) {
  const model = vehicle.vehicle_models || {};
  return vehicle.display_name || [model.make, model.model, model.variant, vehicle.model_year]
    .filter(Boolean)
    .join(' ') || 'Xe tự lái';
}

function formatPrice(value) {
  const price = Number(value || 0);
  return price > 0 ? `${price.toLocaleString('vi-VN')}đ/ngày` : 'Liên hệ để kiểm tra giá';
}

function renderVehicleFallback(vehicle, canonicalSlug) {
  const name = vehicleName(vehicle);
  const canonical = `${SITE_URL}/xe/${canonicalSlug}`;
  const model = vehicle.vehicle_models || {};
  const available = Number(vehicle.available_inventory_count || 0) > 0;
  const availabilityLabel = available ? 'Có thể nhận lịch' : 'Tạm ngừng nhận lịch';
  const description = vehicle.website_description
    || `${name} là mẫu xe tự lái tại Hà Nội. Xem thông số, giá tham khảo và liên hệ Car Match để kiểm tra xe đang sẵn sàng.`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Thuê ${name}`,
    description,
    url: canonical,
    category: 'Xe tự lái',
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'VND',
      ...(Number(vehicle.daily_base_price || 0) > 0 ? { price: Number(vehicle.daily_base_price) } : {}),
      availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Car Match', url: SITE_URL },
    },
  };

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Thuê ${escapeHtml(name)} tự lái Hà Nội | Car Match</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${canonical}" />
  <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>
  <style>
    body{margin:0;background:#f7f8fb;color:#0f172a;font:16px/1.65 system-ui,-apple-system,sans-serif}main{max-width:920px;margin:auto;padding:48px 20px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 16px 50px #0f172a0d}.eyebrow{color:#0f766e;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}h1{font-size:clamp(30px,6vw,52px);line-height:1.1;margin:10px 0 16px}.status{display:inline-block;border-radius:999px;background:${available ? '#dcfce7' : '#fef3c7'};color:${available ? '#166534' : '#92400e'};padding:7px 12px;font-weight:800}.specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:24px 0}.spec{border:1px solid #e2e8f0;border-radius:16px;padding:14px}.spec b{display:block}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.btn{border-radius:999px;padding:12px 18px;font-weight:800;text-decoration:none}.primary{background:#0f172a;color:#fff}.secondary{border:1px solid #cbd5e1;color:#0f172a}small{color:#64748b}
  </style>
</head>
<body><main><article class="card">
  <p class="eyebrow">Trang xe Car Match</p>
  <h1>Thuê ${escapeHtml(name)} tự lái tại Hà Nội</h1>
  <span class="status">${availabilityLabel}</span>
  <p>${escapeHtml(description)}</p>
  ${available ? '' : '<p>Trang thông tin vẫn được giữ để khách tham khảo. Xe này hiện chưa nhận đặt trực tiếp; Car Match sẽ gợi ý mẫu tương đương đang sẵn sàng.</p>'}
  <div class="specs">
    <div class="spec"><small>Giá tham khảo</small><b>${escapeHtml(formatPrice(vehicle.daily_base_price))}</b></div>
    <div class="spec"><small>Số chỗ</small><b>${escapeHtml(model.seats ? `${model.seats} chỗ` : 'Đang cập nhật')}</b></div>
    <div class="spec"><small>Nhiên liệu</small><b>${escapeHtml(model.fuel_type || 'Đang cập nhật')}</b></div>
    <div class="spec"><small>Hộp số</small><b>${escapeHtml(model.transmission || 'Đang cập nhật')}</b></div>
  </div>
  <div class="actions"><a class="btn primary" href="${ZALO_URL}">Nhắn Zalo kiểm tra xe</a><a class="btn secondary" href="/xe">Xem xe đang sẵn sàng</a></div>
</article></main></body></html>`;
}

function serveVehiclePage(req, res, detail, slug) {
  if (!detail) {
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(404).end('Not found');
  }
  if (detail.matchedAlias || detail.canonicalSlug !== slug) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Location', `${SITE_URL}/xe/${detail.canonicalSlug}`);
    return res.status(301).end('Moved permanently');
  }

  const html = renderVehicleFallback(detail.vehicle, detail.canonicalSlug);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag', 'index, follow');
  return res.status(200).end(req.method === 'HEAD' ? '' : html);
}

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
    const slugAliases = Array.from(new Set(
      group.flatMap((vehicle) => Array.isArray(vehicle.seo_slug_aliases) ? vehicle.seo_slug_aliases : []),
    )).filter((alias) => alias && alias !== slug);
    return {
      ...representative,
      slug,
      slugAliases,
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
    .select('id,external_refs,published,seo_indexable')
    .eq('id', vehicleId)
    .maybeSingle();
  if (error) throw error;
  if (!vehicle || (!vehicle.published && !vehicle.seo_indexable)) {
    return res.status(404).json({ error: 'Vehicle image not found' });
  }

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

export function pruneVehicle(vehicle) {
  return {
    id: vehicle.id,
    display_name: vehicle.display_name ?? null,
    color: vehicle.color ?? null,
    model_year: vehicle.model_year ?? null,
    daily_base_price: vehicle.daily_base_price ?? null,
    monthly_price: vehicle.monthly_price ?? null,
    website_description: vehicle.website_description ?? null,
    km_per_day: vehicle.km_per_day ?? null,
    km_surcharge: vehicle.km_surcharge ?? null,
    rental_conditions: vehicle.rental_conditions ?? null,
    status: vehicle.status ?? null,
    published: vehicle.published ?? null,
    slug: vehicle.slug ?? vehicle.seo_slug ?? null,
    slugAliases: Array.isArray(vehicle.slugAliases)
      ? vehicle.slugAliases
      : Array.isArray(vehicle.seo_slug_aliases) ? vehicle.seo_slug_aliases : [],
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

export async function findSeoVehicleBySlug(rawSlug) {
  if (!supabase) throw new Error('Vehicle data service is not configured');
  const slug = slugify(rawSlug);
  if (!slug || !PUBLIC_SLUG_RE.test(slug) || slug !== String(rawSlug || '').trim().toLowerCase()) {
    return null;
  }

  const select =
    'id,display_name,color,model_year,daily_base_price,monthly_price,external_refs,updated_at,website_description,km_per_day,km_surcharge,rental_conditions,status,published,seo_indexable,seo_slug,seo_slug_aliases,vehicle_models(make,model,variant,seats,fuel_type,transmission)';
  let result = await supabase
    .from('vehicles')
    .select(select)
    .eq('seo_indexable', true)
    .eq('seo_slug', slug)
    .order('daily_base_price', { ascending: true });

  if (result.error) throw result.error;
  let matchedAlias = false;

  if (!result.data?.length) {
    result = await supabase
      .from('vehicles')
      .select(select)
      .eq('seo_indexable', true)
      .contains('seo_slug_aliases', [slug])
      .order('daily_base_price', { ascending: true });
    if (result.error) throw result.error;
    matchedAlias = Boolean(result.data?.length);
  }

  const vehicle = collapsePublicVehicles(result.data || [])[0];
  if (!vehicle) return null;
  return {
    vehicle: pruneVehicle(vehicle),
    canonicalSlug: vehicle.slug,
    matchedAlias,
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
    if (req.query?.slug) {
      const slug = String(req.query.slug).trim().toLowerCase();
      const detail = await findSeoVehicleBySlug(slug);
      if (req.query?.html === '1') return serveVehiclePage(req, res, detail, slug);
      if (!detail) return res.status(404).json({ error: 'Vehicle page not found' });
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
      res.setHeader('Server-Timing', `vehicle-detail;dur=${Date.now() - startedAt}`);
      return res.status(200).json(detail);
    }
    const baseSelect =
      'id,display_name,color,model_year,daily_base_price,monthly_price,external_refs,updated_at,website_description,km_per_day,km_surcharge,rental_conditions,status,published,vehicle_models(make,model,variant,seats,fuel_type,transmission)';
    let result = await supabase
      .from('vehicles')
      .select(`seo_slug,seo_slug_aliases,${baseSelect}`)
      .eq('status', 'available')
      .eq('published', true)
      .order('daily_base_price', { ascending: true });

    if (result.error && /seo_slug|seo_slug_aliases/i.test(result.error.message)) {
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
    const message = req.query?.vehicleId
      ? 'Failed to fetch vehicle image'
      : req.query?.slug ? 'Failed to fetch vehicle page' : 'Failed to fetch vehicles';
    res.status(500).json({ error: message });
  }
}
