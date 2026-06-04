import { fetchPostBySlug, fetchPosts } from './_blog-source.js';
import { renderBlogIndex, renderBlogPage } from './_blog-renderer.js';

const SITE = 'https://www.carmatch.vn';

const STATIC_PAGES = [
  { url: '/',                                          priority: '1.0', changefreq: 'weekly'  },
  { url: '/thue-xe-tu-lai-ha-noi',                    priority: '0.95', changefreq: 'weekly' },
  { url: '/xe',                                        priority: '0.9',  changefreq: 'daily'  },
  { url: '/thue-xe-thang',                             priority: '0.85', changefreq: 'monthly'},
  { url: '/thue-xe-tu-lai-vinhomes-ocean-park',        priority: '0.85', changefreq: 'monthly'},
  { url: '/thue-xe-tu-lai-times-city',                 priority: '0.85', changefreq: 'monthly'},
  { url: '/thue-xe-tu-lai-vinhomes-smart-city',        priority: '0.85', changefreq: 'monthly'},
  { url: '/thue-xe-tu-lai-ecopark',                    priority: '0.85', changefreq: 'monthly'},
  { url: '/thue-xe-tu-lai-the-manor',                  priority: '0.8',  changefreq: 'monthly'},
  { url: '/faq-thue-xe-tu-lai-ha-noi',                 priority: '0.8',  changefreq: 'monthly'},
  { url: '/blog',                                      priority: '0.75', changefreq: 'weekly' },
  { url: '/di-dau',                                    priority: '0.7',  changefreq: 'monthly'},
  { url: '/lap-ke-hoach-chuyen-di',                    priority: '0.65', changefreq: 'monthly'},
  { url: '/hop-tac',                                   priority: '0.6',  changefreq: 'monthly'},
  { url: '/gioi-thieu',                                priority: '0.5',  changefreq: 'yearly' },
  { url: '/di-dau/ha-long',     priority: '0.65', changefreq: 'monthly'},
  { url: '/di-dau/ninh-binh',   priority: '0.65', changefreq: 'monthly'},
  { url: '/di-dau/tam-dao',     priority: '0.65', changefreq: 'monthly'},
  { url: '/di-dau/moc-chau',    priority: '0.65', changefreq: 'monthly'},
  { url: '/di-dau/sapa',        priority: '0.65', changefreq: 'monthly'},
  { url: '/di-dau/noi-bai',     priority: '0.65', changefreq: 'monthly'},
  { url: '/di-dau/ba-vi',       priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/soc-son',     priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/hai-phong',   priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/cat-ba',      priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/mai-chau',    priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/pu-luong',    priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/ho-nui-coc',  priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/ecopark',     priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/dai-lai',     priority: '0.6',  changefreq: 'monthly'},
  { url: '/di-dau/chu-de/cuoi-tuan-gan-ha-noi', priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/di-trong-ngay',         priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/cho-gia-dinh-co-tre-em',priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/xe-7-cho-di-tinh',      priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/di-xe-dien',             priority: '0.6', changefreq: 'monthly'},
];

function escapeXml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toIsoDate(value) {
  try { return new Date(value).toISOString().slice(0, 10); } catch { return new Date().toISOString().slice(0, 10); }
}

async function renderSitemap() {
  let blogEntries = '';
  try {
    const posts = await fetchPosts();
    if (Array.isArray(posts)) {
      blogEntries = posts
        .filter(p => p?.slug?.current)
        .map(p => `  <url>
    <loc>${escapeXml(`${SITE}/blog/${p.slug.current}`)}</loc>
    <lastmod>${toIsoDate(p.modifiedAt || p.publishedAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
        .join('\n');
    }
  } catch (e) {
    console.warn('Sitemap blog fetch failed:', e.message);
  }

  const today = new Date().toISOString().slice(0, 10);
  const staticEntries = STATIC_PAGES.map(({ url, priority, changefreq }) =>
    `  <url>\n    <loc>${escapeXml(`${SITE}${url}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries}\n${blogEntries}\n</urlset>`;
}

function setFreshCmsHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
}

export default async function handler(req, res) {
  try {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
    const format = typeof req.query.format === 'string' ? req.query.format : '';

    // Dynamic sitemap
    if (format === 'sitemap') {
      const xml = await renderSitemap();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      return res.status(200).send(xml);
    }

    if (slug) {
      const post = await fetchPostBySlug(slug);
      if (!post) {
        if (format === 'html') return res.status(404).send('Không tìm thấy bài viết.');
        return res.status(404).json({ error: 'Post not found' });
      }
      setFreshCmsHeaders(res);
      if (format === 'html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderBlogPage(post));
      }
      return res.status(200).json(post);
    }

    const posts = await fetchPosts();
    setFreshCmsHeaders(res);
    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderBlogIndex(posts));
    }
    res.status(200).json(posts);
  } catch (error) {
    console.error('Blog fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
