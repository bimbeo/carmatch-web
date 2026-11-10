import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCmsContentInventory,
  renderCmsInsertSql,
} from '../scripts/sync-roadmap-content-cms.mjs';

const inventory = createCmsContentInventory();

test('CMS sync covers the 64-URL roadmap and Tet cluster', () => {
  assert.equal(inventory.blogs.length, 70);
  assert.equal(inventory.landings.length, 14);
  assert.equal(new Set(inventory.blogs.map((item) => item.slug)).size, 70);
  assert.equal(new Set(inventory.landings.map((item) => item.slug)).size, 14);
});

test('CMS content keeps public URLs and contact details safe', () => {
  for (const post of inventory.blogs) {
    assert.equal(post.status, 'published');
    assert.equal(post.canonical_url, `https://www.carmatch.vn/blog/${post.slug}`);
    assert.equal(post.cta_zalo_url, 'https://zalo.me/0971163290');
    assert.match(post.main_image_url, /^https:\/\/www\.carmatch\.vn\/generated\/vehicle-covers\//);
    assert.ok(post.content_html.length > 500, `${post.slug} must keep its full article body`);
  }

  for (const page of inventory.landings) {
    assert.equal(page.status, 'published');
    assert.equal(page.canonical_url, `https://www.carmatch.vn/${page.slug}`);
    assert.equal(page.cta_primary_url, 'https://zalo.me/0971163290');
    assert.ok(page.page_content.blockOrder.length >= 6);
    assert.ok(page.page_content.faqItems.length >= 3);
  }

  const serialized = JSON.stringify(inventory);
  assert.doesNotMatch(serialized, /0975\s*563\s*290|0975563290/);
  assert.doesNotMatch(serialized, /og-image-20260619/);
});

test('CMS SQL import is idempotent and does not overwrite edited records', () => {
  const sql = renderCmsInsertSql(inventory);
  assert.match(sql, /insert into public\.blog_posts/);
  assert.match(sql, /insert into public\.seo_landing_pages/);
  assert.equal((sql.match(/on conflict \(slug\) do nothing/g) || []).length, 2);
  assert.doesNotMatch(sql, /do update/i);
});
