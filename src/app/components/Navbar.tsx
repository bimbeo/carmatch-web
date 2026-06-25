import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, UserCircle } from 'lucide-react';
import { trackZaloClick } from '@/lib/analytics';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';

// Read Supabase session from localStorage synchronously to avoid auth flash on hydration
function getStoredSession(): Session | null {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const ref = url?.match(/https?:\/\/([^.]+)/)?.[1];
    if (!ref) return null;
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session & { expires_at?: number };
    if (!parsed?.access_token) return null;
    if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

const ZALO_LINK = 'https://zalo.me/0975563290';

const navLinks = [
  { href: '/xe', label: 'Thuê xe tự lái' },
  { href: '/di-dau', label: 'Đi đâu' },
  { href: '/lap-ke-hoach-chuyen-di', label: 'Lập chuyến đi' },
  { href: '/thue-xe-thang', label: 'Thuê xe tháng' },
  { href: '/hop-tac', label: 'Hợp tác chủ xe' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/lien-he', label: 'Liên hệ' },
  { href: '/blog', label: 'Blog', staticPage: true },
  { href: '/tai-khoan', label: 'Tài khoản của tôi' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<Session | null>(getStoredSession);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm transition-shadow ${scrolled ? 'shadow-sm' : ''} border-b border-gray-100`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Bỏ qua menu
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="Car Match">
            <img
              src="/brand/carmatch-lockup-navy.png"
              alt="Car Match logo màu navy"
              width="288"
              height="66"
              decoding="async"
              className="h-9 w-auto object-contain"
            />
            <span className="sr-only">Trang chủ Car Match</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.filter(l => l.href !== '/tai-khoan').map((link) => {
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
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <Link
                to="/tai-khoan"
                aria-label="Tài khoản"
                className={`p-1 rounded-full transition-colors ${
                  location.pathname === '/tai-khoan' ? 'ring-2 ring-brand-600' : ''
                }`}
              >
                {session.user.user_metadata?.avatar_url ? (
                  <img
                    src={session.user.user_metadata.avatar_url as string}
                    alt="Tài khoản"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {((session.user.user_metadata?.full_name as string) ?? session.user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                aria-label="Đăng nhập"
                className="p-2 rounded-full transition-colors text-gray-500 hover:text-gray-800"
              >
                <UserCircle className="w-5 h-5" />
              </button>
            )}
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="me noopener noreferrer"
              onClick={() => trackZaloClick('navbar_desktop')}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-full font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm"
              data-cta="navbar-zalo"
            >
              Đặt xe qua Zalo<span className="sr-only"> từ thanh điều hướng</span>
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
            {navLinks.filter(l => l.href !== '/tai-khoan').map((link) => {
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

            {/* Account link mobile */}
            {session ? (
              <Link
                to="/tai-khoan"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                  location.pathname === '/tai-khoan' ? 'text-brand-600 bg-brand-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tài khoản của tôi
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setShowAuthModal(true); }}
                className="block w-full text-left px-3 py-2.5 text-sm rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Đăng nhập
              </button>
            )}

            <div className="pt-3 pb-1">
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="me noopener noreferrer"
                onClick={() => trackZaloClick('navbar_mobile')}
                className="block w-full px-4 py-3 bg-brand-600 text-white rounded-full font-semibold text-sm text-center hover:bg-brand-700 transition-colors"
              >
                Đặt xe qua Zalo
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </nav>
  );
}
