import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const MONTHLY_PAGE_PATH = new URL('../src/app/pages/B2B.tsx', import.meta.url);
const STATIC_GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);

test('monthly-rental page covers dual journeys, shared pricing, EV and long-term intent', async () => {
  const source = await readFile(MONTHLY_PAGE_PATH, 'utf8');

  for (const heading of [
    'Bảng giá thuê xe tự lái theo tháng tại Hà Nội',
    'Bạn muốn thuê xe theo tháng cho ai?',
    'Biết trước ngân sách. Gửi đúng yêu cầu báo giá.',
    'Chọn xe tháng. Ước tính chi phí dễ dàng.',
    'Thuê lâu hơn. Thương lượng một phương án rõ hơn.',
    'Thuê theo tháng dễ hiểu. Chọn xe đúng nhu cầu.',
  ]) {
    assert.match(source, new RegExp(heading.replace(/[?]/g, '\\?')));
  }

  assert.match(source, /useVehicles\(\)/);
  assert.match(source, /car\.priceMonth/);
  assert.match(source, /baseMonthlyPrice \* config\.quantity \* config\.months/);
  assert.doesNotMatch(source, /const pricingRows/);
  assert.doesNotMatch(source, /fallbackCars/);
  assert.match(source, /4\.000 km\/tháng/);
  assert.match(source, /Cọc \$\{formatPrice\(deposit\)\}/);
  assert.match(source, /VAT 8%/);
  assert.doesNotMatch(source, /Từ 15-30 triệu|Từ 20-40 triệu/);
});

test('monthly-rental page does not invent service areas or require company data for personal leads', async () => {
  const source = await readFile(MONTHLY_PAGE_PATH, 'utf8');
  assert.match(source, /customerType === 'business' &&/);
  assert.match(source, /Không cần thông tin doanh nghiệp/);
  assert.match(source, /required=\{emailRequired\}/);
  assert.doesNotMatch(source, /const serviceAreas/);
});

test('monthly structured data derives offers from verified monthly prices', async () => {
  const source = await readFile(STATIC_GENERATOR_PATH, 'utf8');
  const schemaBlock = source.slice(
    source.indexOf('function monthlyRentalStructuredData'),
    source.indexOf('function isElectricVehicle'),
  );

  assert.match(schemaBlock, /Number\(vehicle\.monthly_sale_price \|\| 0\)/);
  assert.match(schemaBlock, /Math\.min\(\.\.\.monthlyPrices\)/);
  assert.match(schemaBlock, /Math\.max\(\.\.\.monthlyPrices\)/);
  assert.match(schemaBlock, /\.\.\.\(offers \? \{ offers \} : \{\}\)/);
  assert.match(schemaBlock, /webPageData\(meta/);
  assert.doesNotMatch(schemaBlock, /buildFAQSchema/);
  assert.doesNotMatch(schemaBlock, /2\.500-3\.000|availability:|lowPrice: 10000000|highPrice: 25000000/);
});

test('monthly fallback shell also uses catalog prices and confirmed areas', async () => {
  const source = await readFile(STATIC_GENERATOR_PATH, 'utf8');
  const shellBlock = source.slice(
    source.indexOf('function monthlyStaticShell'),
    source.indexOf('function contactStaticShell'),
  );

  assert.match(shellBlock, /vehicle\.monthly_sale_price/);
  assert.match(shellBlock, /uniqueMonthlyVehicles/);
  assert.match(shellBlock, /advisoryVehicles/);
  assert.match(shellBlock, /<strong>Liên hệ<\/strong>/);
  assert.doesNotMatch(shellBlock, /vehicle\.monthly_price/);
  assert.match(shellBlock, /Vinhomes Ocean Park/);
  assert.match(shellBlock, /The Manor Central Park/);
  assert.doesNotMatch(shellBlock, /Royal City|Linh Đàm|10-12tr|14-18tr|10-25tr|xuất hóa đơn/);
});
