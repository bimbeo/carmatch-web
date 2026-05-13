import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Car, Menu, X } from 'lucide-react';

const ZALO_LINK = 'https://zalo.me/0975563290';

const navLinks = [
  { href: '/xe', label: 'Thuê xe tự lái' },
  { href: '/thue-xe-thang', label: 'Thuê xe tháng' },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/blog', label: 'Blog' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm transition-colors ${
                  location.pathname === link.href
                    ? 'text-white font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-[#4ade80] text-black rounded-full font-semibold text-sm hover:bg-[#22c55e] transition-colors"
            >
              Đặt xe qua Zalo
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0f0f0f] border-t border-white/5">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  location.pathname === link.href
                    ? 'text-white bg-white/10 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/5">
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-[#4ade80] text-black rounded-full font-semibold text-sm text-center hover:bg-[#22c55e] transition-colors"
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
