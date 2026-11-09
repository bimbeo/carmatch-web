import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTENT_PATH = new URL('../scripts/roadmap-content-posts.mjs', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const KNOWLEDGE_PATH = new URL('../src/data/geoKnowledge.ts', import.meta.url);
const ELECTRIC_HUB_PATH = new URL('../src/app/pages/ElectricRental.tsx', import.meta.url);
const SEVEN_SEAT_HUB_PATH = new URL('../src/app/pages/SevenSeatRental.tsx', import.meta.url);
const MONTHLY_HUB_PATH = new URL('../src/app/pages/B2B.tsx', import.meta.url);

const expectedSlugs = [
  'vf3-hay-vf5-phu-hop-di-pho',
  'carnival-xpander-hay-limo-green',
  'thue-xe-thang-hay-mua-xe',
  'chi-phi-thue-xe-tu-lai-3-ngay-2-dem',
  'di-tinh-nen-thue-xe-dien-hay-xe-xang',
  'xe-dien-thue-het-pin-giua-duong-lam-gi',
  'thue-xe-thang-co-bao-gom-bao-duong-khong',
  'lap-ke-hoach-sac-xe-dien-khi-di-tinh',
];

test('roadmap content module publishes all eight distinct decision and support intents', async () => {
  const source = await readFile(CONTENT_PATH, 'utf8');

  for (const slug of expectedSlugs) {
    assert.match(source, new RegExp(`slug: '${slug}'`));
  }

  assert.equal((source.match(/id: 'static-/g) || []).length, 8);
  assert.match(source, /Câu trả lời ngắn:/);
  assert.match(source, /không nên mặc định giá thuê xe tháng đã bao gồm mọi chi phí bảo dưỡng/i);
  assert.match(source, /không nên lập kế hoạch chỉ dựa vào một trạm/);
  assert.match(source, /không tự kéo, kích điện, tháo pin hoặc can thiệp hệ thống điện/);
  assert.doesNotMatch(source, /\bCarMatch\b/);
});

test('static generator merges roadmap posts before rendering sitemap, schema and llms files', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');

  assert.match(source, /import \{ createRoadmapContentPosts \} from '\.\/roadmap-content-posts\.mjs'/);
  assert.match(source, /const roadmapContentPosts = createRoadmapContentPosts\(\{ siteUrl, brandSocialImage \}\)/);
  assert.match(source, /\.\.\.roadmapContentPosts/);
});

test('GEO knowledge and priority-page briefs cover every new article', async () => {
  const knowledge = await readFile(KNOWLEDGE_PATH, 'utf8');

  for (const slug of expectedSlugs) {
    const matches = knowledge.match(new RegExp(`/blog/${slug}`, 'g')) || [];
    assert.ok(matches.length >= 2, `${slug} must appear in knowledge and priority pages`);
  }

  assert.match(knowledge, /id: 'vf3-vf5-city-comparison'/);
  assert.match(knowledge, /id: 'seven-seat-model-comparison'/);
  assert.match(knowledge, /id: 'monthly-rental-maintenance'/);
  assert.match(knowledge, /id: 'ev-road-trip-charging-plan'/);
});

test('commercial hubs link back to their new supporting content', async () => {
  const [electric, sevenSeat, monthly] = await Promise.all([
    readFile(ELECTRIC_HUB_PATH, 'utf8'),
    readFile(SEVEN_SEAT_HUB_PATH, 'utf8'),
    readFile(MONTHLY_HUB_PATH, 'utf8'),
  ]);

  assert.match(electric, /\/blog\/vf3-hay-vf5-phu-hop-di-pho/);
  assert.match(electric, /\/blog\/lap-ke-hoach-sac-xe-dien-khi-di-tinh/);
  assert.match(electric, /\/blog\/xe-dien-thue-het-pin-giua-duong-lam-gi/);
  assert.match(sevenSeat, /\/blog\/carnival-xpander-hay-limo-green/);
  assert.match(sevenSeat, /\/blog\/chi-phi-thue-xe-tu-lai-3-ngay-2-dem/);
  assert.match(monthly, /\/blog\/thue-xe-thang-hay-mua-xe/);
  assert.match(monthly, /\/blog\/thue-xe-thang-co-bao-gom-bao-duong-khong/);
});

