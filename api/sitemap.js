import { fetchPosts } from './_blog-source.js';

const SITE = 'https://www.carmatch.vn';

// Static pages — priority và changefreq theo tầm quan trọng SEO
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
  // Điểm đến
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
  // Chủ đề
  { url: '/di-dau/chu-de/cuoi-tuan-gan-ha-noi', priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/di-trong-ngay',         priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/cho-gia-dinh-co-tre-em',priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/xe-7-cho-di-tinh',      priority: '0.6', changefreq: 'monthly'},
  { url: '/di-dau/chu-de/di-xe-dien',             priority: '0.6', changefreq: 'monthly'},
];

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default async function handler(req, res) {
  try {
    // Fetch blog posts từ Supabase
    let blogEntries = '';
    try {
      const posts = await fetchPosts();
      if (Array.isArray(posts)) {
        blogEntries = posts
          .filter(p => p?.slug?.current)
          .map(p => {
            const lastmod = toIsoDate(p.modifiedAt || p.publishedAt);
            const loc = escapeXml(`${SITE}/blog/${p.slug.current}`);
            return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
          })
          .join('\n');
      }
    } catch (err) {
      console.warn('Blog fetch for sitemap failed:', err.message);
    }

    // Build static entries
    const today = new Date().toISOString().slice(0, 10);
    const staticEntries = STATIC_PAGES.map(({ url, priority, changefreq }) => {
      const loc = escapeXml(`${SITE}${url}`);
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${blogEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
