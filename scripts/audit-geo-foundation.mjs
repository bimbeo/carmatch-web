import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  aiCrawlerUserAgentPatterns,
  geoKnowledgeBase,
  geoPriorityPages,
} from '../src/data/geoKnowledge.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const siteUrl = 'https://www.carmatch.vn';

const ignoredHtmlFiles = new Set([
  '404.html',
]);

const expectedNoIndexRoutes = new Set([
  '/admin',
  '/chao-ban',
  '/dat-xe',
  '/tai-khoan',
]);

function fail(message, detail = {}) {
  return { level: 'error', message, ...detail };
}

function warn(message, detail = {}) {
  return { level: 'warning', message, ...detail };
}

function textBetween(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || '';
}

function stripTags(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateTokenCount(value = '') {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function extractMeta(html, name) {
  return textBetween(
    html,
    new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["'][^>]*>`, 'i'),
  ) || textBetween(
    html,
    new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+name=["']${name}["'][^>]*>`, 'i'),
  );
}

function extractOpeningParagraph(html) {
  const afterH1 = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>([\s\S]{0,5000})/i)?.[1] || '';
  const paragraphs = [...afterH1.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)];
  const candidates = paragraphs
    .filter((match) => !/\b(meta|eyebrow|pill|blog-topic-title)\b/i.test(match[1] || ''))
    .map((match) => stripTags(match[2]))
    .filter(Boolean);
  return candidates.find((paragraph) => paragraph.length >= 40) || candidates[0] || '';
}

function extractCanonical(html) {
  return textBetween(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)
    || textBetween(html, /<link\s+href=["']([^"']+)["']\s+rel=["']canonical["'][^>]*>/i);
}

function extractJsonLdTypes(html) {
  const blocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const types = [];

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (Array.isArray(node?.['@graph'])) {
          for (const graphNode of node['@graph']) {
            if (graphNode?.['@type']) types.push(graphNode['@type']);
          }
        } else if (node?.['@type']) {
          types.push(node['@type']);
        }
      }
    } catch {
      types.push('INVALID_JSON_LD');
    }
  }

  return types.flat().filter(Boolean);
}

async function listHtmlFiles(dir, base = dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const relativePath = path.relative(base, fullPath);
    const itemStat = await stat(fullPath);
    if (itemStat.isDirectory()) {
      files.push(...await listHtmlFiles(fullPath, base));
    } else if (entry.endsWith('.html') && !ignoredHtmlFiles.has(relativePath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isIndexable(html) {
  const robots = extractMeta(html, 'robots').toLowerCase();
  return !robots.includes('noindex');
}

function routePathFromFile(filePath) {
  const relativePath = path.relative(distDir, filePath);
  if (relativePath === 'index.html') return '/';
  if (relativePath.endsWith('/index.html')) return `/${relativePath.replace(/\/index\.html$/, '')}`;
  return `/${relativePath.replace(/\.html$/, '')}`;
}

function expectedJsonLdGroups(routePath) {
  if (routePath === '/') {
    return [['Organization'], ['WebSite'], ['AutoRental', 'LocalBusiness'], ['WebPage'], ['BreadcrumbList']];
  }
  if (routePath === '/xe') return [['AutoRental', 'LocalBusiness'], ['CollectionPage'], ['BreadcrumbList']];
  if (routePath.startsWith('/xe/')) return [['Product'], ['BreadcrumbList']];
  if (routePath === '/blog') return [['Blog'], ['BreadcrumbList']];
  if (routePath.startsWith('/blog/')) return [['BlogPosting', 'Article'], ['BreadcrumbList']];
  if (routePath === '/thue-xe-thang') return [['Service'], ['FAQPage'], ['BreadcrumbList']];
  if (routePath === '/thue-xe-tu-lai-ha-noi') return [['Service'], ['FAQPage'], ['BreadcrumbList']];
  if (routePath === '/xe-san-bay-noi-bai') return [['Service'], ['FAQPage'], ['BreadcrumbList']];
  if (routePath === '/di-dau' || routePath.startsWith('/di-dau/chu-de/')) return [['CollectionPage', 'WebPage'], ['BreadcrumbList']];
  if (routePath.startsWith('/di-dau/')) return [['Article', 'WebPage'], ['FAQPage'], ['BreadcrumbList']];
  if (routePath === '/lap-ke-hoach-chuyen-di' || routePath.startsWith('/lap-ke-hoach-chuyen-di/')) return [['WebPage'], ['BreadcrumbList']];
  if (routePath === '/faq') return [['FAQPage'], ['BreadcrumbList']];
  if (routePath === '/lien-he') return [['ContactPage'], ['BreadcrumbList']];
  return [['WebPage'], ['BreadcrumbList']];
}

function hasExpectedType(types, expectedGroup) {
  return expectedGroup.some((expectedType) => types.includes(expectedType));
}

function auditHtml(filePath, html) {
  const routePath = routePathFromFile(filePath);
  const title = textBetween(html, /<title>([\s\S]*?)<\/title>/i);
  const description = extractMeta(html, 'description');
  const canonical = extractCanonical(html);
  const jsonLdTypes = extractJsonLdTypes(html);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const internalLinkCount = (html.match(/href=["']\/(?!\/)/gi) || []).length;
  const visibleText = stripTags(html);
  const estimatedTokens = estimateTokenCount(visibleText);
  const aiTokenCount = Number(extractMeta(html, 'ai:token-count') || 0);
  const openingParagraph = extractOpeningParagraph(html);
  const issues = [];
  const indexable = isIndexable(html);

  if (!title) issues.push(fail('Missing <title>', { routePath }));
  if (indexable && description.length < 50) {
    issues.push(fail('Meta description too short for indexable page', { routePath, length: description.length }));
  }
  if (indexable && !canonical.startsWith(siteUrl)) {
    issues.push(fail('Canonical missing or outside primary domain', { routePath, canonical }));
  }
  if (indexable && h1Count !== 1) {
    issues.push(fail('Indexable page should have exactly one H1', { routePath, h1Count }));
  }
  if (indexable && jsonLdTypes.includes('INVALID_JSON_LD')) {
    issues.push(fail('Invalid JSON-LD block', { routePath }));
  }
  if (indexable && jsonLdTypes.length === 0) {
    issues.push(fail('Indexable page is missing JSON-LD', { routePath }));
  }
  if (indexable && aiTokenCount <= 0) {
    issues.push(fail('Indexable page is missing ai:token-count meta', { routePath }));
  }
  if (indexable && !extractMeta(html, 'robots').toLowerCase().includes('max-image-preview:large')) {
    issues.push(fail('Indexable page is missing max-image-preview:large robots directive', { routePath }));
  }
  if (indexable && aiTokenCount > 30000) {
    issues.push(warn('Indexable page exceeds preferred AI token budget', { routePath, aiTokenCount }));
  }
  if (indexable && aiTokenCount && Math.abs(aiTokenCount - estimatedTokens) / Math.max(estimatedTokens, 1) > 0.35) {
    issues.push(warn('ai:token-count differs materially from visible-text estimate', {
      routePath,
      aiTokenCount,
      estimatedTokens,
    }));
  }
  for (const expectedGroup of expectedJsonLdGroups(routePath)) {
    if (indexable && jsonLdTypes.length && !hasExpectedType(jsonLdTypes, expectedGroup)) {
      issues.push(warn('JSON-LD missing expected page type for route pattern', {
        routePath,
        expectedAnyOf: expectedGroup,
        jsonLdTypes,
      }));
    }
  }
  if (indexable && /<div id=["']root["']><\/div>/.test(html)) {
    issues.push(fail('Indexable page is an empty SPA shell', { routePath }));
  }
  if (indexable && internalLinkCount < 2 && routePath !== '/') {
    issues.push(warn('Low internal link count for an indexable page', { routePath, internalLinkCount }));
  }
  if (indexable && !routePath.startsWith('/xe/') && visibleText.length > 500 && openingParagraph.length < 50) {
    issues.push(warn('Opening paragraph after H1 is thin or missing', {
      routePath,
      openingLength: openingParagraph.length,
    }));
  }
  if (/\bCarMatch\b/.test(visibleText.replace(/carmatch\.vn/gi, ''))) {
    issues.push(warn('Visible customer-facing text contains "CarMatch"; prefer "Car Match"', { routePath }));
  }

  return {
    routePath,
    title,
    canonical,
    descriptionLength: description.length,
    h1Count,
    jsonLdTypes,
    aiTokenCount,
    estimatedTokens,
    indexable,
    issues,
  };
}

function auditExpectedNoIndexRoutes(pageAudits) {
  const auditsByRoute = new Map(pageAudits.map((audit) => [audit.routePath, audit]));
  const issues = [];

  for (const routePath of expectedNoIndexRoutes) {
    const audit = auditsByRoute.get(routePath);
    if (!audit) {
      issues.push(fail('Required noindex route is missing from prerendered output', { routePath }));
    } else if (audit.indexable) {
      issues.push(fail('Required noindex route is indexable in prerendered output', { routePath }));
    }
  }

  return issues;
}

async function auditLlms() {
  const issues = [];
  const llmsTextPath = path.join(distDir, 'llms.txt');
  const llmsFullPath = path.join(distDir, 'llms-full.txt');
  const [llmsText, llmsFullText] = await Promise.all([
    readFile(llmsTextPath, 'utf8').catch(() => ''),
    readFile(llmsFullPath, 'utf8').catch(() => ''),
  ]);

  if (!llmsText.includes('# Car Match')) issues.push(fail('llms.txt missing Car Match heading'));
  if (!llmsText.includes(`${siteUrl}/sitemap.xml`)) issues.push(fail('llms.txt missing sitemap link'));
  if (!llmsText.includes(`${siteUrl}/llms-full.txt`)) issues.push(fail('llms.txt missing llms-full link'));
  if (!/tokens:\s*~\d+/i.test(llmsText)) issues.push(fail('llms.txt missing token annotations'));
  if (!llmsFullText.includes('Evidence-Backed Knowledge Base')) {
    issues.push(fail('llms-full.txt missing knowledge base section'));
  }

  for (const page of geoPriorityPages) {
    const url = `${siteUrl}${page.path === '/' ? '/' : page.path}`;
    if (!llmsText.includes(url) && !llmsFullText.includes(url)) {
      issues.push(fail('Priority GEO page missing from llms outputs', { url }));
    }
  }

  return issues;
}

async function auditRss() {
  const issues = [];
  const rssPath = path.join(distDir, 'rss.xml');
  const robotsPath = path.join(distDir, 'robots.txt');
  const [rss, robots] = await Promise.all([
    readFile(rssPath, 'utf8').catch(() => ''),
    readFile(robotsPath, 'utf8').catch(() => ''),
  ]);

  if (!rss.includes('<rss version="2.0"')) issues.push(fail('rss.xml is missing an RSS 2.0 root'));
  if (!rss.includes('<title>Car Match Blog</title>')) issues.push(fail('rss.xml is missing the Car Match Blog title'));
  if (!rss.includes(`${siteUrl}/rss.xml`)) issues.push(fail('rss.xml is missing its canonical self link'));
  if ((rss.match(/<item>/g) || []).length === 0) issues.push(fail('rss.xml has no published blog items'));
  if (!robots.includes(`Sitemap: ${siteUrl}/rss.xml`)) {
    issues.push(fail('robots.txt is missing the RSS discovery link'));
  }

  return issues;
}

function auditKnowledgeBase() {
  const issues = [];
  const seenIds = new Set();

  for (const entry of geoKnowledgeBase) {
    if (seenIds.has(entry.id)) issues.push(fail('Duplicate knowledge entry id', { id: entry.id }));
    seenIds.add(entry.id);

    if (!entry.sourceUrl.startsWith(siteUrl)) {
      issues.push(fail('Knowledge source URL should use primary domain', { id: entry.id, sourceUrl: entry.sourceUrl }));
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.effectiveDate)) {
      issues.push(fail('Knowledge entry missing YYYY-MM-DD effectiveDate', { id: entry.id }));
    }
    if (entry.reviewStatus !== 'reviewed') {
      issues.push(warn('Knowledge entry still needs review', { id: entry.id, reviewStatus: entry.reviewStatus }));
    }
    if (!entry.summary || entry.facts.length < 2 || entry.relatedRoutes.length === 0) {
      issues.push(fail('Knowledge entry is too thin for GEO use', { id: entry.id }));
    }
  }

  return issues;
}

function auditAiCrawlerPatterns() {
  const flatPatterns = aiCrawlerUserAgentPatterns.flatMap((group) => group.patterns);
  const required = ['gptbot', 'oai-searchbot', 'claudebot', 'perplexitybot', 'google-extended'];
  return required
    .filter((pattern) => !flatPatterns.includes(pattern))
    .map((pattern) => fail('Missing important AI crawler user-agent pattern', { pattern }));
}

async function main() {
  const htmlFiles = await listHtmlFiles(distDir);
  const pageAudits = [];

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8');
    pageAudits.push(auditHtml(htmlFile, html));
  }

  const allIssues = [
    ...pageAudits.flatMap((audit) => audit.issues),
    ...auditExpectedNoIndexRoutes(pageAudits),
    ...await auditLlms(),
    ...await auditRss(),
    ...auditKnowledgeBase(),
    ...auditAiCrawlerPatterns(),
  ];
  const errors = allIssues.filter((issue) => issue.level === 'error');
  const warnings = allIssues.filter((issue) => issue.level === 'warning');
  const indexableCount = pageAudits.filter((audit) => audit.indexable).length;
  const tokenCounts = pageAudits
    .filter((audit) => audit.indexable)
    .map((audit) => audit.aiTokenCount || audit.estimatedTokens)
    .filter(Boolean);
  const emptyShellRoutes = pageAudits
    .filter((audit) => audit.indexable)
    .filter((audit) => audit.issues.some((issue) => issue.message.includes('empty SPA shell')))
    .map((audit) => audit.routePath);

  const result = {
    checkedAt: new Date().toISOString(),
    htmlPages: pageAudits.length,
    indexablePages: indexableCount,
    knowledgeEntries: geoKnowledgeBase.length,
    priorityPages: geoPriorityPages.length,
    aiCrawlerGroups: aiCrawlerUserAgentPatterns.length,
    averageIndexableTokens: tokenCounts.length
      ? Math.round(tokenCounts.reduce((total, count) => total + count, 0) / tokenCounts.length)
      : 0,
    maxIndexableTokens: tokenCounts.length ? Math.max(...tokenCounts) : 0,
    errors: errors.length,
    warnings: warnings.length,
    emptyShellRoutes,
    issues: allIssues,
  };

  console.log(JSON.stringify(result, null, 2));

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
