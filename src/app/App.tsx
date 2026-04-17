import { useState } from 'react';
import { Car, Check, Zap, MapPin, DollarSign, Menu, X, Star, Facebook, Instagram } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cars = [
    {
      name: 'VinFast VF8',
      image: 'https://images.unsplash.com/photo-1646644434370-a23a5eaa6d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMG1vZGVybiUyMGVsZWN0cmljJTIwU1VWJTIwc3R1ZGlvfGVufDF8fHx8MTc3NjQzNjA4MHww&ixlib=rb-4.1.0&q=80&w=1080',
      seats: '5 chỗ',
      type: 'Điện',
      transmission: 'Tự động',
      price: '1.100.000đ',
      available: true,
    },
    {
      name: 'VinFast VF6',
      image: 'https://images.unsplash.com/photo-1676919297334-25fe2eb6f8a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxWaW5GYXN0JTIwVkY2JTIwZWxlY3RyaWMlMjBjcm9zc292ZXJ8ZW58MXx8fHwxNzc2NDM2MDc2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      seats: '5 chỗ',
      type: 'Điện',
      transmission: 'Tự động',
      price: '900.000đ',
      available: true,
    },
    {
      name: 'VinFast VF5',
      image: 'https://images.unsplash.com/photo-1774852276663-ed14cf53947e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxWaW5GYXN0JTIwVkY1JTIwY29tcGFjdCUyMFNVVnxlbnwxfHx8fDE3NzY0MzYwNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      seats: '5 chỗ',
      type: 'Điện',
      transmission: 'Tự động',
      price: '750.000đ',
      available: true,
    },
    {
      name: 'Toyota Innova',
      image: 'https://images.unsplash.com/photo-1709620435392-c1ecacde8bd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb3lvdGElMjBJbm5vdmElMjBzaWx2ZXIlMjBtaW5pdmFufGVufDF8fHx8MTc3NjQzNjA3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      seats: '7 chỗ',
      type: 'Xăng',
      transmission: 'Tự động',
      price: '850.000đ',
      available: true,
    },
    {
      name: 'Kia Carnival',
      image: 'https://images.unsplash.com/photo-1709791195523-4e9382c2dc6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLaWElMjBDYXJuaXZhbCUyMG1vZGVybiUyMG1pbml2YW58ZW58MXx8fHwxNzc2NDM2MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      seats: '8 chỗ',
      type: 'Xăng',
      transmission: 'Tự động',
      price: '1.300.000đ',
      available: true,
    },
    {
      name: 'Hyundai Creta',
      image: 'https://images.unsplash.com/photo-1638715403373-ab0e256782f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIeXVuZGFpJTIwQ3JldGElMjB3aGl0ZSUyMFNVVnxlbnwxfHx8fDE3NzY0MzYwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      seats: '5 chỗ',
      type: 'Xăng',
      transmission: 'Tự động',
      price: '700.000đ',
      available: true,
    },
  ];

  const features = [
    {
      icon: Car,
      title: 'Xe mới, đa dạng',
      description: 'Đội xe VinFast và Nhật Bản đa dạng',
    },
    {
      icon: MapPin,
      title: 'Giao xe tận nơi',
      description: 'Toàn Hà Nội, sân bay Nội Bài',
    },
    {
      icon: DollarSign,
      title: 'Giá minh bạch',
      description: 'Không phát sinh chi phí ẩn',
    },
    {
      icon: Zap,
      title: 'Xác nhận nhanh',
      description: 'Phản hồi trong 30 phút qua Zalo',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Car className="w-6 h-6 text-[#4ade80]" />
              <span className="text-xl font-bold text-white">CarMatch</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#fleet" className="text-sm text-gray-300 hover:text-white transition-colors">Thuê xe tự lái</a>
              <a href="#b2b" className="text-sm text-gray-300 hover:text-white transition-colors">Thuê xe dài hạn</a>
              <a href="#about" className="text-sm text-gray-300 hover:text-white transition-colors">Giới thiệu</a>
              <a href="#contact" className="text-sm text-gray-300 hover:text-white transition-colors">Liên hệ</a>
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <button className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors">
                Đặt xe ngay
              </button>
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
              <a href="#fleet" className="block text-sm text-gray-300">Thuê xe tự lái</a>
              <a href="#b2b" className="block text-sm text-gray-300">Thuê xe dài hạn</a>
              <a href="#about" className="block text-sm text-gray-300">Giới thiệu</a>
              <a href="#contact" className="block text-sm text-gray-300">Liên hệ</a>
              <button className="w-full px-6 py-2 bg-white text-black rounded-full font-medium">
                Đặt xe ngay
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0a0a0a] to-[#1a1a1a]" />
        
        {/* Hero Car Image */}
        <div className="absolute bottom-0 right-0 w-full md:w-3/5 h-2/3 md:h-4/5 opacity-40 md:opacity-60">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1684323672225-5612929e9fff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJpYyUyMGNhciUyMGRhcmslMjBiYWNrZ3JvdW5kJTIwaGVyb3xlbnwxfHx8fDE3NzY0MzYwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="VinFast Car"
            className="w-full h-full object-contain object-right-bottom"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-[#4ade80] mb-6 leading-tight"
              style={{ textShadow: '0 0 40px rgba(74, 222, 128, 0.3)' }}
            >
              Thuê Xe Tự Lái<br />Tại Hà Nội
            </h1>
            <p className="text-lg md:text-xl text-white mb-8 max-w-xl">
              Đội xe 20+ chiếc | Giao xe tận nơi | Hỗ trợ 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all hover:scale-105">
                Đặt xe qua Zalo
              </button>
              <button className="px-8 py-3 bg-transparent text-white border-2 border-white rounded-full font-semibold hover:bg-white/10 transition-all">
                Xem đội xe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#111111] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#4ade80] mb-1">20+</div>
              <div className="text-sm text-gray-400">Xe đa dạng</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#4ade80] mb-1">2+</div>
              <div className="text-sm text-gray-400">Năm kinh nghiệm</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#4ade80] mb-1">500+</div>
              <div className="text-sm text-gray-400">Khách hàng</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-3xl md:text-4xl font-bold text-[#4ade80] mb-1">
                4.9<Star className="w-6 h-6 fill-[#4ade80]" />
              </div>
              <div className="text-sm text-gray-400">Đánh giá</div>
            </div>
          </div>
        </div>
      </section>

      {/* Car Fleet Section */}
      <section id="fleet" className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="text-sm text-[#4ade80] font-semibold mb-3 tracking-wider uppercase">ĐỘI XE</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">Lựa chọn xe phù hợp với bạn</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car, index) => (
              <div
                key={index}
                className="bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:border-[#4ade80]/30 transition-all hover:-translate-y-2 hover:shadow-xl hover:shadow-[#4ade80]/10"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
                  <ImageWithFallback
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  {car.available && (
                    <span className="inline-block px-3 py-1 bg-[#4ade80]/10 text-[#4ade80] text-xs font-semibold rounded-full mb-3">
                      Sẵn sàng
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white mb-3">{car.name}</h3>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-white/5">
                      {car.seats}
                    </span>
                    <span className="px-3 py-1 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-white/5">
                      {car.type}
                    </span>
                    <span className="px-3 py-1 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-white/5">
                      {car.transmission}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-[#4ade80]">từ {car.price}</span>
                    <span className="text-gray-400">/ngày</span>
                  </div>
                  <button className="w-full py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors">
                    Đặt xe ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CarMatch Section */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Vì sao chọn CarMatch?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-[#111111] p-8 rounded-2xl border border-white/5 hover:border-[#4ade80]/30 transition-all hover:-translate-y-2"
                >
                  <div className="w-12 h-12 bg-[#4ade80]/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#4ade80]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* B2B Section */}
      <section id="b2b" className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#111111] rounded-3xl p-8 md:p-12 border-l-4 border-[#4ade80]">
            <div className="max-w-3xl">
              <div className="text-sm text-[#4ade80] font-semibold mb-3 tracking-wider uppercase">DOANH NGHIỆP</div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Thuê Xe Dài Hạn Cho Doanh Nghiệp
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Hợp đồng tháng linh hoạt, tiết kiệm chi phí di chuyển cho team
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4ade80] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <p className="text-white">Từ 6 xe trở lên, giá ưu đãi đặc biệt</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4ade80] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <p className="text-white">Xe thay thế ngay khi cần bảo dưỡng</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4ade80] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <p className="text-white">Báo cáo chi phí hàng tháng</p>
                </div>
              </div>

              <button className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all hover:scale-105">
                Nhận báo giá
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book Section */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Đặt xe chỉ 3 bước</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4ade80] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chọn xe và ngày thuê</h3>
              <p className="text-gray-400">Xem đội xe và chọn xe phù hợp với nhu cầu</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4ade80] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nhắn Zalo xác nhận</h3>
              <p className="text-gray-400">Gửi thông tin đặt xe qua Zalo để xác nhận</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#4ade80] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-black">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nhận xe và lên đường</h3>
              <p className="text-gray-400">Giao xe tận nơi hoặc đến văn phòng nhận xe</p>
            </div>
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
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Về CarMatch</a></li>
                <li><a href="#" className="hover:text-[#4ade80] transition-colors">Đội xe</a></li>
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
