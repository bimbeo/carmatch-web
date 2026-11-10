import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const generatorSource = await readFile(
  new URL('../scripts/generate-static-blog.mjs', import.meta.url),
  'utf8',
);

const recoveredPlannerRoutes = [
  '/lap-ke-hoach-chuyen-di/sapa',
  '/lap-ke-hoach-chuyen-di/pu-luong',
  '/lap-ke-hoach-chuyen-di/cat-ba',
  '/lap-ke-hoach-chuyen-di/hoa-binh',
];

test('prerenders the trip-planner URLs reported as 404 in GSC', () => {
  for (const routePath of recoveredPlannerRoutes) {
    assert.match(generatorSource, new RegExp(`path: '${routePath}'`));
    assert.ok(generatorSource.includes('canonical: `${siteUrl}' + routePath + '`'));
  }
});

test('generates every configured planner route as static HTML', () => {
  assert.match(
    generatorSource,
    /filter\(\(routePath\) => routePath\.startsWith\('\/lap-ke-hoach-chuyen-di\/'\)\)/,
  );
  assert.match(
    generatorSource,
    /renderReactTripFinderRoot\(rendererBundle\.renderer, routePath, vehicles\)/,
  );
});
