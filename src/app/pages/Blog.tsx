import { useState, useEffect } from 'react';
import { Car } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import { useSEO } from '@/hooks/useSEO';
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
}

const guideTopics = [
  {
    title: 'Chuẩn bị giấy tờ khi thuê xe',
    body: 'Khách thuê nên chuẩn bị CCCD, giấy phép lái xe hạng B và thông tin lịch trình trước khi nhắn Car Match. Việc chốt sớm ngày nhận, ngày trả, khu vực giao xe và số người đi giúp đội vận hành kiểm tra mẫu xe phù hợp nhanh hơn.',
    links: [
      { href: '/thue-xe-tu-lai-ha-noi', label: 'Thuê xe tự lái Hà Nội' },
      { href: '/chinh-sach', label: 'Điều kiện thuê xe' },
    ],
  },
  {
    title: 'Chọn xe theo nhu cầu di chuyển',
    body: 'Xe 5 chỗ phù hợp đi nội đô hoặc cặp đôi cuối tuần, xe 7 chỗ thoải mái hơn cho gia đình có trẻ nhỏ, còn xe điện VinFast hợp với lịch trình có điểm sạc rõ ràng.',
    links: [
      { href: '/xe', label: 'Xem danh sách xe' },
      { href: '/xe?seats=7', label: 'Xe 7 chỗ' },
      { href: '/xe?category=electric', label: 'Xe điện VinFast' },
    ],
  },
  {
    title: 'Lên lịch trình trước khi đặt xe',
    body: 'Với các chuyến đi Hạ Long, Ninh Bình, Tam Đảo, Mộc Châu hoặc Nội Bài, khách nên kiểm tra cao tốc, bãi đỗ, giờ nhận phòng và chi phí xăng sạc.',
    links: [
      { href: '/di-dau', label: 'Gợi ý đi đâu gần Hà Nội' },
      { href: '/lap-ke-hoach-chuyen-di', label: 'Lập kế hoạch chuyến đi' },
    ],
  },
];

const faqItems = [
  {
    question: 'Blog Car Match phù hợp với ai?',
    answer: 'Blog dành cho khách đang tìm thuê xe tự lái Hà Nội, khách thuê xe theo tháng, gia đình chuẩn bị đi chơi gần Hà Nội và người cần so sánh xe 5 chỗ, 7 chỗ, xe điện trước khi đặt.',
  },
  {
    question: 'Chưa thấy bài viết mới thì có đặt xe được không?',
    answer: 'Có. Khách vẫn có thể xem danh sách xe hoặc nhắn Zalo 0975 563 290 để Car Match kiểm tra lịch xe, tư vấn giấy tờ cần chuẩn bị và gợi ý mẫu xe theo lịch trình.',
  },
  {
    question: 'Car Match có tư vấn lịch trình trước khi thuê xe không?',
    answer: 'Có. Car Match có thể gợi ý loại xe, điểm nhận trả, lưu ý bãi đỗ và chi phí di chuyển tham khảo cho các tuyến phổ biến quanh Hà Nội.',
  },
];

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

async function fetchPostList(path: string): Promise<Post[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  const body = await res.text();
  if (!contentType.includes('json') && body.trimStart().startsWith('<')) {
    throw new Error(`Expected JSON from ${path}, received HTML`);
  }

  const data = JSON.parse(body) as unknown;
  if (!Array.isArray(data)) throw new Error(`Expected post array from ${path}`);
  return data as Post[];
}

