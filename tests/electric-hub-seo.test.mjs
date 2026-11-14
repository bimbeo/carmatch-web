import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const APP_PATH = new URL('../src/app/App.tsx', import.meta.url);
const PAGE_PATH = new URL('../src/app/pages/ElectricRental.tsx', import.meta.url);
const BOOKING_PATH = new URL('../src/app/components/BookingWidget.tsx', import.meta.url);
const BOOKING_CONFIRM_PATH = new URL('../src/app/pages/BookingConfirm.tsx', import.meta.url);
const AVAILABILITY_PATH = new URL('../api/vehicle-availability.js', import.meta.url);
const QUIZ_PATH = new URL('../src/app/components/EvRecommendationQuiz.tsx', import.meta.url);
const COMPARISON_PATH = new URL('../src/app/components/EvVehicleComparison.tsx', import.meta.url);
const PLANNER_PATH = new URL('../src/app/components/EvRoutePlanner.tsx', import.meta.url);
const SPECS_PATH = new URL('../src/data/evVehicleSpecs.ts', import.meta.url);
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
  const [source, specs] = await Promise.all([readFile(PAGE_PATH, 'utf8'), readFile(SPECS_PATH, 'utf8')]);

  for (const text of [
    'Thuê xe điện tự lái tại Hà Nội',
    'Thuê xe điện cần tính những chi phí gì?',
    'Kiểm tra pin trước khi bắt đầu chuyến đi',
  ]) {
    assert.match(source, new RegExp(text.replace(/[?]/g, '\\?')));
  }

  for (const model of ['VF3', 'VF5', 'VF6', 'VF7', 'VF8', 'Limo Green']) {
    assert.match(specs, new RegExp(model));
  }

  assert.match(source, /car\.fuel === 'Điện' && car\.price > 0/);
  assert.match(source, /Math\.min\(\.\.\.electricCars\.map\(\(car\) => car\.price\)\)/);
  assert.match(source, /to="\/thue-xe-thang"/);
  assert.match(source, /to="\/xe\?fuelFilter=%C4%90i%E1%BB%87n"/);
  assert.match(source, /selectedImages\[showroomImageIndex\]/);
  assert.match(source, /Ảnh thật từ danh mục Car Match/);

  const heroBlock = source.slice(
    source.indexOf('<section className="relative isolate overflow-hidden bg-slate-950 text-white">'),
    source.indexOf('</section>'),
  );
  assert.match(heroBlock, /\/images\/electric-hero-crossover\.webp/);
  assert.equal((heroBlock.match(/<img\b/g) || []).length, 1);
  assert.doesNotMatch(heroBlock, /showroomCars\.map/);
});

test('VF7s inventory naming is grouped under the VF7 showroom family', async () => {
  const specs = await readFile(SPECS_PATH, 'utf8');

  assert.ok(specs.includes("if (/\\bvf\\s*7s?\\b/.test(normalized)) return 'VF7';"));
});

test('electric V5 embeds one shared BookingWidget and preserves external trip dates', async () => {
  const [page, booking] = await Promise.all([
    readFile(PAGE_PATH, 'utf8'),
    readFile(BOOKING_PATH, 'utf8'),
  ]);

  assert.match(page, /import BookingWidget/);
  assert.equal((page.match(/<BookingWidget\b/g) || []).length, 1);
  assert.match(page, /vehicleId=\{selectedCar\.id\}/);
  assert.match(page, /onBookingSubmitted=/);
  assert.match(page, /onBookingSummaryChange=\{setBookingSummary\}/);
  assert.match(page, /booking_start/);
  assert.match(page, /booking_request_success/);
  assert.match(booking, /pickupDate\?: string/);
  assert.match(booking, /deliveryFeeIsProvisional/);
  assert.match(booking, /availabilityCheckedVehicleId !== vehicleId/);
  assert.match(booking, /onBookingSubmitted\?\./);
});

test('electric discovery tools use real cars and never add electricity cost to booking', async () => {
  const [page, quiz, comparison, planner] = await Promise.all([
    readFile(PAGE_PATH, 'utf8'),
    readFile(QUIZ_PATH, 'utf8'),
    readFile(COMPARISON_PATH, 'utf8'),
    readFile(PLANNER_PATH, 'utf8'),
  ]);

  assert.match(page, /điện sạc tại trụ nằm trong giá thuê/i);
  assert.match(page, /Không lấy khoản tiền điện ước tính từ công cụ hành trình để cộng vào giá thuê/);
  assert.match(quiz, /ev_recommendation_complete/);
  assert.match(comparison, /ev_compare_vehicle_select/);
  assert.match(planner, /ev_trip_plan_complete/);
  assert.match(planner, /ev_trip_plan_to_booking/);
  assert.match(planner, /Nhập điểm đi, điểm đến và quãng đường dự kiến/);
  assert.match(planner, /Ngày khởi hành nằm ngoài kỳ thuê/);
  assert.match(planner, /Bạn đang lập kế hoạch cho xe khác/);
  assert.match(`${page}${quiz}${comparison}${planner}`, /object-contain/);
  assert.doesNotMatch(`${page}${quiz}${comparison}`, /NEDC/);
  assert.doesNotMatch(planner, /đơn giá điện|giá kWh|costPerKwh/i);
});

test('hub reuses the booking widget pickup locations instead of asserting extra free areas', async () => {
  const [source, booking] = await Promise.all([
    readFile(PAGE_PATH, 'utf8'),
    readFile(BOOKING_PATH, 'utf8'),
  ]);
  const areasBlock = booking.slice(booking.indexOf('export const BOOKING_PICKUP_LOCATIONS'), booking.indexOf('function getInitialDeliverySelection'));

  for (const area of [
    'Ocean Park',
    'Times City',
    'The Manor Central Park',
    'Cầu Giấy',
  ]) {
    assert.match(areasBlock, new RegExp(area));
  }
  assert.match(source, /BOOKING_PICKUP_LOCATIONS\.map/);
  assert.doesNotMatch(areasBlock, /Smart City|Ecopark|Royal City|Linh Đàm/);
});

test('booking CRO claims require verified data and preserve the trip note', async () => {
  const [booking, availability] = await Promise.all([
    readFile(BOOKING_PATH, 'utf8'),
    readFile(AVAILABILITY_PATH, 'utf8'),
  ]);

  assert.doesNotMatch(booking, /priceMonth \/ \(basePrice \* 30\)|Tiết kiệm \{savings\}%/);
  assert.match(booking, /customerNote\?: string/);
  assert.match(booking, /requestedCustomerNote/);
  assert.match(booking, /Tổng tạm tính/);
  assert.match(booking, /phụ phí giao nhận chỉ là tạm tính/);
  assert.match(availability, /\.eq\('status', 'confirmed'\)/);
  assert.match(availability, /timePrecision: 'exact'/);
});

test('electric booking confirmation is tracked only after confirmed status', async () => {
  const source = await readFile(BOOKING_CONFIRM_PATH, 'utf8');
  assert.match(source, /\['contacted', 'confirmed'\]\.includes\(data\.status\)/);
  assert.match(source, /booking_confirmed/);
  assert.match(source, /carmatch_ev_booking_ref/);
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
