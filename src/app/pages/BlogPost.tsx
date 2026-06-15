import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import type { TypedObject } from '@portabletext/types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import { useSEO } from '@/hooks/useSEO';
import { trackEvent } from '@/lib/analytics';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  mainImageUrl: string | null;
  categories: string[];
  author: string;
  body: TypedObject[];
  bodyHtml?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ctaEnabled?: boolean;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryUrl?: string;
  ctaZaloLabel?: string;
  ctaZaloUrl?: string;
  relatedDestinationSlugs?: string[];
  relatedVehicleLinks?: Array<{ label: string; url: string }>;
  relatedPostSlugs?: string[];
  relatedDestinations?: Array<{ slug: string; name: string }>;
  relatedPosts?: Array<{ slug: string; title: string }>;
}

function parseImageAttrs(tag: string) {
  const src = tag.match(/\ssrc=(["'])(.*?)\1/i)?.[2] || '';
  const alt = tag.match(/\salt=(["'])(.*?)\1/i)?.[2] || '';
  const caption = tag.match(/\sdata-caption=(["'])(.*?)\1/i)?.[2] || '';
  return { src, alt, caption };
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeBrandText(value = '') {
  return String(value)
    .replace(/\bCarMatch\b/g, 'Car Match')
    .replace(/\bCARMATCH\b/g, 'CAR MATCH');
}

function normalizeCustomerText(value = '') {
  return normalizeBrandText(value)
    .replace(/hỗ trợ\s*24\/7/gi, 'hỗ trợ trong giờ vận hành')
    .replace(/bảo hiểm đầy đủ/gi, 'điều kiện bảo hiểm được xác nhận trước')
    .replace(/xác nhận tự động/gi, 'đối soát nhanh hơn')
    .replace(/chịu trách nhiệm toàn bộ/gi, 'chịu trách nhiệm theo hợp đồng và quy định đối với');
}

function normalizeOptionalText(value?: string) {
  if (!value?.trim()) return value;
  return normalizeCustomerText(value);
}

function normalizePost(post: Post): Post {
  return {
    ...post,
    title: normalizeCustomerText(post.title),
    excerpt: normalizeCustomerText(post.excerpt || ''),
    author: normalizeCustomerText(post.author || 'Car Match'),
    bodyHtml: normalizeOptionalText(post.bodyHtml),
    seoTitle: normalizeOptionalText(post.seoTitle),
    seoDescription: normalizeOptionalText(post.seoDescription),
    ctaTitle: normalizeOptionalText(post.ctaTitle),
    ctaDescription: normalizeOptionalText(post.ctaDescription),
    ctaPrimaryLabel: normalizeOptionalText(post.ctaPrimaryLabel),
    ctaZaloLabel: normalizeOptionalText(post.ctaZaloLabel),
    relatedVehicleLinks: post.relatedVehicleLinks?.map((link) => ({
      ...link,
      label: normalizeCustomerText(link.label || ''),
    })),
    relatedPosts: post.relatedPosts?.map((relatedPost) => ({
      ...relatedPost,
      title: normalizeCustomerText(relatedPost.title),
    })),
  };
}

function extractHeadings(html: string) {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  html.replace(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, content) => {
    const text = stripHtml(content);
    if (!text) return '';
    const baseId = slugify(text);
    const count = headings.filter((item) => item.id === baseId || item.id.startsWith(`${baseId}-`)).length;
    headings.push({ level: Number(level), text, id: count ? `${baseId}-${count + 1}` : baseId });
    return '';
  });
  return headings;
}

function addHeadingIds(html: string, headings: Array<{ id: string }>) {
  let index = 0;
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, content) => {
    const heading = headings[index++];
    if (!heading) return match;
    const cleanAttrs = String(attrs || '').replace(/\sid=(["']).*?\1/i, '');
    return `<h${level}${cleanAttrs} id="${heading.id}">${content}</h${level}>`;
  });
}

function extractFaqItems(html: string) {
  const faqStart = html.search(/<h2[^>]*>[\s\S]*?(câu hỏi thường gặp|faq)[\s\S]*?<\/h2>/i);
  if (faqStart < 0) return [];
  return [...html.slice(faqStart).matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .slice(0, 8)
    .map((match) => ({ question: stripHtml(match[1]), answer: stripHtml(match[2]) }))
    .filter((item) => item.question && item.answer);
}

function CmsHtml({ html }: { html: string }) {
  const chunks = normalizeCustomerText(html).split(/(<img\b[^>]*>)/gi).filter(Boolean);
  return (
    <div className="cms-blog-body max-w-none">
      {chunks.map((chunk, index) => {
        if (/^<img\b/i.test(chunk)) {
          const { src, alt, caption } = parseImageAttrs(chunk);
          if (!src) return null;
          return (
            <figure key={`image-${src}-${index}`} className="my-8">
              <img
                src={optimizedImageUrl(src, 960, 68)}
                srcSet={optimizedImageSrcSet(src, [640, 960, 1280], 68)}
                sizes="(min-width: 1024px) 760px, 100vw"
                alt={alt}
                className="w-full rounded-xl object-cover shadow-sm"
                width={1280}
                height={720}
                loading="lazy"
                decoding="async"
              />
              {caption || alt ? <figcaption className="mt-2 text-center text-sm text-gray-500">{caption || alt}</figcaption> : null}
            </figure>
          );
        }

        return (
          <div
            key={`html-${index}`}
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: chunk }}
          />
        );
      })}
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function labelFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function trackBlogClick(postSlug: string, action: string, target: string) {
  trackEvent('blog_conversion_click', {
    article_slug: postSlug,
    action,
    target,
  });
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  const body = await res.text();
  if (!contentType.includes('json') && body.trimStart().startsWith('<')) {
    throw new Error(`Expected JSON from ${path}, received HTML`);
  }

  return JSON.parse(body) as T;
}

async function fetchStaticPost(slug: string): Promise<Post | null> {
  const posts = await fetchJson<Post[]>('/data/blog-posts.json');
  return posts.find((item) => item.slug?.current === slug) || null;
}

async function fetchPostBySlug(slug: string): Promise<Post | null> {
  try {
    const post = await fetchJson<Post>(`/api/posts?slug=${encodeURIComponent(slug)}`);
    if (post?._id) return post;
  } catch {
    // Local preview has no serverless API; fall back to static build data.
  }

  return fetchStaticPost(slug);
}

function BlogToc({ headings }: { headings: Array<{ level: number; text: string; id: string }> }) {
  if (headings.length < 2) return null;
  return (
    <nav className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5" aria-label="Mục lục bài viết">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Mục lục</p>
      <ol className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
            <a href={`#${heading.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const portableTextComponents = {
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">{children}</h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-brand-500 pl-4 italic text-gray-600 my-6 bg-brand-50 py-2 rounded-r-lg">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="text-gray-900 font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    link: ({ value, children }: { value?: { href: string }; children?: React.ReactNode }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer"
        className="text-brand-600 hover:underline">
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="text-gray-700 ml-6 mb-4 space-y-1 list-disc">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="text-gray-700 ml-6 mb-4 space-y-1 list-decimal">{children}</ol>
    ),
  },
  types: {
    image: ({ value }: { value: { asset?: { url?: string }; alt?: string } }) => {
      const url = value?.asset?.url;
      if (!url) return null;
      return (
        <figure className="my-8">
          <img
            src={optimizedImageUrl(url, 960, 68)}
            srcSet={optimizedImageSrcSet(url, [640, 960, 1280], 68)}
            sizes="(min-width: 1024px) 760px, 100vw"
            alt={value.alt || ''}
            className="w-full rounded-xl object-cover"
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
          />
          {value.alt && (
            <figcaption className="text-center text-gray-500 text-sm mt-2">{value.alt}</figcaption>
          )}
        </figure>
      );
    },
  },
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const headings = useMemo(() => extractHeadings(post?.bodyHtml || ''), [post?.bodyHtml]);
  const htmlWithHeadingIds = useMemo(() => addHeadingIds(post?.bodyHtml || '', headings), [headings, post?.bodyHtml]);
  const faqItems = useMemo(() => extractFaqItems(htmlWithHeadingIds), [htmlWithHeadingIds]);
  const hasInlineBodyImages = Boolean(post?.bodyHtml && /<img\b/i.test(post.bodyHtml));
  const relatedLinks = post ? [
    ...(post.relatedDestinations?.length
      ? post.relatedDestinations
      : post.relatedDestinationSlugs?.map((relatedSlug) => ({ slug: relatedSlug, name: labelFromSlug(relatedSlug) })) || [])
      .slice(0, 2)
      .map((destination) => ({ key: `destination-${destination.slug}`, href: `/di-dau/${destination.slug}`, label: `Đi ${destination.name} bằng xe tự lái`, action: 'related_destination' })),
    ...(post.relatedVehicleLinks || [])
      .slice(0, 1)
      .map((vehicle) => ({ key: `vehicle-${vehicle.url}`, href: vehicle.url, label: vehicle.label, action: 'related_vehicle' })),
    ...(post.relatedPosts?.length
      ? post.relatedPosts
      : post.relatedPostSlugs?.map((relatedSlug) => ({ slug: relatedSlug, title: labelFromSlug(relatedSlug) })) || [])
      .slice(0, 1)
      .map((relatedPost) => ({ key: `post-${relatedPost.slug}`, href: `/blog/${relatedPost.slug}`, label: relatedPost.title, action: 'related_post' })),
  ] : [];

  useSEO({
    title: post?.seoTitle ?? post?.title ?? 'Blog | Car Match',
    description: post?.seoDescription ?? post?.excerpt ?? 'Đọc bài viết mới nhất từ Car Match về thuê xe tự lái Hà Nội.',
    canonical: post ? (post.canonicalUrl || `https://www.carmatch.vn/blog/${post.slug.current}`) : undefined,
    ogImage: post?.mainImageUrl ?? undefined,
  });

  useEffect(() => {
    if (!slug) return;
    const currentSlug = slug;
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setNotFound(false);
      setPost(null);

      try {
        const data = await fetchPostBySlug(currentSlug);
        if (cancelled) return;
        if (!data?._id) {
          setNotFound(true);
        } else {
          setPost(normalizePost(data));
        }
      } catch {
        if (cancelled) return;
        setNotFound(true);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!post) return undefined;
    const canonical = post.canonicalUrl || `https://www.carmatch.vn/blog/${post.slug.current}`;
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.seoDescription || post.excerpt,
        url: canonical,
        mainEntityOfPage: canonical,
        image: [post.mainImageUrl || 'https://www.carmatch.vn/og-image.png'],
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: { '@type': 'Person', name: post.author || 'Car Match' },
        publisher: {
          '@type': 'Organization',
          name: 'Car Match',
          logo: { '@type': 'ImageObject', url: 'https://www.carmatch.vn/brand/carmatch-lockup-navy.png' },
        },
        inLanguage: 'vi-VN',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://www.carmatch.vn' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.carmatch.vn/blog' },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      },
      ...(faqItems.length ? [{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }] : []),
    ];
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.blogStructuredData = 'true';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [faqItems, post]);

  return (
    <div className="min-h-screen bg-white pb-24 text-gray-900 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="blog_post" zaloHref={post?.ctaZaloUrl || undefined} zaloLabel="Hỏi thuê xe" />

      <main className="pt-24 pb-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Blog
          </a>

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-gray-100 rounded w-3/4" />
              <div className="h-5 bg-gray-100 rounded w-1/2" />
              <div className="aspect-[16/9] bg-gray-100 rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
                <div className="h-4 bg-gray-100 rounded w-4/6" />
              </div>
            </div>
          ) : notFound || !post ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-xl mb-4">Không tìm thấy bài viết.</p>
              <a href="/blog" className="text-brand-600 hover:underline">
                Xem tất cả bài viết
              </a>
            </div>
          ) : (
            <article className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.map((cat) => (
                    <span key={cat}
                      className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-200">
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                {post.title}
              </h1>

              {/* Author + Date */}
              <div className="flex items-center gap-3 text-gray-500 text-sm mb-6">
                {post.author && <span className="text-gray-600">{post.author}</span>}
                {post.author && post.publishedAt && <span>·</span>}
                {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-lg text-gray-600 leading-relaxed mb-8 border-l-4 border-brand-400 pl-4 bg-brand-50 py-3 rounded-r-lg">
                  {post.excerpt}
                </p>
              )}

              {/* Main Image */}
              {post.mainImageUrl && !hasInlineBodyImages && (
                <div className="mb-10">
                  <img
                    src={optimizedImageUrl(post.mainImageUrl, 1200, 68)}
                    srcSet={optimizedImageSrcSet(post.mainImageUrl, [720, 960, 1200, 1600], 68)}
                    sizes="(min-width: 1024px) 760px, 100vw"
                    alt={post.title}
                    className="w-full rounded-xl object-cover aspect-[16/9]"
                    width={1200}
                    height={675}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              )}

              {/* Body */}
              <BlogToc headings={headings} />
              {post.bodyHtml ? (
                <CmsHtml html={htmlWithHeadingIds} />
              ) : post.body && post.body.length > 0 ? (
                <div className="prose max-w-none">
                  <PortableText value={post.body} components={portableTextComponents} />
                </div>
              ) : null}

              {relatedLinks.length > 0 && (
                <aside className="mt-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">Đọc tiếp</h2>
                  <ul className="mt-3 space-y-2 text-gray-700">
                    {relatedLinks.map((link) => (
                      <li key={link.key}>
                        <a href={link.href} onClick={() => trackBlogClick(post.slug.current, link.action, link.href)} className="font-semibold text-brand-700 hover:underline">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              {post.ctaEnabled !== false && (
                <div className="mt-12 bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 mb-3">Car Match hỗ trợ nhanh</p>
                  <h3 className="text-gray-900 font-bold text-2xl mb-2">{post.ctaTitle || 'Sẵn sàng trải nghiệm?'}</h3>
                  <p className="text-gray-500 mb-6">{post.ctaDescription || 'Đặt xe ngay qua Zalo — xác nhận trong 30 phút'}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {post.ctaPrimaryUrl && (
                      <a href={post.ctaPrimaryUrl} onClick={() => trackBlogClick(post.slug.current, 'cta_primary', post.ctaPrimaryUrl || '')} className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-colors">
                        {post.ctaPrimaryLabel || 'Đặt xe với Car Match'}
                      </a>
                    )}
                    <a
                      href={post.ctaZaloUrl || 'https://zalo.me/0975563290'}
                      onClick={() => trackBlogClick(post.slug.current, 'cta_zalo', post.ctaZaloUrl || 'https://zalo.me/0975563290')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-700 border border-brand-200 rounded-full font-bold hover:bg-brand-100 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.ctaZaloLabel || 'Đặt xe qua Zalo'}
                    </a>
                  </div>
                </div>
              )}

              {/* Back link bottom */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <a
                  href="/blog"
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại Blog
                </a>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
