import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Star, CheckCircle2, Building2, MessageCircle, Zap, Shield, Clock, MapPin } from 'lucide-react';
import { cars } from '@/data/cars';
import { sanityClient, postsQuery } from '@/lib/sanity';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import ZaloFAB from '../components/ZaloFAB';

const ZALO_LINK = 'https://zalo.me/0975563290';

const stats = [
  { value: '20+', label: 'Mẫu xe' },
  { value: '500+', label: 'Chuyến thành công' },
  { value: '4.8★', label: 'Đánh giá khách hàng' },
  { value: '2 năm', label: 'Kinh nghiệm' },
];

const features = [
  {
    icon: Shield,
    title: 'Xe an toàn, bảo hiểm đầy đủ',
    desc: 'Tất cả xe được kiểm tra định kỳ, bảo hiểm thân xe và tai nạn đầy đủ.',
  },
  {
    icon: MapPin,
    title: 'Giao xe tận nơi',
    desc: 'Giao đến nhà, văn phòng, sân bay Nội Bài trong nội thành Hà Nội.',
  },
  {
    icon: MessageCircle,
    title: 'Đặt xe qua Zalo dễ dàng',
    desc: 'Nhắn tin Zalo, xác nhận lịch và nhận xe trong vòng 30 phút.',
  },
  {
    icon: Clock,
    title: 'Hỗ trợ 7h – 22h mỗi ngày',
    desc: 'Đội ngũ luôn sẵn sàng tư vấn và xử lý sự cố trong ngày.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Chọn xe & nhắn Zalo',
    desc: 'Xem fleet, chọn xe phù hợp và nhắn Zalo để hỏi lịch trống.',
  },
  {
    step: '02',
    title: 'Xác nhận & ký hợp đồng',
    desc: 'Xuất trình CCCD + GPLX, đặt cọc và ký hợp đồng đơn giản.',
  },
  {
    step: '03',
    title: 'Nhận xe & lên đường',
    desc: 'Xe giao tận nơi. Kiểm tra xe cùng nhân viên, rồi tự do khởi hành!',
  },
];

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    sanityClient.fetch<Post[]>(postsQuery).then((data) => setPosts(data?.slice(0, 3) ?? []));
  }, []);

  const allCarsPreview = cars.slice(0, 6);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-8">
              <Zap className="w-3.5 h-3.5" />
              Hà Nội · Giao xe tận nơi · 7h–22h
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Thuê Xe Tự Lái<br />
              <span className="text-green-600">Hà Nội</span>
            </h1>

            <p className="text-gray-600 text-xl sm:text-2xl mb-3 leading-relaxed">
              20+ mẫu xe từ{' '}
              <span className="text-gray-900 font-semibold">800.000đ/ngày</span>
            </p>
            <p className="text-gray-500 text-base mb-10">
              Xe điện VinFast · Xe 7 chỗ · Kia Carnival · Đặt qua Zalo nhanh 5 phút
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-full hover:bg-green-700 transition-colors shadow-md shadow-green-200"
              >
                <MessageCircle className="w-5 h-5" />
                Đặt xe qua Zalo
              </a>
              <Link
                to="/xe"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-800 font-semibold text-lg rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Xem tất cả xe
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Trust mini badges */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              {['500+ chuyến thành công', 'Bảo hiểm đầy đủ', 'Hoàn cọc ngay'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLEET PREVIEW ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-2">Đội xe CarMatch</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Chọn xe phù hợp với bạn</h2>
              <p className="text-gray-500">Xe điện, xe xăng, xe 7 chỗ — đa dạng cho mọi nhu cầu</p>
            </div>
            <Link
              to="/xe"
              className="hidden sm:flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors font-semibold text-sm"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {allCarsPreview.map((car) => (
              <CarCard key={car.slug} car={car} />
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/xe"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              Xem tất cả {cars.length} mẫu xe
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CARMATCH ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-2">Tại sao chọn CarMatch?</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Dịch vụ đáng tin cậy từ ngày đầu
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Hàng trăm khách hàng Hà Nội đã tin tưởng CarMatch cho mỗi chuyến đi
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── B2B TEASER ────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-green-600 rounded-3xl p-10 lg:p-14 overflow-hidden relative">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-semibold mb-5">
                  <Building2 className="w-3.5 h-3.5" />
                  Dành cho doanh nghiệp
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Cần xe cho công ty?
                </h2>
                <p className="text-green-100 text-lg mb-6 leading-relaxed">
                  Gói thuê xe tháng giúp doanh nghiệp tiết kiệm{' '}
                  <span className="text-white font-bold">30–40%</span> so với thuê ngày lẻ. Hóa đơn VAT. Giao xe tận văn phòng.
                </p>
                <ul className="space-y-2 text-sm text-green-100 mb-8">
                  {['Từ 18.000.000đ/xe/tháng', 'Hóa đơn VAT đầy đủ cho kế toán', 'Giảm thêm khi thuê ≥3 xe hoặc ≥3 tháng'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <Link
                  to="/thue-xe-thang"
                  className="px-8 py-4 bg-white text-green-700 font-bold rounded-full hover:bg-green-50 transition-colors text-center whitespace-nowrap shadow-sm"
                >
                  Xem gói thuê tháng
                </Link>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-colors text-center whitespace-nowrap"
                >
                  Tư vấn ngay
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-2">Quy trình</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Thuê xe dễ dàng 3 bước</h2>
            <p className="text-gray-500">Từ lúc nhắn tin đến lúc cầm chìa khóa, chỉ mất 30 phút</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-green-200">
                  <span className="text-white font-bold text-xl">{step.step}</span>
                </div>
                <h3 className="text-gray-900 font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-colors shadow-md shadow-green-200 text-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Bắt đầu ngay qua Zalo
            </a>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-2">Đánh giá</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Khách hàng nói gì?</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
              <span className="text-gray-900 font-bold ml-2">4.8</span>
              <span className="text-gray-400 ml-1">/ 5.0</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Anh Minh',
                role: 'Khách cá nhân',
                text: 'Thuê VF8 đi Sapa, xe rất mới và sạch. Zalo phản hồi nhanh, giao xe đúng giờ. Sẽ tiếp tục dùng CarMatch.',
                rating: 5,
              },
              {
                name: 'Chị Lan',
                role: 'Khách gia đình',
                text: 'Thuê Carnival 7 chỗ cho cả gia đình. Xe rộng rãi, tiện nghi. Nhân viên rất nhiệt tình tư vấn.',
                rating: 5,
              },
              {
                name: 'Anh Tuấn',
                role: 'Khách doanh nghiệp',
                text: 'Công ty tôi thuê 3 xe theo tháng. Giá tốt, có hóa đơn VAT, xe luôn sẵn sàng. Rất hài lòng.',
                rating: 5,
              },
            ].map((review, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{review.text}"</p>
                <div>
                  <div className="text-gray-900 font-semibold text-sm">{review.name}</div>
                  <div className="text-gray-400 text-xs">{review.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG PREVIEW ──────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-2">Blog</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Kinh nghiệm & Mẹo hay</h2>
                <p className="text-gray-500">Hướng dẫn, lộ trình, kinh nghiệm thuê xe từ CarMatch</p>
              </div>
              <Link
                to="/blog"
                className="hidden sm:flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors font-semibold text-sm"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug.current}`}
                  className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="text-gray-400 text-xs mb-3">
                    {new Date(post.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  <h3 className="text-gray-900 font-semibold mb-3 group-hover:text-green-600 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5">
            Sẵn sàng lên đường?
          </h2>
          <p className="text-gray-600 text-xl mb-10">
            Đặt xe ngay hôm nay — xác nhận trong 30 phút
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-green-600 text-white font-bold text-xl rounded-full hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              <MessageCircle className="w-6 h-6" />
              Đặt xe qua Zalo
            </a>
            <Link
              to="/xe"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-gray-800 font-semibold text-xl rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Xem fleet xe
            </Link>
          </div>
          <p className="text-gray-400 text-sm mt-6">
            Zalo: <span className="text-gray-600">0975 563 290</span> · Phản hồi 7h–22h
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
