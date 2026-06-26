import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import {
  Users, Fuel, Settings, Gauge, Check, Shield, ArrowLeft,
  Zap, ChevronLeft, ChevronRight, Phone,
  MapPin, BadgeCheck, Clock, Share2, CalendarDays,
} from 'lucide-react';
import { formatPrice, type Car } from '@/data/cars';
import { findVehicleBySlug, useVehicles } from '@/hooks/useVehicles';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';
import BookingWidget from '../components/BookingWidget';
import CarReviews from '../components/CarReviews';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackPhoneClick } from '@/lib/analytics';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';

const ZALO_NUMBER = '0975563290';
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

/* ─── Image Gallery ─── */
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const multi = images.length > 1;
  const activeImage = images[active];

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative rounded-2xl overflow-hidden bg-slate-100 group cursor-zoom-in aspect-[4/3]"
          onClick={() => setLightbox(true)}
        >
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
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
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
                onClick={() => setActive(i)}
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
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-xl font-bold"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
          {multi && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
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

/* ─── Spec chip ─── */
function SpecChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-[86px] items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</div>
        <div className="mt-1 text-sm font-black text-gray-950">{value}</div>
      </div>
    </div>
  );
}

function vehicleSeoDescription(car: Car): string {
  return `Thuê ${car.name} tự lái tại Hà Nội: ${car.seats} chỗ, ${car.fuel}, ${car.transmission}, giá tham khảo từ ${formatPrice(car.price)}/ngày. Car Match xác nhận lịch xe, điều kiện cọc/bảo hiểm và hỗ trợ giao nhận tận sảnh trước khi chốt.`;
}

