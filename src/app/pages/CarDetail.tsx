import { useParams, Link } from 'react-router';
import { Users, Fuel, Settings, Gauge, Check, Shield, ArrowLeft, MessageCircle, Zap } from 'lucide-react';
import { cars, formatPrice } from '@/data/cars';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';

const ZALO_LINK = 'https://zalo.me/0975563290';

export default function CarDetail() {
  const { slug } = useParams<{ slug: string }>();
  const car = cars.find((c) => c.slug === slug);
  const relatedCars = cars.filter((c) => c.slug !== slug && c.category === car?.category).slice(0, 3);
  const fallbackRelated = cars.filter((c) => c.slug !== slug).slice(0, 3);

  if (!car) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="text-6xl font-bold text-green-600 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy xe</h1>
          <p className="text-gray-500 mb-8">Xe bạn đang tìm kiếm không tồn tại.</p>
          <Link to="/xe" className="px-8 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors inline-block">
            Xem tất cả xe
          </Link>
        </div>
      </div>
    );
  }

  const displayRelated = relatedCars.length > 0 ? relatedCars : fallbackRelated;
  const zaloMessage = encodeURIComponent(`Xin chào CarMatch! Tôi muốn thuê xe ${car.name}. Cho tôi hỏi về lịch trống và giá thuê ạ.`);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero Image */}
      <section className="relative h-[55vh] min-h-[380px] flex items-end overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={car.images[0]} alt={car.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full">
          <Link to="/xe" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách xe
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              {car.available && (
                <span className="inline-block px-3 py-1 bg-green-500/90 text-white text-xs font-semibold rounded-full mb-3">
                  ● Sẵn sàng cho thuê
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white">{car.name}</h1>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-400">{formatPrice(car.price)}</span>
                <span className="text-white/70">/ngày</span>
              </div>
            </div>
            <a href={`${ZALO_LINK}?text=${zaloMessage}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all hover:scale-105 whitespace-nowrap self-start sm:self-auto shadow-lg">
              <MessageCircle className="w-5 h-5" />
              Đặt xe qua Zalo
            </a>
          </div>
        </div>
      </section>

      {/* Detail */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
                <img src={car.images[0]} alt={car.name} className="w-full h-full object-cover" />
              </div>
              {car.description && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-gray-900 font-semibold mb-3">Giới thiệu xe</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{car.description}</p>
                </div>
              )}
              {car.useCases && car.useCases.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-gray-900 font-semibold mb-3">Phù hợp cho</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.useCases.map((uc) => (
                      <span key={uc} className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-full font-medium">
                        {uc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="space-y-6">
              {/* Price card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Giá thuê ngày lẻ</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-green-600">{formatPrice(car.price)}</span>
                      <span className="text-gray-400 text-sm">/ngày</span>
                    </div>
                  </div>
                  {car.priceMonth && (
                    <div className="text-right">
                      <div className="text-gray-400 text-xs mb-1">Thuê tháng</div>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-lg font-semibold text-gray-900">{formatPrice(car.priceMonth)}</span>
                        <span className="text-gray-400 text-xs">/tháng</span>
                      </div>
                    </div>
                  )}
                </div>
                <a href={`${ZALO_LINK}?text=${zaloMessage}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm shadow-green-200">
                  <MessageCircle className="w-4 h-4" />
                  Đặt xe qua Zalo
                </a>
                <p className="text-center text-gray-400 text-xs mt-3">Phản hồi trong 30 phút · Giao xe tận nơi</p>
              </div>

              {/* Specs */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Thông số xe</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Users className="w-4 h-4 text-green-600" />, label: 'Số chỗ', value: `${car.seats} chỗ ngồi` },
                    { icon: car.fuel === 'Điện' ? <Zap className="w-4 h-4 text-green-600" /> : <Fuel className="w-4 h-4 text-green-600" />, label: 'Nhiên liệu', value: car.fuel },
                    { icon: <Settings className="w-4 h-4 text-green-600" />, label: 'Hộp số', value: car.transmission },
                    { icon: <Gauge className="w-4 h-4 text-green-600" />, label: 'Km miễn phí', value: `${car.kmPerDay} km/ngày` },
                  ].map((spec) => (
                    <div key={spec.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                        {spec.icon}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{spec.label}</div>
                        <div className="font-semibold text-gray-900 text-sm">{spec.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Tiện nghi đi kèm</h2>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {car.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Điều kiện thuê xe</h2>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                  {car.conditions.map((condition) => (
                    <div key={condition} className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <h3 className="text-gray-900 font-semibold mb-2">Sẵn sàng đặt xe?</h3>
                <p className="text-gray-500 text-sm mb-4">Nhắn tin Zalo — xác nhận lịch trong 30 phút</p>
                <a href={`${ZALO_LINK}?text=${zaloMessage}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Chat Zalo ngay
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Xe tương tự</h2>
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
