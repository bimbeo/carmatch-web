import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  LogOut,
  Upload,
  CheckCircle,
  Clock,
  Car,
  FileText,
  ChevronRight,
  X,
  Camera,
  Shield,
  History,
  Phone,
  Copy,
  Check,
  Gift,
  Tag,
  Star,
  Award,
  Pencil,
  MessageCircle,
  CalendarDays,
  MapPin,
  WalletCards,
  IdCard,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSEO } from '@/hooks/useSEO'
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
  payment_proof_url: string | null
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
  { type: 'gplx', label: 'GPLX', hint: 'Giấy phép lái xe' },
  { type: 'cccd_front', label: 'CCCD mặt trước', hint: 'Căn cước công dân' },
  { type: 'cccd_back', label: 'CCCD mặt sau', hint: 'Căn cước công dân mặt sau' },
]

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const DOC_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
const PROOF_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
const SIGNED_DOC_URL_TTL_SECONDS = 30 * 60

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
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ'
}

function getJoinYear(d: string | null): string {
  if (!d) return ''
  return d.split('-')[0]
}

function validateUploadFile(file: File, allowedTypes: Set<string>): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return 'File quá lớn, vui lòng chọn file dưới 8MB'
  if (file.type && !allowedTypes.has(file.type)) {
    return allowedTypes.has('application/pdf')
      ? 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP, HEIC hoặc PDF'
      : 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC'
  }
  return null
}

function isHttpUrl(value: string | null | undefined): boolean {
  return !!value && /^https?:\/\//i.test(value)
}

