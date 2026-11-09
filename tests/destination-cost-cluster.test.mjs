import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTENT_PATH = new URL('../scripts/destination-cost-posts.mjs', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const DESTINATION_HUB_PATH = new URL('../src/app/pages/GoWhereDetail.tsx', import.meta.url);
const ROADMAP_PATH = new URL('../docs/seo/keyword-expansion-roadmap-2026-11-09.md', import.meta.url);

const expectedSlugs = [
  'chi-phi-thue-xe-tu-lai-di-ninh-binh',
  'chi-phi-thue-xe-tu-lai-di-ha-long',
  'chi-phi-thue-xe-tu-lai-di-tam-dao',
  'chi-phi-thue-xe-tu-lai-di-moc-chau',
  'chi-phi-thue-xe-tu-lai-di-sapa',
  'chi-phi-thue-xe-tu-lai-di-cat-ba',
  'chi-phi-thue-xe-tu-lai-di-ba-vi',
  'chi-phi-thue-xe-tu-lai-di-mai-chau',
  'chi-phi-thue-xe-tu-lai-di-hai-phong',
  'chi-phi-thue-xe-tu-lai-di-soc-son',
];

test('destination-cost wave publishes ten distinct, fact-safe intents', async () => {
  const source = await readFile(CONTENT_PATH, 'utf8');

  for (const slug of expectedSlugs) assert.match(source, new RegExp(`slug: '${slug}'`));
  assert.equal((source.match(/name: '[^']+', routeSlug:/g) || []).length, expectedSlugs.length);
  assert.equal(new Set(expectedSlugs).size, expectedSlugs.length);
  assert.match(source, /Câu trả lời ngắn:/);
  assert.match(source, /Tổng chuyến = tiền thuê/);
  assert.match(source, /không nên được chốt bằng một con số chung/);
  assert.doesNotMatch(source, /\bCarMatch\b/);
});

test('every destination-cost article has substantial copy, metadata and contextual links', async () => {
  const { createDestinationCostPosts } = await import(CONTENT_PATH);
  const posts = createDestinationCostPosts({
    siteUrl: 'https://www.carmatch.vn',
    brandSocialImage: 'https://www.carmatch.vn/og-image.png',
  });

  assert.equal(posts.length, expectedSlugs.length);
  assert.equal(new Set(posts.map((post) => post.slug.current)).size, posts.length);
  assert.equal(new Set(posts.map((post) => post.seoTitle)).size, posts.length);

  for (const post of posts) {
    assert.ok(post.bodyHtml.length >= 4000, `${post.slug.current} needs substantial route-specific content`);
    assert.ok(post.bodyHtml.includes('<h2>Công thức tính tổng chi phí'), `${post.slug.current} needs the cost formula`);
    assert.ok(post.bodyHtml.includes('Câu hỏi thường gặp'), `${post.slug.current} needs reader FAQ`);
    assert.ok(post.relatedDestinationSlugs.length === 1, `${post.slug.current} needs one destination hub`);
    assert.ok(post.relatedVehicleLinks.length >= 2, `${post.slug.current} needs two vehicle links`);
    assert.ok(post.relatedPostSlugs.length >= 1, `${post.slug.current} needs one supporting article`);
    assert.equal(post.canonicalUrl, `https://www.carmatch.vn/blog/${post.slug.current}`);
    assert.ok(post.seoDescription.length >= 50 && post.seoDescription.length <= 160);
  }
});

test('generator, destination hub and roadmap include the complete wave', async () => {
  const [generator, hub, roadmap] = await Promise.all([
    readFile(GENERATOR_PATH, 'utf8'),
    readFile(DESTINATION_HUB_PATH, 'utf8'),
    readFile(ROADMAP_PATH, 'utf8'),
  ]);

  assert.match(generator, /import \{ createDestinationCostPosts \} from '\.\/destination-cost-posts\.mjs'/);
  assert.match(generator, /const destinationCostPosts = createDestinationCostPosts\(\{ siteUrl, brandSocialImage \}\)/);
  assert.match(generator, /\.\.\.destinationCostPosts/);

  for (const slug of expectedSlugs) assert.match(hub, new RegExp(`/blog/${slug}`));
  assert.match(hub, /go_where_detail_cost_guide_click/);
  assert.match(roadmap, /Hoàn thành 10\/10/);
  const progress = roadmap.match(/\*\*(\d+)\/64 đã triển khai\*\*/);
  assert.ok(progress && Number(progress[1]) >= 28, 'roadmap progress must retain the completed destination wave');
});
