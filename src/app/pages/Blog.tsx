import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Car } from 'lucide-react';
import { sanityClient, postsQuery } from '@/lib/sanity';
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
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-[16/9] bg-gray-100" />
      <div className="p-6 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-1/4" />
        <div className="h-6 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mt-4" />
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
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100 pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-2">Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Kinh nghiệm & Tin tức
          </h1>
          <p className="text-gray-500 max-w-xl">
            Hướng dẫn thuê xe, mẹo lái xe và kinh nghiệm du lịch từ CarMatch
          </p>
        </div>
      </div>

      {/* Blog Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-20 text-gray-500">{error}</div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Chưa có bài viết nào.</p>
              <p className="text-gray-400 text-sm mt-2">Hãy quay lại sau nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug.current}`}
                  className="block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    {post.mainImageUrl ? (
                      <img src={post.mainImageUrl} alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                        <Car className="w-12 h-12 text-green-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
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

      <Footer />
    </div>
  );
}
