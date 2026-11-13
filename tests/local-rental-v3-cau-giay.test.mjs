import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const localPage = new URL('../src/app/pages/LocalRental.tsx', import.meta.url);
const decisionTools = new URL('../src/app/components/LocalRentalDecisionTools.tsx', import.meta.url);
const areaData = new URL('../src/data/localRentalExpansionAreas.ts', import.meta.url);
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
});

test('V3 pricing reuses the website billing logic and does not invent availability', async () => {
  const [tools, billing] = await Promise.all([readFile(decisionTools, 'utf8'), readFile(rentalDuration, 'utf8')]);
  assert.match(tools, /calculateRentalBillingDays\(fromDate, fromHour, toDate, toHour\)/);
  assert.match(tools, /baseCost = validPeriod && car\?\.price/);
  assert.match(tools, /formatRentalBillingDays\(days\)/);
  assert.match(tools, /không phải danh sách xe đã được xác nhận còn trống/);
  assert.match(tools, /chưa gồm cọc, giao nhận và phụ phí/);
  assert.match(tools, /trackZaloClick\(source \+ '_estimate'/);
  assert.match(billing, /export function calculateRentalBillingDays/);
});

test('Cau Giay has search-intent title and localized meta copy', async () => {
  const source = await readFile(areaData, 'utf8');
  assert.match(source, /Thuê Xe Tự Lái Cầu Giấy: Xe, Giá & Giao Nhận/);
  assert.match(source, /tính tiền theo ngày giờ và hẹn giao nhận tại tòa nhà/);
});
