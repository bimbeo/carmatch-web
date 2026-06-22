import { useEffect, useRef, useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LogOut, Upload, CheckCircle, Clock, Car, FileText, ChevronRight, X, Camera, Shield, History, Phone, Copy, Check, Gift, Tag, Star, Award } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '../components/Navbar'

// ─── Types ───────────────────────────────────────────────────────────────────

type Booking = {
  booking_id: string
  booking_code: string | null
  status: string
  pickup_date: string | null
  return_date: string | null
  requested_vehicle_text: string | null
  pickup_location_text: string | null
  created_at: string
  billing_days: number | null
  daily_rate: number | null
  itinerary: string | null
}

type WebLead = {
  booking_ref: string
  status: string
  car_model: string | null
  building: string | null
  duration: string | null
  deposit_amount: number | null
  created_at: string
}

type CustomerDoc = {
  doc_id: string
  document_type: string
  title: string
  file_url: string
  file_name: string | null
  source: string
  created_at: string
}

type CustomerInfo = {
  customer_id: string
  full_name: string
  loyalty_tier: string
  referral_code: string | null
  first_seen_at: string | null
  last_rental_at: string | null
}

type PromoCode = {
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  max_discount: number | null
  min_order: number | null
  expires_at: string | null
  first_time_only: boolean
  weekends_only: boolean
}

type ReferralReward = {
  reward_id: string
  status: string
  reward_value: number
  reward_note: string | null
  created_at: string
  paid_at: string | null
}

type LoyaltyDiscount = {
  discount_amount: number
  enabled: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  needs_review: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  active: 'Đang thuê',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  pending: 'Chờ xử lý',
  new: 'Chờ xác nhận',
}

const STATUS_COLOR: Record<string, string> = {
  needs_review: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-slate-50 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  new: 'bg-amber-50 text-amber-700 border-amber-200',
}

const STATUS_DOT: Record<string, string> = {
  needs_review: 'bg-amber-400',
  confirmed: 'bg-sky-500',
  active: 'bg-emerald-500',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-400',
  pending: 'bg-amber-400',
  new: 'bg-amber-400',
}

const DOC_LABELS: Record<string, string> = {
  gplx: 'Giấy phép lái xe (GPLX)',
  cccd_front: 'CCCD mặt trước',
  cccd_back: 'CCCD mặt sau',
  other: 'Giấy tờ khác',
}

const TIER_LABEL: Record<string, { label: string; color: string }> = {
  new: { label: 'Khách mới', color: 'bg-slate-100 text-slate-600' },
  regular: { label: 'Khách thân thiết', color: 'bg-blue-100 text-blue-700' },
  vip: { label: 'VIP', color: 'bg-amber-100 text-amber-700' },
  platinum: { label: 'Platinum', color: 'bg-purple-100 text-purple-700' },
}

const UPLOAD_SLOTS = [
  { type: 'gplx', label: 'GPLX', hint: 'Giấy phép lái xe', icon: '🪪' },
  { type: 'cccd_front', label: 'CCCD mặt trước', hint: 'Căn cước công dân', icon: '📋' },
  { type: 'cccd_back', label: 'CCCD mặt sau', hint: 'Căn cước công dân mặt sau', icon: '📋' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('84') && digits.length === 11) return '0' + digits.slice(2)
  return digits
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatDateShort(d: string | null): string {
  if (!d) return '—'
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

function formatCurrency(n: number | null): string {
  if (!n) return '—'
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ'
}

function getJoinYear(d: string | null): string {
  if (!d) return ''
  return d.split('-')[0]
}

// ─── Google SVG ──────────────────────────────────────────────────────────────

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

// ─── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({ b }: { b: Booking }) {
  const colorClass = STATUS_COLOR[b.status] ?? 'bg-slate-50 text-slate-500 border-slate-200'
  const dotClass = STATUS_DOT[b.status] ?? 'bg-slate-400'
  const label = STATUS_LABEL[b.status] ?? b.status
  const total = b.billing_days && b.daily_rate ? b.billing_days * b.daily_rate : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="font-bold text-gray-900 text-base leading-tight">
            {b.requested_vehicle_text ?? 'Xe Car Match'}
          </p>
          <span className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${colorClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {label}
          </span>
        </div>

        {/* Date + location */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500 mb-3">
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>{formatDateShort(b.pickup_date)} → {formatDate(b.return_date)}</span>
          </div>
          {b.pickup_location_text && (
            <div className="flex items-center gap-1 truncate max-w-[180px]">
              <span>📍</span>
              <span className="truncate">{b.pickup_location_text}</span>
            </div>
          )}
        </div>

        {/* Pricing row */}
        {(b.billing_days || b.daily_rate || b.itinerary) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] border-t border-gray-50 pt-3">
            {b.billing_days != null && (
              <span className="text-gray-500">
                <span className="font-medium text-gray-700">{b.billing_days}</span> ngày
              </span>
            )}
            {b.daily_rate != null && (
              <span className="text-gray-500">
                <span className="font-medium text-gray-700">{formatCurrency(b.daily_rate)}</span>/ngày
              </span>
            )}
            {total != null && (
              <span className="ml-auto font-bold text-gray-900 text-[13px]">
                {formatCurrency(total)}
              </span>
            )}
            {b.itinerary && (
              <span className="w-full text-gray-400 truncate">🗺 {b.itinerary}</span>
            )}
          </div>
        )}
      </div>

      {b.booking_code && (
        <div className="border-t border-gray-50 px-4 py-2 bg-gray-50/50">
          <p className="font-mono text-[10px] text-gray-400 tracking-wide">{b.booking_code}</p>
        </div>
      )}
    </div>
  )
}

