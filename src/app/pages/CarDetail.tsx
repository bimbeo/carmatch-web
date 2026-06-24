import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import {
  Users, Fuel, Settings, Gauge, Check, Shield, ArrowLeft,
  Zap, ChevronLeft, ChevronRight, Phone,
  MapPin, BadgeCheck, Clock, MessageCircle, Share2,
} from 'lucide-react';
import { formatPrice } from '@/data/cars';
import { findVehicleBySlug, useVehicles } from '@/hooks/useVehicles';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';
import BookingWidget from '../components/BookingWidget';
import CarReviews from '../components/CarReviews';
import { useSEO } from '@/hooks/useSEO';
import { trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';

const ZALO_NUMBER = '0975563290';
const ZALO_LINK = `https://zalo.me/${ZALO_NUMBER}`;
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
            fetchPriority="high"
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
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
      <div className="w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

/* ─── Trust badge ─── */
function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="text-brand-600">{icon}</div>
      {text}
    </div>
  );
}

/* ─── Main ─── */
export default function CarDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const { cars, loading } = useVehicles();
  const car = findVehicleBySlug(cars, slug);

  useEffect(() => {
    if (hash !== '#booking' || !car) return;
    const scroll = () => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  useSEO({
    title: car
      ? `Thuê ${car.name} Hà Nội — ${formatPrice(car.price)}/ngày | Car Match`
      : 'Thuê Xe Tự Lái Hà Nội | Car Match',
    description: car
      ? `Thuê ${car.name} tự lái tại Hà Nội. ${car.seats} chỗ, ${car.fuel}. Giá từ ${formatPrice(car.price)}/ngày, giao xe tận sảnh và xác nhận điều kiện thuê trước khi chốt.`
      : 'Xem chi tiết xe cho thuê tại Car Match Hà Nội.',
    canonical: canonicalSlug ? `https://www.carmatch.vn/xe/${canonicalSlug}` : 'https://www.carmatch.vn/xe',
    ogImage: car?.images?.[0] ?? undefined,
    noIndex: !loading && !car,
  });

  useEffect(() => {
    if (!car) return undefined;

    const canonical = `${SITE_URL}/xe/${canonicalSlug || car.slug}`;
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `Thuê ${car.name}`,
        description: `Thuê ${car.name} tự lái tại Hà Nội. ${car.seats} chỗ, ${car.fuel}. Giá từ ${formatPrice(car.price)}/ngày, giao xe tận nơi theo lịch hẹn.`,
        image: car.images,
        brand: car.brand ? { '@type': 'Brand', name: car.brand } : undefined,
        category: 'Xe tự lái',
        url: canonical,
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'VND',
          price: car.price || undefined,
          availability: car.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
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
    fetch('/api/promo-list')
      .then(r => r.json())
      .then((data: { code: string; description: string }[]) => {
        setActivePromoCodes(Array.isArray(data) ? data.slice(0, 2) : []);
      })
      .catch(() => {});
  }, []);

  if (loading) {
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

  const zaloMessage = encodeURIComponent(`Xin chào Car Match! Tôi muốn thuê xe ${car.name}. Cho tôi hỏi về lịch trống và giá thuê ạ.`);
  const zaloHref = `${ZALO_LINK}?text=${zaloMessage}`;
  const detailUrl = `${SITE_URL}/xe/${canonicalSlug || car.slug}`;
  const shareTitle = `Thuê ${car.name} tự lái tại Hà Nội | Car Match`;

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── LEFT COLUMN (2/3) ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {car.available && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Sẵn sàng cho thuê
                  </span>
                )}
                {car.popular && (
                  <span className="px-2.5 py-1 bg-brand-600 text-white rounded-full text-xs font-semibold">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  value="3.000đ/km"
                />
                <SpecChip
                  icon={<Clock className="w-4 h-4 text-brand-600" />}
                  label="Trả xe trễ giờ"
                  value="100.000đ/giờ"
                />
              </div>
            </div>

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
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-brand-900 text-sm mb-1">Bàn giao & an toàn</div>
                  <p className="text-brand-700 text-sm leading-relaxed">
                    Trước khi nhận xe, hai bên kiểm tra ngoại thất, nội thất, nhiên liệu/pin, km và phụ kiện. Điều kiện bảo hiểm, cọc và trách nhiệm phát sinh được xác nhận trước khi chốt lịch thuê.
                  </p>
                </div>
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

          {/* ── RIGHT COLUMN — Booking widget (sticky) ────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Promo banner */}
              {activePromoCodes.length > 0 && (
                <div className="mb-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">🎁</span>
                    <span className="text-sm font-bold text-green-800">Ưu đãi đang có</span>
                  </div>
                  <div className="space-y-1">
                    {activePromoCodes.map(p => (
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
              )}

              {/* Booking widget with pricing calculator */}
              <div id="booking">
              <BookingWidget
                basePrice={car.price}
                carName={car.name}
                carSlug={car.slug}
                priceMonth={car.priceMonth}
                vehicleId={car.id}
                kmPerDay={car.kmPerDay}
                relatedCars={displayRelated.slice(0, 3).map(c => ({ slug: c.slug, name: c.name, price: c.price }))}
              />
              </div>

              {/* Trust badges */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="space-y-2.5">
                  <TrustBadge icon={<Shield className="w-4 h-4" />} text="Điều kiện cọc/bảo hiểm được xác nhận trước" />
                  <TrustBadge icon={<BadgeCheck className="w-4 h-4" />} text="Kiểm tra xe cùng khách khi bàn giao" />
                  <TrustBadge icon={<Clock className="w-4 h-4" />} text="Phản hồi trong khoảng 30 phút khi có xe phù hợp" />
                  <TrustBadge icon={<MapPin className="w-4 h-4" />} text="Giao xe tận tòa nhà theo lịch hẹn" />
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
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

              {/* How to rent */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Quy trình đặt xe</h3>
                <ol className="space-y-3">
                  {[
                    { step: '1', text: 'Nhắn Zalo hoặc gọi điện cho Car Match' },
                    { step: '2', text: 'Xác nhận lịch xe & thanh toán đặt cọc' },
                    { step: '3', text: 'Giao xe tận nơi theo giờ đã hẹn' },
                    { step: '4', text: 'Trả xe — Car Match kiểm tra & hoàn cọc' },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {item.step}
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          </div>
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
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackZaloClick('car_detail_mobile_sticky', {
            vehicle_id: car.id,
            vehicle_slug: car.slug,
            vehicle_name: car.name,
          })}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Đặt xe
        </a>
      </div>

      <Footer />
    </div>
  );
}
