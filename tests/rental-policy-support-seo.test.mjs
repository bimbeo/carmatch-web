import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const GENERATOR_PATH = new URL('../scripts/generate-static-blog.mjs', import.meta.url);
const FAQ_PATH = new URL('../src/app/pages/FAQ.tsx', import.meta.url);
const POLICY_PATH = new URL('../src/app/pages/Policy.tsx', import.meta.url);
const KNOWLEDGE_PATH = new URL('../src/data/geoKnowledge.ts', import.meta.url);

function articleSlice(source, id, nextId) {
  const start = source.indexOf(`_id: '${id}'`);
  const end = nextId ? source.indexOf(`_id: '${nextId}'`, start) : source.indexOf('const staticAirportBlogPosts', start);
  assert.ok(start >= 0, `${id} must exist`);
  assert.ok(end > start, `${id} must have a valid boundary`);
  return source.slice(start, end);
}

test('daily-km guide explains the per-vehicle limit and transparent overage formula', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');
  const article = articleSlice(
    source,
    'static-rental-daily-km-limit-guide',
    'static-rental-late-return-fee-guide',
  );

  assert.match(article, /slug: \{ current: 'thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay' \}/);
  assert.match(article, /không có một giới hạn km chung cho mọi xe thuê tự lái/);
  assert.match(article, /200–300 km cho mỗi ngày thuê/);
  assert.match(article, /Km vượt × đơn giá đã xác nhận/);
  assert.match(article, /<a href="\/xe">danh sách xe tự lái<\/a>/);
  assert.match(article, /<a href="\/chinh-sach">chính sách thuê xe<\/a>/);
  assert.match(article, /canonicalUrl: `\$\{siteUrl\}\/blog\/thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay`/);
});

test('late-return guide uses the confirmed return time and contract-safe fee wording', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');
  const article = articleSlice(
    source,
    'static-rental-late-return-fee-guide',
    'static-rental-cancellation-deposit-refund-guide',
  );

  assert.match(article, /slug: \{ current: 'tra-xe-thue-muon-tinh-phi-the-nao' \}/);
  assert.match(article, /100\.000đ cho mỗi giờ trễ/);
  assert.match(article, /điều khoản của mẫu xe và hợp đồng cụ thể vẫn là căn cứ cuối cùng/);
  assert.match(article, /Việc báo sớm không tự động xóa phụ phí/);
  assert.match(article, /không đánh đổi an toàn để cố tránh một giờ phụ phí/);
  assert.match(article, /canonicalUrl: `\$\{siteUrl\}\/blog\/tra-xe-thue-muon-tinh-phi-the-nao`/);
});

test('cancellation guide does not promise a universal refund and gives a written-confirmation checklist', async () => {
  const source = await readFile(GENERATOR_PATH, 'utf8');
  const article = articleSlice(source, 'static-rental-cancellation-deposit-refund-guide');

  assert.match(article, /slug: \{ current: 'huy-lich-thue-xe-co-duoc-hoan-coc-khong' \}/);
  assert.match(article, /phụ thuộc thời điểm hủy, mẫu xe, lịch xe đã được giữ/);
  assert.match(article, /không áp dụng một lời hứa “hủy lúc nào cũng hoàn 100%”/);
  assert.match(article, /Báo giá, tin nhắn hoặc hợp đồng/);
  assert.match(article, /<a href="\/chinh-sach">chính sách thuê xe<\/a>/);
  assert.match(article, /canonicalUrl: `\$\{siteUrl\}\/blog\/huy-lich-thue-xe-co-duoc-hoan-coc-khong`/);
});

test('FAQ, policy and GEO knowledge connect the three support guides', async () => {
  const [faq, policy, knowledge] = await Promise.all([
    readFile(FAQ_PATH, 'utf8'),
    readFile(POLICY_PATH, 'utf8'),
    readFile(KNOWLEDGE_PATH, 'utf8'),
  ]);

  const slugs = [
    'thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay',
    'tra-xe-thue-muon-tinh-phi-the-nao',
    'huy-lich-thue-xe-co-duoc-hoan-coc-khong',
  ];

  for (const slug of slugs) {
    assert.match(faq, new RegExp(`/blog/${slug}`));
    assert.match(policy, new RegExp(`/blog/${slug}`));
    assert.match(knowledge, new RegExp(`/blog/${slug}`));
  }

  assert.match(knowledge, /id: 'rental-daily-km-limit'/);
  assert.match(knowledge, /id: 'rental-late-return-fee'/);
  assert.match(knowledge, /id: 'rental-cancellation-deposit-refund'/);
  assert.match(knowledge, /không có cam kết hoàn 100% áp dụng cho mọi trường hợp/);
});

