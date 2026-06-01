const siteUrl = 'https://www.carmatch.vn';
const brandImage = `${siteUrl}/og-image.jpg`;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(value = '') {
  return String(value)
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

function getPostUrl(post) {
  return post.canonicalUrl || `${siteUrl}/blog/${post.slug.current}`;
}

function getDescription(post) {
  return post.seoDescription || post.excerpt || stripHtml(post.bodyHtml).slice(0, 155) || 'Kinh nghiệm thuê xe tự lái Hà Nội từ CarMatch.';
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
  const primary = post.ctaPrimaryUrl ? `<a class="button primary" href="${escapeHtml(post.ctaPrimaryUrl)}" data-blog-action="cta_primary" data-blog-target="${escapeHtml(post.ctaPrimaryUrl)}">${escapeHtml(post.ctaPrimaryLabel || 'Đặt xe với CarMatch')}</a>` : '';
  const zaloUrl = post.ctaZaloUrl || 'https://zalo.me/0975563290';
  return `<section class="cta">
    <p class="eyebrow">CarMatch hỗ trợ nhanh</p>
    <h2>${escapeHtml(post.ctaTitle || 'Cần xe phù hợp cho chuyến đi?')}</h2>
    <p>${escapeHtml(post.ctaDescription || 'Nhắn CarMatch để được tư vấn xe, lịch trống và chi phí phù hợp.')}</p>
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
      author: { '@type': 'Person', name: post.author || 'CarMatch' },
      publisher: {
        '@type': 'Organization',
        name: 'CarMatch',
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

export function renderBlogPage(post) {
  const canonical = getPostUrl(post);
  const title = `${post.seoTitle || post.title} | CarMatch`;
  const description = getDescription(post);
  const image = post.mainImageUrl || brandImage;
  const rawBodyHtml = post.bodyHtml || renderPortableText(post.body);
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
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(structuredData(post, faqItems))}</script>
    <style>
      :root { font-family: "Be Vietnam Pro", Arial, sans-serif; color: #111827; background: #f8fafc; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      a { color: #11163e; font-weight: 800; text-decoration: none; }
      .topbar { background: rgba(255,255,255,.96); border-bottom: 1px solid #eef2f7; position: sticky; top: 0; z-index: 10; }
      .nav { align-items: center; display: flex; height: 72px; justify-content: space-between; margin: 0 auto; max-width: 1180px; padding: 0 24px; }
      .brand img { height: 34px; width: auto; }
      .navlinks { display: flex; gap: 28px; }
      .navlinks a { color: #4b5563; font-size: 14px; font-weight: 600; }
      .nav-cta, .button.primary { background: #11163e; color: #fff; }
      .nav-cta, .button { border-radius: 999px; display: inline-flex; padding: 12px 20px; }
      main { margin: 0 auto; max-width: 1040px; padding: 64px 20px 80px; }
      article { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: clamp(24px, 5vw, 56px); }
      h1 { font-size: clamp(34px, 6vw, 62px); line-height: 1.04; margin: 12px 0 18px; }
      h2 { font-size: clamp(26px, 4vw, 36px); line-height: 1.18; margin: 46px 0 14px; scroll-margin-top: 96px; }
      h3 { font-size: 23px; line-height: 1.25; margin: 32px 0 10px; scroll-margin-top: 96px; }
      p, li { color: #374151; font-size: 18px; line-height: 1.78; }
      .eyebrow, .meta { color: #64748b; font-size: 13px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .excerpt { border-left: 4px solid #11163e; background: #eef0f8; border-radius: 0 8px 8px 0; padding: 16px 18px; }
      img { max-width: 100%; }
      img.hero, article img { border-radius: 10px; display: block; height: auto; margin: 30px 0; width: 100%; }
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
      .toc .level-3 { margin-left: 16px; }
      .related, .cta { border-radius: 16px; margin-top: 40px; padding: 24px; }
      .related { background: #fff7ed; border: 1px solid #fed7aa; }
      .cta { background: #eef0f8; border: 1px solid #d4d8ef; text-align: center; }
      .cta h2 { margin-top: 0; }
      .cta-actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
      .button.secondary { background: #fff; border: 1px solid #cbd5e1; color: #11163e; }
      @media (max-width: 720px) { .navlinks { display: none; } main { padding: 36px 0 64px; } article { border-radius: 0; border-left: 0; border-right: 0; } p, li { font-size: 16px; } }
    </style>
  </head>
  <body>
    <header class="topbar">
      <nav class="nav" aria-label="Điều hướng chính">
        <a class="brand" href="/" aria-label="CarMatch"><img src="/brand/carmatch-lockup-navy.png" alt="CarMatch" /></a>
        <div class="navlinks"><a href="/xe">Thuê xe tự lái</a><a href="/thue-xe-thang">Thuê xe tháng</a><a href="/hop-tac">Hợp tác chủ xe</a><a href="/gioi-thieu">Giới thiệu</a><a href="/blog">Blog</a></div>
        <a class="nav-cta" href="https://zalo.me/0975563290">Đặt xe qua Zalo</a>
      </nav>
    </header>
    <main>
      <article>
        ${(post.categories || []).length ? `<p class="eyebrow">${escapeHtml(post.categories.join(' / '))}</p>` : ''}
        <h1>${escapeHtml(post.title)}</h1>
        <p class="meta">${escapeHtml(post.author || 'CarMatch')}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''}</p>
        ${post.excerpt ? `<p class="excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
        ${post.mainImageUrl && !hasInlineImages ? `<img class="hero" src="${escapeHtml(post.mainImageUrl)}" alt="${escapeHtml(post.title)}" />` : ''}
        ${renderToc(headings)}
        ${bodyHtml}
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
  </body>
</html>`;
}
