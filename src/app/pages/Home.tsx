import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Star, CheckCircle2, MessageCircle, Zap, Shield, Clock, MapPin, Home as HomeIcon, Car, ChevronLeft, ChevronRight, Key } from 'lucide-react';
import { sanityClient, postsQuery } from '@/lib/sanity';
import { useVehicles } from '@/hooks/useVehicles';
import { usePromotions } from '@/hooks/usePromotions';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import ZaloFAB from '../components/ZaloFAB';

const ZALO_LINK = 'https://zalo.me/0975563290';

const stats = [
  { value: '20+', label: 'Mẫu xe' },
  { value: '500+', label: 'Chuyến thành công' },
  { value: '7', label: 'Khu đô thị phục vụ' },
  { value: '4.8★', label: 'Đánh giá khách hàng' },
];

const residentialAreas = [
  { name: 'Vinhomes Ocean Park', area: 'Gia Lâm' },
  { name: 'Vinhomes Times City', area: 'Hai Bà Trưng' },
  { name: 'Vinhomes Smart City', area: 'Nam Từ Liêm' },
  { name: 'Vinhomes Royal City', area: 'Thanh Xuân' },
  { name: 'Ecopark', area: 'Văn Giang, Hưng Yên' },
  { name: 'The Manor Central Park', area: 'Hoàng Mai' },
  { name: 'Linh Đàm', area: 'Hoàng Mai' },
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
  mainImageUrl?: string;
  categories?: string[];
}