function isImageFile(value: string | null | undefined): boolean {
  return !!value && /\.(jpg|jpeg|png|webp|heic)(\?.*)?$/i.test(value)
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

function getWebLeadSortTime(w: WebLead): number {
  const pickup = w.duration?.split(' → ')[0]?.trim()
  return parseTimestamp(pickup) || parseTimestamp(w.created_at)
}

function getBookingSortTime(b: Booking): number {
  return parseTimestamp(b.pickup_date) || parseTimestamp(b.created_at)
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

const ZALO_NUMBER = '0975563290'

function BookingCard({ b }: { b: Booking }) {
  const colorClass = STATUS_COLOR[b.status] ?? 'bg-slate-50 text-slate-500 border-slate-200'
  const dotClass = STATUS_DOT[b.status] ?? 'bg-slate-400'
  const label = STATUS_LABEL[b.status] ?? b.status
  const total = b.billing_days && b.daily_rate ? b.billing_days * b.daily_rate : null
  const zaloMsg = `Chào CarMatch, tôi muốn hỏi về chuyến xe mã ${b.booking_code ?? b.booking_id}`
  const zaloUrl = `https://zalo.me/${ZALO_NUMBER}?text=${encodeURIComponent(zaloMsg)}`
  const isCompleted = b.status === 'completed'

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300">
      <header className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-base font-bold leading-tight text-slate-950 sm:text-[17px]">
            {b.requested_vehicle_text ?? 'Xe Car Match'}
          </p>
          {b.itinerary && <p className="mt-1 truncate text-xs text-slate-500">{b.itinerary}</p>}
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${colorClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {label}
        </span>
      </header>

      <div className="grid border-y border-slate-100 sm:grid-cols-2">
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-2.5 text-[13px] text-slate-600">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="font-medium">{formatDateShort(b.pickup_date)} → {formatDate(b.return_date)}</span>
          </div>
          {b.pickup_location_text && (
            <div className="flex items-start gap-2.5 text-[13px] text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{b.pickup_location_text}</span>
            </div>
          )}
        </div>

        {(b.billing_days || b.daily_rate || total) && (
          <div className="border-t border-slate-100 px-4 py-4 sm:border-l sm:border-t-0 sm:px-5">
            <div className="flex items-start gap-2.5">
              <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {b.billing_days != null && (
                  <span>
                    <span className="font-semibold text-slate-800">{b.billing_days}</span> ngày
              </span>
            )}
            {b.daily_rate != null && (
                  <span>
                    <span className="font-semibold text-slate-800">{formatCurrency(b.daily_rate)}</span>/ngày
              </span>
            )}
            {total != null && (
                  <span className="w-full pt-1 text-sm font-bold text-slate-950">
                    Tổng dự kiến {formatCurrency(total)}
              </span>
            )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 bg-slate-50/60 px-4 py-3 sm:px-5">
        <p className="truncate font-mono text-[10px] tracking-wide text-slate-400">
          {b.booking_code ?? b.booking_id}
        </p>
        <div className="flex shrink-0 gap-2">
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#0068FF] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Nhắn Zalo
          </a>
          {isCompleted && (
            <a
              href="/xe"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Đặt lại <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </footer>
    </article>
  )
}

// ─── WebLeadCard ─────────────────────────────────────────────────────────────

function WebLeadCard({ w, phone }: { w: WebLead; phone: string }) {
  const colorClass = STATUS_COLOR[w.status] ?? 'bg-amber-50 text-amber-700 border-amber-200'
  const dotClass = STATUS_DOT[w.status] ?? 'bg-amber-400'
  const label = STATUS_LABEL[w.status] ?? 'Chờ xác nhận'

  const [localProofUrl, setLocalProofUrl] = useState<string | null>(w.payment_proof_url ?? null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [proofError, setProofError] = useState('')
  const proofFileRef = useRef<HTMLInputElement | null>(null)

  // duration format: "2026-06-23 20:00:00 → 2026-06-24 20:00:00"
  let dateText = w.duration ?? '—'
  const parts = w.duration?.split(' → ')
  if (parts && parts.length === 2) {
    const fmt = (s: string) => {
      const d = s.trim().split(' ')[0]
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    }
    dateText = `${fmt(parts[0])} → ${fmt(parts[1])}`
  }

  const handleProofUpload = async (file: File) => {
    const validationError = validateUploadFile(file, PROOF_UPLOAD_TYPES)
    if (validationError) {
      setProofError(validationError)
      return
    }

    setUploadingProof(true)
    setProofError('')
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/bookings?action=upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_ref: w.booking_ref, phone, file_base64: base64, file_name: file.name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload thất bại')
      setLocalProofUrl(json.url)
    } catch (e: unknown) {
      setProofError((e as Error).message || 'Lỗi upload, thử lại sau')
    } finally {
      setUploadingProof(false)
    }
  }

  const zaloMsg = `Chào CarMatch, tôi muốn hỏi về đơn đặt xe mã ${w.booking_ref}`
  const zaloUrl = `https://zalo.me/${ZALO_NUMBER}?text=${encodeURIComponent(zaloMsg)}`

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300">
      <header className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-base font-bold leading-tight text-slate-950 sm:text-[17px]">
            {w.car_model ?? 'Xe Car Match'}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-slate-400">{w.booking_ref}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${colorClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {label}
        </span>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_124px] border-y border-slate-100 min-[420px]:grid-cols-[minmax(0,1fr)_150px] md:grid-cols-[minmax(0,1fr)_188px]">
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-[13px] text-slate-600">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="font-medium leading-relaxed">{dateText}</span>
            </div>
            {w.building && (
              <div className="flex items-start gap-2.5 text-[13px] text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{w.building}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <div className="flex items-start gap-2.5">
              <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Tiền cọc</p>
                <p className="mt-0.5 text-sm font-bold text-slate-950">
                  {w.deposit_amount != null ? new Intl.NumberFormat('vi-VN').format(w.deposit_amount) + 'đ' : 'Chưa cập nhật'}
                </p>
              </div>
            </div>
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ${localProofUrl ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {localProofUrl ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {localProofUrl ? 'Đã gửi ảnh TT' : 'Chưa gửi ảnh TT'}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center border-l border-slate-100 bg-slate-50/60 p-2.5 md:p-3">
          {localProofUrl ? (
            <div className="min-w-0">
              <a href={localProofUrl} target="_blank" rel="noopener noreferrer" className="group block">
                <img
                  src={localProofUrl}
                  alt="Ảnh thanh toán"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/2] w-full rounded-md border border-slate-200 bg-white object-cover transition-opacity group-hover:opacity-90"
                />
                <p className="mt-1.5 flex items-center justify-center gap-1 text-center text-[10px] font-medium text-brand-600">
                  Xem đầy đủ <ArrowUpRight className="h-3 w-3" />
                </p>
              </a>
              <button
                onClick={() => proofFileRef.current?.click()}
                disabled={uploadingProof}
                className="mt-1 flex w-full items-center justify-center gap-1 py-1 text-[10px] text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                {uploadingProof ? 'Đang tải...' : 'Đổi ảnh'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => proofFileRef.current?.click()}
              disabled={uploadingProof}
              className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white px-2 text-center text-[10px] font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              {uploadingProof ? (
                <span className="text-slate-400">Đang tải...</span>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Gửi ảnh TT
                </>
              )}
            </button>
          )}
          {proofError && <p className="mt-1 text-center text-[10px] text-red-500">{proofError}</p>}
          <input
            ref={proofFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) void handleProofUpload(f) }}
          />
        </div>
      </div>

      <footer className="flex items-center justify-end bg-slate-50/60 px-4 py-3 sm:px-5">
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#0068FF] px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
          <MessageCircle className="h-3.5 w-3.5" />
            Nhắn Zalo
          </a>
      </footer>
    </article>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Account() {
  useSEO({
    title: 'Tài khoản của tôi',
    description: 'Trang tài khoản cá nhân Car Match để khách hàng xem chuyến đi, giấy tờ và ưu đãi.',
    canonical: 'https://www.carmatch.vn/tai-khoan',
    noIndex: true,
  })

  const [session, setSession] = useState<Session | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  const [phone, setPhone] = useState<string>('')
  const [phoneInput, setPhoneInput] = useState('')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [phoneError, setPhoneError] = useState('')
  const [linkingPhone, setLinkingPhone] = useState(false)

  const [tab, setTab] = useState<'bookings' | 'docs' | 'benefits' | 'points'>('bookings')
  const [pointsData, setPointsData] = useState<{ balance: number; redeemable_value: number; settings: { redeem_points: number; redeem_value: number; points_per_10k: number }; ledger: Array<{ id: string; points: number; type: string; description: string; created_at: string }> } | null>(null)
  const [loadingPoints, setLoadingPoints] = useState(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [webLeads, setWebLeads] = useState<WebLead[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [bookingsError, setBookingsError] = useState('')

  const [docs, setDocs] = useState<CustomerDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docsError, setDocsError] = useState('')
  const [docPreviewUrls, setDocPreviewUrls] = useState<Record<string, string>>({})

  const [promos, setPromos] = useState<PromoCode[]>([])
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([])
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<LoyaltyDiscount | null>(null)
  const [loadingBenefits, setLoadingBenefits] = useState(false)
  const [benefitsError, setBenefitsError] = useState('')
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [copied, setCopied] = useState(false)

  const [changingPhone, setChangingPhone] = useState(false)
  const [changePhoneInput, setChangePhoneInput] = useState('')
  const [changePhoneError, setChangePhoneError] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

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
    const saved = session.user.app_metadata?.customer_phone as string | undefined
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
    setBookingsError('')
    try {
      const [crmResult, webResult] = await Promise.all([
        supabase.rpc('get_customer_bookings_by_phone', { p_phone: phone }),
        supabase.rpc('get_my_website_leads', { p_phone: phone }),
      ])
      if (crmResult.error) throw crmResult.error
      if (webResult.error) throw webResult.error
      setBookings((crmResult.data as Booking[]) ?? [])
      setWebLeads((webResult.data as WebLead[]) ?? [])
    } catch (err) {
      console.error('[account] loadBookings error:', err)
      setBookingsError('Chưa tải được danh sách chuyến đi. Vui lòng thử lại.')
    } finally {
      setLoadingBookings(false)
    }
  }

  async function loadDocs() {
    setLoadingDocs(true)
    setDocsError('')
    try {
      const { data, error } = await supabase.rpc('get_customer_docs_by_phone', { p_phone: phone })
      if (error) throw error
      setDocs((data as CustomerDoc[]) ?? [])
    } catch (err) {
      console.error('[account] loadDocs error:', err)
      setDocsError('Chưa tải được giấy tờ. Vui lòng thử lại.')
    } finally {
      setLoadingDocs(false)
    }
  }

  async function loadBenefits() {
    setLoadingBenefits(true)
    setBenefitsError('')
    try {
      const [promosResult, rewardsResult] = await Promise.all([
        supabase.rpc('get_active_promos'),
        supabase.rpc('get_my_referral_rewards', { p_phone: phone }),
      ])
      if (promosResult.error) throw promosResult.error
      if (rewardsResult.error) throw rewardsResult.error
      setPromos((promosResult.data as PromoCode[]) ?? [])
      setReferralRewards((rewardsResult.data as ReferralReward[]) ?? [])

      if (customerInfo?.loyalty_tier && customerInfo.loyalty_tier !== 'new') {
        const { data, error } = await supabase.rpc('get_loyalty_discount', { p_tier: customerInfo.loyalty_tier })
        if (error) throw error
        setLoyaltyDiscount((data as LoyaltyDiscount[])?.[0] ?? null)
      }
    } catch (err) {
      console.error('[account] loadBenefits error:', err)
      setBenefitsError('Chưa tải được ưu đãi. Vui lòng thử lại.')
    } finally {
      setLoadingBenefits(false)
    }
  }

  async function loadPoints() {
    if (!phone) return
    setLoadingPoints(true)
    try {
      const res = await fetch(`/api/customer-discount?phone=${encodeURIComponent(phone)}`)
      const json = await res.json()
      if (res.ok) {
        setPointsData({
          balance: json.points_balance || 0,
          redeemable_value: json.points_value || 0,
          settings: json.points_settings || { redeem_points: 200, redeem_value: 50000, points_per_10k: 1 },
          ledger: [],
        })
      }
    } catch { /* silent */ } finally {
      setLoadingPoints(false)
    }
  }

  // ── Phone linking ─────────────────────────────────────────────────────────

  async function linkPhoneOnServer(normalizedPhone: string) {
    if (!session?.access_token) throw new Error('Bạn cần đăng nhập lại')

    const res = await fetch('/api/bookings?action=link-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ phone: normalizedPhone }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Chưa liên kết được số điện thoại')

    await supabase.auth.refreshSession()
    return json as { phone: string; customer: CustomerInfo }
  }

  async function handleLinkPhone() {
    const normalized = normalizePhone(phoneInput.trim())
    if (!normalized || normalized.length < 9) {
      setPhoneError('Vui lòng nhập số điện thoại hợp lệ')
      return
    }
    setLinkingPhone(true)
    setPhoneError('')

    try {
      const linked = await linkPhoneOnServer(normalized)
      setCustomerInfo(linked.customer)
      setPhone(linked.phone)
    } catch (error) {
      setPhoneError(error instanceof Error ? error.message : 'Chưa liên kết được số điện thoại')
    } finally {
      setLinkingPhone(false)
    }
  }

  // ── Change phone ─────────────────────────────────────────────────────────

  async function handleChangePhone() {
    const normalized = normalizePhone(changePhoneInput.trim())
    if (!normalized || normalized.length < 9) {
      setChangePhoneError('Số điện thoại không hợp lệ')
      return
    }
    if (normalized === phone) {
      setChangePhoneError('Đây là số điện thoại bạn đang dùng')
      return
    }
    setSavingPhone(true)
    setChangePhoneError('')

    try {
      const linked = await linkPhoneOnServer(normalized)
      setPhone(linked.phone)
      setCustomerInfo(linked.customer)
      setBookings([])
      setWebLeads([])
      setDocs([])
      setChangingPhone(false)
      setChangePhoneInput('')
    } catch (error) {
      setChangePhoneError(error instanceof Error ? error.message : 'Chưa đổi được số điện thoại')
    } finally {
      setSavingPhone(false)
    }
  }

  // ── Document upload ───────────────────────────────────────────────────────

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0]
    if (!file || !session) return

    const validationError = validateUploadFile(file, DOC_UPLOAD_TYPES)
    if (validationError) {
      setUploadError(validationError)
      e.target.value = ''
      return
    }

    setUploadingType(docType)
    setUploadError('')

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${session.user.id}/${docType}-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('customer-documents')
        .upload(path, file, { contentType: file.type || undefined, upsert: true })

      if (uploadErr) throw uploadErr

      const { error: rpcErr } = await supabase.rpc('submit_customer_document', {
        p_phone: phone,
        p_file_url: path,
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

  useEffect(() => {
    let cancelled = false

    async function resolveDocUrls() {
      if (docs.length === 0) {
        setDocPreviewUrls({})
        return
      }

      const entries = await Promise.all(docs.map(async (doc) => {
        if (isHttpUrl(doc.file_url)) return [doc.doc_id, doc.file_url] as const

        const { data, error } = await supabase.storage
          .from('customer-documents')
          .createSignedUrl(doc.file_url, SIGNED_DOC_URL_TTL_SECONDS)

        if (error) {
          console.error('[account] signed document url error:', error.message)
          return [doc.doc_id, ''] as const
        }
        return [doc.doc_id, data?.signedUrl ?? ''] as const
      }))

      if (!cancelled) {
        setDocPreviewUrls(Object.fromEntries(entries.filter(([, url]) => Boolean(url))))
      }
    }

    void resolveDocUrls()

    return () => {
      cancelled = true
    }
  }, [docs])

  // ── Derived ───────────────────────────────────────────────────────────────

  const uploadedTypes = new Set(docs.map((d) => d.document_type))
  const requiredDocCount = UPLOAD_SLOTS.length
  const uploadedRequiredDocCount = UPLOAD_SLOTS.filter((slot) => uploadedTypes.has(slot.type)).length
  const docsComplete = UPLOAD_SLOTS.every((slot) => uploadedTypes.has(slot.type))
  const tripItems = useMemo(() => {
    const bookingCodes = new Set(
      bookings
        .map((booking) => booking.booking_code?.trim().toUpperCase())
        .filter(Boolean) as string[],
    )

    const webItems = webLeads
      .filter((lead) => !bookingCodes.has(lead.booking_ref.trim().toUpperCase()))
      .map((lead) => ({
        type: 'web' as const,
        key: `web-${lead.booking_ref}`,
        sortTime: getWebLeadSortTime(lead),
        lead,
      }))

    const bookingItems = bookings.map((booking) => ({
      type: 'booking' as const,
      key: `booking-${booking.booking_id}`,
      sortTime: getBookingSortTime(booking),
      booking,
    }))

    return [...webItems, ...bookingItems].sort((a, b) => b.sortTime - a.sortTime)
  }, [bookings, webLeads])

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <>
        <Navbar />
        <main id="main-content" className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    )
  }

  // ── Chưa đăng nhập ────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-white pt-16">
        <Navbar />
        <main id="main-content">
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
        </main>
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
        <main id="main-content" className="max-w-sm mx-auto px-5 py-10">
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
                Nhập số điện thoại bạn đã dùng để đặt xe với Car Match.
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
                  <p className="mt-2 text-sm leading-relaxed text-red-500 text-center">{phoneError}</p>
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
        </main>
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
  const joinYear = getJoinYear(customerInfo?.first_seen_at ?? null)

  return (
    <div className="min-h-screen bg-[#f5f7fa] pt-16">
      <Navbar />
      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-9 lg:px-8">

        {/* Greeting header */}
        <div className="mb-6 lg:hidden">
          <h1 className="text-2xl font-bold text-slate-950 sm:text-[28px]">
            Xin chào, {displayName.split(' ').pop()}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {joinYear ? `Khách CarMatch từ năm ${joinYear}` : 'Chào mừng đến với CarMatch'}
            {tierInfo && (
              <span className={`ml-2 inline-block rounded-md px-2 py-0.5 align-middle text-[10px] font-bold ${tierInfo.color}`}>
                {tierInfo.label}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">

          {/* ── Left Sidebar ── */}
          <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-24 lg:w-[272px]">

            {/* Profile + nav card */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">

              {/* Profile */}
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5 lg:py-6 lg:text-center">
                <div className="flex items-center gap-3 lg:block">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                      className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-slate-50 lg:mx-auto lg:mb-3 lg:h-16 lg:w-16"
                  />
                ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xl font-bold text-white ring-4 ring-slate-50 lg:mx-auto lg:mb-3 lg:h-16 lg:w-16 lg:text-2xl">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
                  <div className="min-w-0 flex-1 text-left lg:text-center">
                    <h2 className="truncate font-bold leading-tight text-slate-950">{displayName}</h2>

                {/* Phone + đổi số */}
                {changingPhone ? (
                      <div className="mt-2 space-y-2 text-left">
                    <input
                      type="tel"
                      value={changePhoneInput}
                      onChange={(e) => setChangePhoneInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void handleChangePhone()}
                      placeholder="Nhập SĐT mới..."
                      autoFocus
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-center text-sm tracking-wide focus:border-brand-400 focus:outline-none"
                    />
                    {changePhoneError && (
                      <p className="text-[11px] text-red-500 text-center leading-snug">{changePhoneError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setChangingPhone(false); setChangePhoneInput(''); setChangePhoneError('') }}
                            className="flex-1 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleChangePhone()}
                        disabled={savingPhone || !changePhoneInput.trim()}
                            className="flex-1 rounded-md bg-brand-700 py-1.5 text-xs font-bold text-white hover:bg-brand-800 disabled:opacity-40"
                      >
                        {savingPhone ? 'Đang lưu...' : 'Xác nhận'}
                      </button>
                    </div>
                  </div>
                ) : (
                      <div className="mt-1 flex items-center gap-1.5 lg:justify-center">
                        <p className="text-sm text-slate-500">{phone}</p>
                    <button
                      type="button"
                      onClick={() => { setChangingPhone(true); setChangePhoneInput('') }}
                      title="Đổi số điện thoại"
                          className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-600"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
                  </div>
                </div>

                {/* Mini stats */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-slate-100 bg-slate-50 py-2.5 text-center">
                    <p className="text-lg font-bold leading-none text-slate-950">
                      {loadingBookings ? '—' : tripItems.length}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">Chuyến đi</p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50 py-2.5 text-center">
                    <p className={`text-lg font-bold leading-none ${docsComplete ? 'text-emerald-600' : 'text-slate-950'}`}>
                      {uploadedRequiredDocCount}/{requiredDocCount}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">Giấy tờ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    supabase.auth.signOut()
                    setPhone('')
                    setCustomerInfo(null)
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 lg:hidden"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Đăng xuất
                </button>
              </div>

              {/* Nav */}
              <nav className="grid grid-cols-4 lg:block lg:p-2" role="tablist" aria-label="Khu vực tài khoản">
                <button
                  type="button"
                  id="account-tab-bookings"
                  role="tab"
                  aria-selected={tab === 'bookings'}
                  aria-controls="account-panel-bookings"
                  onClick={() => setTab('bookings')}
                  className={`flex w-full flex-col items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-semibold transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:border-b-0 lg:px-3 lg:py-2.5 lg:text-sm ${
                    tab === 'bookings'
                      ? 'border-brand-700 bg-brand-50 text-brand-800 lg:border-transparent'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Car className="w-4 h-4 shrink-0" />
                  <span className="lg:flex-1 lg:text-left">
                    <span className="lg:hidden">Chuyến đi</span>
                    <span className="hidden lg:inline">Chuyến đi của tôi</span>
                  </span>
                  {!loadingBookings && tripItems.length > 0 && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold lg:px-2 lg:text-[11px] ${
                      tab === 'bookings' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tripItems.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="account-tab-docs"
                  role="tab"
                  aria-selected={tab === 'docs'}
                  aria-controls="account-panel-docs"
                  onClick={() => setTab('docs')}
                  className={`flex w-full flex-col items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-semibold transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:border-b-0 lg:px-3 lg:py-2.5 lg:text-sm ${
                    tab === 'docs'
                      ? 'border-brand-700 bg-brand-50 text-brand-800 lg:border-transparent'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="lg:flex-1 lg:text-left">Giấy tờ</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold lg:px-2 lg:text-[11px] ${
                    docsComplete
                      ? 'bg-emerald-100 text-emerald-700'
                      : tab === 'docs'
                        ? 'bg-brand-100 text-brand-600'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {uploadedRequiredDocCount}/{requiredDocCount}
                  </span>
                </button>

                <button
                  type="button"
                  id="account-tab-benefits"
                  role="tab"
                  aria-selected={tab === 'benefits'}
                  aria-controls="account-panel-benefits"
                  onClick={() => { setTab('benefits'); loadBenefits(); }}
                  className={`flex w-full flex-col items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-semibold transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:border-b-0 lg:px-3 lg:py-2.5 lg:text-sm ${
                    tab === 'benefits'
                      ? 'border-brand-700 bg-brand-50 text-brand-800 lg:border-transparent'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span className="lg:flex-1 lg:text-left">Ưu đãi</span>
                  {(promos.length > 0 || referralRewards.length > 0) && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold lg:px-2 lg:text-[11px] ${
                      tab === 'benefits' ? 'bg-brand-100 text-brand-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {promos.length + referralRewards.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="account-tab-points"
                  role="tab"
                  aria-selected={tab === 'points'}
                  aria-controls="account-panel-points"
                  onClick={() => { setTab('points'); void loadPoints(); }}
                  className={`flex w-full flex-col items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-semibold transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:border-b-0 lg:px-3 lg:py-2.5 lg:text-sm ${
                    tab === 'points'
                      ? 'border-brand-700 bg-brand-50 text-brand-800 lg:border-transparent'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Star className="w-4 h-4 shrink-0" />
                  <span className="lg:flex-1 lg:text-left">Điểm</span>
                  {pointsData && pointsData.balance > 0 && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold lg:px-2 lg:text-[11px] ${
                      tab === 'points' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {pointsData.balance}
                    </span>
                  )}
                </button>

                <div className="mt-2 hidden border-t border-slate-100 pt-2 lg:block">
                  <button
                    type="button"
                    onClick={() => {
                      supabase.auth.signOut()
                      setPhone('')
                      setCustomerInfo(null)
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Đăng xuất
                  </button>
                </div>
              </nav>
            </div>

            {/* Loyalty & Referral card */}
            {(tierInfo || customerInfo?.referral_code) && (
              <div className="hidden rounded-lg border border-slate-200 bg-white p-4 lg:block">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loyalty & Giới thiệu</p>
                </div>

                {tierInfo && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500">Hạng khách</span>
                    <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${tierInfo.color}`}>
                      {tierInfo.label}
                    </span>
                  </div>
                )}

                {customerInfo?.referral_code && (
                  <div>
                    <p className="mb-1.5 text-xs text-slate-400">Mã giới thiệu của bạn</p>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="group flex w-full items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 transition-colors hover:bg-amber-100"
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
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-white py-1.5 text-[12px] font-semibold text-amber-700 transition-colors hover:bg-amber-50"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                      <a
                        href={`https://zalo.me/${ZALO_NUMBER}?text=${encodeURIComponent(`Dùng mã ${customerInfo.referral_code} để đặt xe CarMatch — carmatch.vn/?ref=${customerInfo.referral_code}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#0068FF] py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chia sẻ Zalo
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* ── Main Content ── */}
          <main id="main-content" className="min-w-0 flex-1">
            <div className="mb-7 hidden lg:block">
              <h1 className="text-[28px] font-bold text-slate-950">
                Xin chào, {displayName.split(' ').pop()}!
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {joinYear ? `Khách CarMatch từ năm ${joinYear}` : 'Chào mừng đến với CarMatch'}
                {tierInfo && (
                  <span className={`ml-2 inline-block rounded-md px-2 py-0.5 align-middle text-[10px] font-bold ${tierInfo.color}`}>
                    {tierInfo.label}
                  </span>
                )}
              </p>
            </div>

            {/* Section heading */}
            <div className="mb-4 border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                {tab === 'bookings' ? 'Chuyến đi của tôi' : tab === 'docs' ? 'Giấy tờ của tôi' : 'Ưu đãi & Khuyến mãi'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {tab === 'bookings'
                  ? 'Toàn bộ lịch sử đặt xe với CarMatch'
                  : tab === 'docs'
                    ? 'Lưu một lần, dùng cho mọi lần thuê sau'
                    : 'Mã giảm giá, ưu đãi thành viên và thưởng giới thiệu của bạn'}
              </p>
            </div>

            {/* ── Tab: Bookings ── */}
            {tab === 'bookings' && (
              <div id="account-panel-bookings" role="tabpanel" aria-labelledby="account-tab-bookings">
                {bookingsError && !loadingBookings && (
                  <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-sm text-red-700">{bookingsError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadBookings()}
                      className="shrink-0 rounded-md bg-white px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100 hover:bg-red-100"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
                {loadingBookings ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : tripItems.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-50">
                      <Car className="h-7 w-7 text-slate-300" />
                    </div>
                    <p className="mb-1 font-semibold text-slate-950">Chưa có chuyến nào</p>
                    <p className="mb-5 text-sm text-slate-500">Hãy đặt xe đầu tiên của bạn với CarMatch</p>
                    <a
                      href="/xe"
                      className="inline-flex h-10 items-center gap-1.5 rounded-md bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                    >
                      Xem xe ngay <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Nudge: upload docs if not complete */}
                    {!docsComplete && !loadingDocs && (
                      <button
                        type="button"
                        onClick={() => setTab('docs')}
                        className="flex w-full items-center gap-3 border-y border-amber-200 bg-white px-1 py-3 text-left transition-colors hover:bg-amber-50/40 sm:px-3"
                      >
                        <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-800">Upload giấy tờ để CarMatch chuẩn bị sẵn</p>
                          <p className="mt-0.5 text-[12px] text-slate-500">GPLX + CCCD — lưu 1 lần, dùng mọi chuyến</p>
                        </div>
                        <span className="hidden text-xs font-semibold text-amber-700 sm:inline">Upload ngay</span>
                        <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                      </button>
                    )}
                    {tripItems.map((item) => (
                      item.type === 'web'
                        ? <WebLeadCard key={item.key} w={item.lead} phone={phone} />
                        : <BookingCard key={item.key} b={item.booking} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Documents ── */}
            {tab === 'docs' && (
              <div id="account-panel-docs" role="tabpanel" aria-labelledby="account-tab-docs">
                {/* Status banner */}
                {!docsComplete && !loadingDocs && (
                  <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <IdCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="text-amber-800 text-sm leading-relaxed">
                      Upload GPLX và CCCD một lần — CarMatch lưu lại, bạn không cần gửi lại qua Zalo mỗi lần thuê.
                    </p>
                  </div>
                )}

                {docsComplete && (
                  <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-emerald-800 text-sm font-medium">
                      Giấy tờ đầy đủ — CarMatch sẽ dùng lại cho các lần thuê tiếp theo.
                    </p>
                  </div>
                )}

                {uploadError && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm">{uploadError}</p>
                  </div>
                )}

                {docsError && !loadingDocs && (
                  <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-sm text-red-700">{docsError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadDocs()}
                      className="shrink-0 rounded-md bg-white px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100 hover:bg-red-100"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {loadingDocs ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid items-start gap-4 md:grid-cols-3">
                    {UPLOAD_SLOTS.map((slot) => {
                      const existing = docs.find((d) => d.document_type === slot.type)
                      const isUploading = uploadingType === slot.type
                      const uploaded = !!existing
                      const SlotIcon = slot.type === 'gplx' ? IdCard : FileText
                      const previewUrl = existing ? docPreviewUrls[existing.doc_id] ?? '' : ''
                      const previewIsImage = isImageFile(existing?.file_name) || isImageFile(existing?.file_url)

                      return (
                        <div key={slot.type} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <div className="flex h-full flex-col p-4">
                            <div className="mb-4 flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                                  uploaded ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                                }`}>
                                  <SlotIcon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{slot.label}</p>
                                  <p className="mt-0.5 text-[11px] text-slate-400">{slot.hint}</p>
                                </div>
                              </div>

                              {uploaded ? (
                                <span className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                  <CheckCircle className="h-3 w-3" /> Đã có
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                                  <Clock className="w-3 h-3" /> Chưa có
                                </span>
                              )}
                            </div>

                            {/* Image preview */}
                            {existing && (
                              <div className="mb-4 overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                                {previewUrl && previewIsImage ? (
                                  <img
                                    src={previewUrl}
                                    alt={slot.label}
                                    loading="lazy"
                                    decoding="async"
                                    className="aspect-[4/3] w-full object-cover"
                                  />
                                ) : previewUrl ? (
                                  <a
                                    href={previewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex aspect-[4/3] items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-brand-700 hover:underline"
                                  >
                                    <FileText className="w-4 h-4" />
                                    {existing.file_name ?? 'Xem file'}
                                  </a>
                                ) : (
                                  <div className="flex aspect-[4/3] items-center justify-center px-4 py-4 text-center text-sm text-slate-400">
                                    Chưa tạo được link xem tạm thời
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => fileRefs.current[slot.type]?.click()}
                              disabled={isUploading}
                              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 ${
                                uploaded
                                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                  : 'bg-brand-700 text-white hover:bg-brand-800'
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
              <div id="account-panel-benefits" role="tabpanel" aria-labelledby="account-tab-benefits" className="space-y-5">
                {customerInfo?.referral_code && (
                  <div className="rounded-lg border border-amber-200 bg-white p-4 lg:hidden">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-amber-600" />
                        <p className="text-sm font-bold text-slate-800">Mã giới thiệu của bạn</p>
                      </div>
                      {tierInfo && (
                        <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${tierInfo.color}`}>{tierInfo.label}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex w-full items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5"
                    >
                      <span className="font-mono text-sm font-bold tracking-widest text-amber-800">{customerInfo.referral_code}</span>
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-amber-600" />}
                    </button>
                  </div>
                )}
                {benefitsError && !loadingBenefits && (
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-sm text-red-700">{benefitsError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadBenefits()}
                      className="shrink-0 rounded-md bg-white px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100 hover:bg-red-100"
                    >
                      Thử lại
                    </button>
                  </div>
                )}
                {loadingBenefits ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Loyalty discount card */}
                    {loyaltyDiscount && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
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
                      <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="w-5 h-5 text-brand-600" />
                          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Thưởng giới thiệu</h2>
                        </div>
                        <div className="space-y-3">
                          {referralRewards.map((r) => (
                            <div key={r.reward_id} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  +{r.reward_value.toLocaleString('vi-VN')}đ
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(r.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                              </div>
                              <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
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
                      <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Tag className="w-5 h-5 text-brand-600" />
                          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Mã khuyến mãi</h2>
                        </div>
                        <div className="space-y-3">
                          {promos.map((p) => (
                            <div key={p.code} className="rounded-md border border-dashed border-brand-200 bg-brand-50/40 p-3.5">
                              <div className="flex items-center justify-between mb-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.code)
                                    setCopiedPromo(p.code)
                                    setTimeout(() => setCopiedPromo(null), 2000)
                                  }}
                                  className="group flex items-center gap-2 rounded-md border border-brand-200 bg-white px-3 py-1.5 transition-colors hover:bg-brand-50"
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
                      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50">
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

            {/* ── Points tab ── */}
            {tab === 'points' && (
              <div id="account-panel-points" role="tabpanel" aria-labelledby="account-tab-points" className="space-y-5">
                {loadingPoints ? (
                  <div className="flex justify-center py-16">
                    <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Balance card */}
                    <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-blue-600" />
                        <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Điểm tích lũy</h2>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-4xl font-black text-blue-700">{(pointsData?.balance ?? 0).toLocaleString('vi-VN')}</p>
                          <p className="text-sm text-blue-500 mt-1">điểm</p>
                        </div>
                        {(pointsData?.redeemable_value ?? 0) > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-blue-500">Có thể quy đổi</p>
                            <p className="text-xl font-black text-blue-700 mt-0.5">
                              {(pointsData?.redeemable_value ?? 0).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        )}
                      </div>
                      {(pointsData?.balance ?? 0) > 0 && (pointsData?.redeemable_value ?? 0) === 0 && pointsData?.settings && (
                        <p className="text-xs text-blue-400 mt-3">
                          Cần thêm {Math.max(0, pointsData.settings.redeem_points - (pointsData.balance ?? 0)).toLocaleString('vi-VN')} điểm nữa để đổi {pointsData.settings.redeem_value.toLocaleString('vi-VN')}đ
                        </p>
                      )}
                    </div>

                    {/* How it works */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                      <h3 className="text-sm font-bold text-slate-700 mb-3">Cách tích & dùng điểm</h3>
                      <div className="space-y-2.5 text-sm text-slate-600">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">1</span>
                          <p>Mỗi <strong>10.000đ</strong> chi tiêu = <strong>{pointsData?.settings?.points_per_10k ?? 1} điểm</strong></p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">2</span>
                          <p><strong>{pointsData?.settings?.redeem_points ?? 200} điểm</strong> = <strong>{(pointsData?.settings?.redeem_value ?? 50000).toLocaleString('vi-VN')}đ</strong> giảm giá</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">+</span>
                          <p>Nhận thêm <strong>100 điểm</strong> khi giới thiệu bạn bè đặt xe thành công</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">i</span>
                          <p className="text-slate-400">Điểm được cộng sau khi bạn hoàn trả xe. Liên hệ nhân viên để sử dụng điểm.</p>
                        </div>
                      </div>
                    </div>

                    {/* Empty state */}
                    {(pointsData?.balance ?? 0) === 0 && (
                      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50">
                          <Star className="w-7 h-7 text-blue-300" />
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">Chưa có điểm tích lũy</p>
                        <p className="text-gray-400 text-sm">Điểm được tích sau mỗi chuyến xe hoàn thành</p>
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
