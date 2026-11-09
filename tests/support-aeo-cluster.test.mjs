import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTENT_PATH = new URL('../scripts/support-aeo-posts.mjs', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const FAQ_PATH = new URL('../src/app/pages/FAQ.tsx', import.meta.url);
const ROADMAP_PATH = new URL('../docs/seo/keyword-expansion-roadmap-2026-11-09.md', import.meta.url);

const expectedSlugs = [
  'co-duoc-cho-nguoi-khac-lai-xe-thue-khong',
  'nguoi-nuoc-ngoai-thue-xe-tu-lai-can-giay-to-gi',
  'co-duoc-di-xe-thue-ra-ngoai-ha-noi-khong',
  'phi-vetc-xe-thue-thanh-toan-the-nao',
  'xe-thue-bi-thung-lop-xu-ly-the-nao',
  'xe-thue-khong-khoi-dong-can-lam-gi',
  'mat-chia-khoa-xe-thue-xu-ly-the-nao',
  'co-duoc-mang-thu-cung-len-xe-thue-khong',
  'co-duoc-hut-thuoc-tren-xe-thue-khong',
  'tra-xe-thue-khac-dia-diem-co-duoc-khong',
  'co-the-nhan-xe-thue-dem-muon-khong',
  'can-chup-nhung-gi-khi-nhan-xe-tu-lai',
  'bien-ban-ban-giao-xe-thue-can-co-gi',
  'bao-lau-sau-khi-tra-xe-duoc-hoan-coc',
  'bao-hiem-xe-thue-chi-tra-nhung-gi',
  'gia-thue-xe-le-tet-tinh-the-nao',
];

test('AEO support wave publishes all sixteen distinct customer questions', async () => {
  const source = await readFile(CONTENT_PATH, 'utf8');

  for (const slug of expectedSlugs) assert.match(source, new RegExp(`slug: '${slug}'`));
  assert.equal((source.match(/id: 'static-aeo-/g) || []).length, expectedSlugs.length);
  assert.equal(new Set(expectedSlugs).size, expectedSlugs.length);
  assert.match(source, /Câu trả lời ngắn:/);
  assert.match(source, /22\/VBHN-BGTVT/);
  assert.match(source, /Nghị định 67\/2023\/NĐ-CP/);
  assert.doesNotMatch(source, /\bCarMatch\b/);
});

test('every AEO article is substantial, cautious and internally connected', async () => {
  const { createSupportAeoPosts } = await import(CONTENT_PATH);
  const posts = createSupportAeoPosts({
    siteUrl: 'https://www.carmatch.vn',
    brandSocialImage: 'https://www.carmatch.vn/og-image.png',
  });

  assert.equal(posts.length, expectedSlugs.length);
  assert.equal(new Set(posts.map((post) => post.slug.current)).size, posts.length);
  assert.equal(new Set(posts.map((post) => post.seoTitle)).size, posts.length);

  for (const post of posts) {
    assert.ok(post.bodyHtml.length >= 4000, `${post.slug.current} needs a complete support answer`);
    assert.ok(post.bodyHtml.includes('<strong>Câu trả lời ngắn:</strong>'), `${post.slug.current} needs a direct answer`);
    assert.ok(post.bodyHtml.includes('Những điều phải xác nhận bằng văn bản'), `${post.slug.current} needs policy guardrails`);
    assert.ok(post.bodyHtml.includes('/chinh-sach'), `${post.slug.current} needs the policy hub`);
    assert.ok(post.bodyHtml.includes('/faq'), `${post.slug.current} needs the FAQ hub`);
    assert.ok(post.relatedPostSlugs.length >= 2, `${post.slug.current} needs supporting articles`);
    assert.equal(post.canonicalUrl, `https://www.carmatch.vn/blog/${post.slug.current}`);
    assert.ok(post.seoDescription.length >= 50 && post.seoDescription.length <= 160);
  }
});

test('generator, FAQ hub and roadmap expose the complete AEO wave', async () => {
  const [generator, faq, roadmap] = await Promise.all([
    readFile(GENERATOR_PATH, 'utf8'),
    readFile(FAQ_PATH, 'utf8'),
    readFile(ROADMAP_PATH, 'utf8'),
  ]);

  assert.match(generator, /import \{ createSupportAeoPosts \} from '\.\/support-aeo-posts\.mjs'/);
  assert.match(generator, /const supportAeoPosts = createSupportAeoPosts\(\{ siteUrl, brandSocialImage \}\)/);
  assert.match(generator, /\.\.\.supportAeoPosts/);
  assert.doesNotMatch(generator, /bảo\\s\*hiểm\[\^\.\?!<\\n\]\*/);

  for (const slug of expectedSlugs) assert.match(faq, new RegExp(`/blog/${slug}`));
  assert.match(roadmap, /Hoàn thành 16\/16/);
  const progress = roadmap.match(/\*\*(\d+)\/64 đã triển khai\*\*/);
  assert.ok(progress && Number(progress[1]) >= 44, 'roadmap progress must retain the completed AEO wave');
});
