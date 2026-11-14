import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const HOME_PATH = new URL('../src/app/pages/Home.tsx', import.meta.url);
const DETAIL_PATH = new URL('../src/app/pages/CarDetail.tsx', import.meta.url);
const MONTHLY_PATH = new URL('../src/app/pages/B2B.tsx', import.meta.url);
const REENGAGEMENT_PATH = new URL('../src/app/pages/ReEngagement.tsx', import.meta.url);
const BLOG_POST_PATH = new URL('../src/app/pages/BlogPost.tsx', import.meta.url);
const BLOG_RENDERER_PATH = new URL('../server/blog/renderer.js', import.meta.url);
const STATIC_GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);

test('GSC priority pages use exact commercial intent in titles and internal links', async () => {
  const [home, detail, monthly, generator] = await Promise.all([
    readFile(HOME_PATH, 'utf8'),
    readFile(DETAIL_PATH, 'utf8'),
    readFile(MONTHLY_PATH, 'utf8'),
    readFile(STATIC_GENERATOR_PATH, 'utf8'),
  ]);

  assert.match(home, /Thuê Xe Tự Lái Hà Nội Từ 600K\/Ngày/);
  assert.match(home, /href: '\/xe\/vinfast-vf5'/);
  assert.match(home, /href: '\/xe\/vinfast-vf6'/);
  assert.match(detail, /Thuê Kia Carnival Tự Lái Hà Nội \| Giá & Lịch Xe/);
  assert.match(detail, /`Thuê \$\{car\.name\} tự lái tại Hà Nội`/);
  assert.match(monthly, /Thuê Xe Theo Tháng Hà Nội \| Bảng Giá Theo Mẫu Xe/);
  assert.match(generator, /Thuê Xe Tự Lái Hà Nội Từ 600K\/Ngày \| Car Match/);
  assert.match(generator, /Thuê Xe Theo Tháng Hà Nội \| Bảng Giá Theo Mẫu Xe/);
  assert.match(generator, /function vehicleSeoTitle/);
  assert.match(generator, /Thuê Kia Carnival Tự Lái Hà Nội \| Giá & Lịch Xe/);
});

test('blog renderer removes repeated AI labels and adds a contextual service link', async () => {
  const renderer = await readFile(BLOG_RENDERER_PATH, 'utf8');
  const { renderBlogPage } = await import('../server/blog/renderer.js');
  const html = renderBlogPage({
    slug: { current: 'phat-nguoi-thue-xe-tu-lai-ai-tra' },
    title: 'Bài kiểm tra',
    excerpt: 'Tóm tắt bài kiểm tra.',
    author: 'Car Match',
    categories: ['Thủ tục thuê xe'],
    bodyHtml: '<p><strong>Câu trả lời ngắn:</strong> Khách và đơn vị cho thuê cần đối chiếu hợp đồng.</p>',
  });

  assert.match(renderer, /function deTemplateDirectAnswer/);
  assert.match(html, /<title>Phạt Nguội Khi Thuê Xe Tự Lái Ai Trả\? \| Car Match<\/title>/);
  assert.match(html, /class="direct-answer"/);
  assert.doesNotMatch(html, /Câu trả lời ngắn:/);
  assert.match(html, /data-blog-action="related_service"/);
  assert.equal((renderer.match(/\$\{renderCta\(post\)\}/g) || []).length, 1);
});

test('public conversion copy derives fleet size and avoids an unverified response SLA', async () => {
  const [monthly, reengagement, blogPost, generator] = await Promise.all([
    readFile(MONTHLY_PATH, 'utf8'),
    readFile(REENGAGEMENT_PATH, 'utf8'),
    readFile(BLOG_POST_PATH, 'utf8'),
    readFile(STATIC_GENERATOR_PATH, 'utf8'),
  ]);
  const publicCopy = [monthly, reengagement, blogPost, generator].join('\n');

  assert.match(reengagement, /`\$\{cars\.length\} mẫu xe`/);
  assert.doesNotMatch(publicCopy, /20\+ mẫu xe|phản hồi[^\n<]*30 phút|xác nhận[^\n<]*30 phút/iu);
});
