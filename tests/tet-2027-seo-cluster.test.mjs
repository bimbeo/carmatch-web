import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CONTENT_PATH = new URL('../scripts/tet-2027-posts.mjs', import.meta.url);
const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const APP_PATH = new URL('../src/app/App.tsx', import.meta.url);
const SSR_PATH = new URL('../src/ssg/renderHome.tsx', import.meta.url);
const PARTNER_PATH = new URL('../src/app/pages/Partner.tsx', import.meta.url);
const OWNER_LANDING_PATH = new URL('../src/app/pages/TetOwnerPartnership.tsx', import.meta.url);
const RENTAL_LANDING_PATH = new URL('../src/app/pages/TetRental.tsx', import.meta.url);
const HOME_PATH = new URL('../src/app/pages/Home.tsx', import.meta.url);
const BLOG_PATH = new URL('../src/app/pages/Blog.tsx', import.meta.url);
const FAQ_PATH = new URL('../src/app/pages/FAQ.tsx', import.meta.url);
const STATIC_BLOG_RENDERER_PATH = new URL('../server/blog/renderer.js', import.meta.url);
const GEO_PATH = new URL('../src/data/geoKnowledge.ts', import.meta.url);
const SUPPORT_PATH = new URL('../scripts/support-aeo-posts.mjs', import.meta.url);

const ownerSlugs = [
  'xe-nhan-roi-dip-tet-co-nen-cho-thue-khong',
  'hop-tac-chu-xe-cho-thue-tet-can-gi',
  'cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong',
  'hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi',
  'doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao',
  'uy-thac-xe-theo-ngay-hay-cho-thue-theo-thang',
  'xe-nao-phu-hop-khai-thac-dip-tet',
  'chuan-bi-xe-truoc-khi-cho-thue-tet',
  'phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao',
  'chu-xe-can-chuan-bi-gi-khi-ban-giao-xe-tet',
];

const customerSlugs = [
  'thue-xe-tu-lai-tet-2027-nen-dat-truoc-bao-lau',
  'goi-thue-xe-tet-7-ngay-hay-10-ngay',
  'thue-xe-ve-que-an-tet-nen-chon-xe-nao',
  'thue-xe-tet-cho-gia-dinh-5-7-nguoi',
  'thue-xe-tet-co-nhieu-hanh-ly-chon-xe-nao',
  'thue-xe-dien-di-tet-co-phu-hop-khong',
  'nhan-tra-xe-tu-lai-dip-tet-can-luu-y-gi',
  'thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi',
];

test('Tet 2027 cluster publishes ten owner and eight customer intents', async () => {
  const { createTet2027Posts } = await import(CONTENT_PATH);
  const posts = createTet2027Posts({
    siteUrl: 'https://www.carmatch.vn',
    brandSocialImage: 'https://www.carmatch.vn/og-image.png',
  });

  assert.equal(posts.length, 18);
  assert.equal(new Set(posts.map((post) => post.slug.current)).size, 18);
  assert.deepEqual(posts.slice(0, 10).map((post) => post.slug.current), ownerSlugs);
  assert.deepEqual(posts.slice(10).map((post) => post.slug.current), customerSlugs);
  assert.equal(posts.filter((post) => post.categories.includes('Hợp tác chủ xe')).length, 10);
  assert.equal(posts.filter((post) => post.categories.includes('Thuê xe Tết')).length, 8);

  for (const post of posts) {
    assert.ok(post.bodyHtml.length >= 3300, `${post.slug.current} needs a substantial answer`);
    assert.match(post.bodyHtml, /<strong>Câu trả lời ngắn:<\/strong>/);
    assert.match(post.bodyHtml, /Nên quyết định thế nào\?/);
    assert.match(post.bodyHtml, /Những rủi ro cần kiểm tra trước/);
    assert.match(post.bodyHtml, /\/chinh-sach/);
    assert.ok(post.relatedPostSlugs.length >= 2);
    assert.equal(post.canonicalUrl, `https://www.carmatch.vn/blog/${post.slug.current}`);
    assert.ok(post.seoDescription.length >= 50 && post.seoDescription.length <= 165);
    assert.doesNotMatch(post.bodyHtml, /thu nhập lên tới|bảo hiểm 100%|luôn có xe|cam kết thu nhập \d/i);
  }
});

test('Tet landings are routed, prerendered and registered for sitemap generation', async () => {
  const [generator, app, ssr, partner] = await Promise.all([
    readFile(GENERATOR_PATH, 'utf8'),
    readFile(APP_PATH, 'utf8'),
    readFile(SSR_PATH, 'utf8'),
    readFile(PARTNER_PATH, 'utf8'),
  ]);

  for (const route of ['/hop-tac-chu-xe-cho-thue-tet', '/thue-xe-tu-lai-tet-ha-noi']) {
    assert.match(app, new RegExp(route));
    assert.match(generator, new RegExp(route));
  }
  assert.match(generator, /createTet2027Posts/);
  assert.match(generator, /\.\.\.tet2027Posts/);
  assert.match(ssr, /renderTetOwnerPartnership/);
  assert.match(ssr, /renderTetRental/);
  assert.match(partner, /\/hop-tac-chu-xe-cho-thue-tet/);
  assert.doesNotMatch(partner, /0đ|30 phút|800K–2 triệu/);
});

test('Tet hubs have complete spoke links and are discoverable from strong website pages', async () => {
  const [ownerLanding, rentalLanding, home, blog, faq, staticBlogRenderer, geo] = await Promise.all([
    readFile(OWNER_LANDING_PATH, 'utf8'),
    readFile(RENTAL_LANDING_PATH, 'utf8'),
    readFile(HOME_PATH, 'utf8'),
    readFile(BLOG_PATH, 'utf8'),
    readFile(FAQ_PATH, 'utf8'),
    readFile(STATIC_BLOG_RENDERER_PATH, 'utf8'),
    readFile(GEO_PATH, 'utf8'),
  ]);

  for (const slug of ownerSlugs) assert.match(ownerLanding, new RegExp(`/blog/${slug}`));
  for (const slug of customerSlugs) assert.match(rentalLanding, new RegExp(`/blog/${slug}`));

  for (const route of ['/hop-tac-chu-xe-cho-thue-tet', '/thue-xe-tu-lai-tet-ha-noi']) {
    const pattern = new RegExp(route);
    assert.match(home, pattern);
    assert.match(blog, pattern);
    assert.match(faq, pattern);
    assert.match(staticBlogRenderer, pattern);
    assert.match(geo, pattern);
  }

  assert.match(geo, /tet-2027-self-drive-rental-hanoi/);
  assert.match(geo, /tet-2027-owner-partnership/);
  assert.doesNotMatch(home, /value: '30 phút'|value: '0đ'/);

  const { createSupportAeoPosts } = await import(SUPPORT_PATH);
  const holidayPricePost = createSupportAeoPosts({
    siteUrl: 'https://www.carmatch.vn',
    brandSocialImage: 'https://www.carmatch.vn/og-image.png',
  }).find((post) => post.slug.current === 'gia-thue-xe-le-tet-tinh-the-nao');
  assert.ok(holidayPricePost?.bodyHtml.includes('/thue-xe-tu-lai-tet-ha-noi'));
});
