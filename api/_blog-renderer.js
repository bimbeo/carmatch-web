const siteUrl = 'https://www.carmatch.vn';
const brandImage = `${siteUrl}/og-image.jpg`;
const brandLogo = `${siteUrl}/brand/carmatch-lockup-navy.png`;

function optimizeImageUrl(url = '', width = 1200) {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  if (url.includes('cdn.sanity.io/images/') && !url.includes('?')) {
    return `${url}?w=${width}&fit=max&auto=format`;
  }
  return url;
}

function optimizeBodyImages(html = '') {
  return String(html).replace(/(<img\b[^>]*\ssrc=(["']))([^"']+)(\2[^>]*>)/gi, (_match, prefix, quote, src, suffix) => {
    return `${prefix}${optimizeImageUrl(src, 1400)}${suffix}`;
  });
}

function escapeHtml(value = '') {
  return normalizeBrandText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeBrandText(value = '') {
  return String(value)
    .replace(/\bCarMatch\b/g, 'Car Match')
    .replace(/\bCARMATCH\b/g, 'CAR MATCH');
}

function stripHtml(value = '') {
  return normalizeBrandText(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function readingTime(post) {
  const text = stripHtml(post.bodyHtml || '').trim() || post.excerpt || post.title || '';
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function getPostUrl(post) {
  return post.canonicalUrl || `${siteUrl}/blog/${post.slug.current}`;
}

function getDescription(post) {
  return post.seoDescription || post.excerpt || stripHtml(post.bodyHtml).slice(0, 155) || 'Kinh nghiệm thuê xe tự lái Hà Nội từ Car Match.';
}

function extractHeadings(html = '') {
  const headings = [];
  String(html).replace(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, content) => {
    const text = stripHtml(content);
    if (!text) return '';
    const baseId = slugify(text);
    const sameCount = headings.filter((item) => item.id === baseId || item.id.startsWith(`${baseId}-`)).length;
    headings.push({ level: Number(level), text, id: sameCount ? `${baseId}-${sameCount + 1}` : baseId });
    return '';
  });
  return headings;
}

function addHeadingIds(html = '', headings = []) {
  let index = 0;
  return String(html).replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, content) => {
    const heading = headings[index++];
    if (!heading) return match;
    const cleanAttrs = String(attrs || '').replace(/\sid=(["']).*?\1/i, '');
    return `<h${level}${cleanAttrs} id="${escapeHtml(heading.id)}">${content}</h${level}>`;
  });
}

function extractFaqItems(html = '') {
  const items = [];
  const faqStart = String(html).search(/<h2[^>]*>[\s\S]*?(câu hỏi thường gặp|faq)[\s\S]*?<\/h2>/i);
  if (faqStart < 0) return items;
  const section = String(html).slice(faqStart);
  const matches = [...section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const match of matches.slice(0, 8)) {
    const question = stripHtml(match[1]);
    const answer = stripHtml(match[2]);
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

function renderToc(headings) {
  if (headings.length < 2) return '';
  return `<nav class="toc" aria-label="Mục lục bài viết">
    <p>Mục lục</p>
    <ol>${headings.map((heading) => `<li class="level-${heading.level}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`).join('')}</ol>
  </nav>`;
}

function renderRelated(post) {
  const links = [
    ...(post.relatedDestinations || []).slice(0, 2).map((destination) => ({ href: `/di-dau/${destination.slug}`, label: `Đi ${destination.name} bằng xe tự lái`, action: 'related_destination' })),
    ...(post.relatedVehicleLinks || []).slice(0, 1).map((vehicle) => ({ href: vehicle.url, label: vehicle.label, action: 'related_vehicle' })),
    ...(post.relatedPosts || []).slice(0, 2).map((related) => ({ href: `/blog/${related.slug}`, label: related.title, action: 'related_post' })),
  ].filter((item) => item.href && item.label);
  if (!links.length) return '';
  return `<aside class="related" aria-label="Liên kết liên quan">
    <h2>Đọc tiếp</h2>
    <ul>${links.map((link) => `<li><a href="${escapeHtml(link.href)}" data-blog-action="${escapeHtml(link.action)}" data-blog-target="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join('')}</ul>
  </aside>`;
}

function renderCta(post) {
  if (post.ctaEnabled === false) return '';
  const primary = post.ctaPrimaryUrl ? `<a class="button primary" href="${escapeHtml(post.ctaPrimaryUrl)}" data-blog-action="cta_primary" data-blog-target="${escapeHtml(post.ctaPrimaryUrl)}">${escapeHtml(post.ctaPrimaryLabel || 'Đặt xe với Car Match')}</a>` : '';
  const zaloUrl = post.ctaZaloUrl || 'https://zalo.me/0975563290';
  return `<section class="cta">
    <p class="eyebrow">Car Match hỗ trợ nhanh</p>
    <h2>${escapeHtml(post.ctaTitle || 'Cần xe phù hợp cho chuyến đi?')}</h2>
    <p>${escapeHtml(post.ctaDescription || 'Nhắn Car Match để được tư vấn xe, lịch trống và chi phí phù hợp.')}</p>
    <div class="cta-actions">${primary}<a class="button secondary" href="${escapeHtml(zaloUrl)}" data-blog-action="cta_zalo" data-blog-target="${escapeHtml(zaloUrl)}">${escapeHtml(post.ctaZaloLabel || 'Nhắn Zalo')}</a></div>
  </section>`;
}

function renderMarks(text, marks = []) {
  let rendered = escapeHtml(text);
  for (const mark of marks) {
    if (mark === 'strong') rendered = `<strong>${rendered}</strong>`;
    if (mark === 'em') rendered = `<em>${rendered}</em>`;
  }
  return rendered;
}

function renderPortableText(blocks = []) {
  const html = [];
  let listType = null;
  let listItems = [];
  const flushList = () => {
    if (!listType || !listItems.length) return;
    const tag = listType === 'number' ? 'ol' : 'ul';
    html.push(`<${tag}>${listItems.map((item) => `<li>${item}</li>`).join('')}</${tag}>`);
    listType = null;
    listItems = [];
  };

  for (const block of blocks || []) {
    if (block._type !== 'block') continue;
    const content = (block.children || []).map((child) => renderMarks(child.text || '', child.marks || [])).join('');
    if (!stripHtml(content)) continue;

    if (block.listItem) {
      const currentType = block.listItem === 'number' ? 'number' : 'bullet';
      if (listType && listType !== currentType) flushList();
      listType = currentType;
      listItems.push(content);
      continue;
    }

    flushList();
    if (block.style === 'h2') html.push(`<h2>${content}</h2>`);
    else if (block.style === 'h3') html.push(`<h3>${content}</h3>`);
    else if (block.style === 'blockquote') html.push(`<blockquote><p>${content}</p></blockquote>`);
    else html.push(`<p>${content}</p>`);
  }

  flushList();
  return html.join('\n');
}

function structuredData(post, faqItems) {
  const canonical = getPostUrl(post);
  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: getDescription(post),
      url: canonical,
      mainEntityOfPage: canonical,
      image: [post.mainImageUrl || brandImage],
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { '@type': 'Person', name: post.author || 'Car Match' },
      publisher: {
        '@type': 'Organization',
        name: 'Car Match',
        logo: { '@type': 'ImageObject', url: `${siteUrl}/brand/carmatch-lockup-navy.png` },
      },
      inLanguage: 'vi-VN',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    },
  ];
  if (faqItems.length) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
  }
  return graph;
}

function renderTopbar() {
  return `<header class="topbar">
      <nav class="nav" aria-label="Điều hướng chính">
        <a class="brand" href="/" aria-label="Car Match"><img src="/brand/carmatch-lockup-navy.png" alt="Car Match" /></a>
        <div class="navlinks"><a href="/xe">Thuê xe tự lái</a><a href="/di-dau">Đi đâu</a><a href="/lap-ke-hoach-chuyen-di">Lập chuyến đi</a><a href="/thue-xe-thang">Thuê xe tháng</a><a href="/hop-tac">Hợp tác chủ xe</a><a href="/gioi-thieu">Giới thiệu</a><a href="/blog">Blog</a></div>
        <a class="nav-cta" href="https://zalo.me/0975563290">Đặt xe qua Zalo</a>
      </nav>
    </header>`;
}

function sharedStyles() {
  return `<style>
      :root { font-family: "Be Vietnam Pro", Arial, sans-serif; color: #111827; background: #f8fafc; }
      * { box-sizing: border-box; }
      html, body { max-width: 100%; overflow-x: hidden; }
      body { margin: 0; }
      a { color: #11163e; font-weight: 800; text-decoration: none; }
      .topbar { background: rgba(255,255,255,.96); border-bottom: 1px solid #eef2f7; position: sticky; top: 0; z-index: 10; }
      .nav { align-items: center; display: flex; height: 72px; justify-content: space-between; margin: 0 auto; max-width: 1180px; padding: 0 24px; }
      .brand { align-items: center; display: inline-flex; min-width: 0; }
      .brand img { height: 34px; width: auto; }
      .navlinks { display: flex; gap: 28px; }
      .navlinks a { color: #4b5563; font-size: 14px; font-weight: 600; }
      .nav-cta, .button.primary { background: #11163e; color: #fff; }
      .nav-cta, .button { border-radius: 999px; display: inline-flex; padding: 12px 20px; }
      .eyebrow, .meta { color: #64748b; font-size: 13px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      h1, h2, h3 { color: #111827; overflow-wrap: anywhere; word-break: break-word; }
      p, li { color: #374151; font-size: 18px; line-height: 1.78; }
      img { max-width: 100%; }
      @media (max-width: 720px) { .nav { height: 64px; padding: 0 16px; } .navlinks, .nav-cta { display: none; } .brand img { height: 30px; } h1 { font-size: 30px; line-height: 1.1; max-width: 100%; } p, li { font-size: 16px; } }
      /* Footer */
      .site-footer { background: #111827; color: #e2e8f0; margin-top: 80px; padding: 48px 24px 24px; }
      .footer-inner { display: grid; gap: 40px; grid-template-columns: 1fr repeat(3, auto); margin: 0 auto; max-width: 1180px; }
      .footer-brand img { filter: brightness(0) invert(1); height: 32px; margin-bottom: 14px; width: auto; }
      .footer-brand p { color: #9ca3af; font-size: 14px; font-weight: 400; line-height: 1.65; margin: 0 0 16px; }
      .footer-socials { display: flex; gap: 12px; margin-top: 4px; }
      .social-icon { align-items: center; background: rgba(255,255,255,.1); border-radius: 50%; color: #d1d5db; display: flex; height: 36px; justify-content: center; transition: background .15s; width: 36px; }
      .social-icon:hover { background: rgba(255,255,255,.2); color: #fff; }
      .social-zalo { background: rgba(0,104,255,.3); color: #93c5fd; }
      .social-zalo:hover { background: rgba(0,104,255,.5); }
      .footer-col > p { color: #6b7280; font-size: 12px; font-weight: 900; letter-spacing: .1em; margin: 0 0 12px; text-transform: uppercase; }
      .footer-col ul { list-style: none; margin: 0; padding: 0; }
      .footer-col li { margin-bottom: 8px; }
      .footer-col a { color: #d1d5db; font-size: 14px; font-weight: 500; }
      .footer-col a:hover { color: #fff; }
      .footer-bottom { border-top: 1px solid #1f2937; margin: 40px auto 0; max-width: 1180px; padding-top: 20px; }
      .footer-bottom p { color: #6b7280; font-size: 13px; margin: 0; }
      @media (max-width: 820px) { .footer-inner { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 540px) { .site-footer { padding: 40px 20px 20px; } .footer-inner { grid-template-columns: 1fr; gap: 28px; } }
    </style>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <a href="/"><img src="/brand/carmatch-lockup-navy.png" alt="Car Match" /></a>
        <p>Dịch vụ cho thuê xe tự lái uy tín tại Hà Nội. Xe mới, giá tốt, giao xe tận nơi.</p>
        <div class="footer-socials">
          <a class="social-icon" href="https://facebook.com/carmatch.vn" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </a>
          <a class="social-icon" href="https://instagram.com/carmatch.vn" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd"/></svg>
          </a>
          <a class="social-icon social-zalo" href="https://zalo.me/0975563290" target="_blank" rel="noopener noreferrer" aria-label="Zalo">
            <span style="font-size:11px;font-weight:900;line-height:1">Z</span>
          </a>
        </div>
      </div>
      <div class="footer-col">
        <p>Dịch vụ</p>
        <ul>
          <li><a href="/xe">Thuê xe tự lái</a></li>
          <li><a href="/thue-xe-thang">Thuê xe theo tháng</a></li>
          <li><a href="/xe?category=electric">Xe điện VinFast</a></li>
          <li><a href="/xe?seats=7">Xe 7 chỗ</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p>Thông tin</p>
        <ul>
          <li><a href="/gioi-thieu">Về Car Match</a></li>
          <li><a href="/blog">Blog &amp; Kinh nghiệm</a></li>
          <li><a href="/gioi-thieu#quy-trinh">Quy trình thuê xe</a></li>
          <li><a href="/chinh-sach">Điều kiện &amp; Chính sách</a></li>
          <li><a href="/faq-thue-xe-tu-lai-ha-noi">Câu hỏi thường gặp</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p>Liên hệ</p>
        <ul>
          <li><a href="tel:0975563290">📞 0975 563 290</a></li>
          <li><a href="https://zalo.me/0975563290">Zalo: 0975 563 290</a></li>
          <li><a href="mailto:info@carmatch.vn">info@carmatch.vn</a></li>
          <li>Hà Nội, Việt Nam</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} Car Match. Bảo lưu mọi quyền.</p>
    </div>
  </footer>`;
}

export function renderBlogIndex(posts = []) {
  const title = 'Blog Kinh Nghiệm Thuê Xe Tự Lái | Car Match Hà Nội';
  const description = 'Kinh nghiệm thuê xe tự lái Hà Nội: giấy tờ cần chuẩn bị, đặt cọc, bảo hiểm, chọn xe phù hợp và dịch vụ giao xe tận sảnh chung cư.';
  const postItems = posts.map((post, index) => ({
    ...post,
    url: getPostUrl(post),
    image: optimizeImageUrl(post.mainImageUrl || brandImage, index === 0 ? 1200 : 720),
    minutes: readingTime(post),
  }));
  const graph = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: title,
    description,
    url: `${siteUrl}/blog`,
    blogPost: postItems.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: getDescription(post),
      url: post.url,
      image: [post.mainImageUrl || brandImage],
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { '@type': 'Person', name: post.author || 'Car Match' },
      publisher: { '@type': 'Organization', name: 'Car Match', logo: { '@type': 'ImageObject', url: brandLogo } },
    })),
  };

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${siteUrl}/blog" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${siteUrl}/blog" />
    <meta property="og:image" content="${escapeHtml(brandImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${normalizeBrandText(JSON.stringify(graph))}</script>
    ${sharedStyles()}
    <style>
      main { margin: 0 auto; max-width: 1180px; padding: 56px 24px 84px; }
      .hero { border-bottom: 1px solid #e5e7eb; display: grid; gap: 28px; grid-template-columns: minmax(0, 1fr) 320px; margin-bottom: 32px; padding-bottom: 34px; }
      h1 { font-size: clamp(36px, 6vw, 66px); line-height: 1.02; margin: 12px 0 18px; max-width: 820px; }
      .hero p { max-width: 760px; margin: 0; }
      .topic-panel { align-self: end; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; }
      .topic-panel p { color: #111827; font-size: 13px; font-weight: 900; letter-spacing: .08em; margin: 0 0 12px; text-transform: uppercase; }
      .topic-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .topic-list a { background: #eef2ff; border: 1px solid #dbe3ff; border-radius: 999px; font-size: 13px; padding: 8px 10px; white-space: nowrap; }
      .grid { display: grid; gap: 22px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; display: grid; grid-template-rows: auto 1fr; overflow: hidden; transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease; }
      .card:hover { border-color: #cbd5e1; box-shadow: 0 18px 38px rgba(15,23,42,.08); transform: translateY(-2px); }
      .thumb { aspect-ratio: 16/9; background: #eef2f7; overflow: hidden; }
      .thumb img { display: block; height: 100%; object-fit: cover; width: 100%; }
      .card-body { display: flex; flex-direction: column; gap: 12px; padding: 22px; }
      .pill { align-self: flex-start; background: #eef2ff; border: 1px solid #dbe3ff; border-radius: 999px; color: #11163e; font-size: 12px; font-weight: 900; padding: 5px 10px; }
      .card h2 { font-size: 22px; line-height: 1.25; margin: 0; }
      .card p { font-size: 15px; line-height: 1.65; margin: 0; }
      .card .meta { margin-top: auto; text-transform: none; letter-spacing: 0; }
      @media (max-width: 820px) { main { padding: 38px 16px 64px; } .hero { display: block; } .topic-panel { margin-top: 24px; } .topic-list a { font-size: 12px; } .grid { grid-template-columns: 1fr; } .card h2 { font-size: 20px; } }
    </style>
  </head>
  <body>
    ${renderTopbar()}
    <main>
      <section class="hero">
        <div>
          <p class="eyebrow">Blog Car Match</p>
          <h1>Kinh nghiệm thuê xe tự lái Hà Nội</h1>
          <p>${escapeHtml(description)}</p>
        </div>
        <aside class="topic-panel" aria-label="Chủ đề nổi bật">
          <p>Tìm nhanh</p>
          <div class="topic-list">
            <a href="/xe">Danh sách xe</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/di-dau">Lịch trình đi chơi</a>
            <a href="/faq">Câu hỏi thường gặp</a>
          </div>
        </aside>
      </section>
      <section class="grid" aria-label="Danh sách bài viết">
        ${postItems.map((post) => `<a class="card" href="/blog/${escapeHtml(post.slug.current)}">
          <div class="thumb"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async" /></div>
          <div class="card-body">
            ${(post.categories || []).length ? `<span class="pill">${escapeHtml(post.categories[0])}</span>` : ''}
            <h2>${escapeHtml(post.title)}</h2>
            <p>${escapeHtml(getDescription(post))}</p>
            <p class="meta">${escapeHtml(post.author || 'Car Match')}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''} · ${post.minutes} phút đọc</p>
          </div>
        </a>`).join('')}
      </section>
    </main>
    ${renderFooter()}
  </body>
</html>`;
}

export function renderBlogPage(post) {
  const canonical = getPostUrl(post);
  const title = `${post.seoTitle || post.title} | Car Match`;
  const description = getDescription(post);
  const image = optimizeImageUrl(post.mainImageUrl || brandImage, 1400);
  const rawBodyHtml = optimizeBodyImages(post.bodyHtml || renderPortableText(post.body));
  const headings = extractHeadings(rawBodyHtml);
  const bodyHtml = addHeadingIds(rawBodyHtml, headings);
  const faqItems = extractFaqItems(bodyHtml);
  const hasInlineImages = /<img\b/i.test(bodyHtml);

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(post.mainImageUrl || brandImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(post.mainImageUrl || brandImage)}" />
    <script type="application/ld+json">${normalizeBrandText(JSON.stringify(structuredData(post, faqItems)))}</script>
    ${sharedStyles()}
    <style>
      main { margin: 0 auto; max-width: 1040px; padding: 64px 20px 80px; }
      article { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: clamp(24px, 5vw, 56px); }
      h1 { font-size: clamp(34px, 6vw, 62px); line-height: 1.04; margin: 12px 0 18px; }
      h2 { font-size: clamp(26px, 4vw, 36px); line-height: 1.18; margin: 46px 0 14px; scroll-margin-top: 96px; }
      h3 { font-size: 23px; line-height: 1.25; margin: 32px 0 10px; scroll-margin-top: 96px; }
      .excerpt { border-left: 4px solid #11163e; background: #eef0f8; border-radius: 0 8px 8px 0; padding: 16px 18px; }
      img.hero, article img { border-radius: 10px; display: block; margin: 30px 0; max-height: 720px; object-fit: cover; width: 100%; }
      figure { margin: 34px 0; }
      figcaption, img[data-caption] + figcaption { color: #64748b; font-size: 14px; text-align: center; }
      table { border-collapse: collapse; display: block; margin: 28px 0; overflow-x: auto; width: 100%; }
      th, td { border: 1px solid #e5e7eb; padding: 12px 14px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; color: #111827; }
      blockquote, [data-callout] { border-left: 4px solid #11163e; background: #f8fafc; border-radius: 0 10px 10px 0; margin: 28px 0; padding: 16px 20px; }
      [data-callout="warning"] { background: #fff7ed; border-left-color: #f97316; }
      .toc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 28px 0; padding: 18px; }
      .toc p { color: #111827; font-size: 13px; font-weight: 900; margin: 0 0 10px; text-transform: uppercase; }
      .toc ol { margin: 0; padding-left: 20px; }
      .toc li { font-size: 15px; line-height: 1.7; }
      .toc a { overflow-wrap: anywhere; word-break: break-word; }
      .toc .level-3 { margin-left: 16px; }
      .related, .cta { border-radius: 16px; margin-top: 40px; padding: 24px; }
      .related { background: #fff7ed; border: 1px solid #fed7aa; }
      .cta { background: #eef0f8; border: 1px solid #d4d8ef; text-align: center; }
      .cta h2 { margin-top: 0; }
      .cta-actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
      .button.secondary { background: #fff; border: 1px solid #cbd5e1; color: #11163e; }
      @media (max-width: 720px) { main { padding: 28px 0 64px; } article { border-radius: 0; border-left: 0; border-right: 0; padding-left: 24px; padding-right: 24px; } img.hero, article img { max-height: 520px; } .toc { margin-left: -2px; margin-right: -2px; } }
    </style>
  </head>
  <body>
    ${renderTopbar()}
    <main>
      <article>
        ${(post.categories || []).length ? `<p class="eyebrow">${escapeHtml(post.categories.join(' / '))}</p>` : ''}
        <h1>${escapeHtml(post.title)}</h1>
        <p class="meta">${escapeHtml(post.author || 'Car Match')}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''}</p>
        ${post.excerpt ? `<p class="excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
        ${renderToc(headings)}
        ${post.mainImageUrl && !hasInlineImages ? `<img class="hero" src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" />` : ''}
        ${normalizeBrandText(bodyHtml)}
        ${renderRelated(post)}
        ${renderCta(post)}
      </article>
    </main>
    <script>
      document.addEventListener('click', function (event) {
        var link = event.target && event.target.closest ? event.target.closest('[data-blog-action]') : null;
        if (!link) return;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'blog_conversion_click', article_slug: ${JSON.stringify(post.slug.current)}, action: link.getAttribute('data-blog-action') || '', target: link.getAttribute('data-blog-target') || link.getAttribute('href') || '' });
      });
    </script>
    ${renderFooter()}
  </body>
</html>`;
}
