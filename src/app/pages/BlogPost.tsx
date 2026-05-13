import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import { sanityClient, postBySlugQuery } from '@/lib/sanity';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

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
      <h2 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xl font-bold text-white mt-6 mb-3">{children}</h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-[#4ade80] pl-4 italic text-gray-400 my-6">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    link: ({ value, children }: { value?: { href: string }; children?: React.ReactNode }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#4ade80] hover:underline"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="text-gray-300 ml-6 mb-4 space-y-1 list-disc">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="text-gray-300 ml-6 mb-4 space-y-1 list-decimal">{children}</ol>
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#4ade80] transition-colors text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Blog
          </Link>

          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-[#1a1a1a] rounded w-3/4" />
              <div className="h-5 bg-[#1a1a1a] rounded w-1/2" />
              <div className="aspect-[16/9] bg-[#1a1a1a] rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 bg-[#1a1a1a] rounded" />
                <div className="h-4 bg-[#1a1a1a] rounded w-5/6" />
                <div className="h-4 bg-[#1a1a1a] rounded w-4/6" />
              </div>
            </div>
          ) : notFound || !post ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-xl mb-4">Không tìm thấy bài viết.</p>
              <Link to="/blog" className="text-[#4ade80] hover:underline">
                Xem tất cả bài viết
              </Link>
            </div>
          ) : (
            <article>
              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 bg-[#4ade80]/10 text-[#4ade80] text-xs font-semibold rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {post.title}
              </h1>

              {/* Author + Date */}
              <div className="flex items-center gap-3 text-gray-500 text-sm mb-6">
                {post.author && <span className="text-gray-400">{post.author}</span>}
                {post.author && post.publishedAt && <span>·</span>}
                {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-lg text-gray-400 leading-relaxed mb-8 border-l-2 border-[#4ade80]/40 pl-4">
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
                <div className="prose prose-invert max-w-none">
                  <PortableText value={post.body} components={portableTextComponents} />
                </div>
              )}

              {/* Zalo CTA */}
              <div className="mt-12 bg-gradient-to-br from-[#4ade80]/10 to-transparent border border-[#4ade80]/20 rounded-2xl p-8 text-center">
                <h3 className="text-white font-bold text-xl mb-2">Sẵn sàng trải nghiệm?</h3>
                <p className="text-gray-400 mb-6">Đặt xe ngay qua Zalo — xác nhận trong 30 phút</p>
                <a
                  href="https://zalo.me/0975563290"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#4ade80] text-black rounded-full font-bold hover:bg-[#22c55e] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Đặt xe qua Zalo
                </a>
              </div>

              {/* Back link bottom */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-[#4ade80] transition-colors text-sm"
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
