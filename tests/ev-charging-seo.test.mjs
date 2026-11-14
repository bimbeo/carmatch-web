import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const HUB_PATH = new URL('../src/app/pages/ElectricRental.tsx', import.meta.url);
const DETAIL_PATH = new URL('../src/app/pages/CarDetail.tsx', import.meta.url);
const KNOWLEDGE_PATH = new URL('../src/data/geoKnowledge.ts', import.meta.url);
const SITEMAP_PATH = new URL('../public/sitemap.xml', import.meta.url);

test('charging-cost guide gives a direct, contract-safe answer without a fixed charging rate', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');
  const start = source.indexOf("_id: 'static-electric-rental-charging-cost-guide'");
  const end = source.indexOf('const staticAirportBlogPosts', start);
  const article = source.slice(start, end);

  assert.ok(start >= 0, 'charging-cost article must exist');
  assert.match(article, /slug: \{ current: 'thue-xe-dien-ai-tra-phi-sac' \}/);
  assert.match(article, /Câu trả lời ngắn:/);
  assert.match(article, /không nên mặc định phí sạc đã nằm trong giá thuê xe điện/);
  assert.match(article, /mức pin lúc giao, mức pin cần có khi trả/);
  assert.match(article, /<div class="table-wrap"><table>/);
  assert.match(article, /Chụp màn hình mức pin và đồng hồ km/);
  assert.match(article, /https:\/\/vinfastauto\.com\/vn_vi\/hop-dong-va-chinh-sach\/chinh-sach/);
  assert.match(article, /https:\/\/vinfastauto\.com\/vn_vi\/huong-dan-sac-pin-o-to-dien-vinfast/);
  assert.match(article, /canonicalUrl: `\$\{siteUrl\}\/blog\/thue-xe-dien-ai-tra-phi-sac`/);
  assert.match(article, /ctaPrimaryUrl: '\/thue-xe-dien-ha-noi'/);
  assert.doesNotMatch(article, /3[.,]858|mọi khách thuê (?:luôn )?được sạc miễn phí|phí sạc luôn (?:được )?bao gồm/i);
});

test('electric hub states the current included-charging policy while vehicle detail keeps the policy guide', async () => {
  const [hub, detail] = await Promise.all([
    readFile(HUB_PATH, 'utf8'),
    readFile(DETAIL_PATH, 'utf8'),
  ]);

  assert.match(hub, /điện sạc tại trụ nằm trong giá thuê/i);
  assert.match(hub, /phạm vi trụ áp dụng/);
  assert.match(hub, /phí chiếm dụng vị trí sạc/);
  assert.doesNotMatch(hub, /đơn giá điện|giá kWh/i);

  assert.match(detail, /car\.fuel === 'Điện'/);
  assert.match(detail, /to="\/blog\/thue-xe-dien-ai-tra-phi-sac"/);
  assert.match(detail, /car_detail_ev_charging_guide/);
});

test('charging-cost guide is represented in GEO knowledge and the public sitemap', async () => {
  const [knowledge, sitemap] = await Promise.all([
    readFile(KNOWLEDGE_PATH, 'utf8'),
    readFile(SITEMAP_PATH, 'utf8'),
  ]);

  assert.match(knowledge, /id: 'electric-rental-charging-cost'/);
  assert.match(knowledge, /path: '\/blog\/thue-xe-dien-ai-tra-phi-sac'/);
  assert.match(knowledge, /báo giá, xác nhận đặt xe hoặc hợp đồng/);
  assert.match(knowledge, /'\/thue-xe-dien-ha-noi'/);
  assert.match(sitemap, /https:\/\/www\.carmatch\.vn\/blog\/thue-xe-dien-ai-tra-phi-sac/);
  assert.match(sitemap, /<lastmod>2026-11-08<\/lastmod>/);
});
