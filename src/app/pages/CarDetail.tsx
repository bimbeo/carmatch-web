import { useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  Car,
  Menu,
  X,
  Facebook,
  Instagram,
  Users,
  Fuel,
  Settings,
  Gauge,
  Check,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { cars, formatPrice } from '@/data/cars';

const ZALO_LINK = 'https://zalo.me/0';

export default function CarDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const car = cars.find((c) => c.slug === slug);
  const relatedCars = cars.filter((c) => c.slug !== slug).slice(0, 3);

  if (!car) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="text-6xl font-bold text-[#4ade80] mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-4">Không tìm thấy xe</h1>
          <p className="text-gray-400 mb-8">Xe bạn đang tìm kiếm không tồn tại.</p>
          <Link to="/" className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors inline-block">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Car className="w-6 h-6 text-[#4ade80]" />
              <span className="text-xl font-bold text-white">CarMatch</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/#fleet" className="text-sm text-gray-300 hover:text-white transition-colors">Thuê xe tự lái</Link>
              <Link to="/#b2b" className="text-sm text-gray-300 hover:text-white transition-colors">Thuê xe dài hạn</Link>
              <Link to="/#about" className="text-sm text-gray-300 hover:text-white transition-colors">Giới thiệu</Link>
              <Link to="/#contact" className="text-sm text-gray-300 hover:text-white transition-colors">Liên hệ</Link>
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer">
                <button className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors">
                  Đặt xe ngay
                </button>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-white/5">
            <div className="px-4 py-4 space-y-4">
              <Link to="/#fleet" className="block text-sm text-gray-300">Thuê xe tự lái</Link>
              <Link to="/#b2b" className="block text-sm text-gray-300">Thuê xe dài hạn</Link>
              <Link to="/#about" className="block text-sm text-gray-300">Giới thiệu</Link>
              <Link to="/#contact" className="block text-sm text-gray-300">Liên hệ</Link>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer">
                <button className="w-full px-6 py-2 bg-white text-black rounded-full font-medium">
                  Đặt xe ngay
                </button>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-end overflow-hidden pt-16">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={car.image}
            alt={car.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đội xe
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              {car.available && (
                <span className="inline-block px-3 py-1 bg-[#4ade80]/20 text-[#4ade80] text-xs font-semibold rounded-full mb-3 border border-[#4ade80]/30">
                  Sẵn sàng
                </span>
              )}
              <h1 className="text-4xl md:text-6xl font-bold text-white">{car.name}</h1>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#4ade80]">{formatPrice(car.price)}</span>
                <span className="text-gray-400">/ngày</span>
              </div>
            </div>
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer">
              <button className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all hover:scale-105 whitespace-nowrap">
                Đặt xe qua Zalo
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Detail Section */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Large Car Image (sticky) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl overflow-hidden bg-[#111111] border border-white/5">
                <ImageWithFallback
                  src={car.image}
                  alt={car.name}
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-8">
              {/* Price */}
              <div className="bg-[#111111] rounded-2xl p-6 border border-white/5">
                <div className="text-gray-400 text-sm mb-1">Giá thuê</div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-[#4ade80]">{formatPrice(car.price)}</span>
                  <span className="text-gray-400 pb-1">/ngày</span>
                </div>
              </div>

              {/* Specs Grid */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Thông số xe</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111111] rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Số chỗ</div>
                      <div className="font-semibold text-white">{car.seats} chỗ</div>
                    </div>
                  </div>

                  <div className="bg-[#111111] rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Fuel className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Nhiên liệu</div>
                      <div className="font-semibold text-white">{car.fuel}</div>
                    </div>
                  </div>

                  <div className="bg-[#111111] rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Hộp số</div>
                      <div className="font-semibold text-white">{car.transmission}</div>
                    </div>
                  </div>

                  <div className="bg-[#111111] rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gauge className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Giới hạn km/ngày</div>
                      <div className="font-semibold text-white">{car.kmPerDay} km</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Tiện nghi</h2>
                <div className="bg-[#111111] rounded-2xl p-6 border border-white/5 space-y-3">
                  {car.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-[#4ade80]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-[#4ade80]" />
                      </div>
                      <span className="text-white">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Điều kiện thuê</h2>
                <div className="bg-[#111111] rounded-2xl p-6 border border-white/5 space-y-3">
                  {car.conditions.map((condition, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-[#4ade80]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-3 h-3 text-[#4ade80]" />
                      </div>
                      <span className="text-gray-300 text-sm">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div>
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="block">
                  <button className="w-full py-4 bg-white text-black rounded-full font-semibold text-lg hover:bg-gray-200 transition-all hover:scale-[1.02]">
                    Đặt xe qua Zalo
                  </button>
                </a>
                <p className="text-center text-gray-400 text-sm mt-3">
                  Phản hồi trong 30 phút · Giao xe tận nơi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Cars */}
      <section className="py-16 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-8">Xe khác bạn có thể thích</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedCars.map((relatedCar) => (
              <div
                key={relatedCar.slug}
                className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:border-[#4ade80]/30 transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-[#4ade80]/10"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
                  <ImageWithFallback
                    src={relatedCar.image}
                    alt={relatedCar.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  {relatedCar.available && (
                    <span className="inline-block px-3 py-1 bg-[#4ade80]/10 text-[#4ade80] text-xs font-semibold rounded-full mb-3">
                      Sẵn sàng
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white mb-3">{relatedCar.name}</h3>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-white/5">
                      {relatedCar.seats} chỗ
                    </span>
                    <span className="px-3 py-1 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-white/5">
                      {relatedCar.fuel}
                    </span>
                    <span className="px-3 py-1 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-white/5">
                      {relatedCar.transmission}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-[#4ade80]">từ {formatPrice(relatedCar.price)}</span>
                    <span className="text-gray-400">/ngày</span>
                  </div>
                  <Link to={`/xe/${relatedCar.slug}`}>
                    <button className="w-full py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors">
                      Xem chi tiết
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-6 h-6 text-[#4ade80]" />
                <span className="text-xl font-bold text-white">CarMatch</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Cho thuê xe tự lái Hà Nội
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center hover:bg-[#4ade80]/20 transition-colors">
                  <span className="text-[#4ade80] font-bold text-sm">Z</span>
                </a>
                <a href="#" className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center hover:bg-[#4ade80]/20 transition-colors">
                  <Facebook className="w-5 h-5 text-[#4ade80]" />
                </a>
                <a href="#" className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center hover:bg-[#4ade80]/20 transition-colors">
                  <span className="text-[#4ade80] font-bold text-sm">TT</span>
                </a>
                <a href="#" className="w-10 h-10 bg-[#4ade80]/10 rounded-lg flex items-center justify-center hover:bg-[#4ade80]/20 transition-colors">
                  <Instagram className="w-5 h-5 text-[#4ade80]" />
                </a>
              </div>
            </div>

            {/* Dịch vụ */}
            <div>
              <h4 className="text-white font-semibold mb-4">Dịch vụ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Thuê xe tự lái</a></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Thuê xe dài hạn</a></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Thuê xe doanh nghiệp</a></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Thuê xe sân bay</a></li>
              </ul>
            </div>

            {/* Giới thiệu */}
            <div>
              <h4 className="text-white font-semibold mb-4">Giới thiệu</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/#about" className="hover:text-[#4ade80] transition-colors">Về CarMatch</a></li>
                <li><a href="/#fleet" className="hover:text-[#4ade80] transition-colors">Đội xe</a></li>
                <li><Link to="/blog" className="hover:text-[#4ade80] transition-colors">Tin tức</Link></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Điều khoản</a></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Chính sách</a></li>
              </ul>
            </div>

            {/* Liên hệ */}
            <div>
              <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Hà Nội, Việt Nam</li>
                <li>Zalo: 0xxx-xxx-xxx</li>
                <li>Email: info@carmatch.vn</li>
                <li>Hotline: 1900-xxxx</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-500">
            © 2025 CarMatch. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
