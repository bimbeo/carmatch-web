import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTENT_PATH = new URL('../scripts/model-keyword-posts-batch2.mjs', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const ELECTRIC_HUB_PATH = new URL('../src/app/pages/ElectricRental.tsx', import.meta.url);
const SEVEN_SEAT_HUB_PATH = new URL('../src/app/pages/SevenSeatRental.tsx', import.meta.url);
const MONTHLY_HUB_PATH = new URL('../src/app/pages/B2B.tsx', import.meta.url);

const expectedSlugs = [
  'vf7s-hay-vf7-plus-khac-nhau-the-nao',
  'chi-phi-sac-vf5-cho-chuyen-di-300-km',
  'chi-phi-sac-vf6-cho-chuyen-di-300-km',
  'thue-vf5-theo-ngay-hay-theo-thang',
  'vf3-vf5-hay-vf6-phu-hop-di-pho',
  'fadil-hay-vf3-phu-hop-di-pho',
  'creta-hay-vf6-phu-hop-gia-dinh',
  'xpander-hay-limo-green-cho-nhom-dong',
  'limo-green-cho-duoc-bao-nhieu-vali',
  'jaecoo-j7-hay-vf7-di-tinh',
];

test('batch two publishes ten distinct model intents with fact-safe copy', async () => {
  const source = await readFile(CONTENT_PATH, 'utf8');

  for (const slug of expectedSlugs) assert.match(source, new RegExp(`slug: '${slug}'`));

  assert.equal((source.match(/id: 'static-/g) || []).length, expectedSlugs.length);
  assert.equal(new Set(expectedSlugs).size, expectedSlugs.length);
  assert.match(source, /VF7 Plus.*tạm ngừng nhận lịch/s);
  assert.match(source, /Jaecoo J7.*tạm ngừng nhận lịch/s);
  assert.match(source, /3 × E × P/);
  assert.doesNotMatch(source, /\bCarMatch\b/);
});

test('batch two articles have unique metadata, original bodies and vehicle links', async () => {
  const { createModelKeywordBatch2Posts } = await import(CONTENT_PATH);
  const posts = createModelKeywordBatch2Posts({
    siteUrl: 'https://www.carmatch.vn',
    brandSocialImage: 'https://www.carmatch.vn/og-image.png',
  });

  assert.equal(posts.length, expectedSlugs.length);
  assert.equal(new Set(posts.map((post) => post.seoTitle)).size, posts.length);

  for (const post of posts) {
    assert.ok(post.bodyHtml.length >= 2500, `${post.slug.current} needs substantial original content`);
    assert.ok(post.bodyHtml.includes('<h2>'), `${post.slug.current} needs H2 sections`);
    assert.ok(post.bodyHtml.includes('Câu hỏi thường gặp'), `${post.slug.current} needs reader FAQ`);
    assert.ok(post.relatedVehicleLinks.length >= 2, `${post.slug.current} needs two vehicle links`);
    assert.equal(post.canonicalUrl, `https://www.carmatch.vn/blog/${post.slug.current}`);
    assert.ok(post.seoDescription.length >= 50 && post.seoDescription.length <= 160);
  }
});

test('generator and commercial hubs discover every batch two article', async () => {
  const [generator, electric, sevenSeat, monthly] = await Promise.all([
    readFile(GENERATOR_PATH, 'utf8'),
    readFile(ELECTRIC_HUB_PATH, 'utf8'),
    readFile(SEVEN_SEAT_HUB_PATH, 'utf8'),
    readFile(MONTHLY_HUB_PATH, 'utf8'),
  ]);

  assert.match(generator, /import \{ createModelKeywordBatch2Posts \} from '\.\/model-keyword-posts-batch2\.mjs'/);
  assert.match(generator, /\.\.\.modelKeywordBatch2Posts/);
  for (const slug of expectedSlugs) assert.match(electric, new RegExp(`/blog/${slug}`));
  assert.match(sevenSeat, /\/blog\/xpander-hay-limo-green-cho-nhom-dong/);
  assert.match(sevenSeat, /\/blog\/limo-green-cho-duoc-bao-nhieu-vali/);
  assert.match(monthly, /\/blog\/thue-vf5-theo-ngay-hay-theo-thang/);
});
