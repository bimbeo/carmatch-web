import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');

function redirectFor(source) {
  return config.routes.find((route) => route.src === source);
}

function redirectForPath(pathname) {
  return config.routes.find((route) => {
    if (route.status !== 301 || !route.src || route.has?.length) return false;
    try {
      return new RegExp(`^${route.src}$`).test(pathname);
    } catch {
      return false;
    }
  });
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
  assert.equal(
    redirectFor('/xe/(vinfast-vf5-2025-2|vinfast-vf5-2025-3|vinfast-vf5-2025-30l-53361|vinfast-vf5-2025-30l85312)/?')?.headers?.Location,
    'https://www.carmatch.vn/xe/vinfast-vf5-2025',
  );
  assert.equal(
    redirectFor('/xe/(vf6-plus|vinfast-vf6-2025-2|vinfast-vf6-2025-trang-2|vinfast-vf6-2025-30b-12514|vinfast-vf6-2025-30m-11196|vinfast-vf6-plus-2025-30m-04938|vinfast-vf6-plus-2025-30m-63654|vinfast-vf6-plus-2025-xam|mr-minh-vf6)/?')?.headers?.Location,
    'https://www.carmatch.vn/xe/vinfast-vf6',
  );
});

test('fixes the GSC redirect error with a live VF6 target', () => {
  assert.equal(
    redirectFor('/xe/vf6-plus-2025/?')?.headers?.Location,
    'https://www.carmatch.vn/xe/vinfast-vf6',
  );
});

test('covers every legacy vehicle URL still returning 404 in the GSC sample', () => {
  const expectedTargets = new Map([
    ['/xe/hyundai-creta-2024', 'https://www.carmatch.vn/xe/hyundai-creta-2025'],
    ['/xe/toyota-innova-2018', 'https://www.carmatch.vn/thue-xe-7-cho-tu-lai-ha-noi'],
    ['/xe/vinfast-fadil-2019', 'https://www.carmatch.vn/xe/vinfast-fadil-2021'],
    ['/xe/vinfast-vf3-2024-30l-76573', 'https://www.carmatch.vn/xe/vinfast-vf3-2024'],
    ['/xe/vinfast-vf3-2025-2', 'https://www.carmatch.vn/xe/vinfast-vf3-2025'],
    ['/xe/vinfast-vf3-eco', 'https://www.carmatch.vn/xe/vf3'],
    ['/xe/vinfast-vf5-2025-3', 'https://www.carmatch.vn/xe/vinfast-vf5-2025'],
    ['/xe/vinfast-vf6-2025-30b-12514', 'https://www.carmatch.vn/xe/vinfast-vf6'],
    ['/xe/vinfast-vf6-plus-2025-xam', 'https://www.carmatch.vn/xe/vinfast-vf6'],
    ['/xe/vinfast-vf7s-2025-30l91487', 'https://www.carmatch.vn/xe/vinfast-vf7s-2025'],
    ['/xe/toyota-raize-2022-30h-60690', 'https://www.carmatch.vn/xe/toyota-raize-2022'],
    ['/xe/mitsubishi-xpander-2026', 'https://www.carmatch.vn/xe/mitsubishi-xpander-2023'],
    ['/xe/ford-ranger-2019', 'https://www.carmatch.vn/xe'],
    ['/xe/mrs-chi', 'https://www.carmatch.vn/xe'],
  ]);

  for (const [pathname, target] of expectedTargets) {
    assert.equal(redirectForPath(pathname)?.headers?.Location, target, pathname);
  }
});

test('keeps API resources out of the search index', () => {
  assert.deepEqual(redirectFor('/api/(.*)')?.headers, {
    'X-Robots-Tag': 'noindex',
  });
  assert.equal(redirectFor('/api/(.*)')?.continue, true);
});

test('recovers legacy blog-subdomain paths after the host redirect', () => {
  assert.equal(
    redirectFor('/kinh-nghiem-thue-xe-tu-lai-ha-noi-tranh-lua-dao/?')?.headers?.Location,
    'https://www.carmatch.vn/blog/tranh-lua-dao-coc-online-khi-thue-xe-tu-lai',
  );
  assert.equal(
    redirectFor('/thue-xe-7-cho-tu-lai-ha-noi-gia-bao-nhieu/?')?.headers?.Location,
    'https://www.carmatch.vn/thue-xe-7-cho-tu-lai-ha-noi',
  );
});

test('routes valuable legacy blog-subdomain paths before its catch-all', () => {
  const targeted = config.routes.findIndex((route) => (
    route.src === '/thue-xe-tu-lai-vinfast-ha-noi/?'
    && route.has?.some((condition) => condition.type === 'host' && condition.value === 'blog.carmatch.vn')
  ));
  const catchAll = config.routes.findIndex((route) => (
    route.src === '/(.*)'
    && route.has?.some((condition) => condition.type === 'host' && condition.value === 'blog.carmatch.vn')
  ));

  assert.ok(targeted >= 0);
  assert.ok(catchAll > targeted);
  assert.equal(
    config.routes[targeted].headers.Location,
    'https://www.carmatch.vn/blog/co-nen-thue-xe-dien-tu-lai-ha-noi-vinfast',
  );
});

test('recovers legacy monthly and compact vehicle routes before generic redirects', () => {
  assert.equal(redirectFor('/thue-xethang/?')?.headers?.Location, 'https://www.carmatch.vn/thue-xe-thang');
  assert.equal(redirectFor('/car/vf585312/?')?.headers?.Location, 'https://www.carmatch.vn/xe/vinfast-vf5-2025');
  assert.equal(redirectFor('/car/raize30h60690/?')?.headers?.Location, 'https://www.carmatch.vn/xe/toyota-raize-2022');

  const specific = config.routes.findIndex((route) => route.src === '/car/vf585312/?');
  const generic = config.routes.findIndex((route) => route.src === '/car/([^/]+)/?');
  assert.ok(specific >= 0 && generic > specific);
});

test('keeps account and API utility paths out of crawl while leaving booking queries crawlable', () => {
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Disallow: \/tai-khoan/);
  assert.doesNotMatch(robots, /Disallow: \/\*\?from=/);
  assert.doesNotMatch(robots, /Disallow: \/\*&to=/);
});

test('consolidates the Ocean Park blog intent into the local rental landing', () => {
  assert.deepEqual(redirectFor('/blog/thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh/?'), {
    src: '/blog/thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh/?',
    status: 301,
    headers: { Location: 'https://www.carmatch.vn/thue-xe-tu-lai-vinhomes-ocean-park' },
  });
  assert.equal(redirectFor('/thue-xe-tu-lai-ecopark/?'), undefined);
});

test('places explicit SEO redirects before filesystem and the dynamic vehicle resolver', () => {
  const retiredLandingIndex = config.routes.findIndex((route) => route.src === '/thue-xe-tu-lai-ha-noi/?');
  const filesystemIndex = config.routes.findIndex((route) => route.handle === 'filesystem');
  const vehicleResolverIndex = config.routes.findIndex((route) => route.dest === '/api/vehicles?slug=$1&html=1');

  assert.ok(retiredLandingIndex >= 0);
  assert.ok(retiredLandingIndex < filesystemIndex);
  assert.ok(filesystemIndex < vehicleResolverIndex);
});
