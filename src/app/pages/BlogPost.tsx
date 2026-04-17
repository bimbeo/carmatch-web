import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Car, Facebook, Instagram, ArrowLeft } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import { sanityClient, postBySlugQuery } from '@/lib/sanity';

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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Car className="w-6 h-6 text-[#4ade80]" />
              <span className="text-xl font-bold text-white">CarMatch</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/#fleet" className="text-sm text-gray-300 hover:text-white transition-colors">Thuê xe tự lái</Link>
              <Link to="/#b2b" className="text-sm text-gray-300 hover:text-white transition-colors">Thuê xe dài hạn</Link>
              <Link to="/blog" className="text-sm text-[#4ade80] font-medium transition-colors">Blog</Link>
              <Link to="/#contact" className="text-sm text-gray-300 hover:text-white transition-colors">Liên hệ</Link>
            </div>
            <div className="hidden md:block">
              <button className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors">
                Đặt xe ngay
              </button>
            </div>
          </div>
        </div>
      </nav>

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

              {/* Back link bottom */}
              <div className="mt-12 pt-8 border-t border-white/5">
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

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-6 h-6 text-[#4ade80]" />
                <span className="text-xl font-bold text-white">CarMatch</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">Cho thuê xe tự lái Hà Nội</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center hover:bg-[#4ade80]/20 transition-colors">
                  <span className="text-[#4ade80] font-bold text-sm">Z</span>
                </a>
                <a href="#" className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center hover:bg-[#4ade80]/20 transition-colors">
                  <Facebook className="w-5 h-5 text-[#4ade80]" />
                </a>
                <a href="#" className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center hover:bg-[#4ade80]/20 transition-colors">
                  <Instagram className="w-5 h-5 text-[#4ade80]" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Dịch vụ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/#fleet" className="hover:text-[#4ade80] transition-colors">Thuê xe tự lái</a></li>
                <li><a href="/#b2b" className="hover:text-[#4ade80] transition-colors">Thuê xe dài hạn</a></li>
                <li><a href="/#b2b" className="hover:text-[#4ade80] transition-colors">Thuê xe doanh nghiệp</a></li>
                <li><a href="/#contact" className="hover:text-[#4ade80] transition-colors">Thuê xe sân bay</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Giới thiệu</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/#about" className="hover:text-[#4ade80] transition-colors">Về CarMatch</a></li>
                <li><Link to="/blog" className="hover:text-[#4ade80] transition-colors">Tin tức</Link></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Điều khoản</a></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Chính sách</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Hà Nội, Việt Nam</li>
                <li>Zalo: 0xxx-xxx-xxx</li>
                <li>Email: info@carmatch.vn</li>
                <li>Hotline: 1900-xxxx</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-500">
            © 2025 CarMatch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
