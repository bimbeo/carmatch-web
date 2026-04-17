import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Car, Facebook, Instagram } from 'lucide-react';
import { sanityClient, postsQuery } from '@/lib/sanity';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  mainImageUrl: string | null;
  categories: string[];
  author: string;
}

function SkeletonCard() {
  return (
    <div className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
      <div className="aspect-[16/9] bg-[#1a1a1a]" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-[#1a1a1a] rounded w-1/4" />
        <div className="h-6 bg-[#1a1a1a] rounded w-3/4" />
        <div className="h-4 bg-[#1a1a1a] rounded w-full" />
        <div className="h-4 bg-[#1a1a1a] rounded w-2/3" />
        <div className="h-3 bg-[#1a1a1a] rounded w-1/2 mt-4" />
      </div>
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

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sanityClient
      .fetch(postsQuery)
      .then((data: Post[]) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải bài viết. Vui lòng thử lại sau.');
        setLoading(false);
      });
  }, []);

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

      {/* Hero */}
      <section className="pt-16">
        <div className="border-t-2 border-[#4ade80] bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Blog & Tin tức
            </h1>
            <p className="text-lg text-gray-400 max-w-xl">
              Kinh nghiệm thuê xe, mẹo lái xe và cập nhật từ CarMatch
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-20 text-gray-400">{error}</div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Chưa có bài viết nào.</p>
              <p className="text-gray-600 text-sm mt-2">Hãy quay lại sau nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug.current}`}
                  className="block bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:border-[#4ade80]/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#4ade80]/10 group"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden">
                    {post.mainImageUrl ? (
                      <img
                        src={post.mainImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-[#0d0d0d] flex items-center justify-center">
                        <Car className="w-12 h-12 text-gray-700" />
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 bg-[#4ade80]/10 text-[#4ade80] text-xs font-semibold rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-lg font-bold text-white group-hover:text-[#4ade80] transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Author + Date */}
                    <div className="flex items-center gap-2 text-gray-500 text-xs mt-auto">
                      {post.author && <span>{post.author}</span>}
                      {post.author && post.publishedAt && <span>·</span>}
                      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-12 mt-8">
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
