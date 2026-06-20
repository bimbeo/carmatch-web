import { createSign } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const defaultSitemapPath = path.join(rootDir, 'dist', 'sitemap.xml');
const defaultCachePath = path.join(rootDir, '.cache', 'search-index-status.json');
const tokenUrl = 'https://oauth2.googleapis.com/token';
const inspectUrl = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
const webmastersScope = 'https://www.googleapis.com/auth/webmasters.readonly';

function parseArgs(argv) {
  const args = {
    sitemap: process.env.SITEMAP_PATH || defaultSitemapPath,
    cache: process.env.SEARCH_INDEX_CACHE || defaultCachePath,
    cacheDays: Number(process.env.SEARCH_INDEX_CACHE_DAYS || 14),
    delayMs: Number(process.env.SEARCH_INDEX_DELAY_MS || 250),
    limit: Number(process.env.SEARCH_INDEX_LIMIT || 50),
    siteUrl: process.env.GSC_SITE_URL || 'sc-domain:carmatch.vn',
    dryRun: false,
    refresh: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--refresh') args.refresh = true;
    else if (arg === '--all') args.limit = Number.POSITIVE_INFINITY;
    else if (arg === '--sitemap') args.sitemap = argv[++index];
    else if (arg === '--cache') args.cache = argv[++index];
    else if (arg === '--site-url') args.siteUrl = argv[++index];
    else if (arg === '--limit') args.limit = Number(argv[++index]);
    else if (arg === '--cache-days') args.cacheDays = Number(argv[++index]);
    else if (arg === '--delay-ms') args.delayMs = Number(argv[++index]);
  }

  return args;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function loadServiceAccount() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  throw new Error(
    'Missing Google service account credentials. Set GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.',
  );
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: webmastersScope,
    aud: tokenUrl,
    exp: now + 3600,
    iat: now,
  };
  const unsignedJwt = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;
  const signature = createSign('RSA-SHA256').update(unsignedJwt).sign(serviceAccount.private_key);
  const assertion = `${unsignedJwt}.${base64url(signature)}`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function loadSitemapUrls(sitemapPath) {
  const xml = await readFile(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

async function loadCache(cachePath) {
  try {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    return { urls: {} };
  }
}

async function saveCache(cachePath, cache) {
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}

function isFresh(entry, cacheDays) {
  if (!entry?.checkedAt) return false;
  const ageMs = Date.now() - new Date(entry.checkedAt).getTime();
  return ageMs >= 0 && ageMs < cacheDays * 24 * 60 * 60 * 1000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function inspectUrlStatus({ url, siteUrl, accessToken }) {
  const response = await fetch(inspectUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      inspectionUrl: url,
      siteUrl,
      languageCode: 'vi-VN',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`URL Inspection failed for ${url}: ${response.status} ${JSON.stringify(data)}`);
  }

  const indexStatus = data.inspectionResult?.indexStatusResult || {};
  return {
    checkedAt: new Date().toISOString(),
    inspectionUrl: url,
    coverageState: indexStatus.coverageState || 'UNKNOWN',
    verdict: indexStatus.verdict || 'UNKNOWN',
    indexingState: indexStatus.indexingState || 'UNKNOWN',
    pageFetchState: indexStatus.pageFetchState || 'UNKNOWN',
    robotsTxtState: indexStatus.robotsTxtState || 'UNKNOWN',
    lastCrawlTime: indexStatus.lastCrawlTime || null,
    googleCanonical: indexStatus.googleCanonical || null,
    userCanonical: indexStatus.userCanonical || null,
  };
}

function summarize(results) {
  const byCoverageState = {};
  const byVerdict = {};
  const attention = [];

  for (const result of results) {
    byCoverageState[result.coverageState] = (byCoverageState[result.coverageState] || 0) + 1;
    byVerdict[result.verdict] = (byVerdict[result.verdict] || 0) + 1;

    const needsAttention =
      /not indexed|discovered|crawled|duplicate|redirect|excluded|error/i.test(result.coverageState) ||
      result.verdict === 'FAIL' ||
      (result.googleCanonical && result.userCanonical && result.googleCanonical !== result.userCanonical);

    if (needsAttention) attention.push(result);
  }

  return {
    totalChecked: results.length,
    byCoverageState,
    byVerdict,
    needsAttention: attention,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const urls = (await loadSitemapUrls(args.sitemap)).slice(0, args.limit);

  if (args.dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      siteUrl: args.siteUrl,
      sitemap: args.sitemap,
      urlsToInspect: urls.length,
      sampleUrls: urls.slice(0, 10),
      note: 'Dry run only. This script uses Search Console URL Inspection API and never calls Google Indexing API urlNotifications.publish.',
    }, null, 2));
    return;
  }

  const serviceAccount = await loadServiceAccount();
  const accessToken = await getAccessToken(serviceAccount);
  const cache = await loadCache(args.cache);
  cache.urls ||= {};

  const results = [];
  for (const url of urls) {
    if (!args.refresh && isFresh(cache.urls[url], args.cacheDays)) {
      results.push({ ...cache.urls[url], cached: true });
      continue;
    }

    const result = await inspectUrlStatus({ url, siteUrl: args.siteUrl, accessToken });
    cache.urls[url] = result;
    results.push({ ...result, cached: false });
    if (args.delayMs > 0) await sleep(args.delayMs);
  }

  await saveCache(args.cache, cache);
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    siteUrl: args.siteUrl,
    sitemap: args.sitemap,
    cache: args.cache,
    cacheDays: args.cacheDays,
    note: 'Monitoring only: this script does not submit URLs through Google Indexing API.',
    ...summarize(results),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
