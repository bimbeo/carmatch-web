import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import {
  Users, Fuel, Settings, Gauge, Check, Shield, ArrowLeft,
  Zap, ChevronLeft, ChevronRight, Phone,
  MapPin, BadgeCheck, Clock, CalendarDays, ChevronDown, Tag,
} from 'lucide-react';
import { formatPrice, type Car } from '@/data/cars';
import { findVehicleBySlug, useVehicles } from '@/hooks/useVehicles';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';
import BookingWidget, {
  type BookingAvailabilityStatus,
  type BookingOpenRequest,
  type BookingSummary,
} from '../components/BookingWidget';
import CarReviews from '../components/CarReviews';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackPhoneClick, trackVehicleDetailView } from '@/lib/analytics';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';
import { formatRentalBillingDays } from '@/lib/rentalDuration';

const ZALO_NUMBER = '0971163290';
const SITE_URL = 'https://www.carmatch.vn';
const HANOI_DELIVERY_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingDestination: {
    '@type': 'DefinedRegion',
    addressCountry: 'VN',
    addressRegion: 'Hà Nội',
  },
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: 0,
    currency: 'VND',
  },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: 1,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: 1,
      unitCode: 'DAY',
    },
  },
};
const RENTAL_RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'VN',
  returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
};

const DEFAULT_BOOKING_AVAILABILITY_STATUS: BookingAvailabilityStatus = {
  isLoading: true,
  hasBlockedRanges: false,
  selectedRangeHasHardConflict: false,
  selectedRangeHasBoundaryConflict: false,
  requiresConfirmation: false,
  firstHardConflict: null,
};

