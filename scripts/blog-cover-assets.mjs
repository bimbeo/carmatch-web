import { createHash } from 'node:crypto';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 630;
const BLOG_COVER_ROUTE = '/blog/covers';
const SEO_COVER_ROUTE = '/seo/covers';

const palettes = [
  { start: '#0b102f', end: '#182a65', accent: '#79e6c8' },
  { start: '#102a27', end: '#175c50', accent: '#baf4d7' },
  { start: '#32120c', end: '#8b2f1b', accent: '#ffd08a' },
  { start: '#25113f', end: '#60308f', accent: '#e1c4ff' },
  { start: '#10253d', end: '#176d8c', accent: '#a9edff' },
  { start: '#30210a', end: '#8a5b15', accent: '#ffe49c' },
];

function normalizeSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compactSearchText(value = '') {
  return normalizeSearchText(value).replace(/\s+/g, '');
}

function safeFileName(value = '') {
  return normalizeSearchText(value).replace(/\s+/g, '-').replace(/^-+|-+$/g, '') || 'carmatch';
}

function stableIndex(value, length) {
  const digest = createHash('sha1').update(String(value)).digest();
  return digest[0] % length;
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTitle(title = '', maxChars = 31, maxLines = 4) {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) {
    const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
    const remaining = words.slice(consumed).join(' ');
    lines.push(remaining.length > maxChars + 8 ? `${remaining.slice(0, maxChars + 5).trim()}…` : remaining);
  }

  return lines.slice(0, maxLines);
}

function coverIntent(item = {}) {
  const text = normalizeSearchText(`${item.slug || item.path || ''} ${item.title || ''}`);
  if (/\btet\b/.test(text)) return 'TẾT 2027';
  if (/hop tac|chu xe|uy thac/.test(text)) return 'HỢP TÁC CHỦ XE';
  if (/noi bai|san bay/.test(text)) return 'SÂN BAY NỘI BÀI';
  if (/thue xe thang|theo thang|doanh nghiep/.test(text)) return 'THUÊ XE THÁNG';
  if (/chi phi|gia bao nhieu|bang gia|tiet kiem/.test(text)) return 'CHI PHÍ THUÊ XE';
  if (/so sanh|hay/.test(text)) return 'SO SÁNH XE';
  if (/vf3|vf5|vf6|vf7|vf8|carnival|xpander|raize|creta|fadil|limo green|mazda/.test(text)) return 'CHỌN MẪU XE';
  if (/di dau|lich trinh|ha long|ninh binh|tam dao|moc chau|sapa|ba vi|soc son|ecopark/.test(text)) return 'LỊCH TRÌNH TỰ LÁI';
  return 'KINH NGHIỆM THUÊ XE';
}

function vehicleModelKey(vehicle = {}) {
  const model = normalizeSearchText(vehicle.model || vehicle.name || '');
  return model
    .split(' ')
    .filter((token) => !/^20\d{2}$/.test(token) && !['vinfast', 'kia', 'hyundai', 'toyota', 'mitsubishi'].includes(token))
    .join(' ');
}

function findVehicleBackground(item, vehicles = []) {
  const haystack = compactSearchText(`${item.slug || item.path || ''} ${item.title || ''}`);
  const candidates = vehicles
    .filter((vehicle) => vehicle.imageUrl)
    .map((vehicle) => ({ ...vehicle, key: compactSearchText(vehicleModelKey(vehicle)) }))
    .filter((vehicle) => vehicle.key.length >= 3)
    .sort((a, b) => b.key.length - a.key.length);

  const exact = candidates.find((vehicle) => haystack.includes(vehicle.key));
  if (exact) return exact.imageUrl;

  const normalized = normalizeSearchText(`${item.slug || item.path || ''} ${item.title || ''}`);
  if (/xe 7 cho/.test(normalized)) return candidates.find((vehicle) => Number(vehicle.seats) === 7)?.imageUrl || '';
  if (/xe 5 cho/.test(normalized)) return candidates.find((vehicle) => Number(vehicle.seats) === 5)?.imageUrl || '';
  if (/xe dien|vinfast/.test(normalized)) return candidates.find((vehicle) => /dien|electric/.test(normalizeSearchText(vehicle.fuelType)))?.imageUrl || '';
  if (/thue xe|danh sach xe|doi xe/.test(normalized)) return candidates[0]?.imageUrl || '';
  return '';
}

function findDestinationBackground(item, destinations = []) {
  const related = new Set(item.relatedDestinationSlugs || []);
  const haystack = normalizeSearchText(`${item.slug || item.path || ''} ${item.title || ''}`);
  const match = destinations.find((destination) => {
    if (!destination.imageUrl) return false;
    if (related.has(destination.slug)) return true;
    const slug = normalizeSearchText(destination.slug);
    const name = normalizeSearchText(destination.name);
    return (slug && haystack.includes(slug)) || (name && haystack.includes(name));
  });
  return match?.imageUrl || '';
}

async function localAssetPath(url, distDir, siteUrl) {
  if (!url) return '';
  try {
    const parsed = new URL(url, siteUrl);
    const site = new URL(siteUrl);
    if (parsed.origin !== site.origin && !parsed.pathname.startsWith('/generated/')) return '';
    const relative = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
    const candidate = path.resolve(distDir, relative);
    if (!candidate.startsWith(path.resolve(distDir))) return '';
    const info = await stat(candidate).catch(() => null);
    return info?.isFile() && info.size > 0 ? candidate : '';
  } catch {
    return '';
  }
}

