import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const HOME_PATH = new URL('../src/app/pages/Home.tsx', import.meta.url);
const REVIEWS_API_PATH = new URL('../api/reviews.js', import.meta.url);
const STATIC_GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);

test('homepage targets the main Hanoi self-drive intent and links priority pages', async () => {
  const source = await readFile(HOME_PATH, 'utf8');

  assert.match(source, /Thuê xe tự lái Hà Nội/);
  assert.match(source, /Bảng giá thuê xe tự lái Hà Nội theo nhu cầu/);
  assert.match(source, /href: '\/xe\/kia-carnival'/);
  assert.match(source, /href: '\/xe\/vinfast-vf3-2024'/);
  assert.match(source, /href: '\/thue-xe-thang'/);
  assert.match(source, /<HomeReviews \/>/);
});

test('homepage delivery-area copy only lists the five confirmed priority areas', async () => {
  const source = await readFile(HOME_PATH, 'utf8');
  const areasBlock = source.slice(source.indexOf('const residentialAreas'), source.indexOf('const quickSearchSeats'));

  for (const area of [
    'Vinhomes Ocean Park',
    'Vinhomes Times City',
    'Vinhomes Smart City',
    'Ecopark',
    'The Manor Central Park',
  ]) {
    assert.match(areasBlock, new RegExp(area));
  }

  assert.doesNotMatch(areasBlock, /Royal City|Linh Đàm/);
});

test('homepage reviews endpoint returns only approved reviews with comments', async () => {
  const source = await readFile(REVIEWS_API_PATH, 'utf8');

  assert.match(source, /scope === 'homepage'/);
  assert.match(source, /\.eq\('status', 'approved'\)/);
  assert.match(source, /\.not\('comment', 'is', null\)/);
  assert.match(source, /\.limit\(6\)/);
});

test('homepage prerender receives the full catalog for complete price rows', async () => {
  const source = await readFile(STATIC_GENERATOR_PATH, 'utf8');
  const renderer = source.slice(source.indexOf('async function renderReactHomeRoot'), source.indexOf('async function renderReactMonthlyRoot'));

  assert.match(renderer, /vehicles\.map\(pruneVehicleForClient\)/);
  assert.doesNotMatch(renderer, /vehicles\.slice\(0, 6\)/);
});
