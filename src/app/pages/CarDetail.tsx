import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  Users, Fuel, Settings, Gauge, Check, Shield, ArrowLeft,
  Zap, ChevronLeft, ChevronRight, Phone,
  MapPin, Star, BadgeCheck, Clock, MessageCircle,
} from 'lucide-react';
import { formatPrice } from '@/data/cars';
import { useVehicles } from '@/hooks/useVehicles';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';
import BookingWidget from '../components/BookingWidget';

const ZALO_NUMBER = '0975563290';
const ZALO_LINK = `https://zalo.me/${ZALO_NUMBER}`;

/* ─── Image Gallery ─── */
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const multi = images.length > 1;

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-gray-100 group">
        <img
          src={images[active]}
          alt={`${name} - ảnh ${active + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {multi && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {active + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {multi && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-brand-600 opacity-100' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={img} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
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
  const { cars, loading } = useVehicles();
  const car = cars.find((c) => c.slug === slug);
  const relatedCars = cars.filter((c) => c.slug !== slug && c.category === car?.category).slice(0, 3);
  const displayRelated = relatedCars.length > 0 ? relatedCars : cars.filter((c) => c.slug !== slug).slice(0, 3);

  useEffect(() => {
    if (car) {
      document.title = `Thuê ${car.name} Hà Nội — ${formatPrice(car.price)}/ngày | CarMatch`;
    }
    return () => { document.title = 'CarMatch — Thuê Xe Tự Lái Hà Nội | Giá Từ 800K/Ngày'; };
  }, [car]);

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

  const zaloMessage = encodeURIComponent(`Xin chào CarMatch! Tôi muốn thuê xe ${car.name}. Cho tôi hỏi về lịch trống và giá thuê ạ.`);
  const zaloHref = `${ZALO_LINK}?text=${zaloMessage}`;

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
              {/* Rating placeholder */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                  <span className="text-sm font-semibold text-gray-900 ml-1">4.9</span>
                </div>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500">Hà Nội</span>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  Giao tận tòa nhà
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
                  <div className="font-semibold text-brand-900 text-sm mb-1">Bảo hiểm & an toàn</div>
                  <p className="text-brand-700 text-sm leading-relaxed">
                    Xe có bảo hiểm vật chất 2 chiều đầy đủ. Thiệt hại được xử lý theo quy trình bảo hiểm rõ ràng. Mọi xe được kiểm định kỹ trước mỗi chuyến.
                  </p>
                </div>
              </div>
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

          {/* ── RIGHT COLUMN — Booking widget (sticky) ────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Booking widget with pricing calculator */}
              <BookingWidget
                basePrice={car.price}
                carName={car.name}
                priceMonth={car.priceMonth}
              />

              {/* Trust badges */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="space-y-2.5">
                  <TrustBadge icon={<Shield className="w-4 h-4" />} text="Bảo hiểm vật chất 2 chiều" />
                  <TrustBadge icon={<BadgeCheck className="w-4 h-4" />} text="Xe kiểm định kỹ trước chuyến" />
                  <TrustBadge icon={<Clock className="w-4 h-4" />} text="Xác nhận trong 30 phút" />
                  <TrustBadge icon={<MapPin className="w-4 h-4" />} text="Giao xe tận tòa nhà" />
                </div>
              </div>

              {/* How to rent */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Quy trình đặt xe</h3>
                <ol className="space-y-3">
                  {[
                    { step: '1', text: 'Nhắn Zalo hoặc gọi điện cho CarMatch' },
                    { step: '2', text: 'Xác nhận lịch xe & thanh toán đặt cọc' },
                    { step: '3', text: 'Giao xe tận nơi theo giờ đã hẹn' },
                    { step: '4', text: 'Trả xe — CarMatch kiểm tra & hoàn cọc' },
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
                <CarCard key={c.slug} car={c} compact />
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
          className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          <Phone className="w-4 h-4" />
        </a>
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
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
