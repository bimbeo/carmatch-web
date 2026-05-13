import { useParams, Link } from 'react-router';
import {
  Users,
  Fuel,
  Settings,
  Gauge,
  Check,
  Shield,
  ArrowLeft,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { cars, formatPrice } from '@/data/cars';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';

const ZALO_LINK = 'https://zalo.me/0975563290';

const fuelIcon = (fuel: string) => {
  if (fuel === 'Điện') return <Zap className="w-5 h-5 text-[#4ade80]" />;
  return <Fuel className="w-5 h-5 text-[#4ade80]" />;
};

export default function CarDetail() {
  const { slug } = useParams<{ slug: string }>();

  const car = cars.find((c) => c.slug === slug);
  const relatedCars = cars.filter((c) => c.slug !== slug && c.category === car?.category).slice(0, 3);
  const fallbackRelated = cars.filter((c) => c.slug !== slug).slice(0, 3);

  if (!car) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="text-6xl font-bold text-[#4ade80] mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-4">Không tìm thấy xe</h1>
          <p className="text-gray-400 mb-8">Xe bạn đang tìm kiếm không tồn tại.</p>
          <Link to="/xe" className="px-8 py-3 bg-[#4ade80] text-black rounded-full font-semibold hover:bg-[#22c55e] transition-colors inline-block">
            Xem tất cả xe
          </Link>
        </div>
      </div>
    );
  }

  const displayRelated = relatedCars.length > 0 ? relatedCars : fallbackRelated;
  const zaloMessage = encodeURIComponent(`Xin chào CarMatch! Tôi muốn thuê xe ${car.name}. Cho tôi hỏi về lịch trống và giá thuê ạ.`);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero Image */}
      <section className="relative h-[55vh] min-h-[380px] flex items-end overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img
            src={car.images[0]}
            alt={car.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full">
          <Link to="/xe" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách xe
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              {car.available && (
                <span className="inline-block px-3 py-1 bg-[#4ade80]/20 text-[#4ade80] text-xs font-semibold rounded-full mb-3 border border-[#4ade80]/30">
                  ● Sẵn sàng cho thuê
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white">{car.name}</h1>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#4ade80]">{formatPrice(car.price)}</span>
                <span className="text-gray-400">/ngày</span>
              </div>
            </div>
            <a
              href={`${ZALO_LINK}?text=${zaloMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#4ade80] text-black rounded-full font-bold hover:bg-[#22c55e] transition-all hover:scale-105 whitespace-nowrap self-start sm:self-auto"
            >
              <MessageCircle className="w-5 h-5" />
              Đặt xe qua Zalo
            </a>
          </div>
        </div>
      </section>

      {/* Detail Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Image + Description */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl overflow-hidden bg-[#111111] border border-white/5 aspect-video">
                <img
                  src={car.images[0]}
                  alt={car.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {car.description && (
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-3">Giới thiệu xe</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{car.description}</p>
                </div>
              )}

              {car.useCases && car.useCases.length > 0 && (
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-3">Phù hợp cho</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.useCases.map((uc) => (
                      <span key={uc} className="px-3 py-1.5 bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80] text-sm rounded-full">
                        {uc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Price card */}
              <div className="bg-[#111111] rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Giá thuê ngày lẻ</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-[#4ade80]">{formatPrice(car.price)}</span>
                      <span className="text-gray-500 text-sm">/ngày</span>
                    </div>
                  </div>
                  {car.priceMonth && (
                    <div className="text-right">
                      <div className="text-gray-500 text-xs mb-1">Thuê tháng</div>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-lg font-semibold text-white">{formatPrice(car.priceMonth)}</span>
                        <span className="text-gray-500 text-xs">/tháng</span>
                      </div>
                    </div>
                  )}
                </div>
                <a
                  href={`${ZALO_LINK}?text=${zaloMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#4ade80] text-black rounded-xl font-bold hover:bg-[#22c55e] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Đặt xe qua Zalo
                </a>
                <p className="text-center text-gray-600 text-xs mt-3">
                  Phản hồi trong 30 phút · Giao xe tận nơi
                </p>
              </div>

              {/* Specs Grid */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Thông số xe</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Users className="w-4 h-4 text-[#4ade80]" />, label: 'Số chỗ', value: `${car.seats} chỗ ngồi` },
                    { icon: fuelIcon(car.fuel), label: 'Nhiên liệu', value: car.fuel },
                    { icon: <Settings className="w-4 h-4 text-[#4ade80]" />, label: 'Hộp số', value: car.transmission },
                    { icon: <Gauge className="w-4 h-4 text-[#4ade80]" />, label: 'Km miễn phí', value: `${car.kmPerDay} km/ngày` },
                  ].map((spec) => (
                    <div key={spec.label} className="bg-[#111111] rounded-xl p-4 border border-white/5 flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#4ade80]/10 rounded-lg flex items-center justify-center shrink-0">
                        {spec.icon}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{spec.label}</div>
                        <div className="font-semibold text-white text-sm">{spec.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Tiện nghi đi kèm</h2>
                <div className="bg-[#111111] rounded-2xl p-5 border border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {car.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-[#4ade80]/10 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        </div>
                        <span className="text-gray-300 text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Điều kiện thuê xe</h2>
                <div className="bg-[#111111] rounded-2xl p-5 border border-white/5 space-y-3">
                  {car.conditions.map((condition) => (
                    <div key={condition} className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-sm">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="bg-gradient-to-br from-[#4ade80]/10 to-transparent border border-[#4ade80]/20 rounded-2xl p-6 text-center">
                <h3 className="text-white font-semibold mb-2">Sẵn sàng đặt xe?</h3>
                <p className="text-gray-500 text-sm mb-4">Nhắn tin Zalo — xác nhận lịch trong 30 phút</p>
                <a
                  href={`${ZALO_LINK}?text=${zaloMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#4ade80] text-black rounded-full font-bold hover:bg-[#22c55e] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Zalo ngay
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Cars */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">Xe tương tự</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {displayRelated.map((c) => (
              <CarCard key={c.slug} car={c} compact />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
