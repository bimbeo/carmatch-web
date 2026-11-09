import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTENT_PATH = new URL('../scripts/model-keyword-posts.mjs', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const HUB_PATH = new URL('../src/app/pages/ElectricRental.tsx', import.meta.url);

const expectedSlugs = [
  'vf5-hay-vf6-phu-hop-gia-dinh-hon',
  'vf6-hay-vf7-phu-hop-di-tinh-hon',
  'vf7-hay-vf8-phu-hop-chuyen-di-dai',
  'vf5-co-phu-hop-di-tinh-khong',
  'vf6-co-phu-hop-gia-dinh-5-nguoi-khong',
  'vf7-cho-duoc-bao-nhieu-hanh-ly',
  'vf8-co-phu-hop-di-duong-dai-khong',
  'toyota-raize-hay-vinfast-vf5-di-pho',
];

test('model keyword module publishes eight distinct intents with safe customer-facing copy', async () => {
  const source = await readFile(CONTENT_PATH, 'utf8');

  for (const slug of expectedSlugs) {
    assert.match(source, new RegExp(`slug: '${slug}'`));
  }

  assert.equal((source.match(/id: 'static-/g) || []).length, expectedSlugs.length);
  assert.equal(new Set(expectedSlugs).size, expectedSlugs.length);
  assert.match(source, /Câu trả lời ngắn:/);
  assert.match(source, /không phải cam kết/);
  assert.doesNotMatch(source, /\bCarMatch\b/);
});

test('every model article has vehicle links, metadata and enough original body content', async () => {
  const { createModelKeywordPosts } = await import(CONTENT_PATH);
  const posts = createModelKeywordPosts({
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

test('static generator and electric hub include the new model cluster', async () => {
  const [generator, hub] = await Promise.all([
    readFile(GENERATOR_PATH, 'utf8'),
    readFile(HUB_PATH, 'utf8'),
  ]);

  assert.match(generator, /import \{ createModelKeywordPosts \} from '\.\/model-keyword-posts\.mjs'/);
  assert.match(generator, /const modelKeywordPosts = createModelKeywordPosts\(\{ siteUrl, brandSocialImage \}\)/);
  assert.match(generator, /\.\.\.modelKeywordPosts/);

  for (const slug of expectedSlugs) {
    assert.match(hub, new RegExp(`/blog/${slug}`));
  }
});