// ─── WebLeadCard ─────────────────────────────────────────────────────────────

function WebLeadCard({ w }: { w: WebLead }) {
  const colorClass = STATUS_COLOR[w.status] ?? 'bg-amber-50 text-amber-700 border-amber-200'
  const dotClass = STATUS_DOT[w.status] ?? 'bg-amber-400'
  const label = STATUS_LABEL[w.status] ?? 'Chờ xác nhận'

  // duration format: "2026-06-23 20:00:00 → 2026-06-24 20:00:00"
  let dateText = w.duration ?? '—'
  const parts = w.duration?.split(' → ')
  if (parts && parts.length === 2) {
    const fmt = (s: string) => {
      const d = s.trim().split(' ')[0] // "2026-06-23"
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    }
    dateText = `${fmt(parts[0])} → ${fmt(parts[1])}`
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="font-bold text-gray-900 text-base leading-tight">
            {w.car_model ?? 'Xe Car Match'}
          </p>
          <span className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${colorClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500 mb-3">
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>{dateText}</span>
          </div>
          {w.building && (
            <div className="flex items-center gap-1 truncate max-w-[180px]">
              <span>📍</span>
              <span className="truncate">{w.building}</span>
            </div>
          )}
        </div>
        {w.deposit_amount != null && (
          <div className="flex items-center gap-1.5 text-[12px] border-t border-gray-50 pt-3">
            <span className="text-gray-500">Tiền cọc:</span>
            <span className="font-bold text-brand-600">
              {new Intl.NumberFormat('vi-VN').format(w.deposit_amount)}đ
            </span>
          </div>
        )}
      </div>
      <div className="border-t border-gray-50 px-4 py-2 bg-gray-50/50">
        <p className="font-mono text-[10px] text-gray-400 tracking-wide">{w.booking_ref}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Account() {
  const [session, setSession] = useState<Session | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const [phone, setPhone] = useState<string>('')
  const [phoneInput, setPhoneInput] = useState('')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [phoneError, setPhoneError] = useState('')
  const [linkingPhone, setLinkingPhone] = useState(false)

  const [tab, setTab] = useState<'bookings' | 'docs' | 'benefits'>('bookings')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [webLeads, setWebLeads] = useState<WebLead[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  const [docs, setDocs] = useState<CustomerDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  const [promos, setPromos] = useState<PromoCode[]>([])
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([])
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<LoyaltyDiscount | null>(null)
  const [loadingBenefits, setLoadingBenefits] = useState(false)
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [copied, setCopied] = useState(false)

  const handleCopyCode = useCallback(() => {
    if (!customerInfo?.referral_code) return
    navigator.clipboard.writeText(customerInfo.referral_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [customerInfo?.referral_code])

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingSession(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setLoadingSession(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const saved = session.user.user_metadata?.customer_phone as string | undefined
    if (saved) setPhone(saved)
  }, [session])

  useEffect(() => {
    if (!session || !phone) return
    loadBookings()
    loadDocs()
    if (!customerInfo) {
      supabase.rpc('get_customer_by_phone', { p_phone: phone }).then(({ data }) => {
        if (data && (data as CustomerInfo[]).length > 0) {
          setCustomerInfo((data as CustomerInfo[])[0])
        }
      })
    }
  }, [session, phone])

  // ── Data loaders ─────────────────────────────────────────────────────────

  async function loadBookings() {
    setLoadingBookings(true)
    const [crmResult, webResult] = await Promise.all([
      supabase.rpc('get_customer_bookings_by_phone', { p_phone: phone }),
      supabase.rpc('get_my_website_leads', { p_phone: phone }),
    ])
    setBookings((crmResult.data as Booking[]) ?? [])
    setWebLeads((webResult.data as WebLead[]) ?? [])
    setLoadingBookings(false)
  }

  async function loadDocs() {
    setLoadingDocs(true)
    const { data } = await supabase.rpc('get_customer_docs_by_phone', { p_phone: phone })
    setDocs((data as CustomerDoc[]) ?? [])
    setLoadingDocs(false)
  }

  async function loadBenefits() {
    setLoadingBenefits(true)
    const [promosResult, rewardsResult] = await Promise.all([
      supabase.rpc('get_active_promos'),
      supabase.rpc('get_my_referral_rewards', { p_phone: phone }),
    ])
    setPromos((promosResult.data as PromoCode[]) ?? [])
    setReferralRewards((rewardsResult.data as ReferralReward[]) ?? [])

    if (customerInfo?.loyalty_tier && customerInfo.loyalty_tier !== 'new') {
      const { data } = await supabase.rpc('get_loyalty_discount', { p_tier: customerInfo.loyalty_tier })
      setLoyaltyDiscount((data as LoyaltyDiscount[])?.[0] ?? null)
    }
    setLoadingBenefits(false)
  }

  // ── Phone linking ─────────────────────────────────────────────────────────

  async function handleLinkPhone() {
    const normalized = normalizePhone(phoneInput.trim())
    if (!normalized || normalized.length < 9) {
      setPhoneError('Vui lòng nhập số điện thoại hợp lệ')
      return
    }
    setLinkingPhone(true)
    setPhoneError('')

    const { data, error } = await supabase.rpc('get_customer_by_phone', { p_phone: normalized })
    if (error || !data || (data as CustomerInfo[]).length === 0) {
      setPhoneError('Không tìm thấy số này trong hệ thống. Liên hệ Zalo để được hỗ trợ.')
      setLinkingPhone(false)
      return
    }

    const info = (data as CustomerInfo[])[0]
    setCustomerInfo(info)
    await supabase.auth.updateUser({ data: { customer_phone: normalized } })
    setPhone(normalized)
    setLinkingPhone(false)

    // Lưu Gmail vào hồ sơ khách hàng (fire-and-forget)
    if (session?.user?.email) {
      supabase.rpc('update_customer_email', {
        p_phone: normalized,
        p_email: session.user.email,
      }).then(() => {/* silent */}, () => {/* silent */})
    }
  }

  // ── Document upload ───────────────────────────────────────────────────────

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0]
    if (!file || !session) return

    setUploadingType(docType)
    setUploadError('')

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${session.user.id}/${docType}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('customer-documents')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage
        .from('customer-documents')
        .getPublicUrl(path)

      const fileUrl = urlData?.publicUrl ?? path

      const { error: rpcErr } = await supabase.rpc('submit_customer_document', {
        p_phone: phone,
        p_file_url: fileUrl,
        p_file_name: file.name,
        p_doc_type: docType,
        p_title: DOC_LABELS[docType] ?? 'Giấy tờ',
      })

      if (rpcErr) throw rpcErr
      await loadDocs()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi upload'
      setUploadError(msg)
    } finally {
      setUploadingType(null)
      if (fileRefs.current[docType]) {
        fileRefs.current[docType]!.value = ''
      }
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const uploadedTypes = new Set(docs.map((d) => d.document_type))

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  // ── Chưa đăng nhập ────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-white pt-16">
        <Navbar />
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-800 px-6 pt-12 pb-16 text-white">
          <div className="max-w-sm mx-auto">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6 border border-white/10">
              <Car className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Tài khoản CarMatch</h1>
            <p className="text-white/70 text-[15px] leading-relaxed">
              Quản lý chuyến đi và giấy tờ của bạn — không cần gửi lại qua Zalo mỗi lần thuê.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { icon: <History className="w-4 h-4" />, text: 'Xem toàn bộ lịch sử đặt xe' },
                { icon: <Shield className="w-4 h-4" />, text: 'Lưu GPLX & CCCD một lần dùng mãi' },
                { icon: <Phone className="w-4 h-4" />, text: 'Không cần mật khẩu — đăng nhập bằng Google' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-white/80 text-sm">
                  <span className="text-white/50">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="flex-1 px-6 -mt-6">
          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <p className="text-center text-sm text-gray-500 mb-5 font-medium">
                Đăng nhập để tiếp tục
              </p>

              <button
                type="button"
                onClick={() =>
                  supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/tai-khoan` },
                  })
                }
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm text-[15px]"
              >
                <GoogleIcon />
                Đăng nhập bằng Google
              </button>

              <p className="mt-4 text-center text-[11px] text-gray-400 leading-relaxed">
                Bằng cách đăng nhập, bạn đồng ý với{' '}
                <a href="/chinh-sach" className="underline hover:text-gray-600">điều khoản sử dụng</a>{' '}
                của CarMatch.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Đã đăng nhập, chưa có SĐT ────────────────────────────────────────────

  if (!phone) {
    const avatarUrl = session.user.user_metadata?.avatar_url as string | undefined
    const name = session.user.user_metadata?.full_name as string | undefined

    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Navbar />
        <div className="max-w-sm mx-auto px-5 py-10">
          {/* Avatar */}
          <div className="text-center mb-8">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-full mx-auto mb-3 ring-4 ring-white shadow-md" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-3 text-white font-bold text-2xl ring-4 ring-white shadow-md">
                {(name ?? session.user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <p className="font-semibold text-gray-900">{name ?? session.user.email}</p>
            <p className="text-sm text-gray-400">{session.user.email}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-11 h-11 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="w-5 h-5 text-brand-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-1">Liên kết số điện thoại</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Nhập SĐT bạn đã dùng khi đặt xe với CarMatch để xem lịch sử và giấy tờ.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkPhone()}
                  placeholder="09xx xxx xxx"
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium focus:outline-none focus:border-brand-500 transition-colors text-center tracking-wide"
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-2 text-center leading-relaxed">{phoneError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleLinkPhone}
                disabled={linkingPhone || !phoneInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-brand-600 text-white font-bold text-[15px] hover:bg-brand-700 transition-colors disabled:opacity-40 shadow-sm"
              >
                {linkingPhone ? 'Đang xác nhận...' : 'Xác nhận'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="w-full mt-4 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    )
  }

  // ── Full account ──────────────────────────────────────────────────────────

  const displayName = customerInfo?.full_name
    ?? (session.user.user_metadata?.full_name as string)
    ?? session.user.email
    ?? 'Khách hàng'

  const avatarUrl = session.user.user_metadata?.avatar_url as string | undefined
  const tier = customerInfo?.loyalty_tier
  const tierInfo = tier ? TIER_LABEL[tier] : null
  const docsComplete = uploadedTypes.size === UPLOAD_SLOTS.length
  const joinYear = getJoinYear(customerInfo?.first_seen_at ?? null)

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Greeting header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {displayName.split(' ').pop()}!
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {joinYear ? `Khách CarMatch từ năm ${joinYear}` : 'Chào mừng đến với CarMatch'}
            {tierInfo && (
              <span className={`ml-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full align-middle ${tierInfo.color}`}>
                {tierInfo.label}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* ── Left Sidebar ── */}
          <aside className="w-full md:w-64 shrink-0 space-y-3">

            {/* Profile + nav card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Profile */}
              <div className="px-5 py-6 border-b border-gray-50 text-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-16 h-16 rounded-full mx-auto mb-3 ring-4 ring-gray-50 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center mx-auto mb-3 text-white font-bold text-2xl ring-4 ring-gray-50">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
                <h2 className="font-bold text-gray-900 leading-tight">{displayName}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{phone}</p>

                {/* Mini stats */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl py-2.5">
                    <p className="font-bold text-gray-900 text-lg leading-none">
                      {loadingBookings ? '—' : bookings.length + webLeads.length}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Chuyến đi</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2.5">
                    <p className={`font-bold text-lg leading-none ${docsComplete ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {uploadedTypes.size}/{UPLOAD_SLOTS.length}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Giấy tờ</p>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-2">
                <button
                  type="button"
                  onClick={() => setTab('bookings')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === 'bookings'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Car className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Chuyến đi của tôi</span>
                  {!loadingBookings && (bookings.length + webLeads.length) > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      tab === 'bookings' ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {bookings.length + webLeads.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTab('docs')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === 'docs'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Giấy tờ</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    docsComplete
                      ? 'bg-emerald-100 text-emerald-700'
                      : tab === 'docs'
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {uploadedTypes.size}/{UPLOAD_SLOTS.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setTab('benefits'); loadBenefits(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === 'benefits'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Ưu đãi</span>
                  {(promos.length > 0 || referralRewards.length > 0) && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      tab === 'benefits' ? 'bg-brand-100 text-brand-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {promos.length + referralRewards.length}
                    </span>
                  )}
                </button>

                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      supabase.auth.signOut()
                      setPhone('')
                      setCustomerInfo(null)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Đăng xuất
                  </button>
                </div>
              </nav>
            </div>

            {/* Loyalty & Referral card */}
            {(tierInfo || customerInfo?.referral_code) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loyalty & Giới thiệu</p>
                </div>

                {tierInfo && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">Hạng khách</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${tierInfo.color}`}>
                      {tierInfo.label}
                    </span>
                  </div>
                )}

                {customerInfo?.referral_code && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Mã giới thiệu của bạn</p>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="w-full flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 hover:bg-amber-100 transition-colors group"
                    >
                      <span className="font-mono font-bold text-amber-800 text-sm tracking-widest">
                        {customerInfo.referral_code}
                      </span>
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-amber-400 shrink-0 group-hover:text-amber-600" />
                      )}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                      {copied ? 'Đã sao chép!' : 'Chia sẻ mã để nhận ưu đãi'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">

            {/* Section heading */}
            <div className="mb-5">
              <h1 className="text-xl font-bold text-gray-900">
                {tab === 'bookings' ? 'Chuyến đi của tôi' : tab === 'docs' ? 'Giấy tờ của tôi' : 'Ưu đãi & Khuyến mãi'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {tab === 'bookings'
                  ? 'Toàn bộ lịch sử đặt xe với CarMatch'
                  : tab === 'docs'
                    ? 'Lưu một lần, dùng cho mọi lần thuê sau'
                    : 'Mã giảm giá, ưu đãi thành viên và thưởng giới thiệu của bạn'}
              </p>
            </div>

            {/* ── Tab: Bookings ── */}
            {tab === 'bookings' && (
              <div>
                {loadingBookings ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : bookings.length === 0 && webLeads.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Car className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Chưa có chuyến nào</p>
                    <p className="text-gray-400 text-sm mb-5">Hãy đặt xe đầu tiên của bạn với CarMatch</p>
                    <a
                      href="/xe"
                      className="inline-flex items-center gap-1.5 bg-brand-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-brand-700 transition-colors"
                    >
                      Xem xe ngay <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webLeads.map((w) => <WebLeadCard key={w.booking_ref} w={w} />)}
                    {bookings.map((b) => <BookingCard key={b.booking_id} b={b} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Documents ── */}
            {tab === 'docs' && (
              <div>
                {/* Status banner */}
                {!docsComplete && !loadingDocs && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 mb-5 flex items-start gap-3">
                    <span className="text-amber-500 text-lg shrink-0 mt-0.5">💡</span>
                    <p className="text-amber-800 text-sm leading-relaxed">
                      Upload GPLX và CCCD một lần — CarMatch lưu lại, bạn không cần gửi lại qua Zalo mỗi lần thuê.
                    </p>
                  </div>
                )}

                {docsComplete && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3.5 mb-5 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-emerald-800 text-sm font-medium">
                      Giấy tờ đầy đủ — CarMatch sẽ dùng lại cho các lần thuê tiếp theo.
                    </p>
                  </div>
                )}

                {uploadError && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2 mb-4">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">{uploadError}</p>
                  </div>
                )}

                {loadingDocs ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {UPLOAD_SLOTS.map((slot) => {
                      const existing = docs.find((d) => d.document_type === slot.type)
                      const isUploading = uploadingType === slot.type
                      const uploaded = !!existing

                      return (
                        <div key={slot.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                                  uploaded ? 'bg-emerald-50' : 'bg-gray-50'
                                }`}>
                                  {slot.icon}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{slot.label}</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">{slot.hint}</p>
                                </div>
                              </div>

                              {uploaded ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                                  <CheckCircle className="w-3 h-3" /> Đã xác thực
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                                  <Clock className="w-3 h-3" /> Chưa có
                                </span>
                              )}
                            </div>

                            {/* Image preview */}
                            {existing && (
                              <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                {existing.file_url.match(/\.(jpg|jpeg|png|webp|heic)$/i) ? (
                                  <img
                                    src={existing.file_url}
                                    alt={slot.label}
                                    className="w-full max-h-48 object-cover"
                                  />
                                ) : (
                                  <a
                                    href={existing.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-4 text-sm text-brand-600 font-medium hover:underline"
                                  >
                                    <FileText className="w-4 h-4" />
                                    {existing.file_name ?? 'Xem file'}
                                  </a>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => fileRefs.current[slot.type]?.click()}
                              disabled={isUploading}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                                uploaded
                                  ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                  : 'bg-brand-600 text-white hover:bg-brand-700'
                              }`}
                            >
                              {isUploading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : uploaded ? (
                                <Camera className="w-4 h-4" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {isUploading ? 'Đang upload...' : uploaded ? 'Cập nhật ảnh' : 'Upload ảnh'}
                            </button>
                          </div>

                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            capture="environment"
                            className="sr-only"
                            ref={(el) => { fileRefs.current[slot.type] = el }}
                            onChange={(e) => handleFileChange(e, slot.type)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Benefits ── */}
            {tab === 'benefits' && (
              <div className="space-y-5">
                {loadingBenefits ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Loyalty discount card */}
                    {loyaltyDiscount && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-5 h-5 text-amber-600" />
                          <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Ưu đãi thành viên</h2>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-amber-700">
                              -{loyaltyDiscount.discount_amount.toLocaleString('vi-VN')}đ
                            </p>
                            <p className="text-sm text-amber-600 mt-0.5">mỗi lần thuê xe</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-amber-500">Hạng của bạn</p>
                            <p className="text-sm font-bold text-amber-800 capitalize mt-0.5">
                              {customerInfo?.loyalty_tier === 'vip' ? 'VIP' : 'Khách quen'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-amber-500 mt-3">
                          Ưu đãi được áp dụng tự động khi nhân viên lập hợp đồng
                        </p>
                      </div>
                    )}

                    {/* Referral rewards */}
                    {referralRewards.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="w-5 h-5 text-brand-600" />
                          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Thưởng giới thiệu</h2>
                        </div>
                        <div className="space-y-3">
                          {referralRewards.map((r) => (
                            <div key={r.reward_id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  +{r.reward_value.toLocaleString('vi-VN')}đ
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(r.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                              </div>
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                r.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {r.status === 'paid' ? 'Đã nhận' : 'Chờ xác nhận'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Public promo codes */}
                    {promos.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Tag className="w-5 h-5 text-brand-600" />
                          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Mã khuyến mãi</h2>
                        </div>
                        <div className="space-y-3">
                          {promos.map((p) => (
                            <div key={p.code} className="border border-dashed border-brand-200 rounded-xl p-3.5 bg-brand-50/40">
                              <div className="flex items-center justify-between mb-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.code)
                                    setCopiedPromo(p.code)
                                    setTimeout(() => setCopiedPromo(null), 2000)
                                  }}
                                  className="flex items-center gap-2 bg-white border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-50 transition-colors group"
                                >
                                  <span className="font-mono font-bold text-brand-700 text-sm tracking-widest">{p.code}</span>
                                  {copiedPromo === p.code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-brand-400 group-hover:text-brand-600" />
                                  )}
                                </button>
                                <span className="text-sm font-bold text-brand-700">
                                  {p.discount_type === 'percent'
                                    ? `-${p.discount_value}%`
                                    : `-${p.discount_value.toLocaleString('vi-VN')}đ`}
                                </span>
                              </div>
                              {p.description && (
                                <p className="text-xs text-gray-500">{p.description}</p>
                              )}
                              {p.expires_at && (
                                <p className="text-[11px] text-gray-400 mt-1">
                                  HSD: {new Date(p.expires_at).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!loyaltyDiscount && referralRewards.length === 0 && promos.length === 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Gift className="w-7 h-7 text-amber-300" />
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">Chưa có ưu đãi nào</p>
                        <p className="text-gray-400 text-sm">Giới thiệu bạn bè để nhận thưởng, hoặc hỏi nhân viên về mã khuyến mãi</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
