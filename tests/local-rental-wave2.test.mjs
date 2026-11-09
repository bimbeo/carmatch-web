import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const EXPANSION_PATH = new URL('../src/data/localRentalExpansionAreas.ts', import.meta.url);
const DATA_PATH = new URL('../src/data/localRentalAreas.ts', import.meta.url);
const APP_PATH = new URL('../src/app/App.tsx', import.meta.url);
const HOME_PATH = new URL('../src/app/pages/Home.tsx', import.meta.url);
const ROADMAP_PATH = new URL('../docs/seo/keyword-expansion-roadmap-2026-11-09.md', import.meta.url);

const routes = [
  '/thue-xe-tu-lai-cau-giay',
  '/thue-xe-tu-lai-my-dinh',
  '/thue-xe-tu-lai-ha-dong',
  '/thue-xe-tu-lai-tay-ho',
  '/thue-xe-tu-lai-long-bien',
  '/thue-xe-tu-lai-hoan-kiem',
  '/thue-xe-tu-lai-hai-ba-trung',
  '/thue-xe-tu-lai-thanh-xuan',
  '/thue-xe-tu-lai-nam-tu-liem',
  '/thue-xe-tu-lai-bac-tu-liem',
  '/thue-xe-tu-lai-gia-lam',
  '/thue-xe-tu-lai-dong-anh-noi-bai',
];

test('Wave 2 adds twelve distinct local intents with current-address guardrails', async () => {
  const source = await readFile(EXPANSION_PATH, 'utf8');

  for (const route of routes) assert.match(source, new RegExp(`path: '${route}'`));
  assert.equal((source.match(/^    heroAnswer:/gm) || []).length, routes.length);
  assert.equal((source.match(/^    pickupNote:/gm) || []).length, routes.length);
  assert.equal((source.match(/^    locationNote:/gm) || []).length, routes.length);
  assert.match(source, /phường hiện tại|địa chỉ hiện tại/);
  assert.match(source, /không mặc định/);
  assert.doesNotMatch(source, /phí giao nhận (?:là|cố định) \d/i);
  assert.doesNotMatch(source, /\bCarMatch\b/);
});

test('local area catalog, React routes and homepage expose Wave 2 without replacing confirmed areas', async () => {
  const [data, app, home] = await Promise.all([
    readFile(DATA_PATH, 'utf8'),
    readFile(APP_PATH, 'utf8'),
    readFile(HOME_PATH, 'utf8'),
  ]);

  assert.match(data, /\.\.\.confirmedLocalRentalAreas/);
  assert.match(data, /\.\.\.wave2LocalRentalAreas/);
  assert.match(app, /wave2LocalRentalAreas\.map/);
  assert.match(app, /<Route key=\{area\.path\} path=\{area\.path\} element=\{<LocalRental areaSlug=\{area\.slug\} \/>\} \/>/);
  assert.match(home, /12 khu vực Hà Nội đang tiếp nhận yêu cầu/);
  assert.match(home, /wave2LocalRentalAreas\.map/);

  for (const existingRoute of [
    '/thue-xe-tu-lai-vinhomes-ocean-park',
    '/thue-xe-tu-lai-vinhomes-smart-city',
    '/thue-xe-tu-lai-times-city',
    '/thue-xe-tu-lai-ecopark',
    '/thue-xe-tu-lai-the-manor',
  ]) assert.match(app, new RegExp(existingRoute));
});

test('roadmap records all sixty-four URLs as implemented', async () => {
  const roadmap = await readFile(ROADMAP_PATH, 'utf8');

  assert.match(roadmap, /Hoàn thành 12\/12 với điều kiện xác nhận theo booking/);
  assert.match(roadmap, /Đã triển khai 12\/12/);
  assert.match(roadmap, /64\/64 đã triển khai/);
});
