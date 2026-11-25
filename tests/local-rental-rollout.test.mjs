import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { localRentalAreas } from '../src/data/localRentalAreas.ts';
import { LOCAL_HUBS_DATA } from '../src/data/localHubsData.ts';
import { groupLocalRentalCars, selectLocalRentalCars } from '../src/data/localRentalFleet.ts';
import { BOOKING_PICKUP_LOCATIONS } from '../src/data/bookingPickupLocations.ts';

const localPage = new URL('../src/app/pages/LocalRental.tsx', import.meta.url);
const decisionTools = new URL('../src/app/components/LocalRentalDecisionTools.tsx', import.meta.url);
const areaData = new URL('../src/data/localRentalExpansionAreas.ts', import.meta.url);
const rentalDuration = new URL('../src/lib/rentalDuration.ts', import.meta.url);
const bookingWidget = new URL('../src/app/components/BookingWidget.tsx', import.meta.url);

test('the shared landing is enabled for all 17 configured routes', async () => {
  const source = await readFile(localPage, 'utf8');
  assert.equal(localRentalAreas.length, 17);
  assert.deepEqual(
    localRentalAreas.map(({ slug, path }) => [slug, path]),
    LOCAL_HUBS_DATA.map(({ slug, path }) => [slug, path]),
  );
  assert.equal(new Set(localRentalAreas.map(({ path }) => path)).size, 17);
  const knownSlugs = new Set(localRentalAreas.map(({ slug }) => slug));
  for (const field of ['heroSubhead', 'heroAnswer', 'description', 'pickupNote']) {
    assert.equal(new Set(localRentalAreas.map((area) => area[field])).size, 17, field);
  }
  for (const area of localRentalAreas) {
    assert.deepEqual(area.localContexts.map(({ title }) => title), ['Xe và giá', 'Giao nhận', 'Lịch và điều kiện']);
    assert.equal(area.useCases.length, 3, area.slug);
    assert.ok(area.faqs.length >= 4 && area.faqs.length <= 6, area.slug);
    assert.ok(area.nearbySlugs.length >= 4 && area.nearbySlugs.length <= 8, area.slug);
    assert.equal(new Set(area.nearbySlugs).size, area.nearbySlugs.length);
    assert.ok(area.nearbySlugs.every((slug) => knownSlugs.has(slug) && slug !== area.slug), area.slug);
  }
  assert.match(source, /<LocalRentalPage key=\{areaSlug\}/);
  assert.match(source, /<LocalRentalQuickAnswer area=\{area\}/);
  assert.match(source, /<LocalRentalPlanner/);
  assert.match(source, /selectionAction=/);
  assert.match(source, /area\.heroSubhead/);
  assert.match(source, /area\.faqs\.map/);
  assert.doesNotMatch(source, /isCauGiayPilot|application\/ld\+json|<ZaloFAB|<MobileConversionBar/);
});

