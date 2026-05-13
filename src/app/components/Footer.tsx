import { Link } from 'react-router';
import { Car, Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

const ZALO_LINK = 'https://zalo.me/0975563290';
const PHONE = '0975 563 290';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Car className="w-6 h-6 text-green-400" />
              <span className="text-xl font-bold text-white">CarMatch</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Dịch vụ cho thuê xe tự lái uy tín tại Hà Nội. Xe mới, giá tốt, giao xe tận nơi.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4 text-gray-300" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4 text-gray-300" />
              </a>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#0068FF]/30 flex items-center justify-center hover:bg-[#0068FF]/50 transition-colors">
                <span className="text-[#60a5fa] text-xs font-bold">Z</span>
              </a>
            </div>
          </div>

          {/* Dịch vụ */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Dịch vụ</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/xe', label: 'Thuê xe tự lái' },
                { href: '/thue-xe-thang', label: 'Thuê xe theo tháng' },
                { href: '/xe?category=electric', label: 'Xe điện VinFast' },
                { href: '/xe?seats=7', label: 'Xe 7 chỗ' },
              ].map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Thông tin */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Thông tin</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/gioi-thieu', label: 'Về CarMatch' },
                { href: '/blog', label: 'Blog & Kinh nghiệm' },
                { href: '/gioi-thieu#quy-trinh', label: 'Quy trình thuê xe' },
                { href: '/gioi-thieu#dieu-kien', label: 'Điều kiện & Chính sách' },
              ].map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Liên hệ</h3>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${PHONE.replace(/\s/g, '')}`}
                  className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                  <span className="text-sm">{PHONE}</span>
                </a>
              </li>
              <li>
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group">
                  <span className="w-4 h-4 mt-0.5 shrink-0 text-[#60a5fa] font-bold text-xs leading-none">Z</span>
                  <span className="text-sm">Zalo: {PHONE}</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@carmatch.vn"
                  className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-green-400 transition-colors" />
                  <span className="text-sm">info@carmatch.vn</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-gray-400">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="text-sm">Hà Nội, Việt Nam</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">© 2025 CarMatch. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-6">
            <Link to="/gioi-thieu" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">Chính sách</Link>
            <Link to="/gioi-thieu" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
