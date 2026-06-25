import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { MessageCircle, Phone, Info, ChevronDown, ChevronRight, MapPin, Truck, CalendarDays, X, Tag, ImageIcon, Upload, Copy, Check } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { trackBookingSubmit, trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

const ZALO_NUMBER = '0975563290';
const ZALO_LINK = `https://zalo.me/${ZALO_NUMBER}`;
const MAX_PAYMENT_PROOF_BYTES = 8 * 1024 * 1024;
const PAYMENT_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

// ─── Availability types ────────────────────────────────────────────────────────

interface BlockedRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  type: string; // rental | blocked | maintenance | ...
  allDay: boolean;
}

/**
 * Phân loại conflict thành 2 loại:
 * - hard: xe đang bận rõ ràng trong khoảng đặt (báo đỏ, không nên đặt)
 * - boundary: ngày pickup trùng ngày xe trả ca trước, hoặc ngày trả trùng ngày xe nhận ca sau
 *   → xe CÓ THỂ sẵn sàng tối đó, chỉ cần cảnh báo vàng để khách xác nhận giờ
 */
function categorizeConflicts(
  fromStr: string,
  toStr: string,
  ranges: BlockedRange[],
): { hard: BlockedRange[]; boundary: BlockedRange[] } {
  const hard: BlockedRange[] = [];
  const boundary: BlockedRange[] = [];

  for (const r of ranges) {
    // Không overlap gì cả
    if (r.from > toStr || r.to < fromStr) continue;

    // Ngày pickup đúng bằng ngày xe trả ca trước
    // (xe về tối hôm đó → có thể nhận ca tiếp sau 21-22h)
    const pickupOnReturnDay = r.to === fromStr;

    // Ngày trả đúng bằng ngày xe bắt đầu ca sau
    // (ca sau nhận buổi tối → xe cần trả trước đó)
    const returnOnPickupDay = r.from === toStr;

    if (pickupOnReturnDay || returnOnPickupDay) {
      boundary.push(r);
    } else {
      hard.push(r);
    }
  }

  return { hard, boundary };
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function validatePaymentProof(file: File): string | null {
  if (file.size > MAX_PAYMENT_PROOF_BYTES) return 'Ảnh quá lớn, vui lòng chọn ảnh dưới 8MB';
  if (file.type && !PAYMENT_PROOF_TYPES.has(file.type)) {
    return 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC';
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date to YYYY-MM-DD using LOCAL time (avoids UTC-offset day shift in VN GMT+7) */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function calDaysDiff(a: Date, b: Date): number {
  const msA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const msB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((msB - msA) / 86400000);
}

function fmtVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

/** Display YYYY-MM-DD as "T6 22/5" — parse manually to avoid UTC offset bug */
function displayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d); // local midnight
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
}

function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function displayDateSlash(dateStr: string): string {
  return dateStr.split('-').reverse().join('/');
}

function getInitialPromoCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('promo')?.trim().toUpperCase() || '';
}

// ─── Pricing engine ───────────────────────────────────────────────────────────

interface Fee {
  label: string;
  amount: number;
  highlight?: boolean;
}

interface CalcResult {
  valid: boolean;
  error?: string;
  total: number;
  fees: Fee[];
  note?: string;
}

function calculateRental(
  pickupDateStr: string,
  pickupHour: number,
  returnDateStr: string,
  returnHour: number,
  BP: number,
): CalcResult {
  if (!BP || BP <= 0) {
    return { valid: false, error: 'Liên hệ để nhận báo giá', total: 0, fees: [] };
  }

  const pDate = new Date(pickupDateStr);
  const rDate = new Date(returnDateStr);
  const calDays = calDaysDiff(pDate, rDate);
  const totalHours = calDays * 24 + (returnHour - pickupHour);

  if (totalHours < 4) {
    return { valid: false, error: 'Thời gian thuê tối thiểu 4 tiếng', total: 0, fees: [] };
  }
  if (calDays < 0 || (calDays === 0 && returnHour <= pickupHour)) {
    return { valid: false, error: 'Giờ trả phải sau giờ nhận', total: 0, fees: [] };
  }

  const fees: Fee[] = [];
  const pDow = pDate.getDay();
  const rDow = rDate.getDay();
  const isReturnSat = rDow === 6;
  const isReturnSun = rDow === 0;
  const isReturnWeekend = isReturnSat || isReturnSun;
  const isPickupWeekend = pDow === 0 || pDow === 6;

  if (calDays === 0) {
    const inMorning = pickupHour >= 7 && pickupHour <= 12 && returnHour <= 12;
    const inAfternoon = pickupHour >= 13 && returnHour <= 20;
    const isHalfDay = inMorning || inAfternoon;

    let base = isHalfDay ? Math.round(BP * 0.7) : BP;
    fees.push({ label: isHalfDay ? 'Nửa ngày (×70%)' : '1 ngày', amount: base });

    if (isPickupWeekend) {
      fees.push({ label: 'Phụ phí cuối tuần', amount: 100_000 });
      base += 100_000;
    }
    return { valid: true, total: base, fees };
  }

  let earlyFee = 0;
  if (pickupHour >= 17 && pickupHour < 19) earlyFee = 100_000;
  else if (pickupHour >= 16 && pickupHour < 17) earlyFee = 200_000;

  let lateFee = 0;
  let lateExtraHalf = false;
  if (returnHour >= 23) lateExtraHalf = true;
  else if (returnHour >= 22) lateFee = 200_000;
  else if (returnHour >= 21) lateFee = 100_000;

  let baseDays: number;

  if (pickupHour <= 11) {
    baseDays = calDays + 1;
  } else if (pickupHour <= 15) {
    if (returnHour <= 12) {
      baseDays = calDays;
    } else {
      baseDays = calDays + 0.5;
    }
  } else {
    baseDays = calDays;
    if (pickupHour >= 19 && returnHour <= 12) {
      baseDays = calDays === 1 ? 0.7 : (calDays - 1) + 0.5;
    }
  }

  let baseAmount: number;
  if (baseDays === 0.7) {
    baseAmount = Math.round(BP * 0.7);
  } else {
    baseAmount = Math.round(BP * baseDays);
  }

  const wholeDays = Math.floor(baseDays);
  const daysLabel = baseDays === 0.7 ? 'Nửa ngày (×70%)'
    : baseDays % 1 === 0 ? (baseDays === 1 ? '1 ngày' : `${baseDays} ngày`)
    : baseDays === wholeDays + 0.5 ? `${wholeDays} ngày + nửa ngày (×50%)`
    : `${baseDays} ngày`;

  fees.push({ label: daysLabel, amount: baseAmount });

  if (lateExtraHalf) {
    const halfExtra = Math.round(BP * 0.5);
    fees.push({ label: 'Nửa ca thêm (trả sau 23h)', amount: halfExtra });
    baseAmount += halfExtra;
  }

  let weekendFee = 0;
  if (calDays === 1 && (isReturnSat || isReturnSun || isReturnWeekend)) {
    weekendFee = 100_000;
  }

  if (lateFee > 0) fees.push({ label: 'Phụ phí quá giờ', amount: lateFee });
  if (earlyFee > 0) fees.push({ label: 'Phụ phí nhận xe sớm', amount: earlyFee });
  if (weekendFee > 0) fees.push({ label: 'Phụ phí cuối tuần (T7/CN)', amount: weekendFee });

  const total = baseAmount + lateFee + earlyFee + weekendFee;

  return {
    valid: true,
    total,
    fees,
    note: calDays > 14 ? 'Thuê dài ngày — liên hệ để nhận giá tốt hơn' : undefined,
  };
}

// ─── Hour options ─────────────────────────────────────────────────────────────
const PICKUP_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const RETURN_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// ─── Pickup locations ─────────────────────────────────────────────────────────
const DELIVERY_FEE_PER_WAY = 100_000;

const LOCATIONS = [
  { id: 'times-city',   name: 'Times City',             address: 'Hai Bà Trưng, Hà Nội', mapUrl: 'https://maps.app.goo.gl/aytjYtSmkNVvDnJb9' },
  { id: 'ocean-park',   name: 'Ocean Park',             address: 'Gia Lâm, Hà Nội',      mapUrl: 'https://maps.app.goo.gl/G8UHdiVEqe7TFqxk9' },
  { id: 'manor',        name: 'The Manor Central Park', address: 'Bắc Từ Liêm, Hà Nội',  mapUrl: 'https://maps.app.goo.gl/8fAgFRwDGLgUqX5n7' },
  { id: 'trung-lan',    name: 'Trung Lân Gara',         address: 'Bắc Từ Liêm, Hà Nội',  mapUrl: 'https://maps.app.goo.gl/DHu1nP1h6Gwb3FjZ8' },
];

// ─── Bank / QR config ─────────────────────────────────────────────────────────
const BANK_ID = import.meta.env.VITE_BANK_ID || 'MB';
const BANK_ACCOUNT_RAW = import.meta.env.VITE_BANK_ACCOUNT || '';
const BANK_ACCOUNT = BANK_ACCOUNT_RAW === '0399118989' ? '' : BANK_ACCOUNT_RAW;
const BANK_NAME = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'CONG TY TNHH CAR MATCH';
const BANK_QR_ENABLED = Boolean(BANK_ACCOUNT);

