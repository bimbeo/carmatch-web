import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const apiSource = await readFile(new URL('../api/vehicles.js', import.meta.url), 'utf8');
const routeSource = await readFile(new URL('../api/vehicle-route.js', import.meta.url), 'utf8');
const hookSource = await readFile(new URL('../src/hooks/useVehicles.ts', import.meta.url), 'utf8');

test('unknown vehicle slugs resolve dynamically after static files and before terminal 404', () => {
  const filesystemIndex = config.routes.findIndex((route) => route.handle === 'filesystem');
  const resolverIndex = config.routes.findIndex((route) => route.dest === '/api/vehicle-route?slug=$1');
  const terminal404Index = config.routes.findIndex((route) => route.status === 404 && route.src === '/(.*)');

  assert.ok(filesystemIndex >= 0);
  assert.ok(resolverIndex > filesystemIndex);
  assert.ok(terminal404Index > resolverIndex);
});

test('vehicle detail API reads SEO-retained rows and archived public images', () => {
  assert.match(apiSource, /eq\('seo_indexable', true\)/);
  assert.match(apiSource, /contains\('seo_slug_aliases', \[slug\]\)/);
  assert.match(apiSource, /!vehicle\.published && !vehicle\.seo_indexable/);
});

test('browser refreshes the current vehicle detail separately from the active fleet catalog', () => {
  assert.match(hookSource, /fetchVehicleDetailJson\(detailSlug\)/);
  assert.match(hookSource, /upsertVehicleDetail\(catalogData, detailVehicle\)/);
});

test('legacy aliases redirect permanently while retained canonical pages stay indexable', () => {
  assert.match(routeSource, /detail\.matchedAlias \|\| detail\.canonicalSlug !== slug/);
  assert.match(routeSource, /res\.status\(301\)/);
  assert.match(routeSource, /X-Robots-Tag', 'index, follow'/);
  assert.match(routeSource, /schema\.org\/OutOfStock/);
});
