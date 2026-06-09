import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';

const ZALO_LINK = 'https://zalo.me/0975563290';

const navLinks = [
  { href: '/xe', label: 'Thuê xe tự lái' },
  { href: '/di-dau', label: 'Đi đâu' },
  { href: '/lap-ke-hoach-chuyen-di', label: 'Lập chuyến đi' },
  { href: '/thue-xe-thang', label: 'Thuê xe tháng' },
  { href: '/hop-tac', label: 'Hợp tác chủ xe' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/blog', label: 'Blog', staticPage: true },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow ${scrolled ? 'shadow-sm' : ''} border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="Car Match">
            <img
              src="/brand/carmatch-lockup-navy.png"
              alt="Car Match"
              width="288"
              height="66"
              fetchPriority="high"
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const className = `text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? 'text-brand-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`;

              return link.staticPage ? (
                <a key={link.href} href={link.href} className={className}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} to={link.href} className={className}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-brand-600 text-white rounded-full font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm"
            >
              Đặt xe qua Zalo
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const className = `block px-3 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                location.pathname === link.href
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`;

              return link.staticPage ? (
                <a key={link.href} href={link.href} className={className}>
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={className}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 pb-1">
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-brand-600 text-white rounded-full font-semibold text-sm text-center hover:bg-brand-700 transition-colors"
              >
                Đặt xe qua Zalo
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