// Fallback images for blog posts without mainImage
const BLOG_FALLBACKS = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80', // car on road
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80', // night driving
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80', // mountain road
];
function blogImage(post: Post, index: number): string {
  return post.mainImageUrl ?? BLOG_FALLBACKS[index % BLOG_FALLBACKS.length];
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { cars } = useVehicles();
  const { promotions } = usePromotions();
  const [promoIndex, setPromoIndex] = useState(0);
  const promoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sanityClient.fetch<Post[]>(postsQuery).then((data) => setPosts(data?.slice(0, 3) ?? []));
  }, []);

  // Auto-advance promo carousel
  useEffect(() => {
    if (promotions.length < 2) return;
    promoTimerRef.current = setInterval(() => setPromoIndex((i) => (i + 1) % promotions.length), 5000);
    return () => { if (promoTimerRef.current) clearInterval(promoTimerRef.current); };
  }, [promotions.length]);

  const promoNext = () => {
    if (promoTimerRef.current) clearInterval(promoTimerRef.current);
    setPromoIndex((i) => (i + 1) % promotions.length);
  };
  const promoPrev = () => {
    if (promoTimerRef.current) clearInterval(promoTimerRef.current);
    setPromoIndex((i) => (i - 1 + promotions.length) % promotions.length);
  };

  const allCarsPreview = cars.slice(0, 6);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-10 lg:gap-14 items-center">

            {/* ── Left: copy ── */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-8">
                <HomeIcon className="w-3.5 h-3.5" />
                Dịch vụ xe cho cư dân đô thị Hà Nội
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Không cần sở hữu xe<br />
                <span className="text-brand-600">vẫn luôn có xe dùng</span>
              </h1>

              <p className="text-gray-600 text-lg sm:text-xl mb-3 leading-relaxed">
                Thuê xe ngày hoặc theo tháng —{' '}
                <span className="text-gray-900 font-semibold">giao tận sảnh tòa nhà</span>
              </p>
              <p className="text-gray-500 text-sm mb-10">
                Vinhomes · Ecopark · The Manor · Linh Đàm · Xe điện VinFast · Đặt qua Zalo 5 phút
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-600 text-white font-bold text-base rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200"
                >
                  <MessageCircle className="w-5 h-5" />
                  Đặt xe qua Zalo
                </a>
                <Link
                  to="/xe"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-800 font-semibold text-base rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Car className="w-5 h-5" />
                  Xem tất cả xe
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                {['Giao xe tận tòa nhà', 'Bảo hiểm đầy đủ', 'Hoàn cọc ngay khi trả xe'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: live fleet preview ── */}
            <div className="hidden lg:flex flex-col gap-3 w-[400px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Xe sẵn sàng hôm nay</span>
                <Link to="/xe" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                  Xem tất cả <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {cars.filter(c => c.price > 0).slice(0, 2).map(car => (
                <Link
                  key={car.id}
                  to={`/xe/${car.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex"
                >
                  <div className="w-28 shrink-0 bg-gray-100">
                    <img src={car.images[0]} alt={car.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-gray-900 leading-tight">{car.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{car.seats} chỗ · {car.fuel}</div>
                      </div>
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">Sẵn sàng</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-bold text-brand-600">{Math.round(car.price / 1000)}k</span>
                      <span className="text-xs text-gray-400">/ngày</span>
                    </div>
                  </div>
                </Link>
              ))}

              <Link
                to="/xe"
                className="bg-brand-50 border border-brand-100 rounded-2xl p-3.5 flex items-center justify-between hover:bg-brand-100/60 transition-colors"
              >
                <div className="flex -space-x-2">
                  {cars.filter(c => c.price > 0).slice(2, 6).map((car, i) => (
                    <div key={car.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100" style={{ zIndex: 4 - i }}>
                      <img src={car.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold text-brand-700">
                  +{Math.max(0, cars.filter(c => c.price > 0).length - 2)} xe khác
                </span>
                <ArrowRight className="w-4 h-4 text-brand-600" />
              </Link>
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
                <div className="text-3xl sm:text-4xl font-bold text-brand-600 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESIDENTIAL AREAS ────────────────────────────────── */}
      <section className="py-20 px-4 bg-brand-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-200 font-semibold text-sm uppercase tracking-wide mb-2">Khu vực phục vụ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Sống tại chung cư?<br />CarMatch có mặt ngay tại tòa nhà bạn
            </h2>
            <p className="text-brand-100 max-w-2xl mx-auto text-lg">
              Không cần chỗ đỗ xe. Không lo bảo dưỡng. CarMatch giao xe tận sảnh — bạn chỉ cần cầm chìa khóa và lên đường.
            </p>
          </div>

          {/* Buildings grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-14">
            {residentialAreas.map((area) => (
              <div key={area.name} className="bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-brand-300 rounded-full shrink-0" />
                  <span className="text-white font-semibold text-sm">{area.name}</span>
                </div>
                <span className="text-brand-200 text-xs pl-4">{area.area}</span>
              </div>
            ))}
            {/* More coming */}
            <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 flex items-center justify-center">
              <span className="text-brand-200 text-sm text-center">Và nhiều khu đô thị khác...</span>
            </div>
          </div>

          {/* 3 resident value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: MapPin, title: 'Giao xe tận sảnh', desc: 'CarMatch giao xe đến tòa nhà bạn — không cần ra ngoài đón xe.' },
              { icon: Car, title: 'Xe theo ngày hoặc tháng', desc: 'Dùng dịp cuối tuần, hoặc đăng ký cố định hàng tháng tiết kiệm hơn 30%.' },
              { icon: Shield, title: 'Không lo sở hữu xe', desc: 'Không phí bảo dưỡng, không lo chỗ đỗ, không mất giá theo năm.' },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 rounded-2xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-brand-100 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-brand-200 text-sm mb-4">Cư dân tòa nhà bạn đã có CarMatch chưa?</p>
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Nhắn Zalo để đặt xe
            </a>
          </div>
        </div>
      </section>

      {/* ── FLEET PREVIEW ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Đội xe CarMatch</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Chọn xe phù hợp với bạn</h2>
              <p className="text-gray-500">Xe điện, xe xăng, xe 7 chỗ — đa dạng cho mọi nhu cầu</p>
            </div>
            <Link
              to="/xe"
              className="hidden sm:flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-colors font-semibold text-sm"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {allCarsPreview.map((car) => (
              <CarCard key={car.id} car={car} />
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

      {/* ── PROMO BANNERS ─────────────────────────────────────── */}
      {promotions.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Khuyến mãi</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ưu đãi đang chạy</h2>
              </div>
              <div className="flex items-center gap-2">
                {promotions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPromoIndex(i)}
                    className={`rounded-full transition-all ${i === promoIndex ? 'w-6 h-2 bg-brand-600' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: 3-column grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-5">
              {promotions.map((promo) => {
                const isExternal = promo.link_url?.startsWith('http');
                const cardContent = (
                  <div className="relative rounded-2xl overflow-hidden group cursor-pointer aspect-[16/9]">
                    <img
                      src={promo.image_url}
                      alt={promo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {promo.badge_text && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">
                        {promo.badge_text}
                      </span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-base leading-snug mb-1">{promo.title}</h3>
                      {promo.subtitle && (
                        <p className="text-white/80 text-xs leading-relaxed line-clamp-2">{promo.subtitle}</p>
                      )}
                    </div>
                  </div>
                );
                return promo.link_url ? (
                  isExternal ? (
                    <a key={promo.id} href={promo.link_url} target="_blank" rel="noopener noreferrer">{cardContent}</a>
                  ) : (
                    <Link key={promo.id} to={promo.link_url}>{cardContent}</Link>
                  )
                ) : (
                  <div key={promo.id}>{cardContent}</div>
                );
              })}
            </div>

            {/* Mobile: single-card carousel */}
            <div className="md:hidden relative">
              {(() => {
                const promo = promotions[promoIndex];
                if (!promo) return null;
                const isExternal = promo.link_url?.startsWith('http');
                const cardContent = (
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/9]">
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {promo.badge_text && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">
                        {promo.badge_text}
                      </span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-bold text-lg leading-snug mb-1">{promo.title}</h3>
                      {promo.subtitle && <p className="text-white/80 text-sm">{promo.subtitle}</p>}
                    </div>
                  </div>
                );
                return (
                  <>
                    {promo.link_url ? (
                      isExternal ? (
                        <a href={promo.link_url} target="_blank" rel="noopener noreferrer">{cardContent}</a>
                      ) : (
                        <Link to={promo.link_url}>{cardContent}</Link>
                      )
                    ) : cardContent}
                    {promotions.length > 1 && (
                      <>
                        <button onClick={promoPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={promoNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY CARMATCH ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Tại sao chọn CarMatch?</p>
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
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-brand-600" />
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
          <div className="bg-brand-600 rounded-3xl p-10 lg:p-14 overflow-hidden relative">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-semibold mb-5">
                  <HomeIcon className="w-3.5 h-3.5" />
                  Cư dân & Doanh nghiệp
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Xe theo tháng — dùng nhiều, giá càng tốt
                </h2>
                <p className="text-brand-100 text-lg mb-6 leading-relaxed">
                  Cư dân chung cư hay doanh nghiệp — gói tháng tiết kiệm{' '}
                  <span className="text-white font-bold">30–40%</span> so với thuê ngày lẻ. Xe giao tận nơi, hợp đồng rõ ràng.
                </p>
                <ul className="space-y-2 text-sm text-brand-100 mb-8">
                  {[
                    'Từ 18.000.000đ/xe/tháng',
                    'Giao xe tận tòa nhà hoặc văn phòng',
                    'Hóa đơn VAT — doanh nghiệp thanh toán dễ',
                    'Giảm thêm khi thuê ≥3 xe hoặc ≥3 tháng',
                  ].map((item) => (
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
                  className="px-8 py-4 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors text-center whitespace-nowrap shadow-sm"
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
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Quy trình</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Thuê xe dễ dàng 3 bước</h2>
            <p className="text-gray-500">Từ lúc nhắn tin đến lúc cầm chìa khóa, chỉ mất 30 phút</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-brand-200">
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200 text-lg"
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
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Đánh giá</p>
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
                role: 'Cư dân Vinhomes Ocean Park',
                text: 'Sống ở Ocean Park không có xe riêng nhưng có CarMatch là ổn. Nhắn Zalo tối hôm trước, sáng hôm sau xe đã đỗ dưới sảnh. Dùng được 6 tháng rồi, rất tiện.',
                rating: 5,
              },
              {
                name: 'Chị Lan',
                role: 'Cư dân Ecopark',
                text: 'Thuê Carnival 7 chỗ đưa cả gia đình về quê dịp Tết. Xe mới, sạch, giao tận cổng khu. Nhân viên nhiệt tình, giá hợp lý hơn nhiều chỗ khác.',
                rating: 5,
              },
              {
                name: 'Anh Tuấn',
                role: 'Cư dân The Manor Central Park',
                text: 'Đăng ký thuê VF6 theo tháng cho vợ đi làm. Tiết kiệm hơn mua xe hẳn, không lo bảo dưỡng, không cần tìm chỗ đỗ. Đã gia hạn tháng thứ 4 rồi.',
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
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Blog</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Kinh nghiệm & Mẹo hay</h2>
                <p className="text-gray-500">Hướng dẫn, lộ trình, kinh nghiệm thuê xe từ CarMatch</p>
              </div>
              <Link
                to="/blog"
                className="hidden sm:flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-colors font-semibold text-sm"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Editorial layout: left = 2 small stacked, right = 1 large hero */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 lg:h-[520px]">

              {/* Left column: 2 small posts */}
              <div className="flex flex-col gap-5 h-full">
                {posts.slice(1, 3).map((post, i) => (
                  <Link
                    key={post._id}
                    to={`/blog/${post.slug.current}`}
                    className="group relative rounded-2xl overflow-hidden flex-1 min-h-[200px] bg-gray-200"
                  >
                    <img
                      src={blogImage(post, i + 1)}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                    <div className="relative p-5 h-full flex flex-col justify-end">
                      {post.categories?.[0] && (
                        <span className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
                          {post.categories[0]}
                        </span>
                      )}
                      <h3 className="text-white font-bold text-base leading-snug group-hover:text-brand-200 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-white/60 text-xs">
                          {new Date(post.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:text-brand-300 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right column: 1 large featured post */}
              {posts[0] && (
                <Link
                  to={`/blog/${posts[0].slug.current}`}
                  className="group relative rounded-2xl overflow-hidden min-h-[420px] lg:h-full bg-gray-200"
                >
                  <img
                    src={blogImage(posts[0], 0)}
                    alt={posts[0].title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  {/* Featured badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full">
                      ✦ Nổi bật
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    {posts[0].categories?.[0] && (
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-3 block">
                        {posts[0].categories[0]}
                      </span>
                    )}
                    <h3 className="text-white font-bold text-2xl sm:text-3xl leading-snug mb-3 group-hover:text-brand-200 transition-colors">
                      {posts[0].title}
                    </h3>
                    {posts[0].excerpt && (
                      <p className="text-white/75 text-sm leading-relaxed mb-4 line-clamp-2">{posts[0].excerpt}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-sm">
                        {new Date(posts[0].publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      <span className="text-white/40">·</span>
                      <span className="text-white text-sm font-semibold flex items-center gap-1.5 group-hover:text-brand-300 transition-colors">
                        Đọc bài <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
              >
                Xem tất cả bài viết <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CAR OWNER PARTNERSHIP ─────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white/90 rounded-full text-xs font-semibold mb-6">
                <Key className="w-3.5 h-3.5" />
                Dành cho chủ xe
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Xe đang nằm một chỗ?<br />
                <span className="text-brand-400">Hãy để xe sinh lời</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Gửi xe vào đội CarMatch — chúng tôi lo toàn bộ từ vận hành, bảo dưỡng, bảo hiểm đến tìm khách. Bạn chỉ cần nhận doanh thu hàng tháng.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  'Thu nhập thụ động từ 10–25 triệu/xe/tháng',
                  'CarMatch chịu trách nhiệm toàn bộ vận hành',
                  'Xe được bảo hiểm & bảo dưỡng định kỳ',
                  'Báo cáo doanh thu minh bạch theo tháng',
                  'Rút xe lại bất cứ lúc nào — không ràng buộc dài hạn',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-300 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/hop-tac"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-lg"
                >
                  Tìm hiểu hợp tác ngay
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://zalo.me/0975563290"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hỏi qua Zalo
                </a>
              </div>
            </div>

            {/* Right: stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '10–25M', label: 'Thu nhập/xe/tháng', icon: '💰' },
                { value: '100%', label: 'CarMatch lo vận hành', icon: '🔧' },
                { value: '48h', label: 'Onboard xe vào đội', icon: '⚡' },
                { value: '0đ', label: 'Chi phí tham gia ban đầu', icon: '🎁' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                  <span className="text-2xl mb-3 block">{stat.icon}</span>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-xs leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DỊCH VỤ SẮP CÓ ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-5">
              <Zap className="w-4 h-4" />
              Sắp ra mắt
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Dịch vụ sắp có tại CarMatch</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              CarMatch đang mở rộng thành nền tảng xe toàn diện cho cư dân đô thị Hà Nội.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: '✈️',
                label: 'Đưa đón sân bay',
                desc: 'Đặt lịch trước, xe đón tận nơi, cố định giá — không lo tắc đường hay mặc cả.',
                tag: 'Tháng 7/2026',
              },
              {
                icon: '👨‍✈️',
                label: 'Xe có tài xế',
                desc: 'Tài xế chuyên nghiệp theo giờ hoặc ngày. Phù hợp hội họp, sự kiện, đi công tác.',
                tag: 'Tháng 8/2026',
              },
              {
                icon: '🔑',
                label: 'Gói thuê tuần',
                desc: 'Linh hoạt 3–7 ngày. Giá tốt hơn thuê ngày lẻ, không cần cam kết dài hạn.',
                tag: 'Sắp ra mắt',
              },
              {
                icon: '🔋',
                label: 'Trạm sạc xe điện',
                desc: 'Hỗ trợ cư dân tòa nhà sạc VF5, VF6, VF8 ngay tầng hầm theo đăng ký.',
                tag: 'Đang khảo sát',
              },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all relative overflow-hidden">
                <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-600 rounded-full">
                  {item.tag}
                </span>
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-gray-900 font-semibold mb-2">{item.label}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-8">
            Muốn được thông báo sớm?{' '}
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-medium">
              Nhắn Zalo để đăng ký trước
            </a>
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-br from-brand-50 to-brand-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5">
            Cư dân của bạn đặt xe chưa?
          </h2>
          <p className="text-gray-600 text-xl mb-10">
            Nhắn Zalo ngay — CarMatch giao xe tận sảnh trong 30 phút
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-brand-600 text-white font-bold text-xl rounded-full hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
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
