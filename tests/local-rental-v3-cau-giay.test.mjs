import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const localPage = new URL('../src/app/pages/LocalRental.tsx', import.meta.url);
const decisionTools = new URL('../src/app/components/LocalRentalDecisionTools.tsx', import.meta.url);
const areaData = new URL('../src/data/localRentalExpansionAreas.ts', import.meta.url);
const hubData = new URL('../src/data/localHubsData.ts', import.meta.url);
const rentalDuration = new URL('../src/lib/rentalDuration.ts', import.meta.url);

test('V3 is piloted only on Cau Giay, keeping shared local pages intact', async () => {
  const source = await readFile(localPage, 'utf8');
  assert.match(source, /area\.slug === 'cau-giay'/);
  assert.match(source, /isCauGiayPilot && <LocalRentalQuickAnswer area=\{area\} \/>/);
  assert.match(source, /isCauGiayPilot && <LocalRentalPlanner area=\{area\} cars=\{representativeCars\} source=\{source\} \/>/);
  assert.match(source, /id="xe-goi-y"/);
  assert.match(source, /id="giao-nhan"/);
  assert.match(source, /id="cau-hoi"/);
  assert.match(source, /<CarCard key=\{car\.id\}/);
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
  assert.doesNotMatch(source, /application\/ld\+json/);
});

test('V3 pricing reuses the website billing logic and does not invent availability', async () => {
  const [tools, billing] = await Promise.all([readFile(decisionTools, 'utf8'), readFile(rentalDuration, 'utf8')]);
  assert.match(tools, /calculateRentalBillingDays\(fromDate, fromHour, toDate, toHour\)/);
  assert.match(tools, /baseCost = validPeriod && car\?\.price/);
  assert.match(tools, /formatRentalBillingDays\(days\)/);
  assert.match(tools, /getTomorrowIsoDate/);
  assert.match(tools, /1 ngày \(Mặc định\)/);
  assert.match(tools, /'Hành lý', 'Phù hợp'/);
  assert.match(tools, /Đội vận hành Car Match tiếp nhận địa chỉ/);
  assert.match(tools, /chưa gồm cọc, giao nhận và phụ phí/);
  assert.match(tools, /trackZaloClick\(source \+ '_estimate'/);
  assert.doesNotMatch(tools, /available\s*===\s*true|InStock|LimitedAvailability/);
  assert.doesNotMatch(tools, /xác nhận xe trống trong 5 phút/i);
  assert.match(billing, /export function calculateRentalBillingDays/);
});

test('Cau Giay has search-intent title and localized meta copy', async () => {
  const source = await readFile(areaData, 'utf8');
  assert.match(source, /Thuê Xe Tự Lái Cầu Giấy: Xe, Giá & Giao Nhận/);
  assert.match(source, /tính tiền theo ngày giờ và hẹn giao nhận tại tòa nhà/);
});

test('Cau Giay operational copy is centralized and limited to verified claims', async () => {
  const source = await readFile(hubData, 'utf8');
  assert.match(source, /Tôn Thất Thuyết – Duy Tân/);
  assert.match(source, /deliveryFeePerWay: 100_000/);
  assert.match(source, /serviceHours: '07:00–22:00'/);
  assert.match(source, /CCCD gắn chip và giấy phép lái xe hạng B bản gốc/);
  assert.doesNotMatch(source, /5 phút|bảo hiểm vật chất/i);
});