function PromoBanner({ promos, loading }: { promos: { code: string; description: string }[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 animate-pulse">
        <div className="h-4 w-28 bg-green-200 rounded mb-2" />
        <div className="space-y-1.5">
          <div className="h-5 bg-green-200 rounded" />
          <div className="h-5 bg-green-200 rounded w-4/5" />
        </div>
        <div className="h-3 w-44 bg-green-100 rounded mt-2" />
      </div>
    );
  }
  if (!promos.length) return null;

  return (
    <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">🎁</span>
        <span className="text-sm font-bold text-green-800">Ưu đãi đang có</span>
      </div>
      <div className="space-y-1">
        {promos.map(p => (
          <div key={p.code} className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-green-700 bg-white border border-green-200 px-2 py-0.5 rounded-md">
              {p.code}
            </span>
            <span className="text-xs text-green-700">{p.description}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-green-600 mt-1.5">Nhập mã trong bước đặt xe để được giảm giá</p>
    </div>
  );
}

function VehicleBookingPanel({
  car,
  relatedCars,
  activePromoCodes,
  promoLoading,
}: {
  car: Car;
  relatedCars: Car[];
  activePromoCodes: { code: string; description: string }[];
  promoLoading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="min-h-[76px]">
        <PromoBanner promos={activePromoCodes} loading={promoLoading} />
      </div>
      <BookingWidget
        basePrice={car.price}
        carName={car.name}
        carSlug={car.slug}
        priceMonth={car.priceMonth}
        vehicleId={car.id}
        kmPerDay={car.kmPerDay}
        kmSurcharge={car.kmSurcharge}
        relatedCars={relatedCars.slice(0, 3).map(c => ({ slug: c.slug, name: c.name, price: c.price }))}
      />
    </div>
  );
}

function VehicleSeoSummary({ car }: { car: Car }) {
  const costNotes = [
    `${car.kmPerDay} km/ngày đã gồm trong giá`,
    `Vượt km: ${(car.kmSurcharge || 3000).toLocaleString('vi-VN')}đ/km`,
    'Cọc, bảo hiểm và lịch giao nhận xác nhận trước khi nhận tiền',
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-600">Tóm tắt nhanh</p>
      <h2 className="mt-2 text-lg font-black text-gray-950">Thuê {car.name} tự lái tại Hà Nội</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        {car.name} phù hợp khách cần xe {car.seats} chỗ, {car.fuel.toLowerCase()}, {car.transmission.toLowerCase()} để đi nội thành,
        đi tỉnh ngắn ngày hoặc nhận xe tại sảnh chung cư/khu đô thị theo lịch hẹn. Car Match kiểm tra lịch xe trống qua Zalo trước khi chốt cọc.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {costNotes.map((note) => (
          <div key={note} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-xs font-bold leading-5 text-gray-700">
            {note}
          </div>
        ))}
      </div>
    </section>
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
  const canonicalSlug = car && slug && (car.slug === slug || car.slugAliases?.includes(slug)) ? slug : car?.slug;
  const relatedCars = cars.filter((c) => c.id !== car?.id && c.category === car?.category).slice(0, 3);
  const displayRelated = relatedCars.length > 0 ? relatedCars : cars.filter((c) => c.id !== car?.id).slice(0, 3);
  const [activePromoCodes, setActivePromoCodes] = useState<{ code: string; description: string }[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const detailUrl = car ? `${SITE_URL}/xe/${canonicalSlug || car.slug}` : 'https://www.carmatch.vn/xe';
  const seoDescription = car ? vehicleSeoDescription(car) : 'Xem chi tiết xe cho thuê tại Car Match Hà Nội.';

  useSEO({
    title: car
      ? `Thuê ${car.name} Hà Nội — ${formatPrice(car.price)}/ngày | Car Match`
      : 'Thuê Xe Tự Lái Hà Nội | Car Match',
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
          telephone: '+84975563290',
        },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Số chỗ', value: `${car.seats} chỗ` },
          { '@type': 'PropertyValue', name: 'Nhiên liệu', value: car.fuel },
          { '@type': 'PropertyValue', name: 'Hộp số', value: car.transmission },
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

  const shareTitle = `Thuê ${car.name} tự lái tại Hà Nội | Car Match`;
  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    trackCtaClick('car_detail_mobile_choose_dates', {
      vehicle_id: car.id,
      vehicle_slug: car.slug,
      vehicle_name: car.name,
    });
  };
  const bookingProcess = [
    'Chọn ngày, giờ nhận/trả xe',
    'Car Match xác nhận lịch trống qua Zalo',
    'Đặt cọc giữ xe, nhận hợp đồng/điều kiện',
    'Bàn giao xe, chụp hiện trạng và bắt đầu chuyến đi',
  ];

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
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {car.available && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Sẵn sàng cho thuê
                  </span>
                )}
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{car.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                <span>Hà Nội</span>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Giao tận tòa nhà
                </div>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Kiểm tra lịch qua Zalo
                </div>
              </div>
            </div>

            {/* Gallery */}
            <Gallery images={car.images} name={car.name} />

            {/* Specs grid */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Thông số xe</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <SpecChip
                  icon={<Users className="w-4 h-4 text-brand-600" />}
                  label="Số chỗ"
                  value={`${car.seats} chỗ`}
                />
                <SpecChip
                  icon={car.fuel === 'Điện' ? <Zap className="w-4 h-4 text-brand-600" /> : <Fuel className="w-4 h-4 text-brand-600" />}
                  label="Nhiên liệu"
                  value={car.fuel}
                />
                <SpecChip
                  icon={<Settings className="w-4 h-4 text-brand-600" />}
                  label="Hộp số"
                  value={car.transmission}
                />
                <SpecChip
                  icon={<Gauge className="w-4 h-4 text-brand-600" />}
                  label="Km miễn phí"
                  value={`${car.kmPerDay} km/ngày`}
                />
                <SpecChip
                  icon={<Gauge className="w-4 h-4 text-brand-600" />}
                  label="Phụ phí vượt km"
                  value={`${(car.kmSurcharge || 3000).toLocaleString('vi-VN')}đ/km`}
                />
                <SpecChip
                  icon={<Clock className="w-4 h-4 text-brand-600" />}
                  label="Trả xe trễ giờ"
                  value="100.000đ/giờ"
                />
              </div>
            </div>

          </div>

          {/* ── BOOKING COLUMN — high on mobile, sticky on desktop ────────── */}
          <div className="lg:col-span-1 lg:row-span-2">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div id="booking" className="scroll-mt-24">
                <VehicleBookingPanel
                  car={car}
                  relatedCars={displayRelated}
                  activePromoCodes={activePromoCodes}
                  promoLoading={promoLoading}
                />
              </div>

              <div className="hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:block">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Chia sẻ xe này</h3>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(detailUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Facebook
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(detailUrl)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Email
                  </a>
                </div>
              </div>

              <div className="hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:block">
                <h3 className="text-sm font-black text-gray-950 mb-4">Quy trình đặt xe</h3>
                <ol className="space-y-3">
                  {bookingProcess.map((text, index) => (
                    <li key={text} className="flex items-start gap-3 text-sm font-medium leading-6 text-gray-600">
                      <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {text}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* ── LEFT COLUMN — supporting content ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {car.description && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-3">Giới thiệu xe</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{car.description}</p>
              </div>
            )}

            {/* Use cases */}
            {car.useCases && car.useCases.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-3">Phù hợp cho</h2>
                <div className="flex flex-wrap gap-2">
                  {car.useCases.map((uc) => (
                    <span key={uc} className="px-3 py-1.5 bg-brand-50 border border-brand-100 text-brand-700 text-sm rounded-full font-medium">
                      {uc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {car.amenities && car.amenities.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Tiện nghi đi kèm
                  <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {car.amenities.length} tính năng
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {car.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-brand-600" />
                      </div>
                      <span className="text-gray-700 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rental conditions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Điều kiện thuê xe</h2>
              <div className="space-y-3">
                {car.conditions.map((condition) => (
                  <div key={condition} className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm leading-relaxed">{condition}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insurance callout */}
            <div className="overflow-hidden rounded-2xl bg-brand-900 text-white shadow-sm">
              <div className="border-b border-white/10 px-5 py-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-100/70">Bàn giao & an toàn</p>
                <h2 className="mt-2 text-xl font-black">Kiểm tra xe cùng bạn trước khi chạy</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/70">
                  Trọng tâm của Car Match là giảm tranh chấp: tình trạng xe, nhiên liệu/pin, km, phụ kiện, cọc và bảo hiểm đều được xác nhận trước khi chốt lịch.
                </p>
              </div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-3">
                {[
                  ['Chụp hiện trạng', 'Ngoại thất, nội thất, đồng hồ km và nhiên liệu/pin khi nhận xe.'],
                  ['Rõ phí trước cọc', 'Giá thuê, phụ phí vượt km, giao nhận và điều kiện cọc được nói rõ trước.'],
                  ['Có người hỗ trợ', 'Khách nhắn Zalo khi cần đổi giờ, xử lý phát sinh hoặc hỏi điều kiện thuê.'],
                ].map(([title, desc]) => (
                  <div key={title} className="bg-brand-900 px-5 py-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-900">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <CarReviews carSlug={car.slug} />

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
          {car.price > 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-brand-600">{formatPrice(car.price)}</span>
              <span className="text-gray-400 text-xs">/ngày</span>
            </div>
          ) : (
            <span className="text-base font-bold text-brand-600">Liên hệ báo giá</span>
          )}
          <div className="text-xs text-gray-400">Xác nhận trong 30 phút</div>
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
        <button
          type="button"
          onClick={scrollToBooking}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors shadow-sm"
        >
          <CalendarDays className="w-4 h-4" />
          Chọn lịch
        </button>
      </div>

      <Footer />
    </div>
  );
}
