import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTENT_PATH = new URL('../scripts/monthly-b2b-posts.mjs', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const MONTHLY_HUB_PATH = new URL('../src/app/pages/B2B.tsx', import.meta.url);
const ROADMAP_PATH = new URL('../docs/seo/keyword-expansion-roadmap-2026-11-09.md', import.meta.url);

const expectedSlugs = [
  'thue-xe-thang-cho-doanh-nghiep-nho',
  'thue-xe-thang-cho-chuyen-gia-nuoc-ngoai',
  'thue-xe-thang-cho-nhan-vien-di-cong-tac',
  'goi-thue-xe-22-ngay-va-30-ngay-khac-gi-nhau',
  'thue-xe-thang-co-xuat-hoa-don-khong',
  'hop-dong-thue-xe-thang-can-dieu-khoan-gi',
  'thue-xe-thang-co-gioi-han-km-khong',
  'xe-thay-the-khi-bao-duong-xu-ly-the-nao',
];

test('monthly and B2B wave publishes eight distinct commercial intents', async () => {
  const source = await readFile(CONTENT_PATH, 'utf8');

  for (const slug of expectedSlugs) assert.match(source, new RegExp(`slug: '${slug}'`));
  assert.equal((source.match(/id: 'static-monthly-b2b-/g) || []).length, expectedSlugs.length);
  assert.equal(new Set(expectedSlugs).size, expectedSlugs.length);
  assert.match(source, /Câu trả lời ngắn:/);
  assert.match(source, /Nghị định 254\/2026\/NĐ-CP/);
  assert.match(source, /55\/VBHN-VPQH/);
  assert.doesNotMatch(source, /\bCarMatch\b/);
});

test('every monthly and B2B article is substantial, cautious and decision-focused', async () => {
  const { createMonthlyB2bPosts } = await import(CONTENT_PATH);
  const posts = createMonthlyB2bPosts({
    siteUrl: 'https://www.carmatch.vn',
    brandSocialImage: 'https://www.carmatch.vn/og-image.png',
  });

  assert.equal(posts.length, expectedSlugs.length);
  assert.equal(new Set(posts.map((post) => post.slug.current)).size, posts.length);
  assert.equal(new Set(posts.map((post) => post.seoTitle)).size, posts.length);

  for (const post of posts) {
    assert.ok(post.bodyHtml.length >= 6000, `${post.slug.current} needs a complete business decision guide`);
    assert.ok(post.bodyHtml.includes('<strong>Câu trả lời ngắn:</strong>'), `${post.slug.current} needs a direct answer`);
    assert.ok(post.bodyHtml.includes('<table>'), `${post.slug.current} needs a decision table`);
    assert.ok(post.bodyHtml.includes('/thue-xe-thang'), `${post.slug.current} needs the monthly hub`);
    assert.ok(post.bodyHtml.includes('/chinh-sach'), `${post.slug.current} needs policy context`);
    assert.ok(post.relatedPostSlugs.length >= 3, `${post.slug.current} needs three supporting articles`);
    assert.equal(post.canonicalUrl, `https://www.carmatch.vn/blog/${post.slug.current}`);
    assert.ok(post.seoDescription.length >= 50 && post.seoDescription.length <= 160);
  }
});

test('generator, monthly hub and roadmap expose the complete wave', async () => {
  const [generator, hub, roadmap] = await Promise.all([
    readFile(GENERATOR_PATH, 'utf8'),
    readFile(MONTHLY_HUB_PATH, 'utf8'),
    readFile(ROADMAP_PATH, 'utf8'),
  ]);

  assert.match(generator, /import \{ createMonthlyB2bPosts \} from '\.\/monthly-b2b-posts\.mjs'/);
  assert.match(generator, /const monthlyB2bPosts = createMonthlyB2bPosts\(\{ siteUrl, brandSocialImage \}\)/);
  assert.match(generator, /\.\.\.monthlyB2bPosts/);

  for (const slug of expectedSlugs) {
    assert.match(hub, new RegExp(`/blog/${slug}`));
    assert.match(generator, new RegExp(`/blog/${slug}`));
  }

  assert.match(roadmap, /Hoàn thành 8\/8/);
  const progress = roadmap.match(/\*\*(\d+)\/64 đã triển khai\*\*/);
  assert.ok(progress && Number(progress[1]) >= 52, 'roadmap progress must retain the completed B2B wave');
});
