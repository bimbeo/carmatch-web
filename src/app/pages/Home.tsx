import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, CheckCircle2, MessageCircle, Zap, Clock, MapPin, Home as HomeIcon, Car, ChevronDown, ChevronLeft, ChevronRight, Key, FileText, CalendarDays, Search, Users, X } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { usePromotions } from '@/hooks/usePromotions';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackVehicleClick, trackZaloClick } from '@/lib/analytics';
import { vehicleImageAlt } from '@/lib/imageAlt';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';
import { formatPrice, type Car as CarModel } from '@/data/cars';
import { wave2LocalRentalAreas } from '@/data/localRentalExpansionAreas';
import {
  calculateRentalBillingDays,
  DEFAULT_PICKUP_HOUR,
  DEFAULT_RETURN_HOUR,
} from '@/lib/rentalDuration';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import HomeReviews from '../components/HomeReviews';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';

const ZALO_LINK = 'https://zalo.me/0971163290';

// ── Date picker helpers ───────────────────────────────────────
const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const TIME_SLOTS = ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

function parseDateStr(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatShortDate(s: string): string {
  const d = parseDateStr(s);
  if (!d) return '';
  return `${DAY_NAMES[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}
function defaultQuickDateRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() + 1);
  const date = toDateStr(from);
  return { from: date, to: date };
}
function createQuickSearchHref({
  seats,
  fuel,
  from,
  to,
  pickupHour,
  returnHour,
}: {
  seats: string;
  fuel: string;
  from: string;
  to: string;
  pickupHour: number;
  returnHour: number;
}) {
  const params = new URLSearchParams();
  if (seats) params.set('seatFilter', seats);
  if (fuel) params.set('fuelFilter', fuel);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('pickupHour', String(pickupHour));
  params.set('returnHour', String(returnHour));
  const query = params.toString();
  return query ? `/xe?${query}` : '/xe';
}
const stats = [
  { value: '20+', label: 'Mẫu xe', note: 'Xe 5 chỗ, 7 chỗ, xe điện', icon: Car },
  { value: '7h-22h', label: 'Hỗ trợ mỗi ngày', note: 'Tư vấn và xử lý phát sinh', icon: Clock },
  { value: 'Từ 600K', label: 'Giá thuê/ngày', note: 'Xe điện đô thị đến MPV 7 chỗ gia đình', icon: Zap },
  { value: 'Theo lịch', label: 'Kiểm tra xe', note: 'Đối chiếu xe trước khi xác nhận booking', icon: CalendarDays },
];

const residentialAreas = [
  { name: 'Vinhomes Ocean Park', area: 'Gia Lâm', href: '/thue-xe-tu-lai-vinhomes-ocean-park' },
  { name: 'Vinhomes Times City', area: 'Hai Bà Trưng', href: '/thue-xe-tu-lai-times-city' },
  { name: 'Vinhomes Smart City', area: 'Nam Từ Liêm', href: '/thue-xe-tu-lai-vinhomes-smart-city' },
  { name: 'Ecopark', area: 'Văn Giang, Hưng Yên', href: '/thue-xe-tu-lai-ecopark' },
  { name: 'The Manor Central Park', area: 'Hoàng Mai', href: '/thue-xe-tu-lai-the-manor' },
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

const howItWorks = [
  {
    step: '01',
    title: 'Chọn xe và lịch thuê',
    desc: 'Xem mẫu xe, thời gian thuê và tổng giá dự kiến trên web.',
  },
  {
    step: '02',
    title: 'Xác nhận và giữ xe',
    desc: 'Car Match xác nhận lịch, cọc và phụ phí trước khi giữ xe.',
  },
  {
    step: '03',
    title: 'Nhận xe và ký bàn giao',
    desc: 'Đối chiếu giấy tờ, kiểm tra xe và ký biên bản bàn giao.',
  },
];

const quickFacts = [
  {
    label: 'Giá thuê',
    value: 'Từ 600.000đ/ngày',
    note: 'Tùy mẫu xe, lịch thuê và điểm giao nhận.',
  },
  {
    label: 'Khu vực nhận xe',
    value: 'Hà Nội và một số khu đô thị lân cận',
    note: 'Điểm hẹn được xác nhận theo lịch.',
  },
  {
    label: 'Giấy tờ cần có',
    value: 'CCCD và GPLX hạng B còn hạn',
    note: 'Mang bản gốc để đối chiếu khi nhận xe.',
  },
  {
    label: 'Đặt cọc',
    value: 'Cọc giữ lịch trước khi nhận xe',
    note: 'Mức cọc và điều kiện hủy/hoàn theo xe và lịch.',
  },
];

interface HomePricingRow {
  label: string;
  price: string;
  note: string;
  href: string;
  linkLabel: string;
}

function lowestPositivePrice(cars: CarModel[], pick: (car: CarModel) => number | undefined) {
  const values = cars.map(pick).filter((value): value is number => typeof value === 'number' && value > 0);
  return values.length > 0 ? Math.min(...values) : undefined;
}

function startingPrice(value: number | undefined, unit: 'ngày' | 'tháng') {
  return value ? `Từ ${formatPrice(value)}/${unit}` : 'Chọn lịch để xem giá';
}

function buildHomePricingRows(cars: CarModel[]): HomePricingRow[] {
  const pricedCars = cars.filter((car) => car.price > 0);
  const electricCars = pricedCars.filter((car) => car.fuel === 'Điện');
  const fiveSeatCars = pricedCars.filter((car) => car.seats <= 5);
  const familyCars = pricedCars.filter((car) => car.seats >= 7);

  return [
    {
      label: 'Xe điện đô thị',
      price: startingPrice(lowestPositivePrice(electricCars, (car) => car.price), 'ngày'),
      note: 'Phù hợp đi phố, đi làm và trải nghiệm xe điện VinFast.',
      href: '/xe?fuelFilter=%C4%90i%E1%BB%87n',
      linkLabel: 'Xem xe điện',
    },
    {
      label: 'Xe 5 chỗ',
      price: startingPrice(lowestPositivePrice(fiveSeatCars, (car) => car.price), 'ngày'),
      note: 'Dành cho cá nhân, cặp đôi hoặc gia đình nhỏ đi ngắn ngày.',
      href: '/xe?seatFilter=5',
      linkLabel: 'Xem xe 5 chỗ',
    },
    {
      label: 'Xe 7 chỗ và MPV',
      price: startingPrice(lowestPositivePrice(familyCars, (car) => car.price), 'ngày'),
      note: 'Phù hợp gia đình đông người, đi tỉnh hoặc có nhiều hành lý.',
      href: '/xe?seatFilter=7',
      linkLabel: 'Xem xe 7 chỗ',
    },
    {
      label: 'Thuê xe theo tháng',
      price: startingPrice(lowestPositivePrice(pricedCars, (car) => car.priceMonth) ?? 10_000_000, 'tháng'),
      note: 'Giá phụ thuộc mẫu xe, số tháng thuê và lịch giao nhận thực tế.',
      href: '/thue-xe-thang',
      linkLabel: 'Xem gói thuê tháng',
    },
  ];
}

const priorityCommercialLinks = [
  { label: 'Thuê Kia Carnival tại Hà Nội', href: '/xe/kia-carnival' },
  { label: 'Thuê VinFast VF3', href: '/xe/vinfast-vf3-2024' },
  { label: 'Bảng giá thuê xe Hà Nội', href: '/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu' },
  { label: 'Kinh nghiệm thuê xe tự lái', href: '/blog/kinh-nghiem-thue-xe-tu-lai-ha-noi' },
];

const homeFaqs = [
  {
    question: 'Thuê xe tự lái Car Match giá bao nhiêu?',
    answer: 'Giá từ 600.000đ/ngày và được công khai theo từng xe. Chọn ngày nhận/trả để xem tổng giá dự kiến theo lịch.',
  },
  {
    question: 'Có thể nhận xe tận nơi ở Hà Nội không?',
    answer: 'Có. Bạn có thể hẹn nhận tại chung cư, văn phòng hoặc điểm phù hợp ở Hà Nội. Phí và thời gian giao nhận được xác nhận theo lịch.',
  },
  {
    question: 'Cần chuẩn bị giấy tờ gì khi nhận xe?',
    answer: 'CCCD bản gốc và GPLX hạng B còn hiệu lực. Hai bên kiểm tra xe, pin/xăng, số km và phụ kiện khi bàn giao.',
  },
  {
    question: 'Nếu hủy chuyến hoặc trả xe muộn thì xử lý thế nào?',
    answer: 'Điều kiện hủy, hoàn cọc và trả muộn phụ thuộc mẫu xe và lịch thuê. Chi tiết được xác nhận trước khi giữ xe.',
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
    description: 'Thuê xe tự lái Hà Nội từ 600K/ngày. Chọn lịch, xem tổng giá và đặt trực tiếp trên website. Giao xe tận sảnh Vinhomes, Ecopark, The Manor.',
    canonical: 'https://www.carmatch.vn/',
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const { cars } = useVehicles();
  const { promotions } = usePromotions();
  const [promoIndex, setPromoIndex] = useState(0);
  const promoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [quickSeats, setQuickSeats] = useState('');
  const [quickFuel, setQuickFuel] = useState('');
  const [quickFromDate, setQuickFromDate] = useState('');
  const [quickToDate, setQuickToDate] = useState('');
  const [quickFromTime, setQuickFromTime] = useState(`${String(DEFAULT_PICKUP_HOUR).padStart(2, '0')}:00`);
  const [quickToTime, setQuickToTime] = useState(`${String(DEFAULT_RETURN_HOUR).padStart(2, '0')}:00`);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonthOffset, setCalMonthOffset] = useState(0);
  const [pickStep, setPickStep] = useState<'from' | 'to'>('from');

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
  const homePricingRows = useMemo(() => buildHomePricingRows(cars), [cars]);

  const quickPickupHour = Number(quickFromTime.slice(0, 2));
  const quickReturnHour = Number(quickToTime.slice(0, 2));
  const rentalDays = useMemo(
    () => Math.max(1, Math.ceil(calculateRentalBillingDays(
      quickFromDate,
      quickPickupHour,
      quickToDate,
      quickReturnHour,
    ))),
    [quickFromDate, quickPickupHour, quickReturnHour, quickToDate],
  );

  const hasQuickDateRange = Boolean(quickFromDate && quickToDate);
  const resolveQuickDateRange = () => {
    const fallback = defaultQuickDateRange();
    const from = quickFromDate || fallback.from;
    return {
      from,
      to: quickToDate || from,
    };
  };
  const openQuickCalendar = () => {
    const fallback = defaultQuickDateRange();
    const from = quickFromDate || fallback.from;
    setQuickFromDate(from);
    setQuickToDate(quickToDate || from);
    setShowCalendar(true);
    setPickStep('from');
  };

  const calViewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + calMonthOffset);
    return d;
  }, [calMonthOffset]);

  const calNextViewDate = useMemo(() => {
    const d = new Date(calViewDate);
    d.setMonth(d.getMonth() + 1);
    return d;
  }, [calViewDate]);

  const handleDayClick = (dateStr: string) => {
    if (pickStep === 'from') {
      setQuickFromDate(dateStr);
      const from = parseDateStr(dateStr)!;
      const to = parseDateStr(quickToDate);
      if (!to || from > to) {
        setQuickToDate(dateStr);
      }
      setPickStep('to');
    } else {
      const fromDate = quickFromDate || defaultQuickDateRange().from;
      if (dateStr < fromDate) {
        setQuickToDate(fromDate);
        setQuickFromDate(dateStr);
      } else {
        setQuickToDate(dateStr);
      }
      setPickStep('from');
    }
  };

  const renderCalendarGrid = (year: number, month: number) => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Monday-first: (Sun=0 → index 6, Mon=1 → index 0)
    const rawFirst = new Date(year, month, 1).getDay();
    const firstOffset = (rawFirst + 6) % 7;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const fromDate = parseDateStr(quickFromDate);
    const toDate = parseDateStr(quickToDate);

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    return (
      <div key={`${year}-${month}`}>
        <p className="text-center text-sm font-bold text-gray-700 mb-3">
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-1">
          {['T2','T3','T4','T5','T6','T7','CN'].map((d) => (
            <span key={d} className="py-1">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center">
          {cells.map((day, i) => {
            if (!day) return <span key={i} />;
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const ds = toDateStr(date);
            const isPast = date < today;
            const isFrom = ds === quickFromDate;
            const isTo = ds === quickToDate;
            const isInRange = fromDate && toDate && date > fromDate && date < toDate;
            return (
              <button
                key={i}
                type="button"
                disabled={isPast}
                onClick={() => handleDayClick(ds)}
                className={[
                  'text-sm py-1.5 mx-0.5 my-0.5 rounded-full transition-colors',
                  isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                  isFrom || isTo
                    ? 'bg-brand-600 text-white font-bold'
                    : isInRange
                      ? 'bg-brand-100 text-brand-700 rounded-none'
                      : isPast ? '' : 'hover:bg-brand-50 text-gray-700',
                ].join(' ')}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleQuickSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dates = resolveQuickDateRange();
    const targetPath = createQuickSearchHref({
      seats: quickSeats,
      fuel: quickFuel,
      from: dates.from,
      to: dates.to,
      pickupHour: quickPickupHour,
      returnHour: quickReturnHour,
    });
    trackCtaClick('home_quick_search_submit', {
      target_path: targetPath,
      seats: quickSeats || undefined,
      fuel: quickFuel || undefined,
      date_from: dates.from,
      date_to: dates.to,
    });
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-24 text-gray-900 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar
        source="home"
        primaryKind="direct"
        primaryHref="/xe"
        primaryLabel="Đặt xe"
      />
      <main id="main-content">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50">
        <div className="absolute top-0 right-0 w-[600px] max-w-full h-[600px] bg-brand-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-10 lg:gap-14 items-center">

            {/* ── Left: copy ── */}
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-5">
                <HomeIcon className="w-3.5 h-3.5" />
                <span className="truncate">Thuê xe tự lái tại Hà Nội</span>
              </div>

              <h1 className="cm-mobile-safe-width sm:max-w-none text-[1.875rem] min-[430px]:text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
                Thuê xe tự lái Hà Nội
                <br />
                <span className="text-brand-600">giao tận sảnh theo lịch hẹn</span>
              </h1>

              <p className="cm-mobile-safe-width sm:max-w-none text-gray-600 text-lg sm:text-xl mb-3 leading-relaxed">
                Chọn xe, ngày nhận/trả và xem tổng giá trước khi đặt.{' '}
                <span className="text-gray-900 font-semibold">Có xe điện, xe 5–7 chỗ và gói thuê tháng.</span>
              </p>
              <p className="cm-mobile-safe-width sm:max-w-none text-gray-500 text-sm mb-7 leading-relaxed">
                Giao nhận tại Ocean Park, Smart City, Times City, Ecopark và The Manor theo lịch đã xác nhận.
              </p>

              <div className="cm-mobile-safe-width sm:max-w-none flex flex-col sm:flex-row gap-3">
                <Link
                  to="/xe"
                  onClick={() => trackCtaClick('home_hero_book_now', { target_path: '/xe' })}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-3.5 bg-brand-600 text-white font-bold text-base rounded-full hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-200"
                  data-cta="home-hero-book"
                >
                  <Car className="w-5 h-5" />
                  Chọn xe
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
                  Hỏi qua Zalo<span className="sr-only"> trong phần giới thiệu</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                {['Giao tận nơi', 'Kiểm tra khi bàn giao', 'Báo cọc và phụ phí trước'].map((t) => (
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
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gợi ý xe tự lái</span>
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
      <section className="px-4 py-5 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40 sm:p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-brand-50 text-brand-600 group-hover:bg-white sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="break-words text-lg font-black leading-none tracking-tight text-brand-700 sm:text-2xl">{stat.value}</div>
                    <div className="mt-1 text-xs font-bold text-gray-700 sm:text-sm">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── QUICK SEARCH / CONVERSION SURFACE ─────────────────── */}
      <section id="tim-xe-nhanh" className="px-4 py-10 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-brand-600 font-semibold text-sm uppercase tracking-widest mb-2">Tìm xe nhanh</p>
          <h2 id="tim-xe-tu-lai-theo-lich" className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-7">
            Chọn lịch và xem xe phù hợp
          </h2>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* ── Tabs ── */}
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                className="flex-1 py-3.5 text-sm font-bold text-brand-600 border-b-2 border-brand-600 flex items-center justify-center gap-2"
              >
                <Car className="w-4 h-4" />
                Thuê theo ngày
              </button>
              <Link
                to="/thue-xe-thang"
                onClick={() => trackCtaClick('home_search_tab_monthly', { target_path: '/thue-xe-thang' })}
                className="flex-1 py-3.5 text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                Thuê xe tháng
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleQuickSearch} className="p-4 sm:p-5" aria-label="Tìm xe tự lái nhanh">
              {/* Date/time trigger */}
              <button
                type="button"
                onClick={openQuickCalendar}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left hover:border-brand-400 hover:bg-brand-50/30 transition-colors mb-3 group"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5 group-hover:text-brand-500">
                  Thời gian thuê
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-sm text-gray-800">
                    {quickFromDate ? `${quickFromTime} ${formatShortDate(quickFromDate)}` : 'Ngày nhận xe'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="font-semibold text-sm text-gray-800">
                    {quickToDate ? `${quickToTime} ${formatShortDate(quickToDate)}` : 'Ngày trả xe'}
                  </span>
                  <span className="ml-auto bg-brand-50 text-brand-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {hasQuickDateRange ? `${rentalDays} ngày` : 'Chọn lịch'}
                  </span>
                </div>
              </button>

              {/* Filters + submit */}
              <div className="flex gap-2 sm:gap-3">
                <select
                  value={quickSeats}
                  onChange={(e) => setQuickSeats(e.target.value)}
                  aria-label="Số chỗ"
                  className="flex-1 h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {quickSearchSeats.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={quickFuel}
                  onChange={(e) => setQuickFuel(e.target.value)}
                  aria-label="Nhiên liệu"
                  className="flex-1 h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {quickSearchFuel.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="flex-shrink-0 h-12 px-5 sm:px-6 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors inline-flex items-center gap-2"
                  data-cta="home-quick-search"
                  aria-label="Tìm xe"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Tìm xe</span>
                </button>
              </div>

              {/* Trust + Zalo */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                  Tổng giá hiển thị trước khi đặt
                </span>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('home_quick_search_zalo')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline flex-shrink-0"
                  data-cta="home-quick-search-zalo"
                >
                  <Users className="w-4 h-4" />
                  Chưa chắc? Nhắn Zalo
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* ── CALENDAR MODAL ── */}
        {showCalendar && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCalendar(false); }}
          >
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Thời gian thuê</h3>
                  <p className="text-xs text-brand-600 font-semibold mt-0.5">
                    {pickStep === 'from' ? '→ Chọn ngày nhận xe' : '→ Chọn ngày trả xe'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Calendar body (scrollable) */}
              <div className="overflow-y-auto flex-1">
                {/* Month nav */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setCalMonthOffset((o) => Math.max(0, o - 1))}
                    disabled={calMonthOffset === 0}
                    className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-sm font-semibold text-gray-500 select-none">
                    {MONTH_NAMES[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                    {' — '}
                    {MONTH_NAMES[calNextViewDate.getMonth()]} {calNextViewDate.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalMonthOffset((o) => o + 1)}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Dual calendar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 px-4 pb-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  <div className="py-3 sm:py-2 sm:pr-4">
                    {renderCalendarGrid(calViewDate.getFullYear(), calViewDate.getMonth())}
                  </div>
                  <div className="py-3 sm:py-2 sm:pl-4">
                    {renderCalendarGrid(calNextViewDate.getFullYear(), calNextViewDate.getMonth())}
                  </div>
                </div>

                {/* Time selectors */}
                <div className="px-5 py-4 border-t border-gray-100">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Giờ nhận xe</label>
                      <select
                        value={quickFromTime}
                        onChange={(e) => setQuickFromTime(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      >
                        {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mb-3" />
                    <div className="flex-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Giờ trả xe</label>
                      <select
                        value={quickToTime}
                        onChange={(e) => setQuickToTime(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      >
                        {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky footer CTA */}
              <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-4 bg-white">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {quickFromTime} {formatShortDate(quickFromDate)} → {quickToTime} {formatShortDate(quickToDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Thời gian thuê:{' '}
                    <span className="font-bold text-brand-600">{rentalDays} ngày</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const dates = resolveQuickDateRange();
                    const targetPath = createQuickSearchHref({
                      seats: quickSeats,
                      fuel: quickFuel,
                      from: dates.from,
                      to: dates.to,
                      pickupHour: quickPickupHour,
                      returnHour: quickReturnHour,
                    });
                    setShowCalendar(false);
                    trackCtaClick('home_calendar_confirm', { target_path: targetPath });
                    navigate(targetPath);
                  }}
                  className="flex-shrink-0 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors inline-flex items-center gap-2"
                >
                  Tìm xe
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── DIRECT ANSWER / GEO SUMMARY ───────────────────────── */}
      <section id="tom-tat-thue-xe" className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1.05fr_1.4fr] gap-8 lg:gap-12 items-start">
            <div>
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Thông tin cần biết</p>
              <h2 id="thue-xe-tu-lai-ha-noi-can-biet-gi" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Thuê xe tự lái Hà Nội: thông tin nhanh
              </h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                Xem trước giá, điểm nhận xe, giấy tờ và khoản cọc. Chọn lịch cụ thể để kiểm tra xe trống và tổng giá dự kiến.
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
                        <p className="mt-1 text-gray-500">{fact.note}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE PRICE GUIDE / PRIORITY INTERNAL LINKS ───────── */}
      <section id="bang-gia-thue-xe-ha-noi" className="bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">Giá theo đội xe hiện có</p>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Bảng giá thuê xe tự lái Hà Nội theo nhu cầu</h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Giá tham khảo lấy từ đội xe đang công khai. Tổng giá được tính sau khi bạn chọn lịch và điểm giao nhận.
              </p>
            </div>
            <Link
              to="/xe"
              onClick={() => trackCtaClick('home_price_guide_fleet', { target_path: '/xe' })}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700"
            >
              Chọn lịch để xem tổng giá
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Bảng giá tham khảo thuê xe tự lái tại Hà Nội theo loại xe</caption>
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-bold sm:px-6">Nhu cầu</th>
                  <th className="px-4 py-3 font-bold sm:px-6">Giá tham khảo</th>
                  <th className="hidden px-6 py-3 font-bold md:table-cell">Phù hợp với</th>
                  <th className="px-4 py-3 text-right font-bold sm:px-6">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {homePricingRows.map((row) => (
                  <tr key={row.label} className="align-top">
                    <th scope="row" className="px-4 py-4 font-bold text-gray-900 sm:px-6">{row.label}</th>
                    <td className="px-4 py-4 font-semibold text-brand-700 sm:px-6">{row.price}</td>
                    <td className="hidden px-6 py-4 leading-relaxed text-gray-600 md:table-cell">{row.note}</td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <Link to={row.href} className="font-bold text-brand-600 hover:underline">
                        {row.linkLabel}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Giá tham khảo chưa bao gồm ưu đãi hoặc khoản giao nhận có thể phát sinh. Chọn ngày thuê để xem xe phù hợp và tổng giá dự kiến.
          </p>

          <nav aria-label="Các trang thuê xe được quan tâm" className="mt-8 flex flex-wrap gap-3">
            {priorityCommercialLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-brand-200 hover:text-brand-700"
              >
                {item.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* ── RESIDENTIAL AREAS ────────────────────────────────── */}
      <section className="py-14 px-4 bg-brand-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-brand-200 font-semibold text-sm uppercase tracking-wide mb-2">Khu vực phục vụ</p>
            <h2 id="khu-vuc-giao-xe" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Giao nhận xe tại Hà Nội và khu đô thị lân cận
            </h2>
            <p className="text-brand-100 max-w-2xl mx-auto">
              Điểm hẹn, thời gian và phí giao nhận được xác nhận theo xe và lịch thuê.
            </p>
          </div>

          {/* Buildings grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {residentialAreas.map((area) => (
              <Link key={area.name} to={area.href} className="bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-4 border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-brand-300 rounded-full shrink-0" />
                  <span className="text-white font-semibold text-sm">{area.name}</span>
                </div>
                <span className="text-brand-200 text-xs pl-4">{area.area}</span>
              </Link>
            ))}
          </div>

          <details className="group mb-8 rounded-2xl border border-white/15 bg-white/10">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-white marker:content-none">
              12 khu vực Hà Nội đang tiếp nhận yêu cầu
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <nav aria-label="Trang thuê xe theo khu vực Hà Nội" className="grid gap-2 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {wave2LocalRentalAreas.map((area) => (
                <Link key={area.path} to={area.path} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20">
                  {area.shortName}
                </Link>
              ))}
            </nav>
          </details>

          {/* CTA */}
          <div className="text-center">
            <p className="text-brand-200 text-sm mb-4">Chưa thấy điểm nhận xe của bạn trong danh sách?</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/xe"
                onClick={() => trackCtaClick('home_residential_fleet', { target_path: '/xe' })}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-700 font-bold rounded-full hover:bg-brand-50 transition-colors shadow-lg"
              >
                <Car className="w-5 h-5" />
                Chọn xe
              </Link>
              <Link
                to="/lien-he"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 font-bold text-white hover:bg-white/10"
              >
                Hỏi khu vực giao xe
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLEET PREVIEW ─────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Đội xe Car Match</p>
              <h2 id="chon-xe-tu-lai-phu-hop" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Chọn xe theo nhu cầu</h2>
              <p className="text-gray-500">Xe điện, xe 5 chỗ, 7 chỗ và MPV.</p>
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
            {allCarsPreview.map((car, index) => (
              <div key={car.id} className={index >= 3 ? 'hidden sm:block' : undefined}>
                <CarCard car={car} source="home_fleet_preview" />
              </div>
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

      {/* ── MONTHLY RENTAL TEASER ─────────────────────────────── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.25fr] lg:items-start">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                <CalendarDays className="h-3.5 w-3.5" />
                Thuê xe tháng
              </div>
              <h2 id="thue-xe-theo-thang" className="mt-4 text-3xl font-black leading-tight text-gray-900 sm:text-4xl">
                Cần xe dùng dài ngày?
              </h2>
              <p className="mt-3 text-base leading-7 text-gray-600">
                Gói tháng phù hợp nhu cầu đi làm, gặp khách hoặc dùng xe thường xuyên với chi phí dễ dự tính.
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
                  desc: 'Tùy mẫu xe và thời hạn thuê.',
                },
                {
                  icon: MapPin,
                  label: 'Điểm nhận xe',
                  value: 'Theo điểm hẹn',
                  desc: 'Chung cư, văn phòng hoặc điểm phù hợp.',
                },
                {
                  icon: FileText,
                  label: 'Chi phí rõ ràng',
                  value: 'Thuê, cọc, phụ phí',
                  desc: 'Xác nhận trước khi giữ lịch.',
                },
                {
                  icon: Users,
                  label: 'Nhu cầu linh hoạt',
                  value: 'Cá nhân hoặc đội nhóm',
                  desc: 'Tùy nhu cầu sử dụng thực tế.',
                },
              ].map(({ icon: Icon, label, value, desc }) => (
                <div key={label} className="rounded-[8px] border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[8px] bg-brand-50 text-brand-600 sm:mb-4 sm:h-10 sm:w-10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-gray-500 sm:text-xs">{label}</p>
                  <h3 className="mt-2 text-base font-black leading-snug text-gray-900 sm:text-lg">{value}</h3>
                  <p className="mt-2 text-xs leading-5 text-gray-600 sm:text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-9">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Quy trình</p>
            <h2 id="quy-trinh-thue-xe" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Đặt xe trong 3 bước</h2>
            <p className="text-gray-500">Chọn lịch, xác nhận chi phí và nhận xe.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {howItWorks.map((step, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left">
                <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-sm">{step.step}</span>
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/xe"
              onClick={() => trackCtaClick('home_how_it_works', { target_path: '/xe' })}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200"
              data-cta="home-process-direct-booking"
            >
              <Car className="w-5 h-5" />
              Chọn xe và xem lịch
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ / TRUST POLICY ───────────────────────────────── */}
      <section id="faq-thue-xe-tu-lai" className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-8">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Câu hỏi thường gặp</p>
            <h2 id="cau-hoi-thuong-gap-thue-xe" className="text-3xl sm:text-4xl font-bold text-gray-900">
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="space-y-3">
            {homeFaqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-gray-200 bg-gray-50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-gray-900 marker:content-none">
                  {faq.question}
                  <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="border-t border-gray-200 px-5 py-4 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
              </details>
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

      {/* ── TẾT 2027 ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-red-50 via-white to-amber-50" aria-labelledby="tet-2027-title">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-10">
            <p className="text-red-600 font-semibold text-sm uppercase tracking-wide mb-2">Kế hoạch Tết 2027</p>
            <h2 id="tet-2027-title" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Thuê xe đi Tết hoặc đưa xe nhàn rỗi vào hợp tác
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              Khách thuê nên gửi ngày nhận–trả, số người, hành lý và tuyến đi. Chủ xe nên gửi mẫu xe, khu vực đỗ và lịch rảnh để Car Match thẩm định phương án phù hợp; việc gửi thông tin chưa phải cam kết còn xe hoặc doanh thu.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-red-100 bg-white p-7 shadow-sm">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <CalendarDays className="h-6 w-6" />
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Cần thuê xe tự lái dịp Tết?</h3>
              <p className="text-sm leading-7 text-gray-600 mb-6">
                Xem cách chọn xe theo số người, hành lý, quãng đường; kiểm tra tổng chi phí, điều kiện nhận–trả và các bài hướng dẫn cho chuyến đi Tết.
              </p>
              <Link
                to="/thue-xe-tu-lai-tet-ha-noi"
                onClick={() => trackCtaClick('home_tet_rental', { target_path: '/thue-xe-tu-lai-tet-ha-noi' })}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
                data-cta="home-tet-rental"
              >
                Lập kế hoạch thuê xe Tết <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
            <article className="rounded-3xl border border-amber-100 bg-white p-7 shadow-sm">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <Key className="h-6 w-6" />
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Có xe nhàn rỗi dịp Tết?</h3>
              <p className="text-sm leading-7 text-gray-600 mb-6">
                Đối chiếu hồ sơ, lịch rảnh, hợp đồng, bàn giao và cách tính doanh thu trước khi gửi xe để Car Match kiểm tra khả năng hợp tác.
              </p>
              <Link
                to="/hop-tac-chu-xe-cho-thue-tet"
                onClick={() => trackCtaClick('home_tet_owner', { target_path: '/hop-tac-chu-xe-cho-thue-tet' })}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-bold text-amber-900 hover:bg-amber-100"
                data-cta="home-tet-owner"
              >
                Xem hướng dẫn hợp tác Tết <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <HomeReviews />

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
      <section className="py-12 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-300">
                <Key className="w-3.5 h-3.5" />
                Dành cho chủ xe
              </div>
              <h2 id="hop-tac-chu-xe" className="mt-3 text-3xl font-bold text-white">Có xe nhàn rỗi?</h2>
              <p className="mt-3 text-gray-300 leading-7">
                Gửi mẫu xe, lịch rảnh và khu vực đỗ để Car Match thẩm định phương án hợp tác.
              </p>
            </div>
            <Link
              to="/hop-tac"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 font-bold text-white hover:bg-brand-700"
              data-cta="home-owner-partner"
            >
              Xem cách hợp tác
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DỊCH VỤ ĐANG NHẬN YÊU CẦU ─────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Dịch vụ khác</p>
            <h2 id="dich-vu-sap-co" className="text-3xl font-bold text-gray-900">Thêm lựa chọn cho lịch của bạn</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: '✈️',
                label: 'Xe sân bay Nội Bài',
                desc: 'Gửi giờ bay, nhà ga và số vali để nhận phương án phù hợp.',
                tag: 'Đang nhận yêu cầu',
                href: '/xe-san-bay-noi-bai',
              },
              {
                icon: '🔑',
                label: 'Thuê xe theo tháng',
                desc: 'Chọn mẫu xe, thời hạn và điểm nhận để xem gói dài hạn.',
                tag: 'Đang nhận yêu cầu',
                href: '/thue-xe-thang',
              },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="relative block overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:shadow-md"
              >
                <>
                  <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-600 rounded-full">
                    {item.tag}
                  </span>
                  <span className="text-3xl mb-4 block">{item.icon}</span>
                  <h3 className="text-gray-900 font-semibold mb-2">{item.label}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-br from-brand-50 to-brand-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 id="dat-xe-car-match" className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Chọn xe cho lịch của bạn
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Xem xe, tổng giá và gửi yêu cầu trực tiếp trên website.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/xe"
              onClick={() => trackCtaClick('home_final_direct_booking', { target_path: '/xe' })}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold text-lg rounded-full hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
              data-cta="home-final-direct-booking"
            >
              <Car className="w-6 h-6" />
              Chọn xe
            </Link>
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('home_final_support')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-800 font-semibold text-lg rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              data-cta="home-final-zalo-support"
            >
              <MessageCircle className="w-6 h-6" />
              Hỏi qua Zalo
            </a>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
