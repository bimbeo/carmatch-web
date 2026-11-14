import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const APP_PATH = new URL('../src/app/App.tsx', import.meta.url);
const PAGE_PATH = new URL('../src/app/pages/LocalRental.tsx', import.meta.url);
const DATA_PATH = new URL('../src/data/localRentalAreas.ts', import.meta.url);
const HOME_PATH = new URL('../src/app/pages/Home.tsx', import.meta.url);
const SSG_PATH = new URL('../src/ssg/renderHome.tsx', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const AUDIT_PATH = new URL('../scripts/audit-geo-foundation.mjs', import.meta.url);

const routes = [
  '/thue-xe-tu-lai-vinhomes-ocean-park',
  '/thue-xe-tu-lai-vinhomes-smart-city',
  '/thue-xe-tu-lai-times-city',
  '/thue-xe-tu-lai-ecopark',
  '/thue-xe-tu-lai-the-manor',
];

test('adds five explicit local rental routes while preserving the public route contract', async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.match(source, /lazy\(\(\) => import\('\.\/pages\/LocalRental'\)\)/);
  for (const route of routes) {
    assert.match(source, new RegExp(`path="${route.replaceAll('/', '\\/')}"`));
  }
  for (const route of ['/', '/xe', '/xe/:slug', '/thue-xe-thang', '/thue-xe-dien-ha-noi', '/thue-xe-7-cho-tu-lai-ha-noi', '/blog']) {
    assert.match(source, new RegExp(`path="${route.replaceAll('/', '\\/')}"`));
  }
});

test('local area data contains five distinct, confirmed service-area pages', async () => {
  const source = await readFile(DATA_PATH, 'utf8');

  for (const value of [
    'Vinhomes Ocean Park',
    'Vinhomes Smart City',
    'Vinhomes Times City',
    'Ecopark',
    'The Manor Central Park',
    'Gia Lâm, Hà Nội',
    'Tây Mỗ – Đại Mỗ, Nam Từ Liêm, Hà Nội',
    '458 Minh Khai, Hai Bà Trưng, Hà Nội',
    'Văn Giang, Hưng Yên',
    'Nguyễn Xiển – Nghiêm Xuân Yêm, Hoàng Mai, Hà Nội',
  ]) {
    assert.match(source, new RegExp(value));
  }

  assert.equal((source.match(/^    heroAnswer:/gm) || []).length, 5);
  assert.equal((source.match(/^    pickupNote:/gm) || []).length, 5);
  assert.doesNotMatch(source, /Royal City|Linh Đàm/);
});

test('shared local page derives prices from the catalog and makes availability conditional', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');

  assert.match(source, /catalog\.filter\(\(car\) => car\.price > 0\)/);
  assert.match(source, /Math\.min\(\.\.\.representativeCars\.map\(\(car\) => car\.price\)\)/);
  assert.match(source, /Lịch, tổng tiền và điểm giao nhận chỉ được chốt sau khi Car Match kiểm tra/);
  assert.match(source, /`Thuê xe tự lái tại \$\{area\.name\}`/);
  assert.match(source, /displayedLocalAreas\.map/);
  assert.match(source, /localRentalAreas\.filter/);
  assert.doesNotMatch(source, /luôn (còn|trống)|InStock|LimitedAvailability/i);
});

test('homepage links every confirmed area into the local landing cluster', async () => {
  const source = await readFile(HOME_PATH, 'utf8');
  for (const route of routes) assert.match(source, new RegExp(route));
  assert.match(source, /<Link key=\{area\.name\} to=\{area\.href\}/);
});

test('local pages are prerendered with catalog data and receive local schemas', async () => {
  const [ssg, generator, audit] = await Promise.all([
    readFile(SSG_PATH, 'utf8'),
    readFile(GENERATOR_PATH, 'utf8'),
    readFile(AUDIT_PATH, 'utf8'),
  ]);

  assert.match(ssg, /export function renderLocalRental\(areaSlug: LocalRentalAreaSlug, routePath: string, vehicles: unknown\[\]\)/);
  assert.match(generator, /async function renderReactLocalRoot\(area, vehicles\)/);
  assert.match(generator, /prerenderedLocalRoots\.set\(area\.path, await renderReactLocalRoot\(area, vehicles\)\)/);
  assert.match(generator, /function localRentalStructuredData\(meta, vehicles = \[\], area\)/);
  assert.match(generator, /localBusinessData\(\)/);
  assert.match(generator, /buildServiceSchema/);
  assert.match(generator, /buildFAQSchema/);
  assert.match(generator, /breadcrumbData/);
  assert.match(audit, /localRentalRoutePaths\.has\(routePath\)/);
});

test('Ocean Park article is retired from generated posts in favor of the transactional landing', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');

  assert.match(source, /redirectedBlogSlugs/);
  assert.match(source, /filter\(\(post\) => !redirectedBlogSlugs\.has\(post\?\.slug\?\.current\)\)/);
  assert.match(source, /thue-xe-tu-lai-vinhomes-ocean-park/);
});