test('vehicle selection ranks local preferences, deduplicates model variants and excludes inactive or unpriced cars', () => {
  const car = (name, slug, price, extra = {}) => ({ name, slug, price, available: true, seats: 5, ...extra });
  const catalog = [
    car('VinFast VF3 2026', 'vf3-2026', 650_000),
    car('VinFast VF3 2025', 'vf3-2025', 600_000),
    car('VinFast VF6', 'vf6', 990_000),
    car('Toyota Corolla Cross G', 'cross-g', 800_000, { model: 'Toyota Corolla Cross' }),
    car('Toyota Corolla Cross V', 'cross-v', 900_000, { model: 'Toyota Corolla Cross' }),
    car('VinFast VF5', 'vf5', 100, { available: false }),
    car('Mitsubishi Xpander', 'xpander', 0),
  ];
  const preferred = ['vinfast-vf6-plus'];
  const result = selectLocalRentalCars(catalog, preferred);
  assert.deepEqual(result.map(({ slug }) => slug), ['vf6', 'vf3-2025', 'cross-g']);
  const variants = groupLocalRentalCars(catalog, preferred).find(({ key }) => key === 'vinfast-vf3-2025');
  assert.deepEqual(variants?.vehicles.map(({ slug }) => slug), ['vf3-2025', 'vf3-2026']);
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
  assert.doesNotMatch(tools, /NO_VERIFIED_CAU_GIAY_PICKUP_LOCATIONS/);
  assert.match(tools, /initialDeliveryMode=\{preferredPickupId \? 'self' : 'delivery'\}/);
  assert.match(tools, /<SelectedVehicleMainInfo car=\{car\}/);
  assert.ok(
    tools.indexOf('<SelectedVehicleMainInfo car={car}') < tools.indexOf('<BookingWidget'),
    'selected vehicle information must appear before the booking calculator',
  );
  assert.match(tools, /Thông tin chính · \{car\.name\}/);
  assert.match(tools, /Giấy tờ và tài sản bảo đảm/);
  assert.match(tools, /car\.conditions/);
  assert.match(tools, /car\.kmPerDay/);
  assert.match(tools, /car\.kmSurcharge/);
  assert.match(tools, /layout="wide"/);
  assert.match(tools, /deliveryPolicy="conditional"/);
  assert.match(tools, /separateReturnAddress/);
  assert.match(tools, /externalOpenRequest=\{dateRequest\}/);
  assert.match(widget, /externalOpenRequest\?\.action === 'calendar'/);
  assert.match(widget, /calculateRentalBillingDays\(pickupDate, pickupHour, returnDate, returnHour\)/);
  assert.match(widget, /pickupLocations = BOOKING_PICKUP_LOCATIONS/);
  assert.equal(BOOKING_PICKUP_LOCATIONS.find(({ id }) => id === 'trung-lan')?.name, 'Cầu Giấy');
  assert.ok(BOOKING_PICKUP_LOCATIONS.every(({ mapUrl }) => new URL(mapUrl).hostname === 'maps.app.goo.gl'));
  assert.match(widget, /fetch\('\/api\/bookings'/);
  assert.match(widget, /Idempotency-Key/);
  assert.match(widget, /if \(bookingSubmittingRef\.current\) return/);
  assert.match(widget, /if \(areaSlug && deliveryAddressMissing\)/);
  assert.match(widget, /Chi phí tham khảo · Xe trùng lịch/);
  assert.match(widget, /bookingAttribution = bookingPage\s*\? \{[\s\S]*?landing_page: landingArea\.path[\s\S]*?booking_page: bookingPage/);
  assert.doesNotMatch(widget, /attribution: attribution \? \{ \.\.\.attribution, booking_page: bookingPage \} : null/);
  assert.match(widget, /Tài sản bảo đảm khi nhận xe được xác nhận riêng theo từng xe/);
  assert.match(widget, /Phí giao nhận sẽ được xác nhận theo địa chỉ/);
  assert.match(widget, /Chưa cần thanh toán\. Car Match sẽ xác nhận lịch và tổng chi phí trước khi hướng dẫn đặt cọc\./);
  assert.match(widget, /getBookingScheduleNotice/);
  assert.doesNotMatch(widget, /Car Match sẽ kiểm tra lịch và liên hệ lại/);
  assert.doesNotMatch(widget, /Kiểm tra lịch & nhận báo giá|Gửi yêu cầu kiểm tra lịch/);
  assert.match(widget, /Địa chỉ trả xe \(nếu khác địa chỉ nhận\)/);
  assert.match(widget, /Car Match đã nhận yêu cầu thuê xe/);
  assert.doesNotMatch(widget, /Trả xe trước 20:00/);
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
  assert.match(source, /requestId !== promoValidationRef\.current/);
  assert.match(source, /\}, \[vehicleId\]\);/);
  assert.doesNotMatch(source, /setPickupDate\(initialBookingSelection\.pickupDate\)[\s\S]{0,240}\}, \[vehicleId\]\);/);
});

test('Cau Giay has search-intent title and localized meta copy', async () => {
  const source = await readFile(areaData, 'utf8');
  assert.match(source, /Thuê Xe Tự Lái Cầu Giấy, Hà Nội/);
  assert.match(source, /description: 'Thuê xe tự lái Cầu Giấy.*Duy Tân.*Nội Bài/);
});

test('only four explicitly configured self-pickup hubs are defaulted', () => {
  assert.deepEqual(
    LOCAL_HUBS_DATA.flatMap(({ slug, selfPickupId }) => selfPickupId ? [[slug, selfPickupId]] : []),
    [
      ['vinhomes-ocean-park', 'ocean-park'],
      ['times-city', 'times-city'],
      ['the-manor-central-park', 'manor'],
      ['cau-giay', 'trung-lan'],
    ],
  );
});