// ─── Component ────────────────────────────────────────────────────────────────
interface RelatedCar {
  slug: string;
  name: string;
  price: number;
}

interface Props {
  basePrice: number;
  carName: string;
  priceMonth?: number;
  vehicleId?: string;
  carSlug?: string;
  kmPerDay?: number;
  relatedCars?: RelatedCar[];
}

export default function BookingWidget({ basePrice, carName, priceMonth, vehicleId, carSlug, kmPerDay = 300, relatedCars = [] }: Props) {
  // Local midnight — avoids toISOString UTC offset shifting day back in GMT+7
  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);
  const todayStr = toDateStr(today);
  const [pickupDate, setPickupDate] = useState(toDateStr(addDays(today, 1)));
  const [pickupHour, setPickupHour] = useState(20);
  const [returnDate, setReturnDate] = useState(toDateStr(addDays(today, 2)));
  const [returnHour, setReturnHour] = useState(20);
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'delivery'>('self');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('times-city');
  const [showModal, setShowModal] = useState(false);
  const initialPromoCode = useMemo(() => getInitialPromoCodeFromUrl(), []);

  // ── Availability ──────────────────────────────────────────────────────────
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);

  // ── Promo code ────────────────────────────────────────────────────────────
  const [promoCode, setPromoCode] = useState(initialPromoCode);
  const [promoResult, setPromoResult] = useState<{
    code: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoList, setPromoList] = useState<Array<{
    code: string;
    discount_type: string;
    discount_value: number;
    discount_amount: number;
    description: string;
    applicable: boolean;
    reason: string | null;
    expires_warning: string | null;
  }>>([]);
  const [promoListLoading, setPromoListLoading] = useState(false);
  const promoAutoAppliedRef = useRef(false);

  // ── Loyalty auto-discount ─────────────────────────────────────────────────
  const [referralCredit, setReferralCredit] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsValue, setPointsValue] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<{
    tier: string;
    discount_amount: number;
    customer_name: string;
  } | null>(null);

  // ── Booking flow ──────────────────────────────────────────────────────────
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [customerReferralCode, setCustomerReferralCode] = useState('');
  const [activeSuggestedCodes, setActiveSuggestedCodes] = useState<Array<{ code: string; discount_value: number; expires_at: string }>>([]);
  const [recentBookingsCount, setRecentBookingsCount] = useState(0);
  const [insuranceAddon, setInsuranceAddon] = useState(false);
  const [showInsuranceDetail, setShowInsuranceDetail] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [pointsPerTenK, setPointsPerTenK] = useState(1); // default 1 pt per 10k VND (overridden by DB setting)
  const [referralRewardAmount, setReferralRewardAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    const validationError = validatePaymentProof(file);
    if (validationError) {
      setUploadError(validationError);
      e.target.value = '';
      return;
    }
    setPaymentProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPaymentProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleConfirmPayment() {
    setUploadingProof(true);
    setUploadError('');
    try {
      if (paymentProofFile && bookingRef) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(paymentProofFile);
        });
        const res = await fetch('/api/bookings?action=upload-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_ref: bookingRef,
            phone: customerPhone.trim().replace(/\s/g, ''),
            file_base64: base64,
            file_name: paymentProofFile.name,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Upload thất bại');
        }
      }
      setBookingStep(3);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Không thể tải ảnh lên, vui lòng thử lại');
    } finally {
      setUploadingProof(false);
    }
  }

  const fetchAvailability = useCallback(async () => {
    if (!vehicleId) return;
    setAvailLoading(true);
    try {
      const from = todayStr;
      const to = toDateStr(addDays(today, 120));
      const res = await fetch(`/api/vehicle-availability?vehicleId=${vehicleId}&from=${from}&to=${to}`);
      if (!res.ok) return;
      const data = await res.json();
      setBlockedRanges(data.blockedRanges || []);
      setRequiresConfirmation(data.requires_confirmation === true);
      if (data.recent_bookings_count > 0) setRecentBookingsCount(data.recent_bookings_count);
    } catch {
      // graceful
    } finally {
      setAvailLoading(false);
    }
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

  // Fetch points_per_10k from DB on mount so preview is accurate before phone is entered
  useEffect(() => {
    fetch('/api/customer-discount?settings_only=1')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.points_settings?.points_per_10k) {
          setPointsPerTenK(Number(json.points_settings.points_per_10k));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-fill phone+name from logged-in session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setIsLoggedIn(true);
      const phone = session?.user?.app_metadata?.customer_phone as string | undefined;
      if (phone) {
        setCustomerPhone(prev => prev || phone);
        void checkLoyaltyDiscount(phone, true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCalModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showCalModal]);

  // Detect if the selected range overlaps any blocked period
  const { hard: hardConflicts, boundary: boundaryConflicts } = useMemo(
    () => categorizeConflicts(pickupDate, returnDate, blockedRanges),
    [pickupDate, returnDate, blockedRanges],
  );

  // Giữ biến `conflicts` để tương thích với calendar modifiers bên dưới
  const conflicts = [...hardConflicts, ...boundaryConflicts];

  const rentalResult = useMemo(
    () => calculateRental(pickupDate, pickupHour, returnDate, returnHour, basePrice),
    [pickupDate, pickupHour, returnDate, returnHour, basePrice],
  );

  const deliveryFee = deliveryMode === 'delivery' ? DELIVERY_FEE_PER_WAY * 2 : 0;
  // 10% tổng giá thuê xe, làm tròn đến 1.000đ
  const insuranceFeeAmount = rentalResult.valid ? Math.round(rentalResult.total * 0.1 / 1000) * 1000 : 0;
  const insuranceFee = insuranceAddon ? insuranceFeeAmount : 0;
  const orderTotalBeforePromo = rentalResult.valid ? rentalResult.total + deliveryFee + insuranceFee : 0;
  const totalAmount = orderTotalBeforePromo;
  const loyaltyDiscountAmount = loyaltyDiscount?.discount_amount ?? 0;

  const result = useMemo(() => {
    if (!rentalResult.valid) return rentalResult;
    const extraFees: Fee[] = deliveryMode === 'delivery'
      ? [{ label: 'Phí giao/trả xe (2 chiều)', amount: deliveryFee }]
      : [];
    const insuranceFees: Fee[] = insuranceAddon
      ? [{ label: 'Bảo hiểm chuyến đi', amount: insuranceFee }]
      : [];
    const loyaltyFee: Fee[] = loyaltyDiscount
      ? [{ label: loyaltyDiscount.tier === 'vip' ? '⭐ Ưu đãi VIP' : '✓ Ưu đãi khách thân thiết', amount: -loyaltyDiscountAmount, highlight: true }]
      : [];
    const promoFee: Fee[] = promoResult
      ? [{ label: `Mã ${promoResult.code}`, amount: -promoResult.discount_amount, highlight: true }]
      : [];
    return {
      ...rentalResult,
      fees: [...rentalResult.fees, ...extraFees, ...insuranceFees, ...loyaltyFee, ...promoFee],
      total: Math.max(0, orderTotalBeforePromo - loyaltyDiscountAmount - (promoResult?.discount_amount ?? 0)),
    };
  }, [rentalResult, deliveryMode, deliveryFee, insuranceAddon, insuranceFee, orderTotalBeforePromo, loyaltyDiscount, loyaltyDiscountAmount, promoResult]);

  const savings =
    priceMonth && basePrice > 0
      ? Math.round((1 - priceMonth / (basePrice * 30)) * 100)
      : 0;

  const handlePickupDate = (v: string) => {
    setPickupDate(v);
    if (v >= returnDate) setReturnDate(toDateStr(addDays(new Date(v), 1)));
  };

  // ── react-day-picker range selection ──────────────────────────────────────
  // Convert blocked ranges to { from, to } Date objects for DayPicker disabled prop
  const blockedIntervals = useMemo(
    () => blockedRanges.map((r) => {
      const fromDate = parseDateStr(r.from);
      // Không disable ngày trả xe (to) trên calendar — khách vẫn có thể chọn
      // ngày đó để nhận ca tiếp (tối hôm đó sau khi xe về). Chỉ block đến ngày trước đó.
      const effectiveTo = r.from === r.to
        ? parseDateStr(r.to)               // 1-day rental: vẫn block ngày đó
        : addDays(parseDateStr(r.to), -1); // multi-day: chỉ block đến to-1
      return { from: fromDate, to: effectiveTo };
    }),
    [blockedRanges],
  );

  const selectedRange = useMemo(() => ({
    from: parseDateStr(pickupDate),
    to: parseDateStr(returnDate),
  }), [pickupDate, returnDate]);

  // Step mode: first click = pickup, second = return
  const [rangeStep, setRangeStep] = useState<'from' | 'to'>('from');

  // Use onDayClick instead of onSelect — onSelect has stale-range issues in v8
  // when an existing range is already selected and user starts fresh
  const handleDayClick = useCallback((day: Date, modifiers: Record<string, boolean>) => {
    if (modifiers.disabled || modifiers.blocked) return;
    const ds = toDateStr(day);
    if (rangeStep === 'from') {
      setPickupDate(ds);
      setReturnDate(toDateStr(addDays(day, 1)));
      setRangeStep('to');
    } else {
      if (ds > pickupDate) {
        setReturnDate(ds);
        setRangeStep('from');
      } else {
        // clicked same day or before pickup → restart from this day
        setPickupDate(ds);
        setReturnDate(toDateStr(addDays(day, 1)));
        setRangeStep('to');
      }
    }
  }, [rangeStep, pickupDate]);

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const phoneParam = customerPhone.trim() ? `&phone=${encodeURIComponent(customerPhone.trim())}` : '';
      const res = await fetch(
        `/api/promo-validate?code=${encodeURIComponent(promoCode.trim())}&total=${totalAmount}&pickup_date=${pickupDate}${phoneParam}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Mã không hợp lệ');
      setPromoResult(json);
    } catch (e) {
      setPromoError((e as Error).message);
    } finally {
      setPromoLoading(false);
    }
  };

  const clearPromo = () => {
    setPromoCode('');
    setPromoResult(null);
    setPromoError('');
  };

  const checkLoyaltyDiscount = async (phone: string, autoFillName = false) => {
    const clean = phone.trim().replace(/\s/g, '');
    if (!/^(0[3-9]\d{8})$/.test(clean)) return;
    try {
      const res = await fetch(`/api/customer-discount?phone=${encodeURIComponent(clean)}&include_ledger=1&include_referral_codes=1`);
      const json = await res.json();
      if (res.ok && json.eligible && json.discount_amount > 0) {
        setLoyaltyDiscount({ tier: json.tier, discount_amount: json.discount_amount, customer_name: json.customer_name || '' });
      } else {
        setLoyaltyDiscount(null);
      }
      setReferralCredit(json.referral_credit || 0);
      setPointsBalance(json.points_balance || 0);
      setPointsValue(json.points_value || 0);
      setCustomerReferralCode(json.referral_code || '');
      const codes = [...(json.active_codes || []), ...(json.active_referral_codes || [])];
      setActiveSuggestedCodes(codes);
      if (json.points_settings?.points_per_10k) setPointsPerTenK(json.points_settings.points_per_10k);
      if (json.referral_reward_amount) setReferralRewardAmount(Number(json.referral_reward_amount));
      if (autoFillName && json.customer_name) {
        setCustomerName(prev => prev || json.customer_name);
      }
    } catch { setLoyaltyDiscount(null); setReferralCredit(0); setPointsBalance(0); setPointsValue(0); setCustomerReferralCode(''); setActiveSuggestedCodes([]); }
  };

  const fetchPromoList = useCallback(async () => {
    setPromoListLoading(true);
    try {
      const res = await fetch(`/api/promo-list?total=${totalAmount}`);
      const json = await res.json();
      if (res.ok) setPromoList(json.promos || []);
    } catch { /* silent */ } finally {
      setPromoListLoading(false);
    }
  }, [totalAmount]);

  const openPromoModal = () => {
    setShowPromoModal(true);
    void fetchPromoList();
  };

  const applyPromoFromList = async (code: string) => {
    setPromoCode(code);
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const phoneParam = customerPhone.trim() ? `&phone=${encodeURIComponent(customerPhone.trim())}` : '';
      const res = await fetch(`/api/promo-validate?code=${encodeURIComponent(code)}&total=${totalAmount}&pickup_date=${pickupDate}${phoneParam}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Mã không hợp lệ');
      setPromoResult(json);
      setShowPromoModal(false);
    } catch (e) {
      setPromoError((e as Error).message);
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    if (!initialPromoCode || promoAutoAppliedRef.current || totalAmount <= 0) return;
    promoAutoAppliedRef.current = true;
    void applyPromoFromList(initialPromoCode);
    // Run once when the calculator has a valid amount; `applyPromoFromList` reads the latest booking state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPromoCode, totalAmount]);

  const handleBookingSubmit = async () => {
    if (!customerName.trim()) { setBookingError('Vui lòng nhập họ tên'); return; }
    const phoneClean = customerPhone.trim().replace(/\s/g, '');
    if (!/^(0[3-9]\d{8})$/.test(phoneClean)) { setBookingError('Số điện thoại không hợp lệ'); return; }
    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      setBookingError('Vui lòng nhập địa chỉ giao xe');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    trackBookingSubmit('attempt', {
      vehicle_id: vehicleId || null,
      vehicle_name: carName,
      rental_days: rentalDays,
      total_amount: finalTotal,
      delivery_mode: deliveryMode,
      pickup_date: pickupDate,
      return_date: returnDate,
      promo_code: promoResult?.code ?? null,
    });
    try {
      const loc = LOCATIONS.find(l => l.id === selectedLocation);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId || null,
          car_slug: carSlug || null,
          car_name: carName,
          customer_name: customerName.trim(),
          customer_phone: phoneClean,
          customer_email: customerEmail.trim() || null,
          customer_note: customerNote.trim() || null,
          pickup_date: pickupDate,
          pickup_hour: pickupHour,
          return_date: returnDate,
          return_hour: returnHour,
          delivery_mode: deliveryMode,
          delivery_address: deliveryMode === 'delivery' ? deliveryAddress.trim() : null,
          location_name: deliveryMode === 'self' ? loc?.name : deliveryAddress.trim() || 'Giao tận nơi',
          base_amount: rentalResult.valid ? rentalResult.total : 0,
          delivery_fee: deliveryFee,
          insurance_addon: insuranceAddon,
          insurance_fee: insuranceFee,
          loyalty_tier: loyaltyDiscount?.tier ?? null,
          loyalty_discount: loyaltyDiscountAmount,
          promo_code: promoResult?.code ?? null,
          promo_discount: promoResult?.discount_amount ?? 0,
          total_amount: result.valid ? result.total : 0,
          requires_confirmation: requiresConfirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo đơn');
      setBookingRef(data.bookingRef);
      setDepositAmount(data.depositAmount);
      setBookingStep(BANK_QR_ENABLED ? 2 : 3);
      trackBookingSubmit('success', {
        vehicle_id: vehicleId || null,
        vehicle_name: carName,
        booking_ref: data.bookingRef,
        rental_days: rentalDays,
        total_amount: result.valid ? result.total : 0,
        deposit_amount: data.depositAmount,
        delivery_mode: deliveryMode,
        promo_code: promoResult?.code ?? null,
      });
    } catch (e: unknown) {
      const message = (e as Error)?.message || 'Lỗi kết nối, thử lại sau';
      setBookingError(message);
      trackBookingSubmit('error', {
        vehicle_id: vehicleId || null,
        vehicle_name: carName,
        rental_days: rentalDays,
        total_amount: finalTotal,
        error_message: message,
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const buildMessage = () => {
    const priceText = result.valid ? fmtVND(result.total) : 'báo giá';
    const loc = LOCATIONS.find(l => l.id === selectedLocation)!;
    const locationLine = deliveryMode === 'self'
      ? `📍 Địa điểm: ${loc.name} (${loc.address})`
      : `🚗 Giao xe tận nơi (phí 100.000đ/chiều)`;
    const promoLine = promoResult
      ? `🏷️ Mã giảm giá: ${promoResult.code} (-${fmtVND(promoResult.discount_amount)})\n`
      : '';
    return (
      `[ĐẶT XE - ${carName}]\n` +
      `📅 Nhận xe: ${displayDate(pickupDate)} lúc ${pickupHour}:00\n` +
      `📅 Trả xe: ${displayDate(returnDate)} lúc ${returnHour}:00\n` +
      `${locationLine}\n` +
      `${promoLine}` +
      `💰 Dự kiến: ${priceText}\n\n` +
      `Anh/chị xác nhận giúp lịch xe và giá thuê ạ!`
    );
  };

  const handleBook = () => setShowModal(true);

  const handleConfirmZalo = async () => {
    const message = buildMessage();
    try {
      await navigator.clipboard.writeText(message);
    } catch { /* blocked */ }
    trackZaloClick('booking_widget_confirm_zalo', {
      vehicle_id: vehicleId || null,
      vehicle_name: carName,
      rental_days: rentalDays,
      total_amount: finalTotal,
    });
    window.open(`${ZALO_LINK}?text=${encodeURIComponent(message)}`, '_blank');
    setShowModal(false);
  };

  function buildVietQR(amount: number, info: string): string {
    const encoded = encodeURIComponent(info);
    const name = encodeURIComponent(BANK_NAME);
    return `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encoded}&accountName=${name}`;
  }

  const selectedLocationInfo = LOCATIONS.find(l => l.id === selectedLocation);
  const finalTotal = result.valid ? result.total : 0;
  const promoDiscount = promoResult?.discount_amount ?? 0;
  const appliedPromo = promoResult?.code ?? '';
  const pickupDt = parseDateStr(pickupDate);
  pickupDt.setHours(pickupHour, 0, 0, 0);
  const returnDt = parseDateStr(returnDate);
  returnDt.setHours(returnHour, 0, 0, 0);
  const rentalDays = Math.max(1, Math.ceil((returnDt.getTime() - pickupDt.getTime()) / 86_400_000));
  const remainingAmount = Math.max(0, finalTotal - depositAmount);
  const bookingZaloHref = `${ZALO_LINK}?text=${encodeURIComponent(buildMessage())}`;

  const copyBookingConfirmation = async () => {
    const lines = [
      'ĐƠN XÁC NHẬN ĐẶT XE',
      `Mã Booking: ${bookingRef}`,
      `Khách hàng: ${customerName}`,
      `Số điện thoại: ${customerPhone}`,
      `Tên xe: ${carName}`,
      `Giờ nhận xe: ${pickupHour} giờ ngày ${displayDateSlash(pickupDate)}`,
      `Giờ trả xe: ${returnHour} giờ ngày ${displayDateSlash(returnDate)}`,
      `Số ngày thuê: ${rentalDays} ngày`,
      '',
      `Tổng giá: ${orderTotalBeforePromo.toLocaleString('vi-VN')}đ`,
      loyaltyDiscountAmount > 0 ? `Ưu đãi ${loyaltyDiscount?.tier === 'vip' ? 'VIP' : 'khách thân thiết'}: -${loyaltyDiscountAmount.toLocaleString('vi-VN')}đ` : null,
      promoDiscount > 0 ? `Giảm giá (${appliedPromo}): -${promoDiscount.toLocaleString('vi-VN')}đ` : null,
      (loyaltyDiscountAmount > 0 || promoDiscount > 0) ? `Tổng sau ưu đãi: ${finalTotal.toLocaleString('vi-VN')}đ` : null,
      `${BANK_QR_ENABLED ? 'Đã cọc' : 'Tiền cọc dự kiến'}: ${depositAmount.toLocaleString('vi-VN')}đ`,
      deliveryFee > 0 ? `Phí giao nhận xe: ${deliveryFee.toLocaleString('vi-VN')}đ` : null,
      'Điều kiện bảo hiểm: xác nhận theo hợp đồng và biên bản bàn giao',
      `Thanh toán khi nhận xe: ${remainingAmount.toLocaleString('vi-VN')}đ`,
      '',
      `Giới hạn: ${kmPerDay} km/ngày | Phụ trội: 3.000đ/km | 100.000đ/giờ`,
      'Liên hệ: Car Match Vận Hành 0975563290',
    ].filter(l => l !== null).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
    } catch { /* clipboard may be blocked */ }
  };

  return (
    <>
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
      {/* ── Price header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        {basePrice > 0 ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-brand-600">
              {fmtVND(basePrice)}
            </span>
            <span className="text-gray-400 text-sm">/ngày</span>
          </div>
        ) : (
          <div className="text-2xl font-bold text-brand-600">Liên hệ báo giá</div>
        )}

        {priceMonth && savings > 0 && (
          <div className="flex items-center gap-2 mt-2.5 p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="flex-1">
              <div className="text-xs text-gray-500">Thuê theo tháng</div>
              <div className="font-bold text-gray-900">{fmtVND(priceMonth)}/tháng</div>
            </div>
            <span className="text-xs font-bold text-green-700 bg-white border border-green-200 px-2.5 py-1 rounded-full whitespace-nowrap">
              Tiết kiệm {savings}%
            </span>
          </div>
        )}
      </div>

      {/* ── Date/time pickers ── */}
      <div className="px-5 py-4 space-y-3.5">
        {/* Pickup row */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Ngày nhận xe
          </label>
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 relative">
              <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white pointer-events-none">
                {displayDateSlash(pickupDate)}
              </div>
              <input
                type="date"
                value={pickupDate}
                min={todayStr}
                onChange={e => handlePickupDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
              />
            </div>
            <div className="relative col-span-2">
              <select
                value={pickupHour}
                onChange={e => setPickupHour(+e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors pr-7"
              >
                {PICKUP_HOURS.map(h => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Return row */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Ngày trả xe
          </label>
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 relative">
              <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white pointer-events-none">
                {displayDateSlash(returnDate)}
              </div>
              <input
                type="date"
                value={returnDate}
                min={pickupDate}
                onChange={e => setReturnDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
              />
            </div>
            <div className="relative col-span-2">
              <select
                value={returnHour}
                onChange={e => setReturnHour(+e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors pr-7"
              >
                {RETURN_HOURS.map(h => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Availability calendar button ── */}
        {vehicleId && (
          <div>
            <button
              type="button"
              onClick={() => { setShowCalModal(true); setRangeStep('from'); }}
              className="flex items-center gap-2 w-full py-2.5 px-3.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-colors"
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              {availLoading ? 'Đang tải lịch xe…' : 'Chọn ngày trên lịch'}
              <span className="ml-auto text-brand-400 text-xs font-normal">
                {displayDate(pickupDate)} → {displayDate(returnDate)}
              </span>
            </button>

            {/* Hard conflict — xe đang bận hẳn — cảnh báo đỏ + gợi xe khác */}
            {hardConflicts.length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  <div>
                    <div className="font-semibold mb-0.5">Xe đã có lịch trong khoảng này</div>
                    {hardConflicts.map((r, i) => (
                      <div key={i}>
                        {fmtDateShort(r.from)} – {fmtDateShort(r.to)}
                        {r.type === 'rental' ? ' (đang cho thuê)' : r.type === 'maintenance' ? ' (bảo dưỡng)' : ' (bận)'}
                      </div>
                    ))}
                    <div className="mt-1 text-red-600">Liên hệ Car Match để xác nhận lịch trống ạ.</div>
                  </div>
                </div>
                {relatedCars.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold text-amber-800 mb-2">Xe tương tự đang trống lịch</p>
                    <div className="space-y-1.5">
                      {relatedCars.map(c => (
                        <a
                          key={c.slug}
                          href={`/xe/${c.slug}`}
                          className="flex items-center justify-between rounded-lg bg-white border border-amber-100 px-3 py-2 text-xs hover:bg-amber-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-800">{c.name}</span>
                          <span className="text-amber-700 font-bold">{fmtVND(c.price)}/ngày →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Boundary day — xe về / nhận khách tối hôm đó — cảnh báo vàng mềm */}
            {boundaryConflicts.length > 0 && hardConflicts.length === 0 && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <div>
                  {boundaryConflicts.map((r, i) => {
                    const isPickupBoundary = r.to === pickupDate; // khách nhận xe đúng ngày xe ca trước trả
                    return (
                      <div key={i} className={`font-semibold ${i > 0 ? 'mt-1' : 'mb-0.5'}`}>
                        {isPickupBoundary
                          ? `Xe có lịch về tối ngày ${fmtDateShort(r.to)}`
                          : `Xe có lịch nhận khách từ tối ngày ${fmtDateShort(r.from)}`
                        }
                      </div>
                    );
                  })}
                  <div>
                    {boundaryConflicts.some(r => r.to === pickupDate)
                      ? <><strong>Giờ nhận từ 21:00 trở đi</strong> để đảm bảo xe đã kiểm tra và bàn giao.</>
                      : <><strong>Trả xe trước 20:00</strong> để Car Match kịp chuẩn bị cho ca tiếp theo.</>
                    }{' '}Car Match sẽ xác nhận lại lịch với bạn.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Location / delivery ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Địa điểm giao nhận xe
          </label>
          <div className="space-y-2">
            {/* Option 1: self pickup */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${deliveryMode === 'self' ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="deliveryMode"
                value="self"
                checked={deliveryMode === 'self'}
                onChange={() => setDeliveryMode('self')}
                className="mt-0.5 accent-brand-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Tôi tự đến lấy xe
                  </span>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Miễn phí</span>
                </div>

                {/* Sub-locations */}
                {deliveryMode === 'self' && (
                  <div className="mt-2.5 space-y-1.5 pl-1">
                    {LOCATIONS.map(loc => (
                      <label key={loc.id} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio"
                          name="location"
                          value={loc.id}
                          checked={selectedLocation === loc.id}
                          onChange={() => setSelectedLocation(loc.id)}
                          className="accent-brand-600"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700 font-medium">{loc.name}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{loc.address}</span>
                        </div>
                        <a
                          href={loc.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-brand-500 hover:text-brand-700 hover:underline shrink-0"
                        >
                          Bản đồ
                        </a>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </label>

            {/* Option 2: delivery */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${deliveryMode === 'delivery' ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="deliveryMode"
                value="delivery"
                checked={deliveryMode === 'delivery'}
                onChange={() => setDeliveryMode('delivery')}
                className="mt-0.5 accent-brand-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    Tôi muốn được giao xe tận nơi
                  </span>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">+100k/chiều</span>
                </div>
                {deliveryMode === 'delivery' && (
                  <>
                    <p className="text-xs text-gray-400 mt-1">Áp dụng trong nội thành Hà Nội. Phí 2 chiều (giao + trả): {fmtVND(DELIVERY_FEE_PER_WAY * 2)}</p>
                    <input
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Địa chỉ nhận xe (số nhà, đường, quận...)"
                      className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                    />
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* ── Price breakdown / error ── */}
        {!result.valid ? (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <span>{result.error}</span>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl overflow-hidden divide-y divide-gray-100">
            {/* Fee rows */}
            <div className="px-4 py-3 space-y-2">
              {result.fees.map((fee, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className={fee.amount < 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                    {fee.label}
                  </span>
                  <span className={`font-semibold ${fee.amount < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {fee.amount < 0 ? '-' : ''}{fmtVND(Math.abs(fee.amount))}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo row */}
            {promoResult ? (
              <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                    <Tag className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-green-700 truncate">{promoResult.code}</div>
                    <div className="text-xs text-green-600">
                      {promoResult.discount_type === 'percent'
                        ? `Giảm ${promoResult.discount_value}%`
                        : `Giảm cố định`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-green-600">-{fmtVND(promoResult.discount_amount)}</span>
                  <button
                    type="button"
                    onClick={clearPromo}
                    className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openPromoModal}
                className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center">
                    <Tag className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  Mã khuyến mãi
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Total row */}
            <div className="flex justify-between items-center px-4 py-3 bg-brand-50">
              <div>
                <div className="text-xs text-brand-600 font-medium">Tổng dự kiến</div>
                {result.note && (
                  <div className="text-xs text-gray-400 mt-0.5">{result.note}</div>
                )}
              </div>
              <span className="font-bold text-brand-600 text-xl">
                {fmtVND(result.total)}
              </span>
            </div>
          </div>
        )}

        {/* ── CTAs ── */}
        {recentBookingsCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 font-semibold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {recentBookingsCount} người đặt xe này trong 7 ngày qua
          </div>
        )}
        <button
          onClick={() => {
            trackCtaClick('booking_widget_open_form', {
              vehicle_id: vehicleId || null,
              vehicle_name: carName,
              rental_days: rentalDays,
              total_amount: finalTotal,
            });
            setShowBookingModal(true);
            setBookingStep(1);
            setBookingError('');
            setConfirmTransfer(false);
          }}
          disabled={!result.valid}
          className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CalendarDays className="w-4 h-4" />
          {requiresConfirmation ? 'Gửi yêu cầu đặt xe' : 'Đặt xe ngay'}
        </button>
        {requiresConfirmation && (
          <p className="text-center text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            Xe này cần xác nhận lịch với chủ xe. Car Match sẽ liên hệ bạn trong 1–2 giờ.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <a
            href={bookingZaloHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackZaloClick('booking_widget_contact', {
              vehicle_id: vehicleId || null,
              vehicle_name: carName,
              rental_days: rentalDays,
              total_amount: finalTotal,
            })}
            className="py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-sm"
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
            Zalo
          </a>
          <a
            href={`tel:${ZALO_NUMBER}`}
            onClick={() => trackPhoneClick('booking_widget_contact', {
              vehicle_id: vehicleId || null,
              vehicle_name: carName,
            })}
            className="py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-sm"
          >
            <Phone className="w-4 h-4 text-gray-400" />
            Gọi
          </a>
        </div>

        {/* Trust list */}
        <ul className="space-y-1 pt-0.5">
          {[
            '✓ Giá, cọc và điều kiện bảo hiểm được xác nhận trước khi chốt',
            '✓ Đặt cọc giữ xe theo hướng dẫn của Car Match',
            '✓ Giao xe tận tòa nhà theo lịch hẹn',
          ].map(t => (
            <li key={t} className="text-xs text-gray-400">{t}</li>
          ))}
        </ul>
      </div>
    </div>

    {/* ── Calendar Modal — portal to document.body (escapes sticky stacking context) ── */}
    {showCalModal && createPortal(
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6"
        onClick={() => setShowCalModal(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{ width: '90vw', maxWidth: 700, maxHeight: '92vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Chọn ngày thuê xe</h3>
              <p className={`text-xs mt-0.5 font-medium ${rangeStep === 'from' ? 'text-brand-600' : 'text-green-600'}`}>
                {rangeStep === 'from' ? '① Chọn ngày nhận xe' : '② Chọn ngày trả xe'}
              </p>
            </div>
            <button onClick={() => setShowCalModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* ── Calendar ── */}
          <div className="carmatch-cal overflow-x-auto py-2" style={{ minHeight: 260 }}>
            <div style={{ minWidth: 560, padding: '0 12px' }}>
              <DayPicker
                mode="range"
                selected={selectedRange}
                onDayClick={handleDayClick}
                numberOfMonths={2}
                pagedNavigation
                locale={vi}
                disabled={[{ before: today }, ...blockedIntervals]}
                modifiers={{ blocked: blockedIntervals }}
                modifiersClassNames={{ blocked: 'rdp-day_blocked' }}
                fromDate={today}
                showOutsideDays={false}
              />
            </div>
          </div>

          {/* ── Time pickers ── */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              {/* Nhận xe */}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-600 inline-block" />
                  Giờ nhận xe
                </div>
                <div className="relative">
                  <select
                    value={pickupHour}
                    onChange={e => setPickupHour(+e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 pr-8 cursor-pointer"
                  >
                    {PICKUP_HOURS.map(h => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Giờ hoạt động: 07:00 – 23:00</p>
              </div>

              {/* Trả xe */}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Giờ trả xe
                </div>
                <div className="relative">
                  <select
                    value={returnHour}
                    onChange={e => setReturnHour(+e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 pr-8 cursor-pointer"
                  >
                    {RETURN_HOURS.map(h => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Giờ hoạt động: 07:00 – 23:00</p>
              </div>
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="px-6 pb-2 flex flex-wrap gap-x-5 gap-y-1.5 shrink-0">
            {[
              { color: 'bg-brand-600 rounded-full', label: 'Ngày chọn' },
              { color: 'bg-brand-100 border border-brand-200 rounded', label: 'Trong khoảng' },
              { color: 'bg-red-100 border border-red-200 rounded', label: 'Đã có lịch (bận)' },
              { color: 'bg-gray-200 rounded opacity-60', label: 'Không khả dụng' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`w-3 h-3 inline-block shrink-0 ${color}`} />
                {label}
              </span>
            ))}
          </div>

          {/* ── Bottom bar ── */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center gap-3">
              {/* Summary */}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nhận xe</div>
                  <div className="font-bold text-gray-900 text-sm">{pickupHour}:00 · {displayDate(pickupDate)}</div>
                </div>
                <div className="flex flex-col items-center px-2 shrink-0">
                  <div className="text-gray-300">→</div>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    {(() => {
                      const d = Math.round((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / 86_400_000);
                      return d > 0 ? `${d} ngày` : '';
                    })()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trả xe</div>
                  <div className="font-bold text-gray-900 text-sm">{returnHour}:00 · {displayDate(returnDate)}</div>
                </div>
              </div>

              <button
                onClick={() => setShowCalModal(false)}
                className="shrink-0 py-3 px-7 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 active:scale-[0.98] transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Promo code modal ── */}
    {showPromoModal && createPortal(
      <div
        className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => setShowPromoModal(false)}
      >
        <div
          className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '85vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <h3 className="font-bold text-gray-900 text-base">Mã khuyến mãi</h3>
            <button
              onClick={() => setShowPromoModal(false)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Input area */}
          <div className="px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={e => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                }}
                onKeyDown={e => e.key === 'Enter' && void validatePromo()}
                placeholder="Nhập mã khuyến mãi"
                type="text"
                autoFocus
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                autoCapitalize="characters"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!promoCode.trim()) return;
                  await applyPromoFromList(promoCode.trim());
                }}
                disabled={promoLoading || !promoCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {promoLoading ? '...' : 'Áp dụng'}
              </button>
            </div>
            {promoError && (
              <p className="text-xs text-red-500 font-medium mt-2">{promoError}</p>
            )}
          </div>

          {/* Promo list */}
          <div className="overflow-y-auto flex-1 py-2">
            {promoListLoading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Đang tải mã...</div>
            ) : promoList.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Không có mã nào</div>
            ) : (
              promoList.map(item => (
                <div
                  key={item.code}
                  className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 ${
                    !item.applicable ? 'opacity-50' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.applicable ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Tag className={`w-5 h-5 ${item.applicable ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${item.applicable ? 'text-gray-900' : 'text-gray-400'}`}>
                      {item.code}
                    </div>
                    <div className={`text-xs mt-0.5 ${item.applicable ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.description}
                      {item.discount_amount > 0 && (
                        <span className="text-green-600 font-semibold"> · Tiết kiệm {fmtVND(item.discount_amount)}</span>
                      )}
                    </div>
                    {item.expires_warning && (
                      <div className="text-xs text-orange-500 font-medium mt-0.5">⏰ {item.expires_warning}</div>
                    )}
                    {!item.applicable && item.reason && (
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {item.reason}
                      </div>
                    )}
                  </div>

                  {/* Button */}
                  <button
                    type="button"
                    disabled={!item.applicable}
                    onClick={() => void applyPromoFromList(item.code)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      item.applicable
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Áp dụng
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Booking confirm modal — portal to escape sticky stacking context ── */}
    {showModal && createPortal(
      <div
        className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={() => setShowModal(false)}
      >
        <div
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Xác nhận thông tin đặt xe</h3>
            <p className="text-xs text-gray-400 mt-0.5">Kiểm tra lại trước khi gửi Zalo</p>
          </div>

          {/* Booking summary */}
          <div className="px-5 py-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Xe</span>
              <span className="font-semibold text-gray-800">{carName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nhận xe</span>
              <span className="font-semibold text-gray-800">{displayDate(pickupDate)} · {pickupHour}:00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Trả xe</span>
              <span className="font-semibold text-gray-800">{displayDate(returnDate)} · {returnHour}:00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Địa điểm</span>
              <span className="font-semibold text-gray-800 text-right max-w-[55%]">
                {deliveryMode === 'self'
                  ? LOCATIONS.find(l => l.id === selectedLocation)?.name
                  : 'Giao tận nơi'}
              </span>
            </div>
            {result.valid && (
              <>
                {loyaltyDiscount && (
                  <div className="flex justify-between text-sm text-violet-600">
                    <span>{loyaltyDiscount.tier === 'vip' ? '⭐ Ưu đãi VIP' : '✓ Ưu đãi khách thân thiết'}</span>
                    <span className="font-semibold">-{fmtVND(loyaltyDiscountAmount)}</span>
                  </div>
                )}
                {promoResult && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Mã {promoResult.code}</span>
                    <span className="font-semibold">-{fmtVND(promoResult.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Dự kiến</span>
                  <span className="font-bold text-brand-600 text-base">{fmtVND(result.total)}</span>
                </div>
              </>
            )}
          </div>

          {/* Instruction */}
          <div className="mx-5 mb-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5 text-xs text-blue-700">
            <span className="text-sm mt-0.5">💬</span>
            <span>Nội dung đặt xe sẽ được <strong>tự động copy</strong>. Sau khi Zalo mở, <strong>nhấn giữ vào ô chat → Dán</strong> là xong!</span>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-2.5">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Sửa lại
            </button>
            <button
              onClick={handleConfirmZalo}
              className="flex-[2] py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              Copy & Mở Zalo
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Booking flow modal ── */}
    {showBookingModal && createPortal(
      <div
        className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
        onClick={() => bookingStep < 3 && setShowBookingModal(false)}
      >
        <div
          className="w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '95vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Step indicator ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              {([1, 2, 3] as const).map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    bookingStep === s ? 'bg-brand-600 text-white'
                    : bookingStep > s ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                    {bookingStep > s ? '✓' : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${bookingStep === s ? 'text-brand-600' : 'text-gray-400'}`}>
                    {s === 1 ? 'Thông tin' : s === 2 ? 'Đặt cọc' : 'Xác nhận'}
                  </span>
                  {s < 3 && <div className="w-6 h-px bg-gray-200" />}
                </div>
              ))}
            </div>
            {bookingStep < 3 && (
              <button onClick={() => setShowBookingModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">

            {/* ══ STEP 1: Info form ══ */}
            {bookingStep === 1 && (
              <div className="px-5 py-4 space-y-4">
                {/* Booking summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="font-bold text-gray-900 text-base">{carName}</div>
                  <div className="flex justify-between text-gray-600">
                    <span>Nhận xe</span>
                    <span className="font-medium">{displayDate(pickupDate)} · {pickupHour}:00</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Trả xe</span>
                    <span className="font-medium">{displayDate(returnDate)} · {returnHour}:00</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Địa điểm</span>
                    <span className="font-medium text-right max-w-[55%]">
                      {deliveryMode === 'self' ? LOCATIONS.find(l => l.id === selectedLocation)?.name : 'Giao tận nơi'}
                    </span>
                  </div>
                  {loyaltyDiscount && (
                    <div className="flex justify-between text-violet-600">
                      <span>{loyaltyDiscount.tier === 'vip' ? '⭐ Ưu đãi VIP' : '✓ Ưu đãi khách thân thiết'}</span>
                      <span className="font-medium">-{fmtVND(loyaltyDiscountAmount)}</span>
                    </div>
                  )}
                  {promoResult && (
                    <div className="flex justify-between text-green-600">
                      <span>Mã {promoResult.code}</span>
                      <span className="font-medium">-{fmtVND(promoResult.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-800">Tổng dự kiến</span>
                    <span className="font-bold text-brand-600 text-base">{result.valid ? fmtVND(result.total) : '—'}</span>
                  </div>
                  {result.valid && result.total > 0 && (
                    <div className="text-xs text-blue-600 font-medium text-right">
                      ⭐ Tích được ~{Math.floor(result.total / 10000) * pointsPerTenK} điểm chuyến này
                    </div>
                  )}
                </div>

                {/* Customer form */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={customerName}
                    onChange={e => { setCustomerName(e.target.value); setBookingError(''); }}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={customerPhone}
                    onChange={e => { setCustomerPhone(e.target.value); setBookingError(''); setLoyaltyDiscount(null); setReferralCredit(0); setPointsBalance(0); setPointsValue(0); }}
                    onBlur={e => void checkLoyaltyDiscount(e.target.value)}
                    placeholder="0912 345 678"
                    type="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                  />
                  {loyaltyDiscount && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2.5">
                      <div>
                        <p className="text-xs font-black text-violet-800">
                          {loyaltyDiscount.tier === 'vip' ? '⭐ Khách VIP' : '🔄 Khách thân thiết'} — Ưu đãi dành riêng
                        </p>
                        <p className="text-xs text-violet-600 mt-0.5">
                          Giảm {loyaltyDiscount.discount_amount.toLocaleString('vi-VN')}đ — tự động áp dụng ✓
                        </p>
                      </div>
                    </div>
                  )}
                  {referralCredit > 0 && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                      <span className="text-base">🎁</span>
                      <div>
                        <p className="text-xs font-black text-amber-800">Thưởng giới thiệu</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Bạn có <strong>{referralCredit.toLocaleString('vi-VN')}đ</strong> — nhân viên sẽ tự động áp dụng khi lập hợp đồng
                        </p>
                      </div>
                    </div>
                  )}
                  {pointsValue > 0 && (
                    <div className="mt-2 flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                      <span className="text-base">⭐</span>
                      <div>
                        <p className="text-xs font-black text-blue-800">{pointsBalance.toLocaleString('vi-VN')} điểm tích lũy</p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Quy đổi được <strong>{pointsValue.toLocaleString('vi-VN')}đ</strong> — liên hệ nhân viên để sử dụng
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Email nhận xác nhận <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                  </label>
                  <input
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com — nhận xác nhận đặt xe"
                    type="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Mã giảm giá <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={e => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                        setPromoResult(null);
                      }}
                      onKeyDown={e => e.key === 'Enter' && void validatePromo()}
                      placeholder="SUMMER10"
                      type="text"
                      disabled={Boolean(promoResult)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                      autoCapitalize="characters"
                    />
                    <button
                      type="button"
                      onClick={() => void validatePromo()}
                      disabled={promoLoading || Boolean(promoResult)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                        promoResult
                          ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                          : 'bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {promoLoading ? '...' : promoResult ? '✓ Đã áp dụng' : 'Áp dụng'}
                    </button>
                  </div>
                  {promoResult && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs text-green-700 flex items-center justify-between gap-1.5">
                      <span>✅ Giảm {fmtVND(promoResult.discount_amount)}</span>
                      <button
                        type="button"
                        onClick={clearPromo}
                        className="font-bold text-green-700 hover:text-red-500"
                        aria-label="Xóa mã giảm giá"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="text-xs text-red-500 font-medium mt-1">{promoError}</p>
                  )}
                  {!promoResult && activeSuggestedCodes.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs text-gray-400 font-medium">Mã của bạn:</p>
                      {activeSuggestedCodes.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => void applyPromoFromList(c.code)}
                          className="w-full flex items-center justify-between rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs hover:bg-cyan-100 transition-colors"
                        >
                          <span className="font-mono font-bold text-cyan-800">{c.code}</span>
                          <span className="text-cyan-600 font-semibold">Giảm {c.discount_value.toLocaleString('vi-VN')}đ · Áp dụng →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Add-on bảo hiểm */}
                <div className={`rounded-xl border transition-colors overflow-hidden ${insuranceAddon ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                  {/* Hàng chọn bảo hiểm */}
                  <label className="flex items-start gap-3 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={insuranceAddon}
                      onChange={e => setInsuranceAddon(e.target.checked)}
                      className="mt-0.5 accent-green-600 w-4 h-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800">🛡️ Bảo hiểm chuyến đi</span>
                        <span className="text-xs font-bold text-green-700 shrink-0">
                          {rentalResult.valid ? `+${fmtVND(insuranceFeeAmount)}` : '+10% giá thuê'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tai nạn đâm va, cháy nổ, ngập nước · Cứu hộ miễn phí 70 km
                      </p>
                    </div>
                  </label>

                  {/* Toggle chi tiết */}
                  <button
                    type="button"
                    onClick={() => setShowInsuranceDetail(v => !v)}
                    className="w-full flex items-center justify-between px-3 pb-2.5 text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors"
                  >
                    <span>{showInsuranceDetail ? 'Ẩn chi tiết' : 'Xem chi tiết bảo hiểm'}</span>
                    {showInsuranceDetail ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  {/* Chi tiết mở rộng */}
                  {showInsuranceDetail && (
                    <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-3 text-xs">
                      {/* Được bảo hiểm */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5">✅ Được bảo hiểm</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Tai nạn đâm va, cháy nổ, lật đổ xe</li>
                          <li>• Trầy xước, bóp mép dù nhẹ hay nặng</li>
                          <li>• Thiệt hại do hành động ác ý từ bên thứ ba</li>
                          <li>• Tổn thất động cơ do ngập nước (khấu trừ 20%)</li>
                          <li>• Mất nguyên chiếc xe</li>
                          <li>• Cứu hộ kéo xe miễn phí tối đa 70 km/vụ</li>
                        </ul>
                      </div>

                      {/* Không được bảo hiểm */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5">❌ Không được bảo hiểm</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Cố ý gây thiệt hại hoặc vi phạm pháp luật</li>
                          <li>• Sử dụng sai mục đích (đua xe, chạy hàng cấm...)</li>
                          <li>• Mất cắp phụ kiện, lốp xe riêng lẻ</li>
                          <li>• Hao mòn tự nhiên (lốp mòn, kính mờ...)</li>
                          <li>• Lái xe ra ngoài lãnh thổ Việt Nam</li>
                        </ul>
                      </div>

                      {/* Mức khấu trừ — quan trọng nhất */}
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                        <p className="font-semibold text-amber-800 mb-1">⚠️ Mức khấu trừ khi có sự cố</p>
                        <p className="text-amber-700 leading-relaxed">
                          Khách chịu tối đa <strong>2.000.000đ</strong> tiền sửa xe + chi phí thuê xe trong những ngày xe nằm gara. Phần thiệt hại vượt quá do bảo hiểm chi trả.
                        </p>
                      </div>

                      {/* Không mua bảo hiểm */}
                      <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                        <p className="font-semibold text-red-800 mb-1">⛔ Nếu không mua bảo hiểm</p>
                        <p className="text-red-700 leading-relaxed">
                          Khách chịu <strong>100% chi phí</strong> sửa chữa khi có va chạm, trầy xước hoặc hư hỏng trong thời gian thuê.
                        </p>
                      </div>

                      {/* Quy trình xử lý sự cố */}
                      <div>
                        <p className="font-semibold text-gray-800 mb-1.5">🚨 Quy trình xử lý khi xảy ra sự cố</p>
                        <ol className="space-y-1.5 text-gray-600">
                          <li className="flex gap-2"><span className="font-bold shrink-0">1.</span><span><strong>Giữ nguyên hiện trường</strong> và chụp ảnh xe đang bị sự cố.</span></li>
                          <li className="flex gap-2"><span className="font-bold shrink-0">2.</span><span>Gọi cho nhân viên Car Match để được hướng dẫn liên hệ trung tâm bồi thường của nhà bảo hiểm.</span></li>
                          <li className="flex gap-2"><span className="font-bold shrink-0">3.</span><span>Giám định viên bảo hiểm liên hệ hướng dẫn xử lý, xác minh thông tin và hiện trường.</span></li>
                          <li className="flex gap-2"><span className="font-bold shrink-0">4.</span><span>Giám định viên và chủ xe/khách thuê cùng đưa xe ra Garage để <strong>giám định thiệt hại và ra báo giá sửa chữa</strong>.</span></li>
                          <li className="flex gap-2"><span className="font-bold shrink-0">5.</span><span>Trung tâm bồi thường ra <strong>Biên bản giám định</strong> thiệt hại.</span></li>
                          <li className="flex gap-2"><span className="font-bold shrink-0">6.</span><span>Garage tiến hành sửa chữa theo báo giá đã được xác nhận.</span></li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                    placeholder="Yêu cầu đặc biệt, địa chỉ giao xe..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors resize-none"
                  />
                </div>
                {bookingError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                    <span>⚠</span> {bookingError}
                  </p>
                )}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-700 flex items-start gap-2">
                  <span className="shrink-0">ℹ️</span>
                  <span>
                    <strong>Chính sách hủy:</strong> Hủy trước 24h hoàn 100% cọc.
                    Hủy trong 24h hoặc không đến nhận xe mất cọc.
                  </span>
                </div>
              </div>
            )}

            {/* ══ STEP 2: QR deposit ══ */}
            {bookingStep === 2 && (
              <div className="px-5 py-4 space-y-4">
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-base">Đặt cọc để giữ xe</div>
                  <p className="text-sm text-gray-500 mt-1">Chuyển khoản <strong className="text-brand-600">{fmtVND(depositAmount)}</strong> để xác nhận đơn</p>
                  <p className="text-xs text-gray-400 mt-0.5">Cọc trừ vào tổng tiền khi nhận xe · Hủy trước 24h hoàn 100%</p>
                  {promoResult && (
                    <p className="text-xs font-semibold text-green-600 mt-1">
                      Đã áp dụng mã {promoResult.code} — giảm {fmtVND(promoResult.discount_amount)}
                    </p>
                  )}
                </div>

                {BANK_QR_ENABLED ? (
                  <>
                    {/* QR code */}
                    <div className="flex justify-center">
                      <div className="border-2 border-brand-100 rounded-2xl p-3 bg-white shadow-sm">
                        <img
                          src={buildVietQR(depositAmount, `DATXE ${bookingRef}`)}
                          alt="QR chuyển khoản"
                          className="w-52 h-52 object-contain"
                          width={208}
                          height={208}
                          loading="lazy"
                          decoding="async"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    </div>

                    {/* Bank info */}
                    <div className="bg-brand-50 rounded-xl p-4 space-y-2 text-sm border border-brand-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ngân hàng</span>
                        <span className="font-bold text-gray-900">{BANK_ID} Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Số tài khoản</span>
                        <span className="font-bold text-gray-900 font-mono">{BANK_ACCOUNT}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Chủ tài khoản</span>
                        <span className="font-bold text-gray-900 text-right max-w-[55%]">{BANK_NAME}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Số tiền</span>
                        <span className="font-bold text-brand-600 text-base">{fmtVND(depositAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-brand-200">
                        <span className="text-gray-500 shrink-0">Nội dung CK</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 font-mono bg-white px-2 py-0.5 rounded-lg border border-brand-200 text-xs tracking-wider">{`DATXE ${bookingRef}`}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`DATXE ${bookingRef}`).then(() => {
                                setCopiedRef(true);
                                setTimeout(() => setCopiedRef(false), 2000);
                              });
                            }}
                            className="p-1 rounded-md border border-brand-200 bg-white hover:bg-brand-50 text-brand-500 transition-colors"
                            title="Copy nội dung chuyển khoản"
                          >
                            {copiedRef ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 text-xs text-amber-700">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <span>Nhập <strong>đúng nội dung chuyển khoản</strong> để Car Match đối soát nhanh hơn. Phần cọc sẽ trừ vào tổng tiền thuê.</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">ℹ️</span>
                      <span>
                        <strong>Chính sách hủy:</strong> Điều kiện hoàn cọc phụ thuộc thời điểm hủy, mẫu xe và lịch đã giữ.{' '}
                        <a href="/chinh-sach" className="underline text-amber-600 hover:text-amber-800" target="_blank" rel="noopener noreferrer">
                          Xem chi tiết →
                        </a>
                      </span>
                    </div>

                    {/* Upload ảnh chuyển khoản */}
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Tải ảnh chuyển khoản <span className="text-gray-400 font-normal">(tuỳ chọn — giúp xác nhận nhanh hơn)</span>
                      </p>
                      <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden ${
                        paymentProofPreview
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50'
                      }`}>
                        {paymentProofPreview ? (
                          <img src={paymentProofPreview} alt="Ảnh chuyển khoản" className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-400 pointer-events-none">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-xs text-center px-4">Nhấn để chọn ảnh bill chuyển khoản</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProofSelect}
                        />
                      </label>
                      {paymentProofPreview && (
                        <button
                          type="button"
                          onClick={() => { setPaymentProofPreview(null); setPaymentProofFile(null); }}
                          className="mt-1.5 text-xs text-red-500 hover:text-red-700"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    {uploadError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
                    )}

                    {/* Xác nhận đã chuyển khoản */}
                    <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={confirmTransfer}
                        onChange={e => setConfirmTransfer(e.target.checked)}
                        className="mt-0.5 accent-green-600 w-4 h-4 shrink-0"
                      />
                      <span className="text-xs text-gray-700 leading-relaxed">
                        Tôi xác nhận đã chuyển khoản <strong className="text-gray-900">{fmtVND(depositAmount)}</strong> với nội dung <strong className="font-mono text-brand-700">DATXE {bookingRef}</strong>
                      </span>
                    </label>

                    {/* Tư vấn trước */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-center text-gray-400 mb-2">Chưa muốn chuyển khoản ngay?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://zalo.me/${ZALO_NUMBER}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackZaloClick('booking_step2_consult')}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          Nhắn Zalo tư vấn
                        </a>
                        <a
                          href={`tel:${ZALO_NUMBER}`}
                          onClick={() => trackPhoneClick('booking_step2_consult')}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          Gọi hỏi trước
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Car Match chưa bật QR chuyển khoản online. Đơn của bạn đã được gửi tới CSKH, team sẽ liên hệ để xác nhận lịch xe và hướng dẫn đặt cọc bằng tài khoản chính thức.
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 3: Confirmation ══ */}
            {bookingStep === 3 && (
              <div className="px-5 py-5 space-y-4">
                {/* Header xác nhận */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Đặt xe thành công!</h3>
                  <p className="text-sm text-slate-500 mt-1">Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút</p>
                </div>

                {/* Card xác nhận */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-900 text-base">ĐƠN XÁC NHẬN ĐẶT XE</span>
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Đã đặt</span>
                  </div>

                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                    <span className="text-slate-500 whitespace-nowrap">Mã Booking</span>
                    <span className="font-bold text-blue-600">{bookingRef}</span>

                    <span className="text-slate-500">Khách hàng</span>
                    <span className="font-semibold text-slate-900">{customerName}</span>

                    <span className="text-slate-500">Số điện thoại</span>
                    <span className="font-semibold text-slate-900">{customerPhone}</span>

                    <span className="text-slate-500">Tên xe</span>
                    <span className="font-semibold text-slate-900">{carName}</span>

                    <span className="text-slate-500">Nhận xe</span>
                    <span className="font-semibold text-slate-900">{pickupHour} giờ ngày {displayDateSlash(pickupDate)}</span>

                    <span className="text-slate-500">Trả xe</span>
                    <span className="font-semibold text-slate-900">{returnHour} giờ ngày {displayDateSlash(returnDate)}</span>

                    <span className="text-slate-500">Số ngày thuê</span>
                    <span className="font-semibold text-slate-900">{rentalDays} ngày</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tổng giá</span>
                      <span className="font-bold text-slate-900">{orderTotalBeforePromo.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {loyaltyDiscountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ưu đãi {loyaltyDiscount?.tier === 'vip' ? 'VIP' : 'khách thân thiết'}</span>
                        <span className="font-semibold text-purple-600">-{loyaltyDiscountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Giảm giá ({appliedPromo})</span>
                        <span className="font-semibold text-green-600">-{promoDiscount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {(loyaltyDiscountAmount > 0 || promoDiscount > 0) && (
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-1">
                        <span className="text-slate-500 font-medium">Tổng sau ưu đãi</span>
                        <span className="font-bold text-slate-900">{finalTotal.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">{BANK_QR_ENABLED ? 'Đã cọc (chuyển khoản)' : 'Tiền cọc dự kiến'}</span>
                      <span className="font-semibold text-blue-600">{depositAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phí giao nhận xe</span>
                        <span className="font-semibold text-slate-900">{deliveryFee.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                      <span className="font-bold text-slate-900">Thanh toán khi nhận xe</span>
                      <span className="font-black text-red-600 text-base">{remainingAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between"><span>Giới hạn Km</span><span className="text-slate-700">{kmPerDay} km/ngày</span></div>
                    <div className="flex justify-between"><span>Phụ trội quá km</span><span className="text-slate-700">3.000 đ/km</span></div>
                    <div className="flex justify-between"><span>Phụ trội quá giờ</span><span className="text-slate-700">100.000 đ/giờ</span></div>
                  </div>

                  <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                    <p className="font-semibold text-slate-700">Thủ tục thuê xe</p>
                    <p className="text-slate-500">• Căn cước, bằng lái (xác minh, không giữ lại)</p>
                    <p className="text-slate-500">• Tài sản thế chấp (giữ lại): Từ 15 triệu hoặc xe máy có giá trị tương đương</p>
                  </div>

                  <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                    <p className="font-semibold text-slate-700">Liên hệ nhận xe & xử lý sự cố</p>
                    <p className="text-slate-500">📞 Car Match Vận Hành: <span className="font-semibold text-slate-800">0975 563 290</span></p>
                    {selectedLocationInfo?.name && (
                      <p className="text-slate-500">📍 {selectedLocationInfo.name}</p>
                    )}
                  </div>
                </div>

                {/* Bước tiếp theo */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800 space-y-1.5">
                  <p className="font-bold text-blue-900 text-sm">Bước tiếp theo</p>
                  <p>1️⃣ Nhân viên gọi xác nhận trong <strong>30 phút</strong> (giờ hành chính)</p>
                  <p>2️⃣ Chuẩn bị <strong>CCCD + GPLX</strong> khi đến nhận xe</p>
                  <p>3️⃣ Thanh toán phần còn lại <strong>{remainingAmount.toLocaleString('vi-VN')}đ</strong> khi nhận xe</p>
                </div>

                {/* CTA đăng ký tài khoản — chỉ hiện khi chưa đăng nhập */}
                {!isLoggedIn && (
                  <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 px-4 py-3.5">
                    <p className="font-bold text-violet-900 text-sm mb-2">✨ Tạo tài khoản — theo dõi & quản lý đơn hàng</p>
                    <ul className="space-y-1 text-xs text-violet-800 mb-3">
                      <li>⭐ Tích điểm mỗi chuyến, đổi ưu đãi độc quyền</li>
                      <li>📋 Xem lịch sử đặt xe, tải xác nhận bất cứ lúc nào</li>
                      <li>⚡ Đặt xe lại nhanh — thông tin tự điền sẵn</li>
                      <li>🌟 Lên hạng khách thân thiết / VIP — giảm giá tự động</li>
                      <li>💬 Đánh giá xe sau chuyến để nhận thêm điểm</li>
                    </ul>
                    <Link
                      to="/tai-khoan"
                      onClick={() => setShowBookingModal(false)}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
                    >
                      Tạo tài khoản miễn phí →
                    </Link>
                  </div>
                )}

                {/* Refer friend CTA — chỉ hiện khi đã đăng nhập và có referral code */}
                {customerReferralCode && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    <p className="font-bold text-amber-900 text-sm mb-1">🎁 Giới thiệu bạn bè — nhận mã giảm giá</p>
                    <p className="mb-2">Bạn bè đặt xe thành công bằng mã của bạn → nhận <strong>mã giảm giá {referralRewardAmount > 0 ? fmtVND(referralRewardAmount) : '100.000đ'}</strong> cho chuyến thuê tiếp theo</p>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `Thuê xe tự lái tại Car Match — chất lượng, giao tận nơi!\nDùng mã giới thiệu của mình: ${customerReferralCode}\ncarmatch.vn/?ref=${customerReferralCode}`;
                        navigator.clipboard.writeText(msg).catch(() => {});
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy mã {customerReferralCode}
                    </button>
                  </div>
                )}

                {/* Utility actions — gộp thành 1 hàng compact */}
                {(() => {
                  const fmt = (dateStr: string, hour: number) => `${dateStr.replace(/-/g, '')}T${String(hour).padStart(2, '0')}0000`;
                  const loc = deliveryMode === 'self'
                    ? (LOCATIONS.find(l => l.id === selectedLocation)?.name || '')
                    : (deliveryAddress || 'Giao tận nơi');
                  const details = `Mã đặt xe: ${bookingRef}\nXe: ${carName}\nLiên hệ Car Match: 0975563290`;
                  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Nhận xe ${carName}`)}&dates=${fmt(pickupDate, pickupHour)}/${fmt(returnDate, returnHour)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`;
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={calUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 rounded-xl border border-green-200 bg-green-50 py-2.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <span className="text-base">📅</span>
                        <span>Calendar</span>
                      </a>
                      <button
                        onClick={() => void copyBookingConfirmation()}
                        className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-base">📋</span>
                        <span>Copy tóm tắt</span>
                      </button>
                      <Link
                        to={`/dat-xe?ref=${bookingRef}&phone=${encodeURIComponent(customerPhone.trim().replace(/\s/g, ''))}`}
                        className="flex flex-col items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 py-2.5 text-xs font-medium text-cyan-700 hover:bg-cyan-100 transition-colors"
                      >
                        <span className="text-base">🔍</span>
                        <span>Xem đơn</span>
                      </Link>
                    </div>
                  );
                })()}

                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingStep(1);
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerEmail('');
                    setCustomerNote('');
                    setDeliveryAddress('');
                    setPromoCode('');
                    setPromoResult(null);
                    setPromoError('');
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 py-3 text-sm font-bold text-white shadow hover:from-cyan-600 hover:to-cyan-500 transition-all"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          {bookingStep < 3 && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-2">
            {bookingStep === 1 && (
              <button
                onClick={handleBookingSubmit}
                disabled={bookingLoading}
                className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {bookingLoading ? <span className="animate-spin">⟳</span> : <CalendarDays className="w-4 h-4" />}
                {bookingLoading ? 'Đang xử lý…' : BANK_QR_ENABLED ? 'Tiếp tục — Xem QR đặt cọc' : 'Gửi yêu cầu đặt xe'}
              </button>
            )}
            {bookingStep === 2 && (
              <>
                <button
                  onClick={handleConfirmPayment}
                  disabled={uploadingProof || (!confirmTransfer && !paymentProofFile)}
                  className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingProof ? (
                    <>
                      <span className="animate-spin text-base">⟳</span>
                      Đang tải ảnh lên…
                    </>
                  ) : paymentProofFile ? (
                    <>
                      <Upload className="w-4 h-4" />
                      Gửi ảnh & xác nhận đã chuyển khoản ✓
                    </>
                  ) : (
                    'Xác nhận đã chuyển khoản ✓'
                  )}
                </button>
                {!confirmTransfer && !paymentProofFile && (
                  <p className="text-xs text-center text-gray-400">Tích chọn xác nhận phía trên để tiếp tục</p>
                )}
                <button
                  onClick={() => setBookingStep(1)}
                  disabled={uploadingProof}
                  className="w-full py-2.5 border border-gray-200 text-gray-500 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Quay lại
                </button>
              </>
            )}
          </div>
          )}
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
