import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import { sanityClient, postBySlugQuery } from '@/lib/sanity';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import { useSEO } from '@/hooks/useSEO';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  mainImageUrl: string | null;
  categories: string[];
  author: string;
  body: unknown[];
  seoTitle?: string;
  seoDescription?: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
            src={url}
            alt={value.alt || ''}
            className="w-full rounded-xl object-cover"
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

  useSEO({
    title: post?.seoTitle ?? post?.title ?? 'Blog | CarMatch',
    description: post?.seoDescription ?? post?.excerpt ?? 'Đọc bài viết mới nhất từ CarMatch về thuê xe tự lái Hà Nội.',
    canonical: post ? `https://carmatch.vn/blog/${post.slug.current}` : undefined,
    ogImage: post?.mainImageUrl ?? undefined,
  });

  useEffect(() => {
    if (!slug) return;
    sanityClient
      .fetch(postBySlugQuery, { slug })
      .then((data: Post | null) => {
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (post) {
      document.title = `${post.seoTitle || post.title} | CarMatch`;
    }

    return () => {
      document.title = 'CarMatch — Thuê Xe Tự Lái Hà Nội | Giá Từ 800K/Ngày';
    };
  }, [post]);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      <main className="pt-24 pb-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Blog
          </Link>

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
              <Link to="/blog" className="text-brand-600 hover:underline">
                Xem tất cả bài viết
              </Link>
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
              {post.mainImageUrl && (
                <div className="mb-10">
                  <img
                    src={post.mainImageUrl}
                    alt={post.title}
                    className="w-full rounded-xl object-cover aspect-[16/9]"
                  />
                </div>
              )}

              {/* Body */}
              {post.body && post.body.length > 0 && (
                <div className="prose max-w-none">
                  <PortableText value={post.body} components={portableTextComponents} />
                </div>
              )}

              {/* Zalo CTA */}
              <div className="mt-12 bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center">
                <h3 className="text-gray-900 font-bold text-xl mb-2">Sẵn sàng trải nghiệm?</h3>
                <p className="text-gray-500 mb-6">Đặt xe ngay qua Zalo — xác nhận trong 30 phút</p>
                <a
                  href="https://zalo.me/0975563290"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Đặt xe qua Zalo
                </a>
              </div>

              {/* Back link bottom */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại Blog
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
