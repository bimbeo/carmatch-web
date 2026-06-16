import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, CheckCircle2, MessageCircle, Zap, Shield, Clock, MapPin, Home as HomeIcon, Car, ChevronLeft, ChevronRight, Key, FileText, RefreshCw, Share2, CalendarDays, Search, Users } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { usePromotions } from '@/hooks/usePromotions';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackVehicleClick, trackZaloClick } from '@/lib/analytics';
import { vehicleImageAlt } from '@/lib/imageAlt';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';

const ZALO_LINK = 'https://zalo.me/0975563290';
const SITE_URL = 'https://www.carmatch.vn/';

const stats = [
  { value: '20+', label: 'Mẫu xe', note: 'Xe 5 chỗ, 7 chỗ, xe điện', icon: Car },
  { value: '7h-22h', label: 'Hỗ trợ mỗi ngày', note: 'Tư vấn và xử lý phát sinh', icon: Clock },
  { value: 'Từ 600K', label: 'Giá thuê/ngày', note: 'Xe điện đô thị đến MPV 7 chỗ gia đình', icon: Zap },
  { value: '30 phút', label: 'Xác nhận lịch', note: 'Kiểm tra xe trống và báo giá qua Zalo', icon: CalendarDays },
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

const quickSearchAreas = [
  'Vinhomes Ocean Park',
  'Vinhomes Times City',
  'Vinhomes Smart City',
  'The Manor Central Park',
  'Ecopark',
  'Linh Đàm',
];

const quickSearchSeats = [
  { value: '', label: 'Số chỗ' },
  { value: '5', label: '5 chỗ' },
  { value: '7', label: '7 chỗ' },
  { value: '8+', label: '8+ chỗ' },
];

const quickSearchFuel = [
  { value: '', label: 'Nhiên liệu' },
  { value: 'Điện', label: 'Xe điện' },
  { value: 'Xăng', label: 'Xe xăng' },
  { value: 'Dầu', label: 'Xe dầu' },
];

const features = [
  {
    icon: Shield,
    title: 'Kiểm tra xe trước chuyến',
    desc: 'Hai bên ghi nhận ngoại thất, nội thất, nhiên liệu/pin, km và phụ kiện khi bàn giao.',
  },
  {
    icon: MapPin,
    title: 'Giao xe tận sảnh',
    desc: 'Ưu tiên chung cư, văn phòng hoặc điểm hẹn phù hợp tại Hà Nội theo lịch đã xác nhận.',
  },
  {
    icon: Key,
    title: 'Báo rõ cọc và phụ phí',
    desc: 'Giá thuê, phí giao nhận, điều kiện cọc và lịch xe được xác nhận trước khi khách chốt.',
  },
  {
    icon: Clock,
    title: 'Hỗ trợ 7h – 22h mỗi ngày',
    desc: 'Có người hỗ trợ khi cần tư vấn lịch thuê, nhận xe hoặc xử lý phát sinh trong ngày.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Gửi nhu cầu thuê xe',
    desc: 'Chọn mẫu xe, ngày nhận/trả và khu vực nhận xe; nếu chưa chắc, bạn có thể nhắn Zalo để được gợi ý mẫu phù hợp.',
  },
  {
    step: '02',
    title: 'Kiểm tra lịch và đặt cọc',
    desc: 'Bạn được xác nhận xe còn trống, giá thuê, phụ phí giao nhận và khoản cọc cần chuyển để giữ lịch.',
  },
  {
    step: '03',
    title: 'Nhận xe và ký bàn giao',
    desc: 'Mang CCCD và GPLX bản gốc, kiểm tra tình trạng xe, nhiên liệu/pin, số km và phụ kiện trước khi lên đường.',
  },
];

const quickFacts = [
  {
    label: 'Giá thuê',
    value: 'Từ 600.000đ/ngày',
    note: 'Giá thay đổi theo mẫu xe, số ngày thuê, điểm giao nhận và thời điểm đặt.',
  },
  {
    label: 'Khu vực nhận xe',
    value: 'Hà Nội và một số khu đô thị lân cận',
    note: 'Phù hợp nhất khi nhận tại chung cư, văn phòng hoặc điểm hẹn đã xác nhận.',
  },
  {
    label: 'Giấy tờ cần có',
    value: 'CCCD và GPLX hạng B còn hạn',
    note: 'Mang bản gốc khi nhận xe để đối chiếu và ký biên bản bàn giao.',
  },
  {
    label: 'Đặt cọc',
    value: 'Cọc giữ lịch trước khi nhận xe',
    note: 'Khoản cọc và điều kiện hoàn/hủy được xác nhận theo từng mẫu xe và lịch thuê.',
  },
];

const homeFaqs = [
  {
    question: 'Ai phù hợp với dịch vụ thuê xe tự lái này?',
    answer: 'Dịch vụ phù hợp nếu bạn ở Hà Nội, không muốn sở hữu xe thường xuyên nhưng vẫn cần xe cho cuối tuần, về quê, đi tỉnh, công tác hoặc thuê theo tháng. Bạn có thể nhận xe tại sảnh tòa nhà, xem trước điều kiện thuê và được hỗ trợ khi phát sinh trong chuyến đi.',
  },
  {
    question: 'Có thể nhận xe tận nơi ở Hà Nội không?',
    answer: 'Có. Bạn có thể hẹn nhận xe tại sảnh chung cư, văn phòng hoặc điểm hẹn phù hợp trong khu vực Hà Nội. Các khu vực thường được khách hỏi gồm Vinhomes Ocean Park, Times City, Smart City, Royal City, Ecopark, The Manor Central Park và Linh Đàm.',
  },
  {
    question: 'Cần chuẩn bị giấy tờ gì khi nhận xe?',
    answer: 'Bạn cần CCCD bản gốc và giấy phép lái xe hạng B còn hiệu lực. Khi nhận xe, nên kiểm tra ngoại thất, nội thất, mức pin/xăng, số km và phụ kiện để biên bản bàn giao rõ ràng ngay từ đầu.',
  },
  {
    question: 'Nếu hủy chuyến hoặc trả xe muộn thì xử lý thế nào?',
    answer: 'Điều kiện hủy, hoàn cọc và phụ phí trả muộn phụ thuộc vào thời điểm hủy, giờ trả xe và tình trạng xe khi hoàn trả. Bạn nên đọc trang chính sách trước khi đặt, hoặc nhắn Zalo để xác nhận điều kiện cụ thể theo mẫu xe và lịch thuê.',
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

export default function Home() {
  const navigate = useNavigate();

  useSEO({
    title: 'Thuê Xe Tự Lái Hà Nội — Giao Xe Tận Sảnh | Car Match',
    description: 'Thuê xe tự lái Hà Nội từ 600K/ngày. Giao xe tận sảnh Vinhomes, Ecopark, The Manor. Xác nhận 30 phút, đặt qua Zalo. 20+ mẫu xe + xe điện VinFast.',
    canonical: 'https://www.carmatch.vn/',
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const { cars } = useVehicles();
  const { promotions } = usePromotions();
  const [promoIndex, setPromoIndex] = useState(0);
  const promoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [quickSeats, setQuickSeats] = useState('');
  const [quickFuel, setQuickFuel] = useState('');
  const [quickFromDate, setQuickFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [quickToDate, setQuickToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const data = await fetchPostList('/api/posts');
        if (!cancelled) setPosts(data.slice(0, 3));
      } catch {
        try {
          const data = await fetchPostList('/data/blog-posts.json');
          if (!cancelled) setPosts(data.slice(0, 3));
        } catch {
          if (!cancelled) setPosts([]);
        }
      }
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
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

  const totalVehicleHint =
    typeof window !== 'undefined'
      ? window.__CM_TOTAL_VEHICLES__
      : globalThis.__CM_TOTAL_VEHICLES__;
  const readyCars = cars.filter((car) => car.price > 0);
  const allCarsPreview = cars.slice(0, 6);
  const totalCars = Math.max(cars.length, totalVehicleHint ?? 0);

  const quickSearchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (quickSeats) params.set('seatFilter', quickSeats);
    if (quickFuel) params.set('fuelFilter', quickFuel);
    if (quickFromDate) params.set('from', quickFromDate);
    if (quickToDate) params.set('to', quickToDate);
    const query = params.toString();
    return query ? `/xe?${query}` : '/xe';
  }, [quickSeats, quickFuel, quickFromDate, quickToDate]);

  const handleQuickSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    trackCtaClick('home_quick_search_submit', {
      target_path: quickSearchHref,
      seats: quickSeats || undefined,
      fuel: quickFuel || undefined,
      date_from: quickFromDate || undefined,
      date_to: quickToDate || undefined,
    });
    navigate(quickSearchHref);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-24 text-gray-900 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="home" />
      <main id="main-content">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50">
        <div className="absolute top-0 right-0 w-[600px] max-w-full h-[600px] bg-brand-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-10 lg:gap-14 items-center">

            {/* ── Left: copy ── */}
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-8">
                <HomeIcon className="w-3.5 h-3.5" />
                <span className="truncate">Dịch vụ xe cho cư dân đô thị Hà Nội</span>
              </div>

              <h1 className="cm-mobile-safe-width sm:max-w-none text-[1.875rem] min-[430px]:text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Không cần sở hữu xe
                <br />
                <span className="text-brand-600">vẫn luôn có xe dùng</span>
              </h1>

              <p className="cm-mobile-safe-width sm:max-w-none text-gray-600 text-lg sm:text-xl mb-3 leading-relaxed">
                Thuê xe ngày hoặc theo tháng —{' '}
                <span className="text-gray-900 font-semibold">giao tận sảnh tòa nhà</span>
              </p>
              <p className="cm-mobile-safe-width sm:max-w-none text-gray-500 text-sm mb-10 leading-relaxed">
                Vinhomes · Ecopark · The Manor · Linh Đàm · Xe điện VinFast · Kiểm tra lịch qua Zalo
              </p>

              <div className="cm-mobile-safe-width sm:max-w-none flex flex-col sm:flex-row gap-3">
                <Link
                  to="/xe"
                  onClick={() => trackCtaClick('home_hero_book_now', { target_path: '/xe' })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-3.5 bg-brand-600 text-white font-bold text-base rounded-full hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-200"
                  data-cta="home-hero-book"
                >
                  <Car className="w-5 h-5" />
                  Đặt xe ngay
                </Link>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('home_hero')}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-800 font-semibold text-base rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                  data-cta="home-hero-zalo"
                >
                  <MessageCircle className="w-5 h-5" />
                  Đặt xe qua Zalo<span className="sr-only"> trong phần giới thiệu</span>
                </a>
                <Link
                  to="/lap-ke-hoach-chuyen-di"
                  onClick={() => trackCtaClick('home_hero_trip_planner', { target_path: '/lap-ke-hoach-chuyen-di' })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-3.5 bg-white text-gray-800 font-semibold text-base rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                  data-cta="home-hero-trip-planner"
                >
                  <Zap className="w-5 h-5" />
                  Lập chuyến đi
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                {['Giao xe tận tòa nhà', 'Kiểm tra xe khi bàn giao', 'Báo cọc/phụ phí trước khi chốt'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: live fleet preview ── */}
            <div className="hidden lg:flex flex-col gap-3 w-[400px] min-h-[312px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Gợi ý xe tự lái</span>
                <Link to="/xe" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                  Xem toàn bộ đội xe <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {readyCars.length === 0 ? (
                <>
                  {[0, 1].map((item) => (
                    <div
                      key={item}
                      className="h-[96px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
                    >
                      <div className="w-28 shrink-0 bg-gray-100" />
                      <div className="flex-1 p-3.5">
                        <div className="h-4 w-36 bg-gray-100 rounded-full" />
                        <div className="h-3 w-20 bg-gray-100 rounded-full mt-2" />
                        <div className="h-4 w-16 bg-brand-50 rounded-full mt-4" />
                      </div>
                    </div>
                  ))}
                </>
              ) : readyCars.slice(0, 2).map((car) => (
                <Link
                  key={car.id}
                  to={`/xe/${car.slug}`}
                  onClick={() => trackVehicleClick('home_ready_card_click', {
                    source: 'home_hero_ready_cars',
                    vehicle_id: car.id,
                    vehicle_slug: car.slug,
                    vehicle_name: car.name,
                    vehicle_price: car.price,
                  })}
                  className="h-[96px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex"
                >
                  <div className="w-28 shrink-0 bg-gray-100">
                    <img
                      src={optimizedImageUrl(car.images[0], 320)}
                      srcSet={optimizedImageSrcSet(car.images[0], [224, 320], 62)}
                      sizes="112px"
                      alt={vehicleImageAlt(car, 'đang sẵn sàng cho thuê hôm nay tại Car Match')}
                      className="w-full h-full object-cover"
                      width={112}
                      height={96}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <div className="flex-1 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm text-gray-900 leading-tight">{car.name}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{car.seats} chỗ · {car.fuel}</div>
                      </div>
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">Có thể thuê</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-bold text-brand-600">{Math.round(car.price / 1000)}k</span>
                      <span className="text-xs text-gray-600">/ngày</span>
                    </div>
                  </div>
                </Link>
              ))}

              <Link
                to="/xe"
                onClick={() => trackCtaClick('home_ready_more_cars', { target_path: '/xe' })}
                className="h-[60px] bg-brand-50 border border-brand-100 rounded-2xl p-3.5 flex items-center justify-between hover:bg-brand-100/60 transition-colors"
              >
                <div className="flex -space-x-2">
                  {readyCars.slice(2, 6).map((car, i) => (
                    <div key={car.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100" style={{ zIndex: 4 - i }}>
                      <img
                        src={optimizedImageUrl(car.images[0], 96)}
                        srcSet={optimizedImageSrcSet(car.images[0], [64, 96], 62)}
                        sizes="32px"
                        alt={vehicleImageAlt(car, 'trong đội xe tự lái Car Match')}
                        className="w-full h-full object-cover"
                        width={32}
                        height={32}
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold text-brand-700">
                  +{Math.max(0, totalCars - 2)} xe khác
                </span>
                <ArrowRight className="w-4 h-4 text-brand-600" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="px-4 py-8 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group flex min-h-[132px] flex-col gap-3 rounded-[8px] border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/40 sm:min-h-[112px] sm:flex-row sm:items-start sm:gap-4 sm:p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-brand-50 text-brand-600 group-hover:bg-white sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="break-words text-xl font-black leading-none tracking-tight text-brand-700 sm:text-3xl">{stat.value}</div>
                    <div className="mt-2 text-[13px] font-bold text-gray-900 sm:text-sm">{stat.label}</div>
                    <div className="mt-1 text-[11px] font-medium leading-5 text-gray-500 sm:text-xs">{stat.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── QUICK SEARCH / CONVERSION SURFACE ─────────────────── */}
      <section id="tim-xe-nhanh" className="px-4 py-10 bg-gray-50 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Tìm xe nhanh</p>
              <h2 id="tim-xe-tu-lai-theo-lich" className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                Lọc xe theo lịch, khu vực nhận và số chỗ
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Chọn nhu cầu cơ bản để xem đội xe phù hợp hơn. Car Match vẫn kiểm tra lại xe trống và chi phí qua Zalo trước khi chốt.
              </p>
            </div>
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('home_quick_search_header_zalo')}
              className="hidden items-center justify-center gap-2 rounded-[8px] border border-brand-200 bg-white px-4 py-3 text-sm font-black text-brand-700 transition-colors hover:bg-brand-50 sm:inline-flex"
              data-cta="home-quick-search-header-zalo"
            >
              <MessageCircle className="h-4 w-4" />
              Nhờ Car Match lọc xe
            </a>
          </div>

          <form
            onSubmit={handleQuickSearch}
            className="rounded-[8px] border border-gray-200 bg-white p-3 shadow-sm sm:p-4"
            aria-label="Tìm xe tự lái nhanh"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[0.75fr_0.85fr_1fr_1fr_auto]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-gray-500">Số chỗ</span>
                <select
                  value={quickSeats}
                  onChange={(event) => setQuickSeats(event.target.value)}
                  className="h-11 w-full rounded-[8px] border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:h-12"
                >
                  {quickSearchSeats.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-gray-500">Nhiên liệu</span>
                <select
                  value={quickFuel}
                  onChange={(event) => setQuickFuel(event.target.value)}
                  className="h-11 w-full rounded-[8px] border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:h-12"
                >
                  {quickSearchFuel.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-gray-500">Ngày nhận</span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={quickFromDate}
                    onChange={(event) => setQuickFromDate(event.target.value)}
                    className="h-11 w-full rounded-[8px] border border-gray-200 bg-white pl-9 pr-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:h-12"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-gray-500">Ngày trả</span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={quickToDate}
                    onChange={(event) => setQuickToDate(event.target.value)}
                    className="h-11 w-full rounded-[8px] border border-gray-200 bg-white pl-9 pr-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:h-12"
                    aria-label="Ngày trả xe"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-[8px] bg-brand-600 px-5 text-sm font-black text-white transition-colors hover:bg-brand-700 sm:h-12 md:col-span-2 xl:col-span-1"
                data-cta="home-quick-search"
              >
                <Search className="h-4 w-4" />
                Tìm xe
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="hidden flex-wrap gap-2 sm:flex">
                {['Giao tận sảnh', 'Báo cọc trước', 'Kiểm tra xe trống qua Zalo'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
                    {item}
                  </span>
                ))}
              </div>
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackZaloClick('home_quick_search_zalo')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-black text-brand-700 transition-colors hover:bg-brand-100 sm:w-auto"
                data-cta="home-quick-search-zalo"
              >
                <Users className="h-4 w-4" />
                Chưa chắc chọn xe nào? Nhắn Zalo
              </a>
            </div>
          </form>
        </div>
      </section>

      {/* ── DIRECT ANSWER / GEO SUMMARY ───────────────────────── */}
      <section id="tom-tat-thue-xe" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1.05fr_1.4fr] gap-8 lg:gap-12 items-start">
            <div>
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Thông tin cần biết</p>
              <h2 id="thue-xe-tu-lai-ha-noi-can-biet-gi" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Trước khi thuê xe tự lái ở Hà Nội, bạn cần biết gì?
              </h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                Bạn nên kiểm tra trước giá thuê theo ngày, khu vực nhận xe, giấy tờ cần mang theo, khoản cọc và phí giao nhận. Với lịch cụ thể, bạn sẽ được xác nhận lại mẫu xe còn trống, giá cuối cùng và thời gian bàn giao qua Zalo trước khi giữ xe.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Thông tin nhanh về thuê xe tự lái Car Match tại Hà Nội</caption>
                <tbody className="divide-y divide-gray-100">
                  {quickFacts.map((fact) => (
                    <tr key={fact.label} className="align-top">
                      <th scope="row" className="w-32 bg-gray-50 px-4 py-4 font-bold text-gray-900 sm:w-40">
                        {fact.label}
                      </th>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">{fact.value}</p>
                        <p className="mt-1 text-gray-600">{fact.note}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESIDENTIAL AREAS ────────────────────────────────── */}
      <section className="py-20 px-4 bg-brand-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-200 font-semibold text-sm uppercase tracking-wide mb-2">Khu vực phục vụ</p>
            <h2 id="khu-vuc-giao-xe" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Sống tại chung cư?<br />Bạn có thể nhận xe ngay tại sảnh
            </h2>
            <p className="text-brand-100 max-w-2xl mx-auto text-lg">
              Không cần sở hữu xe, không lo chỗ đỗ hay bảo dưỡng. Bạn chọn lịch, xác nhận điểm nhận xe và cầm chìa khóa khi bàn giao xong.
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
              { icon: MapPin, title: 'Nhận xe tận sảnh', desc: 'Hẹn điểm nhận tại tòa nhà hoặc văn phòng, hạn chế phải di chuyển xa để lấy xe.' },
              { icon: Car, title: 'Xe theo ngày hoặc tháng', desc: 'Dùng dịp cuối tuần, hoặc đăng ký cố định hàng tháng để kiểm soát chi phí tốt hơn.' },
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
            <p className="text-brand-200 text-sm mb-4">Bạn muốn nhận xe ở khu vực nào?</p>
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('home_residential_section')}
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
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Đội xe Car Match</p>
              <h2 id="chon-xe-tu-lai-phu-hop" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Chọn xe phù hợp với bạn</h2>
              <p className="text-gray-500">Xe điện, xe xăng, xe 7 chỗ — đa dạng cho mọi nhu cầu</p>
            </div>
            <Link
              to="/xe"
              onClick={() => trackCtaClick('home_fleet_header_all', { target_path: '/xe' })}
              className="hidden sm:flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-colors font-semibold text-sm"
            >
              Xem đội xe đầy đủ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {allCarsPreview.map((car) => (
              <CarCard key={car.id} car={car} source="home_fleet_preview" />
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/xe"
              onClick={() => trackCtaClick('home_fleet_all', { target_path: '/xe', vehicle_count: totalCars })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium shadow-sm"
              data-cta="home-fleet-all"
            >
              Xem tất cả {totalCars} mẫu xe
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
                <h2 id="uu-dai-thue-xe" className="text-2xl sm:text-3xl font-bold text-gray-900">Ưu đãi đang chạy</h2>
              </div>
              <div className="flex items-center gap-2">
                {promotions.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPromoIndex(i)}
                    aria-label={`Hiển thị khuyến mãi ${i + 1}`}
                    aria-pressed={i === promoIndex}
                    className="w-11 h-11 flex items-center justify-center rounded-full"
                  >
                    <span className={`block rounded-full transition-all ${i === promoIndex ? 'w-6 h-2 bg-brand-600' : 'w-2 h-2 bg-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: 3-column grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-5">
              {promotions.map((promo, index) => {
                const isExternal = promo.link_url?.startsWith('http');
                const cardContent = (
                  <div className="relative rounded-2xl overflow-hidden group cursor-pointer aspect-[16/9]">
                    <img
                      src={optimizedImageUrl(promo.image_url, 480, 58)}
                      srcSet={optimizedImageSrcSet(promo.image_url, [480, 720], 58)}
                      sizes="(min-width: 768px) 33vw, 100vw"
                      alt={`Ưu đãi Car Match ${index + 1}: ${[promo.title, promo.badge_text, promo.subtitle].filter(Boolean).join(' - ')}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={720}
                      height={405}
                      loading="lazy"
                      decoding="async"
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
                    <img
                      src={optimizedImageUrl(promo.image_url, 480, 58)}
                      srcSet={optimizedImageSrcSet(promo.image_url, [480, 720], 58)}
                      sizes="100vw"
                      alt={`Ưu đãi Car Match: ${[promo.title, promo.badge_text, promo.subtitle].filter(Boolean).join(' - ')}`}
                      className="w-full h-full object-cover"
                      width={720}
                      height={405}
                      loading="lazy"
                      decoding="async"
                    />
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
                        <button type="button" onClick={promoPrev} aria-label="Khuyến mãi trước" className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={promoNext} aria-label="Khuyến mãi tiếp theo" className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm">
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

      {/* ── WHY CAR MATCH ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Tại sao chọn Car Match?</p>
            <h2 id="ly-do-chon-car-match" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Dịch vụ đáng tin cậy từ ngày đầu
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Trước khi chốt xe, bạn nên biết rõ lịch trống, giấy tờ, cọc, phí giao nhận và cách bàn giao.
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

      {/* ── MONTHLY RENTAL TEASER ─────────────────────────────── */}
      <section className="py-12 px-4 bg-gray-50 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.25fr] lg:items-start">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                <CalendarDays className="h-3.5 w-3.5" />
                Thuê xe tháng
              </div>
              <h2 id="thue-xe-theo-thang" className="mt-5 text-3xl font-black leading-tight text-gray-900 sm:text-4xl">
                Cần xe dùng đều đặn mỗi tuần?
              </h2>
              <p className="mt-4 text-base leading-8 text-gray-600 sm:text-lg">
                Nếu bạn cần xe đi làm, gặp khách, đưa gia đình đi lại hoặc dùng cho đội nhóm, gói tháng giúp chi phí dễ dự tính hơn so với thuê từng ngày lẻ.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/thue-xe-thang"
                  onClick={() => trackCtaClick('home_monthly_package', { target_path: '/thue-xe-thang' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-brand-700"
                  data-cta="home-monthly-package"
                >
                  Xem gói thuê tháng
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('home_monthly_advice')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-black text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
                  data-cta="home-monthly-zalo"
                >
                  <MessageCircle className="h-4 w-4" />
                  Nhắn Zalo để báo giá
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Car,
                  label: 'Giá tham khảo',
                  value: 'Từ 10 triệu/xe/tháng',
                  desc: 'Tùy mẫu xe, số tháng thuê và lịch giao nhận thực tế.',
                },
                {
                  icon: MapPin,
                  label: 'Điểm nhận xe',
                  value: 'Chung cư hoặc văn phòng',
                  desc: 'Hẹn điểm nhận cố định để tiết kiệm thời gian mỗi lần dùng xe.',
                },
                {
                  icon: FileText,
                  label: 'Chi phí rõ ràng',
                  value: 'Thuê, cọc, phụ phí',
                  desc: 'Các khoản chính được xác nhận trước khi giữ lịch.',
                },
                {
                  icon: Users,
                  label: 'Nhu cầu linh hoạt',
                  value: 'Một xe hoặc nhiều xe',
                  desc: 'Phù hợp cá nhân dùng dài ngày hoặc đội nhóm cần xe đều đặn.',
                },
              ].map(({ icon: Icon, label, value, desc }) => (
                <div key={label} className="rounded-[8px] border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[8px] bg-brand-50 text-brand-600 sm:mb-4 sm:h-10 sm:w-10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-gray-500 sm:text-xs">{label}</p>
                  <h3 className="mt-2 text-base font-black leading-snug text-gray-900 sm:text-lg">{value}</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-600 sm:text-sm sm:leading-6">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-gray-200 pt-5 md:grid-cols-3">
            {[
              'Chọn mẫu xe, số tháng và khu vực nhận xe',
              'Xác nhận giá, cọc, phụ phí và lịch bàn giao',
              'Nhận xe, ký biên bản và dùng theo lịch đã chốt',
            ].map((item, index) => (
              <div key={item} className="flex items-start gap-3 rounded-[8px] bg-white px-3 py-3 ring-1 ring-gray-200 sm:px-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Quy trình</p>
            <h2 id="quy-trinh-thue-xe" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Thuê xe dễ dàng 3 bước</h2>
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
              onClick={() => trackZaloClick('home_how_it_works')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200 text-lg"
              data-cta="home-process-zalo"
            >
              <MessageCircle className="w-5 h-5" />
              Bắt đầu ngay qua Zalo
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ / TRUST POLICY ───────────────────────────────── */}
      <section id="faq-thue-xe-tu-lai" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Câu hỏi thường gặp</p>
            <h2 id="cau-hoi-thuong-gap-thue-xe" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Thuê xe tự lái cần đặt cọc và giấy tờ gì?
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              Các câu trả lời dưới đây tóm tắt những điều nên kiểm tra trước khi đặt xe. Với từng mẫu xe cụ thể, bạn sẽ được xác nhận lại giá, lịch trống, điểm giao nhận và điều kiện cọc qua Zalo trước khi chốt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {homeFaqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{faq.answer}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm leading-relaxed text-amber-900">
                Chính sách hủy, hoàn cọc, phụ phí trả muộn và trách nhiệm khi phát sinh sự cố được ghi riêng tại trang chính sách.
              </p>
            </div>
            <Link
              to="/chinh-sach"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-amber-900 shadow-sm ring-1 ring-amber-200"
            >
              Xem chính sách
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ─────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Tín hiệu tin cậy</p>
            <h2 id="kiem-tra-truoc-khi-chot-xe" className="text-3xl font-bold text-gray-900 mb-3">
              Trước khi chốt xe, bạn cần biết rõ những gì?
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Đừng chỉ xem giá. Trước khi đặt, bạn nên kiểm tra những điểm có thể ảnh hưởng trực tiếp đến chi phí, thời gian nhận xe và trách nhiệm khi trả xe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: 'Lịch xe thật',
                desc: 'Gửi ngày nhận/trả và khu vực nhận xe để kiểm tra đúng mẫu xe còn trống theo lịch thực tế.',
              },
              {
                icon: FileText,
                title: 'Giấy tờ và cọc rõ ràng',
                desc: 'Yêu cầu CCCD, GPLX hạng B, điều kiện đặt cọc và phụ phí được xác nhận trước khi giữ xe.',
              },
              {
                icon: RefreshCw,
                title: 'Bàn giao hai chiều',
                desc: 'Hai bên kiểm tra tình trạng xe, nhiên liệu/pin, km và phụ kiện khi nhận xe và khi trả xe.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/chinh-sach"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
            >
              Xem điều kiện thuê xe
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('home_trust_zalo')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
            >
              <MessageCircle className="h-4 w-4" />
              Nhắn Zalo kiểm tra xe
            </a>
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
                <h2 id="kinh-nghiem-thue-xe" className="text-3xl font-bold text-gray-900 mb-2">Kinh nghiệm & Mẹo hay</h2>
                <p className="text-gray-500">Hướng dẫn, lộ trình, kinh nghiệm thuê xe từ Car Match</p>
              </div>
              <a
                href="/blog"
                className="hidden sm:flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-colors font-semibold text-sm"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Editorial layout: left = 2 small stacked, right = 1 large hero */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 lg:h-[520px]">

              {/* Left column: 2 small posts */}
              <div className="flex flex-col gap-5 h-full">
                {posts.slice(1, 3).map((post, i) => (
                  <a
                    key={post._id}
                    href={`/blog/${post.slug.current}`}
                    className="group relative rounded-2xl overflow-hidden flex-1 min-h-[200px] bg-gray-200"
                  >
                    <img
                      src={optimizedImageUrl(blogImage(post, i + 1), 800)}
                      srcSet={optimizedImageSrcSet(blogImage(post, i + 1), [480, 720, 960], 62)}
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={960}
                      height={540}
                      loading="lazy"
                      decoding="async"
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
                  </a>
                ))}
              </div>

              {/* Right column: 1 large featured post */}
              {posts[0] && (
                <a
                  href={`/blog/${posts[0].slug.current}`}
                  className="group relative rounded-2xl overflow-hidden min-h-[420px] lg:h-full bg-gray-200"
                >
                  <img
                    src={optimizedImageUrl(blogImage(posts[0], 0), 1200)}
                    srcSet={optimizedImageSrcSet(blogImage(posts[0], 0), [720, 960, 1200], 62)}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    alt={posts[0].title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    width={1200}
                    height={675}
                    loading="lazy"
                    decoding="async"
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
                </a>
              )}
            </div>

            <div className="text-center mt-8">
              <a
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
              >
                Xem tất cả bài viết <ArrowRight className="w-4 h-4" />
              </a>
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
              <h2 id="hop-tac-chu-xe" className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Xe đang nằm một chỗ?<br />
                <span className="text-brand-400">Gửi thông tin để Car Match thẩm định</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Chủ xe tại Hà Nội có thể gửi thông tin xe, lịch rảnh và khu vực đỗ. Car Match sẽ đánh giá phương án khai thác, điều kiện vận hành và cách đối soát doanh thu phù hợp.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  'Ước tính doanh thu theo mẫu xe và lịch khai thác',
                  'Car Match hỗ trợ điều phối vận hành theo hợp đồng',
                  'Điều kiện bảo hiểm và bảo dưỡng được thống nhất trước',
                  'Báo cáo doanh thu minh bạch theo kỳ đối soát',
                  'Thời hạn hợp tác và điều kiện rút xe ghi rõ trong hợp đồng',
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
                  data-cta="home-owner-partner"
                >
                  Tìm hiểu hợp tác ngay
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://zalo.me/0975563290"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
                  data-cta="home-owner-zalo"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hỏi qua Zalo
                </a>
              </div>
            </div>

            {/* Right: stat cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'Theo xe', label: 'Ước tính doanh thu', icon: '💰' },
                { value: 'Hợp đồng', label: 'Điều kiện vận hành', icon: '🔧' },
                { value: 'Thẩm định', label: 'Kiểm tra xe trước hợp tác', icon: '⚡' },
                { value: '0đ', label: 'Chi phí gửi thông tin ban đầu', icon: '🎁' },
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
            <h2 id="dich-vu-sap-co" className="text-3xl font-bold text-gray-900 mb-3">Dịch vụ sắp có tại Car Match</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Car Match đang mở rộng thành nền tảng xe toàn diện cho cư dân đô thị Hà Nội.
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
          <p className="text-center text-gray-600 text-sm mt-8">
            Muốn được thông báo sớm?{' '}
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('home_early_access')} className="text-brand-600 hover:underline font-medium">
              Nhắn Zalo để đăng ký trước
            </a>
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-br from-brand-50 to-brand-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="dat-xe-car-match" className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5">
            Bạn cần xe cho cuối tuần hay đi công tác?
          </h2>
          <p className="text-gray-600 text-xl mb-10">
            Chọn xe online hoặc nhắn Zalo để được xác nhận lịch trống, giá thuê và điểm nhận xe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('home_final_cta')}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-brand-600 text-white font-bold text-xl rounded-full hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
              data-cta="home-final-zalo"
            >
              <MessageCircle className="w-6 h-6" />
              Đặt xe qua Zalo<span className="sr-only"> ở cuối trang</span>
            </a>
            <Link
              to="/xe"
              onClick={() => trackCtaClick('home_final_fleet', { target_path: '/xe' })}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-gray-800 font-semibold text-xl rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              data-cta="home-final-fleet"
            >
              Xem fleet xe
            </Link>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            Zalo: <span className="text-gray-600">0975 563 290</span> · Phản hồi 7h–22h
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-gray-700">
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              data-share="facebook"
            >
              Facebook
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent('Car Match - thuê xe tự lái Hà Nội')}&body=${encodeURIComponent(SITE_URL)}`}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              data-share="email"
            >
              Email
            </a>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
