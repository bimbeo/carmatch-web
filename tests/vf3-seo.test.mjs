import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CAR_DETAIL_PATH = new URL('../src/app/pages/CarDetail.tsx', import.meta.url);
const VEHICLE_HOOK_PATH = new URL('../src/hooks/useVehicles.ts', import.meta.url);
const STATIC_GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);

test('VF3 detail pages expose the commercial decision block near the top', async () => {
  const source = await readFile(CAR_DETAIL_PATH, 'utf8');

  for (const text of [
    'Giá ngày, giá tháng, lịch xe và chi phí sạc',
    'Tổng chi phí cần tính',
    'Thuê VF3 thì sạc xe thế nào?',
    'VF3 hay VF5 phù hợp hơn?',
    'Chọn ngày và xem tổng giá',
  ]) {
    assert.match(source, new RegExp(text.replace(/[?]/g, '\\?')));
  }

  assert.match(source, /function isVf3Car/);
  assert.match(source, /<Vf3DecisionPanel/);
  assert.match(source, /Thuê VinFast VF3 tự lái tại Hà Nội/);
  assert.match(source, /car\.priceMonth \? formatPrice\(car\.priceMonth\) : 'Liên hệ báo giá'/);
});

test('VF3 comparison uses a real available VF5 model when present', async () => {
  const source = await readFile(CAR_DETAIL_PATH, 'utf8');

  assert.match(source, /cars\.find\(\(candidate\) => candidate\.available && isVf5Car\(candidate\)\)/);
  assert.match(source, /to=\{vf5 \? `\/xe\/\$\{vf5\.slug\}` : '\/xe'\}/);
  assert.match(source, /vf5 \? formatPrice\(vf5\.price\) : 'Xem xe để báo giá'/);
});

test('missing VF3 seat data falls back to the verified four-seat model value', async () => {
  const source = await readFile(VEHICLE_HOOK_PATH, 'utf8');

  assert.match(source, /\^vf\\s\*3\$/);
  assert.match(source, /\? 4 : 5/);
  assert.match(source, /seats,/);
});

test('vehicle schema publishes monthly price only when verified', async () => {
  const source = await readFile(STATIC_GENERATOR_PATH, 'utf8');
  const schemaBlock = source.slice(
    source.indexOf('function vehicleStructuredData'),
    source.indexOf('function fleetStructuredData'),
  );

  assert.match(schemaBlock, /Number\(vehicle\.monthly_sale_price \|\| 0\)/);
  assert.match(schemaBlock, /monthlyPrice > 0/);
  assert.match(schemaBlock, /Giá thuê tháng tham khảo/);
  assert.match(schemaBlock, /\? 4 : 0/);
});

test('VF3 prerender receives the catalog and emits dedicated metadata', async () => {
  const source = await readFile(STATIC_GENERATOR_PATH, 'utf8');

  assert.match(source, /safeRenderReactVehicleRoot\(vehicleRenderer, routePath, vehicle, seoVehicles\)/);
  assert.match(source, /const isVf3 = \/\^vf\\s\*3\$\/i/);
  assert.match(source, /gi, 'VinFast'/);
  assert.match(source, /Xem lịch trống, tổng chi phí, hướng dẫn sạc và so sánh VF3–VF5/);
});
