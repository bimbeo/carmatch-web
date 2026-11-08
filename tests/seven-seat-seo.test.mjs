import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const APP_PATH = new URL('../src/app/App.tsx', import.meta.url);
const PAGE_PATH = new URL('../src/app/pages/SevenSeatRental.tsx', import.meta.url);
const FLEET_PATH = new URL('../src/app/pages/Fleet.tsx', import.meta.url);
const CAR_DETAIL_PATH = new URL('../src/app/pages/CarDetail.tsx', import.meta.url);
const SSG_PATH = new URL('../src/ssg/renderHome.tsx', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const AUDIT_PATH = new URL('../scripts/audit-geo-foundation.mjs', import.meta.url);

test('seven-seat hub is added as one new public route without replacing existing routes', async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.match(source, /lazy\(\(\) => import\('\.\/pages\/SevenSeatRental'\)\)/);
  assert.match(source, /path="\/thue-xe-7-cho-tu-lai-ha-noi" element=\{<SevenSeatRental \/>\}/);
  for (const route of ['/', '/xe', '/xe/:slug', '/thue-xe-thang', '/thue-xe-dien-ha-noi', '/blog', '/lien-he']) {
    assert.match(source, new RegExp(`path="${route.replaceAll('/', '\\/')}"`));
  }
});

test('seven-seat hub answers price, luggage, model fit and total-cost decisions', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');

  for (const text of [
    'Thuê xe 7 chỗ tự lái tại Hà Nội',
    'Carnival',
    'Xpander',
    'Limo Green',
    'Xe 7 chỗ có đủ chỗ cho người và hành lý không?',
    'Thuê xe 7 chỗ cần tính những chi phí gì?',
    'Liên hệ báo giá',
  ]) {
    assert.match(source, new RegExp(text.replace(/[?]/g, '\\?')));
  }

  assert.match(source, /car\.seats === 7 && car\.price > 0/);
  assert.match(source, /Math\.min\(\.\.\.sevenSeatCars\.map\(\(car\) => car\.price\)\)/);
  assert.match(source, /to=\{`\/xe\/\$\{car\.slug\}`\}/);
  assert.match(source, /to="\/xe\?seatFilter=7"/);
  assert.match(source, /to="\/thue-xe-dien-ha-noi"/);
  assert.doesNotMatch(source, /8 chỗ|8-seat/i);
});

test('seven-seat hub lists only confirmed delivery areas', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');
  const areasBlock = source.slice(source.indexOf('const serviceAreas'), source.indexOf('const costItems'));

  for (const area of ['Vinhomes Ocean Park', 'Vinhomes Smart City', 'Times City', 'Ecopark', 'The Manor Central Park']) {
    assert.match(areasBlock, new RegExp(area));
  }
  assert.doesNotMatch(areasBlock, /Royal City|Linh Đàm/);
});

test('seven-seat hub receives the real catalog through React SSR', async () => {
  const ssg = await readFile(SSG_PATH, 'utf8');
  const generator = await readFile(GENERATOR_PATH, 'utf8');

  assert.match(ssg, /export function renderSevenSeatRental\(vehicles: unknown\[\]\)/);
  assert.match(ssg, /initialEntries=\{\['\/thue-xe-7-cho-tu-lai-ha-noi'\]\}/);
  assert.match(generator, /async function renderReactSevenSeatRoot\(vehicles\)/);
  assert.match(generator, /renderSevenSeatRental\(initialVehicles\)/);
  assert.match(generator, /prerenderedSevenSeatRoot = await renderReactSevenSeatRoot\(vehicles\)/);
  assert.match(generator, /meta\.path === '\/thue-xe-7-cho-tu-lai-ha-noi' && prerenderedSevenSeatRoot/);
});

test('seven-seat schema uses only target seven-seat models and catalog prices', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');
  const schemaBlock = source.slice(
    source.indexOf('function sevenSeatRentalStructuredData'),
    source.indexOf('function vehicleStructuredData'),
  );

  assert.match(source, /seats === 7 && \(name\.includes\('carnival'\) \|\| name\.includes\('xpander'\) \|\| name\.includes\('limo green'\)\)/);
  assert.match(schemaBlock, /Number\(vehicle\.daily_base_price \|\| 0\)/);
  assert.match(schemaBlock, /Math\.min\(\.\.\.dailyPrices\)/);
  assert.match(schemaBlock, /Math\.max\(\.\.\.dailyPrices\)/);
  assert.match(schemaBlock, /Thuê xe 7 chỗ tự lái tại Hà Nội/);
  assert.doesNotMatch(schemaBlock, /availability|InStock|LimitedAvailability|lowPrice: \d|highPrice: \d/);
});

test('fleet and seven-seat model pages link to the new hub', async () => {
  const [fleet, detail, audit] = await Promise.all([
    readFile(FLEET_PATH, 'utf8'),
    readFile(CAR_DETAIL_PATH, 'utf8'),
    readFile(AUDIT_PATH, 'utf8'),
  ]);

  assert.match(fleet, /to="\/thue-xe-7-cho-tu-lai-ha-noi"/);
  assert.match(fleet, /fleet_seven_seat_hub/);
  assert.match(detail, /car\.seats === 7/);
  assert.match(detail, /car_detail_seven_seat_hub/);
  assert.match(audit, /routePath === '\/thue-xe-7-cho-tu-lai-ha-noi'/);
});
