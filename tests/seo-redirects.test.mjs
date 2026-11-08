import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

function redirectFor(source) {
  return config.routes.find((route) => route.src === source);
}

test('consolidates the retired Hanoi landing into the homepage', () => {
  assert.deepEqual(redirectFor('/thue-xe-tu-lai-ha-noi/?'), {
    src: '/thue-xe-tu-lai-ha-noi/?',
    status: 301,
    headers: { Location: 'https://www.carmatch.vn/' },
  });
});

test('redirects legacy plate-specific vehicle URLs to their model pages', () => {
  assert.equal(
    redirectFor('/xe/vinfast-vf5-2025-30b-25908/?')?.headers?.Location,
    'https://www.carmatch.vn/xe/vinfast-vf5-2025',
  );
  assert.equal(
    redirectFor('/xe/vinfast-vf3-2024-30m-02770/?')?.headers?.Location,
    'https://www.carmatch.vn/xe/vinfast-vf3-2024',
  );
});

test('consolidates the Ocean Park blog intent into the local rental landing', () => {
  assert.deepEqual(redirectFor('/blog/thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh/?'), {
    src: '/blog/thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh/?',
    status: 301,
    headers: { Location: 'https://www.carmatch.vn/thue-xe-tu-lai-vinhomes-ocean-park' },
  });
  assert.equal(redirectFor('/thue-xe-tu-lai-ecopark/?'), undefined);
});

test('places SEO redirects before filesystem and terminal 404 routes', () => {
  const retiredLandingIndex = config.routes.findIndex((route) => route.src === '/thue-xe-tu-lai-ha-noi/?');
  const filesystemIndex = config.routes.findIndex((route) => route.handle === 'filesystem');
  const vehicle404Index = config.routes.findIndex((route) => route.src === '/xe/([^/]+)/?' && route.status === 404);

  assert.ok(retiredLandingIndex >= 0);
  assert.ok(retiredLandingIndex < filesystemIndex);
  assert.ok(retiredLandingIndex < vehicle404Index);
});
