import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const MONTHLY_PAGE_PATH = new URL('../src/app/pages/B2B.tsx', import.meta.url);
const STATIC_GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);

test('monthly-rental page covers price, total cost, buy comparison, EV and business intent', async () => {
  const source = await readFile(MONTHLY_PAGE_PATH, 'utf8');

  for (const heading of [
    'Bảng giá thuê xe tự lái theo tháng tại Hà Nội',
    'Thuê xe tháng gồm những chi phí nào?',
    'Khi nào nên thuê xe tháng thay vì mua xe?',
    'Thuê xe điện VinFast theo tháng',
    'Gói thuê xe tháng cho doanh nghiệp',
  ]) {
    assert.match(source, new RegExp(heading.replace(/[?]/g, '\\?')));
  }

  assert.match(source, /monthlyPriceLabel\(car\)/);
  assert.doesNotMatch(source, /const pricingRows/);
  assert.doesNotMatch(source, /2\.500-3\.000 km\/tháng|Từ 15-30 triệu|Từ 20-40 triệu/);
});

test('monthly-rental page lists only the five confirmed delivery areas', async () => {
  const source = await readFile(MONTHLY_PAGE_PATH, 'utf8');
  const areasBlock = source.slice(source.indexOf('const serviceAreas'), source.indexOf('type CustomerType'));

  for (const area of [
    'Vinhomes Ocean Park',
    'Times City',
    'Vinhomes Smart City',
    'Ecopark',
    'The Manor Central Park',
  ]) {
    assert.match(areasBlock, new RegExp(area));
  }

  assert.doesNotMatch(areasBlock, /Royal City|Linh Đàm|Nội thành Hà Nội/);
});

test('monthly structured data derives offers from verified monthly prices', async () => {
  const source = await readFile(STATIC_GENERATOR_PATH, 'utf8');
  const schemaBlock = source.slice(
    source.indexOf('function monthlyRentalStructuredData'),
    source.indexOf('function vehicleStructuredData'),
  );

  assert.match(schemaBlock, /Number\(vehicle\.monthly_sale_price \|\| 0\)/);
  assert.match(schemaBlock, /Math\.min\(\.\.\.monthlyPrices\)/);
  assert.match(schemaBlock, /Math\.max\(\.\.\.monthlyPrices\)/);
  assert.match(schemaBlock, /\.\.\.\(offers \? \{ offers \} : \{\}\)/);
  assert.doesNotMatch(schemaBlock, /2\.500-3\.000|availability:|lowPrice: 10000000|highPrice: 25000000/);
});

test('monthly fallback shell also uses catalog prices and confirmed areas', async () => {
  const source = await readFile(STATIC_GENERATOR_PATH, 'utf8');
  const shellBlock = source.slice(
    source.indexOf('function monthlyStaticShell'),
    source.indexOf('function contactStaticShell'),
  );

  assert.match(shellBlock, /vehicle\.monthly_sale_price/);
  assert.doesNotMatch(shellBlock, /vehicle\.monthly_price/);
  assert.match(shellBlock, /Vinhomes Ocean Park/);
  assert.match(shellBlock, /The Manor Central Park/);
  assert.doesNotMatch(shellBlock, /Royal City|Linh Đàm|10-12tr|14-18tr|10-25tr|xuất hóa đơn/);
});
