import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const localPage = new URL('../src/app/pages/LocalRental.tsx', import.meta.url);
const decisionTools = new URL('../src/app/components/LocalRentalDecisionTools.tsx', import.meta.url);
const areaData = new URL('../src/data/localRentalExpansionAreas.ts', import.meta.url);
const hubData = new URL('../src/data/localHubsData.ts', import.meta.url);
const rentalDuration = new URL('../src/lib/rentalDuration.ts', import.meta.url);
const bookingWidget = new URL('../src/app/components/BookingWidget.tsx', import.meta.url);

test('V3 is piloted only on Cau Giay, keeping shared local pages intact', async () => {
  const source = await readFile(localPage, 'utf8');
  assert.match(source, /area\.slug === 'cau-giay'/);
  assert.match(source, /isCauGiayPilot && <LocalRentalQuickAnswer area=\{area\} \/>/);
  assert.match(source, /<LocalRentalPlanner/);
  assert.match(source, /selectedCarId=\{selectedCar\.id\}/);
  assert.match(source, /onSelectCar=\{handleSelectCar\}/);
  assert.match(source, /id="xe-goi-y"/);
  assert.match(source, /id="giao-nhan"/);
  assert.match(source, /id="cau-hoi"/);
  assert.match(source, /<CarCard car=\{car\}/);
  assert.match(source, /setFleetFilter/);
  assert.match(source, /Chọn xe này & xem lịch/);
  assert.match(source, /optimizedImageUrl\(heroCar\.images\[0\]/);
  assert.match(source, /displayedLocalAreas\.map/);
  assert.match(source, /localRentalAreas\.filter/);
  assert.match(source, /<Navbar collapseAtLg=\{isCauGiayPilot\}/);
  assert.match(source, /const PHONE_LINK = 'tel:0971163290'/);
  assert.match(source, /isCauGiayPilot \? 6 : 3/);
  assert.match(source, /selectedModels = new Set/);
  assert.match(source, /normalizedVehicleSearchText\(car\.name\)/);
  assert.match(source, /!isCauGiayPilot && <section/);
  assert.match(source, /cauGiayHubData\.pickupAreas\.map/);
  assert.match(source, /!isCauGiayPilot && <MobileConversionBar/);
  assert.doesNotMatch(source, /application\/ld\+json/);
});

test('landing reuses the single BookingWidget engine instead of maintaining a second calculator', async () => {
  const [tools, widget, billing] = await Promise.all([
    readFile(decisionTools, 'utf8'),
    readFile(bookingWidget, 'utf8'),
    readFile(rentalDuration, 'utf8'),
  ]);
  assert.equal((tools.match(/<BookingWidget/g) || []).length, 1);
  assert.doesNotMatch(tools, /calculateRentalBillingDays|baseCost|trackZaloClick|ZALO_BASE/);
  assert.match(tools, /pageType="local_rental"/);
  assert.match(tools, /pickupLocations=\{NO_VERIFIED_CAU_GIAY_PICKUP_LOCATIONS\}/);
  assert.match(tools, /initialDeliveryMode="delivery"/);
  assert.match(tools, /externalOpenRequest=\{openRequest\}/);
  assert.match(tools, /Gửi yêu cầu không đồng nghĩa booking đã được xác nhận/);
  assert.match(widget, /calculateRentalBillingDays\(pickupDate, pickupHour, returnDate, returnHour\)/);
  assert.match(widget, /fetch\('\/api\/bookings'/);
  assert.match(widget, /Idempotency-Key/);
  assert.match(widget, /Tài sản bảo đảm khi nhận xe được xác nhận riêng theo từng xe/);
  assert.doesNotMatch(widget, /Từ 15 triệu/);
  assert.match(billing, /export function calculateRentalBillingDays/);
});

test('switching vehicle keeps inputs but invalidates availability, quote and promotion state', async () => {
  const source = await readFile(bookingWidget, 'utf8');
  assert.match(source, /const requestId = \+\+availabilityRequestRef\.current/);
  assert.match(source, /requestId !== availabilityRequestRef\.current/);
  assert.match(source, /setPromoResult\(null\)/);
  assert.match(source, /Xe đã thay đổi\. Vui lòng áp dụng lại mã để kiểm tra điều kiện\./);
  assert.match(source, /setServerPriceQuote\(null\)/);
  assert.match(source, /promoAutoAppliedRef\.current = false/);
  assert.match(source, /\}, \[vehicleId\]\);/);
  assert.doesNotMatch(source, /setPickupDate\(initialBookingSelection\.pickupDate\)[\s\S]{0,240}\}, \[vehicleId\]\);/);
});

test('Cau Giay has search-intent title and localized meta copy', async () => {
  const source = await readFile(areaData, 'utf8');
  assert.match(source, /Thuê Xe Tự Lái Cầu Giấy: Xe, Giá & Giao Nhận/);
  assert.match(source, /tính tiền theo ngày giờ và hẹn giao nhận tại tòa nhà/);
});

test('Cau Giay operational copy is centralized and limited to verified claims', async () => {
  const source = await readFile(hubData, 'utf8');
  assert.match(source, /Duy Tân – Tôn Thất Thuyết/);
  assert.match(source, /serviceHours: '07:00–22:00'/);
  assert.match(source, /CCCD gắn chip và giấy phép lái xe hạng B bản gốc/);
  assert.doesNotMatch(source, /5 phút|bảo hiểm vật chất|miễn phí|pickupHub|deliveryFeePerWay/i);
});
