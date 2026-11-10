import { findSeoVehicleBySlug } from './vehicles.js';

const SITE_URL = 'https://www.carmatch.vn';
const ZALO_URL = 'https://zalo.me/0971163290';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const slug = String(req.query?.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(404).end('Not found');
  }

  try {
    const detail = await findSeoVehicleBySlug(slug);
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
  } catch (error) {
    console.error('[api/vehicle-route]', error);
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(503).end('Vehicle page temporarily unavailable');
  }
}
