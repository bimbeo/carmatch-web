import { Link } from 'react-router';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0971163290';
const FACEBOOK_LINK = 'https://www.facebook.com/carmatchvn';
const INSTAGRAM_LINK = 'https://www.instagram.com/carmatchvn/';
const PHONE = '0971 163 290';

export default function Footer() {
  return (
    <footer className="bg-gray-900 pb-28 pt-10 text-white md:pb-8 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: keep only the actions and links people need at the end of the page. */}
        <div className="md:hidden">
          <Link to="/" className="inline-flex items-center" aria-label="Car Match">
            <img
              src="/brand/carmatch-lockup-white.png"
              alt="Car Match"
              width="288"
              height="66"
              loading="lazy"
              decoding="async"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <p className="mt-3 text-sm text-gray-400">Thuê xe tự lái tại Hà Nội.</p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <a
              href={`tel:${PHONE.replace(/\s/g, '')}`}
              onClick={() => trackPhoneClick('footer_mobile')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-gray-900"
            >
              <Phone className="h-4 w-4" /> Gọi
            </a>
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="me noopener noreferrer"
              onClick={() => trackZaloClick('footer_mobile')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 text-sm font-bold text-white"
            >
              <span className="font-black">Z</span> Zalo
            </a>
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-5 text-sm" aria-label="Liên kết cuối trang">
            <Link to="/xe" className="text-gray-300 hover:text-white">Danh sách xe</Link>
            <Link to="/thue-xe-thang" className="text-gray-300 hover:text-white">Thuê xe tháng</Link>
            <Link to="/chinh-sach" className="text-gray-300 hover:text-white">Chính sách</Link>
            <Link to="/lien-he" className="text-gray-300 hover:text-white">Liên hệ</Link>
          </nav>

          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} Car Match
          </p>
        </div>

        <div className="mb-12 hidden grid-cols-1 gap-10 md:grid md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 inline-flex items-center" aria-label="Car Match">
              <img
                src="/brand/carmatch-lockup-white.png"
                alt="Car Match logo màu trắng"
                width="288"
                height="66"
                loading="lazy"
                decoding="async"
                className="h-10 w-auto object-contain"
              />
              <span className="sr-only">Trang chủ Car Match</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Thuê xe tự lái tại Hà Nội theo ngày hoặc theo tháng. Giao nhận xe tận sảnh chung cư hoặc điểm hẹn theo lịch đã xác nhận.
            </p>
            <div className="flex items-center gap-3">
              <a href={FACEBOOK_LINK} target="_blank" rel="me noopener noreferrer" aria-label="Facebook Car Match"
                onClick={() => trackCtaClick('footer_social_facebook', { target: FACEBOOK_LINK })}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4 text-gray-300" />
                <span className="sr-only">Facebook Car Match</span>
              </a>
              <a href={INSTAGRAM_LINK} target="_blank" rel="me noopener noreferrer" aria-label="Instagram Car Match"
                onClick={() => trackCtaClick('footer_social_instagram', { target: INSTAGRAM_LINK })}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4 text-gray-300" />
                <span className="sr-only">Instagram Car Match</span>
              </a>
              <a href={ZALO_LINK} target="_blank" rel="me noopener noreferrer" aria-label="Zalo"
                onClick={() => trackZaloClick('footer_social')}
                className="w-9 h-9 rounded-full bg-[#0068FF]/30 flex items-center justify-center hover:bg-[#0068FF]/50 transition-colors">
                <span className="text-[#60a5fa] text-xs font-bold">Z</span>
                <span className="sr-only">Zalo Car Match</span>
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
                { href: '/di-dau/chu-de/di-xe-dien', label: 'Xe điện VinFast' },
                { href: '/di-dau/chu-de/xe-7-cho-di-tinh', label: 'Xe 7 chỗ' },
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
                { href: '/gioi-thieu', label: 'Về Car Match' },
                { href: '/lien-he', label: 'Liên hệ Car Match' },
                { href: '/blog', label: 'Blog & Kinh nghiệm' },
                { href: '/gioi-thieu#quy-trinh', label: 'Quy trình thuê xe' },
                { href: '/chinh-sach', label: 'Điều kiện & Chính sách' },
                { href: '/faq', label: 'Câu hỏi thường gặp' },
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
                  onClick={() => trackPhoneClick('footer_contact')}
                  className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group">
                  <Phone className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-brand-400 transition-colors" />
                  <span className="text-sm">{PHONE}</span>
                </a>
              </li>
              <li>
                <a href={ZALO_LINK} target="_blank" rel="me noopener noreferrer"
                  onClick={() => trackZaloClick('footer_contact')}
                  className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group">
                  <span className="w-4 h-4 mt-0.5 shrink-0 text-[#60a5fa] font-bold text-xs leading-none">Z</span>
                  <span className="text-sm">Zalo: {PHONE}</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@carmatch.vn"
                  className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors group">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0 group-hover:text-brand-400 transition-colors" />
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
        <div className="hidden border-t border-white/10 pt-6 md:flex md:flex-row md:items-center md:justify-between md:gap-4">
          <p className="text-gray-400 text-xs">© {new Date().getFullYear()} Car Match. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-6">
            <Link to="/chinh-sach" className="text-gray-400 text-xs hover:text-white transition-colors">Chính sách</Link>
            <Link to="/lien-he" className="text-gray-400 text-xs hover:text-white transition-colors">Liên hệ</Link>
            <Link to="/chinh-sach" className="text-gray-400 text-xs hover:text-white transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
