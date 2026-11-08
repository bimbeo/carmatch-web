import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const APP_PATH = new URL('../src/app/App.tsx', import.meta.url);
const PAGE_PATH = new URL('../src/app/pages/ElectricRental.tsx', import.meta.url);
const FLEET_PATH = new URL('../src/app/pages/Fleet.tsx', import.meta.url);
const SSG_PATH = new URL('../src/ssg/renderHome.tsx', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);

test('electric-rental hub is exposed as a public route without replacing existing routes', async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.match(source, /lazy\(\(\) => import\('\.\/pages\/ElectricRental'\)\)/);
  assert.match(source, /path="\/thue-xe-dien-ha-noi" element=\{<ElectricRental \/>\}/);
  for (const existingRoute of ['/', '/xe', '/xe/:slug', '/thue-xe-thang', '/blog', '/lien-he']) {
    assert.match(source, new RegExp(`path="${existingRoute.replaceAll('/', '\\/')}"`));
  }
});

test('hub answers model, price, charging, cost and delivery-area decisions', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');

  for (const text of [
    'Thuê xe điện tự lái tại Hà Nội',
    'VF3',
    'VF5',
    'VF6',
    'VF7',
    'VF8',
    'Limo Green',
    'Thuê xe điện cần tính những chi phí gì?',
    'Kiểm tra pin trước khi bắt đầu chuyến đi',
    'Liên hệ báo giá',
  ]) {
    assert.match(source, new RegExp(text.replace(/[?]/g, '\\?')));
  }

  assert.match(source, /car\.fuel === 'Điện' && car\.price > 0/);
  assert.match(source, /Math\.min\(\.\.\.electricCars\.map\(\(car\) => car\.price\)\)/);
  assert.match(source, /to=\{`\/xe\/\$\{car\.slug\}`\}/);
  assert.match(source, /to="\/thue-xe-thang"/);
  assert.match(source, /to="\/xe\?fuelFilter=%C4%90i%E1%BB%87n"/);
});

test('hub names only confirmed delivery areas', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');
  const areasBlock = source.slice(source.indexOf('const serviceAreas'), source.indexOf('const costItems'));

  for (const area of [
    'Vinhomes Ocean Park',
    'Vinhomes Smart City',
    'Times City',
    'Ecopark',
    'The Manor Central Park',
  ]) {
    assert.match(areasBlock, new RegExp(area));
  }
  assert.doesNotMatch(areasBlock, /Royal City|Linh Đàm/);
});

test('electric hub uses React SSR with the real vehicle catalog', async () => {
  const ssg = await readFile(SSG_PATH, 'utf8');
  const generator = await readFile(GENERATOR_PATH, 'utf8');

  assert.match(ssg, /export function renderElectricRental\(vehicles: unknown\[\]\)/);
  assert.match(ssg, /initialEntries=\{\['\/thue-xe-dien-ha-noi'\]\}/);
  assert.match(generator, /async function renderReactElectricRoot\(vehicles\)/);
  assert.match(generator, /renderElectricRental\(initialVehicles\)/);
  assert.match(generator, /prerenderedElectricRoot = await renderReactElectricRoot\(vehicles\)/);
  assert.match(generator, /meta\.path === '\/thue-xe-dien-ha-noi' && prerenderedElectricRoot/);
});

test('electric schema derives price range from catalog and does not claim availability', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');
  const schemaBlock = source.slice(
    source.indexOf('function electricRentalStructuredData'),
    source.indexOf('function vehicleStructuredData'),
  );

  assert.match(schemaBlock, /Number\(vehicle\.daily_base_price \|\| 0\)/);
  assert.match(source, /replace\(\/đ\/g, 'd'\)/);
  assert.match(schemaBlock, /Math\.min\(\.\.\.dailyPrices\)/);
  assert.match(schemaBlock, /Math\.max\(\.\.\.dailyPrices\)/);
  assert.match(schemaBlock, /Thuê xe điện tự lái tại Hà Nội/);
  assert.doesNotMatch(schemaBlock, /availability|InStock|LimitedAvailability|lowPrice: \d|highPrice: \d/);
});

test('fleet links internally to the electric-rental hub', async () => {
  const source = await readFile(FLEET_PATH, 'utf8');
  assert.match(source, /to="\/thue-xe-dien-ha-noi"/);
  assert.match(source, /fleet_electric_hub/);
});