export default function Blog() {
  useSEO({
    title: 'Blog — Kinh Nghiệm Thuê Xe & Ô Tô Hà Nội | Car Match',
    description: 'Kinh nghiệm thuê xe tự lái Hà Nội: giấy tờ cần chuẩn bị, đặt cọc, chọn xe 5 chỗ, 7 chỗ, xe điện, lịch trình gần Hà Nội và lưu ý trước khi đặt xe.',
    canonical: 'https://www.carmatch.vn/blog',
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const data = await fetchPostList('/api/posts');
        if (!cancelled) setPosts(data);
      } catch {
        try {
          const data = await fetchPostList('/data/blog-posts.json');
          if (!cancelled) setPosts(data);
        } catch {
          if (!cancelled) setError('Không thể tải bài viết. Vui lòng thử lại sau.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="blog_index" zaloLabel="Hỏi thuê xe" />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100 pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Kinh nghiệm & Tin tức
          </h1>
          <p className="text-gray-500 max-w-xl">
            Hướng dẫn thuê xe, mẹo lái xe và kinh nghiệm du lịch từ Car Match
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
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <p className="text-gray-700 text-base font-semibold">Các bài viết chuyên sâu đang được Car Match biên tập và sẽ xuất hiện tại đây khi được đăng chính thức.</p>
              <p className="text-gray-500 text-sm mt-2">Trong lúc chờ bài mới, bạn có thể xem nhanh các hướng dẫn nền tảng bên dưới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              {posts.map((post) => (
                <a
                  key={post._id}
                  href={`/blog/${post.slug.current}`}
                  className="block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    {post.mainImageUrl ? (
                      <img
                        src={optimizedImageUrl(post.mainImageUrl, 720, 62)}
                        srcSet={optimizedImageSrcSet(post.mainImageUrl, [480, 720, 960], 62)}
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={960}
                        height={540}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                        <Car className="w-12 h-12 text-brand-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-200">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-2 line-clamp-2">
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
                </a>
              ))}
            </div>
          )}

          <section className="mt-12" aria-label="Hướng dẫn thuê xe tự lái">
            <div className="max-w-3xl">
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Hướng dẫn nhanh</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Nên đọc gì trước khi thuê xe tự lái?</h2>
              <p className="text-gray-600 leading-relaxed">
                Trong lúc các bài viết chuyên sâu được đăng dần, trang này vẫn gom các chủ đề quan trọng nhất để khách mới không bị lạc giữa giấy tờ, giá thuê, chọn xe và lịch trình.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {guideTopics.map((topic) => (
                <article key={topic.title} className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{topic.title}</h3>
                  <p className="text-sm leading-7 text-gray-600">{topic.body}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {topic.links.map((link) => (
                      <a key={link.href} href={link.href} className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:border-brand-200">
                        {link.label}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6 items-start" aria-label="Cách Car Match hỗ trợ khách thuê xe">
            <div>
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Quy trình đặt xe</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Từ đọc kinh nghiệm đến chốt xe</h2>
              <ol className="list-decimal space-y-3 pl-5 text-gray-600">
                <li><strong className="text-gray-900">Chọn nhu cầu:</strong> xác định số người đi, hành lý, cung đường và số ngày thuê.</li>
                <li><strong className="text-gray-900">Đối chiếu mẫu xe:</strong> xem xe 5 chỗ, 7 chỗ, xe điện hoặc gói thuê tháng phù hợp ngân sách.</li>
                <li><strong className="text-gray-900">Nhắn Zalo:</strong> gửi lịch trình, khu vực nhận xe và giấy tờ để Car Match kiểm tra xe còn phù hợp.</li>
                <li><strong className="text-gray-900">Xác nhận nhận xe:</strong> thống nhất điểm hẹn, thời gian giao nhận và các lưu ý trước chuyến đi.</li>
              </ol>
            </div>
            <aside className="rounded-lg border border-brand-100 bg-brand-50 p-6">
              <p className="text-brand-700 font-semibold text-sm uppercase tracking-wide mb-2">Cần xe sớm?</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Nhắn Car Match kiểm tra xe</h2>
              <p className="text-sm leading-7 text-gray-600">Đội vận hành hỗ trợ 7h-22h, ưu tiên tư vấn theo lịch trình thực tế và khu vực nhận xe tại Hà Nội.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="https://zalo.me/0975563290" rel="me noopener noreferrer" className="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">Nhắn Zalo</a>
                <a href="/xe" className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:border-gray-300">Xem xe</a>
              </div>
            </aside>
          </section>

          <section className="mt-12" aria-label="Câu hỏi thường gặp về blog thuê xe">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Câu hỏi thường gặp</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {faqItems.map((item) => (
                <article key={item.question} className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3">{item.question}</h3>
                  <p className="text-sm leading-7 text-gray-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </div>
  );
}