function formatBlockedRange(range: BookingAvailabilityStatus['firstHardConflict']): string | null {
  if (!range) return null;
  const short = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${Number(day)}/${Number(month)}`;
  };
  return `${short(range.from)} - ${short(range.to)}`;
}

/* ─── Image Gallery ─── */
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const multi = images.length > 1;
  const activeImage = images[active];

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  useEffect(() => {
    if (!lightbox) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false);
      if (event.key === 'ArrowLeft') setActive((index) => (index - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') setActive((index) => (index + 1) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, lightbox]);

  return (
    <>
      <div className="relative hidden h-[540px] grid-cols-[1.6fr_1fr] grid-rows-2 gap-3 overflow-hidden rounded-2xl lg:grid">
        <button
          type="button"
          onClick={() => { setActive(0); setLightbox(true); }}
          className="group row-span-2 overflow-hidden bg-slate-100 text-left"
          aria-label={`Xem ảnh chính của ${name}`}
        >
          <img
            src={optimizedImageUrl(images[0], 1280, 70)}
            srcSet={optimizedImageSrcSet(images[0], [720, 960, 1280, 1600], 70)}
            sizes="55vw"
            alt={`${name} - ảnh 1`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            width={1280}
            height={960}
            loading="eager"
            decoding="async"
          />
        </button>
        {[1, 2].map((index) => images[index] ? (
          <button
            key={images[index]}
            type="button"
            onClick={() => { setActive(index); setLightbox(true); }}
            className="group overflow-hidden bg-slate-100 text-left"
            aria-label={`Xem ảnh ${index + 1} của ${name}`}
          >
            <img
              src={optimizedImageUrl(images[index], 720, 66)}
              srcSet={optimizedImageSrcSet(images[index], [480, 720, 960], 66)}
              sizes="35vw"
              alt={`${name} - ảnh ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              width={720}
              height={540}
              loading="lazy"
              decoding="async"
            />
          </button>
        ) : <div key={index} className="bg-slate-100" />)}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute bottom-4 right-4 rounded-xl border border-white/60 bg-white/95 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-lg backdrop-blur transition-colors hover:bg-white"
        >
          Xem tất cả {images.length} ảnh
        </button>
      </div>

      <div className="space-y-3 lg:hidden">
        {/* Main image */}
        <div
          className="relative rounded-2xl overflow-hidden bg-slate-100 group cursor-zoom-in aspect-[4/3]"
        >
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute inset-0 z-10"
            aria-label={`Mở thư viện ảnh của ${name}`}
          />
          <img
            key={`bg-${active}`}
            src={optimizedImageUrl(activeImage, 720, 45)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-20"
            width={720}
            height={540}
            decoding="async"
          />
          <img
            key={active}
            src={optimizedImageUrl(activeImage, 960, 68)}
            srcSet={optimizedImageSrcSet(activeImage, [640, 960, 1280, 1600], 68)}
            sizes="(min-width: 1024px) 832px, 100vw"
            alt={`${name} - ảnh ${active + 1}`}
            className="relative z-10 w-full h-full object-contain object-center transition-opacity duration-200"
            width={1280}
            height={960}
            loading="eager"
            decoding="async"
          />
          {/* Gradient overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-b-2xl" />

          {multi && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Xem ảnh trước"
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Xem ảnh tiếp theo"
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
            {active + 1}/{images.length}
          </div>
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            Nhấn để phóng to
          </div>
        </div>

        {/* Thumbnails */}
        {multi && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1} của ${name}`}
                className={`flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  i === active
                    ? 'border-brand-600 ring-2 ring-brand-100 opacity-100 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-90 hover:scale-105'
                }`}
                style={{ width: 112, height: 80 }}
              >
                <img
                  src={optimizedImageUrl(img, 224, 60)}
                  srcSet={optimizedImageSrcSet(img, [112, 224], 60)}
                  sizes="112px"
                  alt={`${name} - ảnh thu nhỏ ${i + 1}`}
                  className="w-full h-full object-cover"
                  width={112}
                  height={80}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Thư viện ảnh ${name}`}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-xl font-bold"
            onClick={() => setLightbox(false)}
            aria-label="Đóng thư viện ảnh"
          >
            ✕
          </button>
          {multi && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Xem ảnh trước"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Xem ảnh tiếp theo"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={optimizedImageUrl(activeImage, 1600, 72)}
            srcSet={optimizedImageSrcSet(activeImage, [960, 1280, 1600, 1920], 72)}
            sizes="100vw"
            alt={`${name} - ảnh ${active + 1}`}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            width={1600}
            height={1200}
            loading="lazy"
            decoding="async"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

function vehicleSeoDescription(car: Car): string {
  if (/\bvf3\b/i.test(`${car.slug} ${car.name}`)) {
    const monthlyPrice = car.priceMonth
      ? `, giá tháng tham khảo ${formatPrice(car.priceMonth)}`
      : ', giá tháng được xác nhận theo lịch xe';
    return `Thuê VinFast VF3 tự lái tại Hà Nội từ ${formatPrice(car.price)}/ngày${monthlyPrice}. Xem lịch trống, tổng chi phí, hướng dẫn sạc và so sánh VF3 với VF5 trước khi đặt.`;
  }
  if (/carnival/i.test(`${car.slug} ${car.name}`)) {
    const monthlyPrice = car.priceMonth ? `, gói tháng từ ${formatPrice(car.priceMonth)}` : '';
    return `Thuê Kia Carnival tự lái tại Hà Nội: ${car.seats} chỗ, giá tham khảo từ ${formatPrice(car.price)}/ngày${monthlyPrice}. Xem lịch xe, tổng giá, điều kiện cọc và phương án hành lý trước khi đặt.`;
  }
  return `Thuê ${car.name} tự lái tại Hà Nội: ${car.seats} chỗ, ${car.fuel}, ${car.transmission}, giá tham khảo từ ${formatPrice(car.price)}/ngày. Car Match xác nhận lịch xe, điều kiện cọc và hỗ trợ giao nhận tận sảnh trước khi chốt.`;
}

function vehicleSeoTitle(car: Car): string {
  const identity = `${car.slug} ${car.name}`;
  if (/carnival/i.test(identity)) {
    return 'Thuê Kia Carnival Tự Lái Hà Nội | Giá & Lịch Xe';
  }
  if (/\bvf[3-8]\b/i.test(identity)) {
    return `Thuê ${car.name} Tự Lái Hà Nội | Giá & Lịch Xe`;
  }
  return `Thuê ${car.name} Tự Lái Hà Nội | ${formatPrice(car.price)}/Ngày`;
}

function isVf3Car(car: Car) {
  return /\bvf3\b/i.test(`${car.slug} ${car.name}`);
}

function isVf5Car(car: Car) {
  return /\bvf5\b/i.test(`${car.slug} ${car.name}`);
}

function vf3DisplayName(car: Car) {
  return car.name.replace(/\bvinfast\b/i, 'VinFast');
}

function PromoBanner({
  promos,
  loading,
  className = '',
}: {
  promos: { code: string; description: string }[];
  loading: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={`rounded-2xl border border-emerald-100 bg-emerald-50 p-4 ${className}`}>
        <div className="h-4 w-28 animate-pulse rounded bg-emerald-200" />
        <div className="mt-3 h-8 animate-pulse rounded-lg bg-emerald-100" />
      </div>
    );
  }
  if (!promos.length) return null;

  return (
    <aside className={`overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm ${className}`} aria-label="Ưu đãi hiện có">
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
          <Tag className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-black text-emerald-950">Ưu đãi hiện có</p>
          <p className="text-[11px] font-medium text-emerald-700">Chọn khi đặt xe</p>
        </div>
      </div>
      <div className="divide-y divide-emerald-50 px-4">
        {promos.map((promo) => (
          <div key={promo.code} className="flex items-start gap-3 py-2.5">
            <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[11px] font-black text-emerald-800">
              {promo.code}
            </span>
            <span className="pt-0.5 text-xs font-medium leading-5 text-slate-600">{promo.description}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function RentalEssentials({ car }: { car: Car }) {
  const conditions = car.conditions.slice(0, 3).map((condition) => condition
    .replace('Căn cước và bằng lái xe hạng B (Đối chiếu)', 'CCCD và bằng lái hạng B (đối chiếu)')
    .replace('Đặt cọc tiền từ ', 'Cọc từ '));

  return (
    <section
      id="specs"
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-labelledby="rental-essentials-heading"
    >
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <h2 id="rental-essentials-heading" className="text-lg font-black text-slate-950">Thông tin chính</h2>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: 'Số chỗ', value: `${car.seats} chỗ`, icon: <Users className="h-4 w-4" /> },
          { label: 'Nhiên liệu', value: car.fuel, icon: car.fuel === 'Điện' ? <Zap className="h-4 w-4" /> : <Fuel className="h-4 w-4" /> },
          { label: 'Hộp số', value: car.transmission, icon: <Settings className="h-4 w-4" /> },
        ].map((spec) => (
          <div key={spec.label} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">{spec.icon}</span>
            <div className="min-w-0">
              <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{spec.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-black text-slate-950">{spec.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="grid md:grid-cols-2 md:divide-x md:divide-slate-100">
        <div className="px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <Shield className="h-4 w-4 text-brand-600" /> Điều kiện thuê
          </div>
          <ul className="mt-3 space-y-2.5">
            {conditions.map((condition) => (
              <li key={condition} className="flex items-start gap-2.5 text-sm font-medium leading-6 text-slate-600">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-6 md:border-t-0">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <Gauge className="h-4 w-4 text-brand-600" /> Giới hạn và phụ phí
          </div>
          <dl className="mt-3 space-y-2.5 text-sm">
            {[
              ['Đã gồm', `${car.kmPerDay} km/ngày`],
              ['Vượt km', `${(car.kmSurcharge || 3000).toLocaleString('vi-VN')}đ/km`],
              ['Trả xe trễ', '100.000đ/giờ'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-black text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-5 text-slate-500">Phí giao nhận và sạc/nhiên liệu được báo trước khi cọc.</p>
        </div>
      </div>
    </section>
  );
}

function VehicleBookingPanel({
  car,
  relatedCars,
  activePromoCodes,
  promoLoading,
  externalOpenRequest,
  onAvailabilityStatusChange,
  onBookingSummaryChange,
}: {
  car: Car;
  relatedCars: Car[];
  activePromoCodes: { code: string; description: string }[];
  promoLoading: boolean;
  externalOpenRequest: BookingOpenRequest | null;
  onAvailabilityStatusChange: (status: BookingAvailabilityStatus) => void;
  onBookingSummaryChange: (summary: BookingSummary) => void;
}) {
  return (
    <div className="space-y-3">
      <PromoBanner promos={activePromoCodes} loading={promoLoading} className="hidden lg:block" />
      <BookingWidget
        basePrice={car.price}
        carName={car.name}
        carSlug={car.slug}
        priceMonth={car.priceMonth}
        vehicleId={car.id}
        kmPerDay={car.kmPerDay}
        kmSurcharge={car.kmSurcharge}
        relatedCars={relatedCars.slice(0, 3).map(c => ({ slug: c.slug, name: c.name, price: c.price }))}
        externalOpenRequest={externalOpenRequest}
        onAvailabilityStatusChange={onAvailabilityStatusChange}
        onBookingSummaryChange={onBookingSummaryChange}
      />
    </div>
  );
}

function UnavailableVehiclePanel({ car, relatedCars }: { car: Car; relatedCars: Car[] }) {
  return (
    <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">Tạm ngừng nhận lịch</p>
      <h2 className="mt-2 text-xl font-black text-gray-950">{car.name} hiện chưa nhận đặt trực tiếp</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-gray-600">
        Xem giá tham khảo, chọn xe tương đương hoặc nhắn Car Match để kiểm tra phương án khác.
      </p>
      <div className="mt-4 space-y-2">
        {relatedCars.slice(0, 3).map((related) => (
          <Link
            key={related.slug}
            to={`/xe/${related.slug}`}
            className="flex items-center justify-between rounded-xl border border-amber-100 bg-white px-3 py-3 text-sm font-bold text-gray-800 hover:border-brand-300"
          >
            <span>{related.name}</span>
            <span className="text-brand-600">{formatPrice(related.price)}/ngày</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Link
          to="/xe"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700"
        >
          <CalendarDays className="h-4 w-4" />
          Xem xe đang nhận lịch
        </Link>
        <a
          href={`https://zalo.me/${ZALO_NUMBER}`}
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-800 hover:bg-amber-100"
        >
          Nhắn Zalo kiểm tra xe
        </a>
      </div>
    </aside>
  );
}

function VehicleSeoSummary({ car }: { car: Car }) {
  const fit = car.seats >= 7
    ? 'phù hợp gia đình đông người hoặc nhóm có hành lý; nên gửi số người và số vali để kiểm tra không gian thực tế'
    : car.fuel === 'Điện'
      ? 'phù hợp đi phố hoặc chuyến đã có kế hoạch sạc; mức pin giao–trả được xác nhận trước khi nhận xe'
      : 'phù hợp cá nhân hoặc gia đình nhỏ cần chủ động lịch đi trong và ngoài Hà Nội';

  return (
    <section className="border-t border-gray-200 py-6">
      <h2 className="mt-2 text-lg font-black text-gray-950">Thuê {car.name} tự lái tại Hà Nội</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Xe {car.seats} chỗ, {car.fuel.toLowerCase()}, {car.transmission.toLowerCase()}, giá từ {formatPrice(car.price)}/ngày;
        {' '}{fit}. Chọn ngày nhận/trả để xem lịch xe, tổng giá và điều kiện cọc.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold">
        <Link to="/xe" className="text-brand-700 hover:text-brand-800">Xem đội xe đang nhận lịch</Link>
        <Link to="/thue-xe-thang" className="text-brand-700 hover:text-brand-800">Xem giá thuê theo tháng</Link>
      </div>
    </section>
  );
}

function VehicleGuideLinks({ car }: { car: Car }) {
  if (car.fuel !== 'Điện' && car.seats !== 7) return null;

  return (
    <nav aria-label="Hướng dẫn chọn xe" className="flex flex-wrap gap-2">
      {car.fuel === 'Điện' ? (
        <Link
          to="/blog/thue-xe-dien-ai-tra-phi-sac"
          onClick={() => trackCtaClick('car_detail_ev_charging_guide', { vehicle_slug: car.slug })}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
        >
          <Zap className="h-4 w-4" />
          Ai trả phí sạc khi thuê xe điện?
        </Link>
      ) : null}
      {car.seats === 7 ? (
        <Link
          to="/thue-xe-7-cho-tu-lai-ha-noi"
          onClick={() => trackCtaClick('car_detail_seven_seat_hub', { vehicle_slug: car.slug })}
          className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-bold text-brand-800 hover:bg-brand-100"
        >
          <Users className="h-4 w-4" />
          So sánh xe 7 chỗ
        </Link>
      ) : null}
    </nav>
  );
}

function CarnivalDecisionPanel({
  car,
  availabilityLabel,
  onCheckAvailability,
}: {
  car: Car;
  availabilityLabel: string;
  onCheckAvailability: () => void;
}) {
  const priceRows = [
    { duration: '1 ngày', price: car.price, note: 'Giá cơ sở theo ngày' },
    { duration: '3 ngày', price: car.price * 3, note: 'Ước tính trước ưu đãi' },
    { duration: '7 ngày', price: car.price * 7, note: 'Ước tính trước ưu đãi' },
    { duration: '30 ngày', price: car.priceMonth || null, note: car.priceMonth ? 'Gói tháng tham khảo' : 'Cần báo giá theo lịch' },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm" aria-labelledby="carnival-rental-heading">
      <div className="border-b border-brand-100 bg-brand-50 px-5 py-5">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-700">Kia Carnival tại Hà Nội</p>
        <h2 id="carnival-rental-heading" className="mt-2 text-xl font-black text-gray-950">
          Giá thuê, chỗ ngồi, hành lý và lịch xe
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          Kia Carnival phù hợp gia đình đông người, nhóm đi tỉnh và doanh nghiệp cần không gian ngồi rộng. Giá dưới đây lấy từ giá xe đang công bố; tổng tiền cuối cùng được tính lại theo ngày, giờ nhận trả và ưu đãi trong lịch đặt xe.
        </p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h3 className="text-sm font-black text-gray-950">Bảng giá tham khảo</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
            {priceRows.map((row) => (
              <div key={row.duration} className="grid grid-cols-[72px_1fr] gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0 sm:grid-cols-[86px_150px_1fr]">
                <span className="text-sm font-black text-gray-950">{row.duration}</span>
                <span className="text-sm font-black text-brand-700">
                  {row.price ? formatPrice(row.price) : 'Liên hệ báo giá'}
                </span>
                <span className="col-span-2 text-xs font-medium text-gray-500 sm:col-span-1">{row.note}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-medium leading-5 text-gray-500">
            Chưa gồm giao nhận, nhiên liệu, VETC, vượt km hoặc phát sinh. Chọn lịch để xem báo giá sát nhất.
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-gray-950">
              <Users className="h-4 w-4 text-brand-600" />
              {car.seats} chỗ và phương án hành lý
            </div>
            <p className="mt-2 text-xs font-medium leading-5 text-gray-600">
              Khi dùng đủ {car.seats} chỗ, sức chứa hành lý phụ thuộc kích thước vali và cách xếp ghế. Hãy gửi số người, số vali lớn/nhỏ để Car Match xác nhận trước khi cọc.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-gray-950">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              Lịch xe: {availabilityLabel}
            </div>
            <p className="mt-2 text-xs font-medium leading-5 text-gray-600">
              Chọn ngày nhận và trả để kiểm tra xung đột lịch thực tế. Trang model vẫn được giữ ngay cả khi xe tạm bận.
            </p>
          </div>
          <button
            type="button"
            onClick={onCheckAvailability}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700"
          >
            <CalendarDays className="h-4 w-4" />
            Chọn ngày và xem tổng giá
          </button>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold">
            <Link to="/thue-xe-thang" className="text-brand-700 hover:text-brand-800">Xem gói thuê tháng</Link>
            <Link to="/xe/mitsubishi-xpander-2023" className="text-brand-700 hover:text-brand-800">So với Xpander</Link>
            <Link to="/thue-xe-7-cho-tu-lai-ha-noi" className="text-brand-700 hover:text-brand-800">So sánh 3 mẫu xe 7 chỗ</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Vf3DecisionPanel({
  car,
  vf5,
  onCheckAvailability,
}: {
  car: Car;
  vf5?: Car;
  onCheckAvailability: () => void;
}) {
  return (
    <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Thuê VinFast VF3 tự lái tại Hà Nội</p>
          <h2 className="mt-1 text-base font-black text-gray-950">Giá ngày, giá tháng, lịch xe và chi phí sạc</h2>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-5 border-t border-gray-100 px-5 py-4 sm:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black text-gray-950"><Zap className="h-4 w-4 text-emerald-700" /> Thuê VF3 thì sạc xe thế nào?</h3>
          <ul className="mt-3 space-y-2 text-xs font-medium leading-5 text-gray-600">
            <li>• Ghi nhận mức pin và phụ kiện khi nhận xe.</li>
            <li>• Chi phí sạc, mức pin trả xe được xác nhận trước khi cọc.</li>
            <li>• Đi tỉnh nên kiểm tra điểm sạc trên tuyến.</li>
          </ul>
          <Link
            to="/blog/thue-xe-dien-ai-tra-phi-sac"
            onClick={() => trackCtaClick('car_detail_ev_charging_guide', { vehicle_slug: car.slug })}
            className="mt-3 inline-block text-xs font-bold text-brand-700 hover:text-brand-800"
          >
            Xem hướng dẫn sạc chi tiết
          </Link>
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-950">VF3 hay VF5 phù hợp hơn?</h3>
          <p className="mt-3 text-xs font-medium leading-5 text-gray-600">
            VF3: {car.seats} chỗ, từ {formatPrice(car.price)}/ngày; giá tháng {car.priceMonth ? formatPrice(car.priceMonth) : 'Liên hệ báo giá'}.
            VF5: {vf5 ? formatPrice(vf5.price) : 'Xem xe để báo giá'}/ngày, phù hợp khi cần thêm không gian.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold">
            <Link to="/thue-xe-thang" className="text-brand-700 hover:text-brand-800">Thuê xe theo tháng</Link>
            <Link to={vf5 ? `/xe/${vf5.slug}` : '/xe'} className="text-brand-700 hover:text-brand-800">
              {vf5 ? `Xem ${vf5.name}` : 'Xem xe điện 5 chỗ'}
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-gray-600"><strong className="text-gray-950">Tổng chi phí cần tính:</strong> tiền thuê, giao nhận và khoản phát sinh theo thực tế.</p>
          <button
            type="button"
            onClick={onCheckAvailability}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700"
          >
            <CalendarDays className="h-4 w-4" />
            Chọn ngày và xem tổng giá
          </button>
        </div>
      </div>
    </details>
  );
}

/* ─── Main ─── */
export default function CarDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const { cars, loading, fetched } = useVehicles();
  const car = findVehicleBySlug(cars, slug);

  useEffect(() => {
    if (!['#booking', '#booking-mobile', '#booking-desktop'].includes(hash) || !car) return;
    const scroll = () => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // Wait one frame after render so layout is stable
    const raf = requestAnimationFrame(() => {
      scroll();
      // Fallback: some browsers need a second tick
      setTimeout(scroll, 300);
    });
    return () => cancelAnimationFrame(raf);
  }, [hash, car]);

  // Alias URLs remain crawlable for continuity, but every physical/color alias
  // points to the stable model URL so they do not compete as duplicate pages.
  const canonicalSlug = car?.slug;
  const relatedCars = cars.filter((c) => c.available && c.id !== car?.id && c.category === car?.category).slice(0, 3);
  const displayRelated = relatedCars.length > 0
    ? relatedCars
    : cars.filter((c) => c.available && c.id !== car?.id).slice(0, 3);
  const [activePromoCodes, setActivePromoCodes] = useState<{ code: string; description: string }[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [bookingAvailabilityStatus, setBookingAvailabilityStatus] = useState<BookingAvailabilityStatus>(
    DEFAULT_BOOKING_AVAILABILITY_STATUS,
  );
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [bookingOpenRequest, setBookingOpenRequest] = useState<BookingOpenRequest | null>(null);
  const trackedVehicleViewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!car || trackedVehicleViewRef.current === car.id) return;
    trackedVehicleViewRef.current = car.id;
    trackVehicleDetailView({
      vehicle_id: car.id,
      vehicle_slug: car.slug,
      vehicle_name: car.name,
      value: car.price,
      currency: 'VND',
      items: [{ item_id: car.id, item_name: car.name, price: car.price }],
    });
  }, [car]);

  useEffect(() => {
    setBookingAvailabilityStatus(DEFAULT_BOOKING_AVAILABILITY_STATUS);
    setBookingSummary(null);
    setBookingOpenRequest(null);
  }, [car?.id]);

  const handleAvailabilityStatusChange = useCallback((next: BookingAvailabilityStatus) => {
    setBookingAvailabilityStatus((prev) => {
      const sameFirstConflict =
        prev.firstHardConflict?.from === next.firstHardConflict?.from &&
        prev.firstHardConflict?.to === next.firstHardConflict?.to &&
        prev.firstHardConflict?.type === next.firstHardConflict?.type;

      if (
        prev.isLoading === next.isLoading &&
        prev.hasBlockedRanges === next.hasBlockedRanges &&
        prev.selectedRangeHasHardConflict === next.selectedRangeHasHardConflict &&
        prev.selectedRangeHasBoundaryConflict === next.selectedRangeHasBoundaryConflict &&
        prev.requiresConfirmation === next.requiresConfirmation &&
        sameFirstConflict
      ) {
        return prev;
      }

      return next;
    });
  }, []);
  const detailUrl = car ? `${SITE_URL}/xe/${canonicalSlug || car.slug}` : 'https://www.carmatch.vn/xe';
  const seoDescription = car ? vehicleSeoDescription(car) : 'Xem chi tiết xe cho thuê tại Car Match Hà Nội.';

  useSEO({
    title: car ? vehicleSeoTitle(car) : 'Thuê Xe Tự Lái Hà Nội | Car Match',
    description: seoDescription,
    canonical: detailUrl,
    ogImage: car?.images?.[0] ?? undefined,
    noIndex: !loading && !car,
  });

  useEffect(() => {
    if (!car) return undefined;

    const canonical = `${SITE_URL}/xe/${canonicalSlug || car.slug}`;
    const description = vehicleSeoDescription(car);
    const vehicleNodeId = `${canonical}#vehicle`;
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: `Thuê ${car.name} tự lái tại Hà Nội`,
        description,
        inLanguage: 'vi-VN',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': vehicleNodeId },
        primaryImageOfPage: car.images?.[0]
          ? { '@type': 'ImageObject', url: car.images[0] }
          : undefined,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': vehicleNodeId,
        name: `Thuê ${car.name}`,
        description,
        image: car.images,
        mainEntityOfPage: canonical,
        inLanguage: 'vi-VN',
        brand: car.brand ? { '@type': 'Brand', name: car.brand } : undefined,
        category: 'Xe tự lái',
        url: canonical,
        areaServed: {
          '@type': 'City',
          name: 'Hà Nội',
          addressCountry: 'VN',
        },
        provider: {
          '@type': 'Organization',
          name: 'Car Match',
          url: SITE_URL,
          telephone: '+84971163290',
        },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Số chỗ', value: `${car.seats} chỗ` },
          { '@type': 'PropertyValue', name: 'Nhiên liệu', value: car.fuel },
          { '@type': 'PropertyValue', name: 'Hộp số', value: car.transmission },
          ...(car.priceMonth
            ? [{ '@type': 'PropertyValue', name: 'Giá thuê tháng tham khảo', value: `${formatPrice(car.priceMonth)}/tháng` }]
            : []),
          { '@type': 'PropertyValue', name: 'Km miễn phí mỗi ngày', value: `${car.kmPerDay} km/ngày` },
          { '@type': 'PropertyValue', name: 'Phụ phí vượt km', value: `${(car.kmSurcharge || 3000).toLocaleString('vi-VN')}đ/km` },
        ],
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'VND',
          price: car.price || undefined,
          availability: car.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          areaServed: {
            '@type': 'City',
            name: 'Hà Nội',
            addressCountry: 'VN',
          },
          availableAtOrFrom: {
            '@type': 'Place',
            name: 'Hà Nội',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Hà Nội',
              addressCountry: 'VN',
            },
          },
          seller: {
            '@type': 'Organization',
            name: 'Car Match',
            url: SITE_URL,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/carmatch-logo-stacked-navy.png` },
          },
          shippingDetails: HANOI_DELIVERY_DETAILS,
          hasMerchantReturnPolicy: RENTAL_RETURN_POLICY,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Thuê xe tự lái', item: `${SITE_URL}/xe` },
          { '@type': 'ListItem', position: 3, name: car.name, item: canonical },
        ],
      },
    ];
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.carStructuredData = 'true';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [car, canonicalSlug]);

  useEffect(() => {
    setPromoLoading(true);
    fetch('/api/promo-list')
      .then(r => r.json())
      .then((data: { promos?: { code: string; description: string }[] }) => {
        setActivePromoCodes(Array.isArray(data.promos) ? data.promos.slice(0, 2) : []);
      })
      .catch(() => {})
      .finally(() => setPromoLoading(false));
  }, []);

  if (!car && (loading || !fetched)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Be Vietnam Pro','Inter',sans-serif" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Đang tải thông tin xe...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Be Vietnam Pro','Inter',sans-serif" }}>
        <div className="text-center">
          <div className="text-6xl font-bold text-brand-600 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy xe</h1>
          <p className="text-gray-500 mb-8">Xe bạn đang tìm không tồn tại.</p>
          <Link to="/xe" className="px-8 py-3 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 transition-colors">
            Xem tất cả xe
          </Link>
        </div>
      </div>
    );
  }

  const isCarnival = /carnival/i.test(`${car.slug} ${car.name}`);
  const isVf3 = isVf3Car(car);
  const vf5ComparisonCar = cars.find((candidate) => candidate.available && isVf5Car(candidate));
  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    trackCtaClick('car_detail_mobile_choose_dates', {
      vehicle_id: car.id,
      vehicle_slug: car.slug,
      vehicle_name: car.name,
    });
  };
  const openMobileBooking = () => {
    trackCtaClick('car_detail_mobile_direct_booking', {
      vehicle_id: car.id,
      vehicle_slug: car.slug,
      vehicle_name: car.name,
      availability_state: bookingAvailabilityStatus.isLoading
        ? 'loading'
        : bookingAvailabilityStatus.selectedRangeHasHardConflict
          ? 'hard_conflict'
          : bookingAvailabilityStatus.requiresConfirmation ? 'manual_confirmation' : 'available',
    });
    setBookingOpenRequest((current) => ({
      id: (current?.id ?? 0) + 1,
      source: 'car_detail_mobile_sticky',
      vehicleId: car.id,
    }));
  };
  const hardConflictRange = formatBlockedRange(bookingAvailabilityStatus.firstHardConflict);
  const availabilityBadgeMeta = !car.available
    ? {
        label: 'Tạm ngừng cho thuê',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        dotClassName: 'bg-slate-400',
        notice: 'Xe này đang tạm ngừng nhận lịch mới. Bạn có thể chọn xe tương tự hoặc nhắn Zalo để được hỗ trợ.',
        noticeClassName: 'border-slate-200 bg-slate-50 text-slate-600',
      }
    : bookingAvailabilityStatus.selectedRangeHasHardConflict
      ? {
          label: 'Bận trong ngày đã chọn',
          className: 'bg-red-50 text-red-700 border-red-200',
          dotClassName: 'bg-red-500',
          notice: hardConflictRange
            ? `Xe đang có lịch ${hardConflictRange}. Vui lòng đổi ngày hoặc xem xe tương tự ở khung đặt lịch.`
            : 'Xe đang bận trong khoảng ngày đang chọn. Vui lòng đổi ngày hoặc xem xe tương tự ở khung đặt lịch.',
          noticeClassName: 'border-red-200 bg-red-50 text-red-700',
        }
      : bookingAvailabilityStatus.selectedRangeHasBoundaryConflict
        ? {
            label: 'Cần xác nhận giờ',
            className: 'bg-amber-50 text-amber-800 border-amber-200',
            dotClassName: 'bg-amber-500',
            notice: '',
            noticeClassName: '',
          }
        : bookingAvailabilityStatus.isLoading
          ? {
              label: 'Đang kiểm tra lịch',
              className: 'bg-slate-50 text-slate-600 border-slate-200',
              dotClassName: 'bg-slate-400 animate-pulse',
              notice: '',
              noticeClassName: '',
            }
          : bookingAvailabilityStatus.hasBlockedRanges
            ? {
                label: 'Có ngày đã kín',
                className: 'bg-amber-50 text-amber-800 border-amber-200',
                dotClassName: 'bg-amber-500',
                notice: '',
                noticeClassName: '',
              }
            : bookingAvailabilityStatus.requiresConfirmation
              ? {
                  label: 'Cần xác nhận lịch',
                  className: 'bg-amber-50 text-amber-800 border-amber-200',
                  dotClassName: 'bg-amber-500',
                  notice: 'Car Match kiểm tra lịch và liên hệ xác nhận. Chưa cần cọc.',
                  noticeClassName: 'border-amber-200 bg-amber-50 text-amber-800',
                }
            : {
                label: 'Lịch đang trống',
                className: 'bg-green-50 text-green-700 border-green-200',
                dotClassName: 'bg-green-500',
                notice: 'Gửi yêu cầu để giữ xe 15 phút.',
                noticeClassName: 'border-green-200 bg-green-50 text-green-800',
              };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "'Be Vietnam Pro','Inter',sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/xe" className="hover:text-gray-600 transition-colors">Thuê xe tự lái</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate">{car.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start lg:auto-rows-min">

          {/* ── LEFT COLUMN (2/3) ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title + badges */}
            <header className="py-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-full text-xs font-bold ${availabilityBadgeMeta.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${availabilityBadgeMeta.dotClassName}`} />
                  {availabilityBadgeMeta.label}
                </span>
                {car.popular && (
                  <span className="px-2.5 py-1 bg-brand-600 text-white rounded-full text-xs font-bold">
                    Phổ biến
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  car.fuel === 'Điện' ? 'bg-brand-50 text-brand-700 border border-brand-200' :
                  car.fuel === 'Dầu' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {car.fuel === 'Điện' ? <Zap className="w-3 h-3" /> : <Fuel className="w-3 h-3" />}
                  {car.fuel}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {isCarnival
                  ? 'Thuê Kia Carnival tự lái tại Hà Nội'
                  : isVf3
                    ? `Thuê ${vf3DisplayName(car)} tự lái tại Hà Nội`
                    : `Thuê ${car.name} tự lái tại Hà Nội`}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                <span>Hà Nội</span>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Giao tận nơi
                </div>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {bookingAvailabilityStatus.requiresConfirmation ? 'Cần xác nhận lịch' : 'Đặt online'}
                </div>
              </div>
              {availabilityBadgeMeta.notice && (
                <p className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold leading-relaxed ${availabilityBadgeMeta.noticeClassName}`}>
                  {availabilityBadgeMeta.notice}
                </p>
              )}
            </header>

            {/* Gallery */}
            <section id="photos" className="scroll-mt-32">
              <Gallery images={car.images} name={car.name} />
            </section>

            <PromoBanner promos={activePromoCodes} loading={promoLoading} className="lg:hidden" />

            <RentalEssentials car={car} />

            <VehicleGuideLinks car={car} />

          </div>

          {/* ── BOOKING COLUMN — high on mobile, sticky on desktop ────────── */}
          <div className="lg:col-span-1 lg:row-span-2">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div id="booking" className="scroll-mt-24">
                {car.available ? (
                  <VehicleBookingPanel
                    car={car}
                    relatedCars={displayRelated}
                    activePromoCodes={activePromoCodes}
                    promoLoading={promoLoading}
                    externalOpenRequest={bookingOpenRequest}
                    onAvailabilityStatusChange={handleAvailabilityStatusChange}
                    onBookingSummaryChange={setBookingSummary}
                  />
                ) : (
                  <UnavailableVehiclePanel car={car} relatedCars={displayRelated} />
                )}
              </div>

            </div>
          </div>

          {/* ── LEFT COLUMN — supporting content ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {isCarnival ? (
              <CarnivalDecisionPanel
                car={car}
                availabilityLabel={availabilityBadgeMeta.label}
                onCheckAvailability={scrollToBooking}
              />
            ) : null}

            {isVf3 ? <Vf3DecisionPanel car={car} vf5={vf5ComparisonCar} onCheckAvailability={scrollToBooking} /> : null}

            <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm" aria-labelledby="handover-heading">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-brand-600" />
                <h2 id="handover-heading" className="text-sm font-black text-gray-950">Bàn giao rõ ràng</h2>
              </div>
              <div className="mt-3 grid gap-2 text-xs font-semibold text-gray-600 sm:grid-cols-3">
                <span>✓ Chụp hiện trạng</span>
                <span>✓ Chốt phí trước khi cọc</span>
                <span>✓ Hỗ trợ khi phát sinh</span>
              </div>
            </section>

            <div id="reviews" className="scroll-mt-32">
              <CarReviews carSlug={car.slug} />
            </div>

            {/* Back button mobile */}
            <Link
              to="/xe"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách xe
            </Link>
          </div>

        </div>

        <div className="mt-14 max-w-4xl">
          <VehicleSeoSummary car={car} />
        </div>

        {/* Related cars */}
        {displayRelated.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Xe tương tự</h2>
              <Link to="/xe" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {displayRelated.map((c) => (
                <CarCard key={c.slug} car={c} compact source="car_detail_related" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY MOBILE BOTTOM BAR ─────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-3 flex items-center gap-3 lg:hidden z-40">
        <div className="flex-1">
          {!car.available ? (
            <div>
              <div className="text-sm font-black text-amber-700">Tạm ngừng nhận lịch</div>
              <div className="text-[11px] font-medium text-gray-500">Xem xe tương đương đang sẵn sàng</div>
            </div>
          ) : bookingSummary?.valid && bookingSummary.totalAmount > 0 ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-brand-600">{formatPrice(bookingSummary.totalAmount)}</span>
                <span className="text-gray-400 text-xs">tổng</span>
              </div>
              <div className="text-[11px] font-medium text-gray-500">{formatRentalBillingDays(bookingSummary.billingDays)}</div>
            </div>
          ) : car.price > 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-brand-600">{formatPrice(car.price)}</span>
              <span className="text-gray-400 text-xs">/ngày</span>
            </div>
          ) : (
            <span className="text-base font-bold text-brand-600">Liên hệ báo giá</span>
          )}
          {car.available && !bookingSummary?.valid && (
            <div className="text-xs text-gray-400">
              {bookingAvailabilityStatus.requiresConfirmation ? 'Car Match sẽ liên hệ xác nhận' : 'Chọn lịch để xem tổng giá'}
            </div>
          )}
        </div>
        <a
          href={`tel:${ZALO_NUMBER}`}
          onClick={() => trackPhoneClick('car_detail_mobile_sticky', {
            vehicle_id: car.id,
            vehicle_slug: car.slug,
            vehicle_name: car.name,
          })}
          className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          <Phone className="w-4 h-4" />
        </a>
        {car.available ? (
          <button
            type="button"
            onClick={openMobileBooking}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <CalendarDays className="w-4 h-4" />
            {bookingAvailabilityStatus.isLoading
              ? 'Đang kiểm tra…'
              : bookingAvailabilityStatus.selectedRangeHasHardConflict
                ? 'Đổi lịch'
                : bookingSummary?.valid
                  ? 'Gửi yêu cầu'
                  : 'Lịch & tổng giá'}
          </button>
        ) : (
          <Link
            to="/xe"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
          >
            <CalendarDays className="h-4 w-4" />
            Xem xe khác
          </Link>
        )}
      </div>

      <Footer />
    </div>
  );
}
