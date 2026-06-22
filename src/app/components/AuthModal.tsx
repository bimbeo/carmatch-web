import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, History, Shield, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onClose: () => void
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function AuthModal({ onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleGoogleLogin() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/tai-khoan` },
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Đăng nhập tài khoản"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
          aria-label="Đóng"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-7 pt-8 pb-10 text-white">
          <img
            src="/brand/carmatch-lockup-white.png"
            alt="Car Match"
            className="h-7 w-auto object-contain mb-6"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <h2 className="text-xl font-bold mb-1">Tài khoản CarMatch</h2>
          <p className="text-white/65 text-sm leading-relaxed">
            Xem lịch sử đặt xe và quản lý giấy tờ của bạn.
          </p>

          <div className="mt-5 space-y-2.5">
            {[
              { icon: <History className="w-3.5 h-3.5" />, text: 'Xem toàn bộ lịch sử đặt xe' },
              { icon: <Shield className="w-3.5 h-3.5" />, text: 'Lưu GPLX & CCCD dùng cho mọi lần thuê' },
              { icon: <Phone className="w-3.5 h-3.5" />, text: 'Không cần gửi giấy tờ qua Zalo nữa' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-white/75 text-[13px]">
                <span className="text-white/45 shrink-0">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Body — login */}
        <div className="px-7 py-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm text-[15px]"
          >
            <GoogleIcon />
            Đăng nhập bằng Google
          </button>

          <p className="mt-4 text-center text-[11px] text-gray-400 leading-relaxed">
            Chỉ cần tài khoản Google — không cần tạo mật khẩu mới.{' '}
            <a href="/chinh-sach" className="underline hover:text-gray-600" onClick={onClose}>
              Điều khoản
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
