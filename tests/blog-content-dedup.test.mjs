import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';

import { deTemplateDirectAnswer } from '../server/blog/content-normalize.js';
import { assignUniqueBlogCovers } from '../scripts/blog-cover-assets.mjs';

test('direct answer normalization removes the repeated AI label and preserves paragraph classes', () => {
  const html = deTemplateDirectAnswer('<p class="lead"><strong>Câu trả lời ngắn:</strong> Nội dung hữu ích.</p>');
  assert.equal(html, '<p class="lead direct-answer">Nội dung hữu ích.</p>');
  assert.doesNotMatch(html, /Câu trả lời ngắn:/);
});

test('duplicate source images become unique 1200x630 editorial covers', async () => {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'carmatch-blog-covers-'));
  const posts = [
    { title: 'Thuê VF3 tự lái tại Hà Nội', slug: { current: 'thue-vf3-ha-noi' }, mainImageUrl: 'https://www.carmatch.vn/og-image.png' },
    { title: 'Chi phí thuê xe cuối tuần', slug: { current: 'chi-phi-thue-xe-cuoi-tuan' }, mainImageUrl: 'https://www.carmatch.vn/og-image.png' },
  ];
  const output = await assignUniqueBlogCovers(posts, {
    distDir,
    siteUrl: 'https://www.carmatch.vn',
    brandSocialImage: 'https://www.carmatch.vn/og-image.png',
  });

  assert.notEqual(output[0].mainImageUrl, output[1].mainImageUrl);
  for (const post of output) {
    const pathname = new URL(post.mainImageUrl).pathname.replace(/^\/+/, '');
    const filePath = path.join(distDir, pathname);
    assert.ok((await stat(filePath)).size > 0);
    const metadata = await sharp(await readFile(filePath)).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
  }
});