function overlaySvg({ title, eyebrow, palette, hasPhoto }) {
  const lines = wrapTitle(title);
  const fontSize = lines.length >= 4 ? 46 : lines.length === 3 ? 52 : 58;
  const lineHeight = Math.round(fontSize * 1.18);
  const startY = 250 - Math.max(0, lines.length - 2) * 22;
  const titleSpans = lines
    .map((line, index) => `<tspan x="74" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  return Buffer.from(`<svg width="${COVER_WIDTH}" height="${COVER_HEIGHT}" viewBox="0 0 ${COVER_WIDTH} ${COVER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.start}"/><stop offset="1" stop-color="${palette.end}"/></linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#050816" stop-opacity=".94"/><stop offset=".7" stop-color="#050816" stop-opacity="${hasPhoto ? '.58' : '.18'}"/><stop offset="1" stop-color="#050816" stop-opacity="${hasPhoto ? '.32' : '0'}"/></linearGradient>
    </defs>
    ${hasPhoto ? '' : '<rect width="1200" height="630" fill="url(#base)"/>'}
    <rect width="1200" height="630" fill="url(#shade)"/>
    <circle cx="1085" cy="85" r="170" fill="${palette.accent}" opacity=".12"/>
    <circle cx="1010" cy="560" r="250" fill="${palette.accent}" opacity=".08"/>
    <rect x="74" y="58" width="88" height="6" rx="3" fill="${palette.accent}"/>
    <text x="74" y="112" fill="${palette.accent}" font-family="Arial, DejaVu Sans, sans-serif" font-size="25" font-weight="700" letter-spacing="2">${escapeXml(eyebrow)}</text>
    <text fill="#fff" font-family="Arial, DejaVu Sans, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-.8">${titleSpans}</text>
    <text x="74" y="564" fill="#fff" opacity=".92" font-family="Arial, DejaVu Sans, sans-serif" font-size="24" font-weight="700">CAR MATCH · HÀ NỘI</text>
    <text x="1128" y="566" text-anchor="end" fill="${palette.accent}" font-family="Arial, DejaVu Sans, sans-serif" font-size="20" font-weight="700">carmatch.vn</text>
  </svg>`);
}

async function generateCover(item, options) {
  const { distDir, siteUrl, route, vehicles = [], destinations = [], sourceImageUrl = '' } = options;
  const slug = safeFileName(item.slug || item.path || item.title);
  const palette = palettes[stableIndex(slug, palettes.length)];
  const outputDir = path.join(distDir, route.replace(/^\/+/, ''));
  const outputPath = path.join(outputDir, `${slug}.jpg`);
  const publicUrl = `${siteUrl}${route}/${slug}.jpg`;
  await mkdir(outputDir, { recursive: true });

  const preferredBackground = findVehicleBackground(item, vehicles)
    || findDestinationBackground(item, destinations)
    || sourceImageUrl;
  const backgroundPath = await localAssetPath(preferredBackground, distDir, siteUrl);
  const overlay = overlaySvg({
    title: item.title,
    eyebrow: coverIntent(item),
    palette,
    hasPhoto: Boolean(backgroundPath),
  });

  const canvas = backgroundPath
    ? sharp(backgroundPath).rotate().resize(COVER_WIDTH, COVER_HEIGHT, { fit: 'cover', position: 'attention' })
    : sharp({ create: { width: COVER_WIDTH, height: COVER_HEIGHT, channels: 3, background: palette.start } });

  await canvas
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 82, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(outputPath);

  return publicUrl;
}

export async function assignUniqueBlogCovers(posts = [], options = {}) {
  const sourceCounts = new Map();
  for (const post of posts) {
    const source = post.mainImageUrl || '';
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  }

  let generated = 0;
  let preserved = 0;
  const output = [];

  for (const post of posts) {
    const source = post.mainImageUrl || '';
    const isGeneric = !source || source === options.brandSocialImage;
    const isRepeated = (sourceCounts.get(source) || 0) > 1;
    if (!isGeneric && !isRepeated) {
      output.push(post);
      preserved += 1;
      continue;
    }

    const mainImageUrl = await generateCover(
      { ...post, slug: post.slug?.current || post.slug },
      { ...options, route: BLOG_COVER_ROUTE, sourceImageUrl: isGeneric ? '' : source },
    );
    output.push({ ...post, mainImageUrl });
    generated += 1;
  }

  console.log(`[blog-cover-assets] Blog covers: ${generated} unique generated, ${preserved} original preserved`);
  return output;
}

export async function assignPriorityRouteCovers(routes = [], options = {}) {
  const priorityPaths = new Set(options.priorityPaths || []);
  let generated = 0;

  for (const route of routes) {
    if (!priorityPaths.has(route.path)) continue;
    route.image = await generateCover(
      { ...route, slug: route.path.replace(/^\/+/, '') || 'trang-chu' },
      { ...options, route: SEO_COVER_ROUTE, sourceImageUrl: route.image || '' },
    );
    generated += 1;
  }

  console.log(`[blog-cover-assets] Priority landing covers: ${generated} generated`);
  return routes;
}
