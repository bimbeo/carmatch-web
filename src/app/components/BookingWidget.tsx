import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Phone, Info, ChevronDown, MapPin, Truck, CalendarDays, X, Tag } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

const ZALO_NUMBER = '0975563290';
const ZALO_LINK = `https://zalo.me/${ZALO_NUMBER}`;

// ─── Availability types ────────────────────────────────────────────────────────

interface BlockedRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  type: string; // rental | blocked | maintenance | ...
  allDay: boolean;
}

interface PublicPromoCode {
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_discount: number | null;
  min_order: number;
  expiresInDays: number | null;
}

function rangeOverlapsBlocked(fromStr: string, toStr: string, ranges: BlockedRange[]): BlockedRange[] {
  return ranges.filter((r) => r.from <= toStr && r.to >= fromStr);
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
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
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT || '0399118989';
const BANK_NAME = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'CONG TY TNHH CAR MATCH';

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  basePrice: number;
  carName: string;
  priceMonth?: number;
  vehicleId?: string;
}

export default function BookingWidget({ basePrice, carName, priceMonth, vehicleId }: Props) {
  // Local midnight — avoids toISOString UTC offset shifting day back in GMT+7
  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);
  const todayStr = toDateStr(today);
  const [pickupDate, setPickupDate] = useState(toDateStr(addDays(today, 1)));
  const [pickupHour, setPickupHour] = useState(20);
  const [returnDate, setReturnDate] = useState(toDateStr(addDays(today, 2)));
  const [returnHour, setReturnHour] = useState(20);
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'delivery'>('self');
  const [selectedLocation, setSelectedLocation] = useState('times-city');
  const [showModal, setShowModal] = useState(false);

  // ── Availability ──────────────────────────────────────────────────────────
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);

  // ── Promo code ────────────────────────────────────────────────────────────
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoList, setPromoList] = useState<PublicPromoCode[]>([]);
  const [promoListLoading, setPromoListLoading] = useState(false);

  // ── Booking flow ──────────────────────────────────────────────────────────
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);

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
    } catch {
      // graceful
    } finally {
      setAvailLoading(false);
    }
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

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
  const conflicts = useMemo(
    () => rangeOverlapsBlocked(pickupDate, returnDate, blockedRanges),
    [pickupDate, returnDate, blockedRanges],
  );

  const rentalResult = useMemo(
    () => calculateRental(pickupDate, pickupHour, returnDate, returnHour, basePrice),
    [pickupDate, pickupHour, returnDate, returnHour, basePrice],
  );

  const deliveryFee = deliveryMode === 'delivery' ? DELIVERY_FEE_PER_WAY * 2 : 0;
  const orderTotalBeforePromo = rentalResult.valid ? rentalResult.total + deliveryFee : 0;

  const result = useMemo(() => {
    if (!rentalResult.valid) return rentalResult;
    const extraFees: Fee[] = deliveryMode === 'delivery'
      ? [{ label: 'Phí giao/trả xe (2 chiều)', amount: deliveryFee }]
      : [];
    const promoFee: Fee[] = promoApplied
      ? [{ label: `Mã ${promoApplied.code}`, amount: -promoApplied.discount, highlight: true }]
      : [];
    return {
      ...rentalResult,
      fees: [...rentalResult.fees, ...extraFees, ...promoFee],
      total: Math.max(0, orderTotalBeforePromo - (promoApplied?.discount ?? 0)),
    };
  }, [rentalResult, deliveryMode, deliveryFee, orderTotalBeforePromo, promoApplied]);

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
    () => blockedRanges.map((r) => ({
      from: parseDateStr(r.from),
      to: parseDateStr(r.to),
    })),
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

  const handlePromoValidate = async (codeToCheck?: string) => {
    const code = (codeToCheck ?? promoInput).trim().toUpperCase();
    if (!code) { setPromoError('Vui lòng nhập mã khuyến mãi'); return; }

    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch('/api/promo-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal: orderTotalBeforePromo, countUsage: true }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ code: data.code, discount: data.discount, description: data.description });
        setShowPromoModal(false);
        setPromoInput('');
      } else {
        setPromoError(data.error || 'Mã không hợp lệ');
      }
    } catch {
      setPromoError('Lỗi kết nối, thử lại sau');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!customerName.trim()) { setBookingError('Vui lòng nhập họ tên'); return; }
    const phoneClean = customerPhone.trim().replace(/\s/g, '');
    if (!/^(0[3-9]\d{8})$/.test(phoneClean)) { setBookingError('Số điện thoại không hợp lệ'); return; }

    setBookingLoading(true);
    setBookingError('');
    try {
      const loc = LOCATIONS.find(l => l.id === selectedLocation);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId || null,
          car_name: carName,
          customer_name: customerName.trim(),
          customer_phone: phoneClean,
          customer_note: customerNote.trim() || null,
          pickup_date: pickupDate,
          pickup_hour: pickupHour,
          return_date: returnDate,
          return_hour: returnHour,
          delivery_mode: deliveryMode,
          location_name: deliveryMode === 'self' ? loc?.name : 'Giao tận nơi',
          base_amount: rentalResult.valid ? rentalResult.total : 0,
          delivery_fee: deliveryFee,
          promo_code: promoApplied?.code || null,
          promo_discount: promoApplied?.discount || 0,
          total_amount: result.valid ? result.total : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo đơn');
      setBookingRef(data.bookingRef);
      setDepositAmount(data.depositAmount);
      setBookingStep(2);
    } catch (e: unknown) {
      setBookingError((e as Error)?.message || 'Lỗi kết nối, thử lại sau');
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchPromoList = useCallback(async () => {
    if (promoList.length > 0) return;
    setPromoListLoading(true);
    try {
      const res = await fetch('/api/promo-list');
      const data = await res.json();
      setPromoList(Array.isArray(data) ? data : []);
    } catch {
      // graceful
    } finally {
      setPromoListLoading(false);
    }
  }, [promoList.length]);

  // Re-validate promo silently when the pre-discount order total changes.
  const prevTotalRef = useRef<number>(0);
  useEffect(() => {
    if (!promoApplied) return;
    if (!result.valid) return;
    if (prevTotalRef.current === orderTotalBeforePromo) return;
    prevTotalRef.current = orderTotalBeforePromo;
    void (async () => {
      try {
        const res = await fetch('/api/promo-validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoApplied.code, orderTotal: orderTotalBeforePromo, countUsage: false }),
        });
        const data = await res.json();
        if (data.valid) {
          setPromoApplied(prev => prev ? { ...prev, discount: data.discount } : null);
        } else {
          setPromoApplied(null);
          setPromoError(data.error || 'Mã không còn áp dụng được cho đơn hàng này');
        }
      } catch {
        // Network error — keep existing discount, don't clear.
      }
    })();
  }, [orderTotalBeforePromo, result.valid]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildMessage = () => {
    const priceText = result.valid ? fmtVND(result.total) : 'báo giá';
    const loc = LOCATIONS.find(l => l.id === selectedLocation)!;
    const locationLine = deliveryMode === 'self'
      ? `📍 Địa điểm: ${loc.name} (${loc.address})`
      : `🚗 Giao xe tận nơi (phí 100.000đ/chiều)`;
    const promoLine = promoApplied
      ? `🏷️ Mã giảm giá: ${promoApplied.code} (${promoApplied.description})\n`
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
    try {
      await navigator.clipboard.writeText(buildMessage());
    } catch { /* blocked */ }
    window.open(ZALO_LINK, '_blank');
    setShowModal(false);
  };

  function buildVietQR(amount: number, info: string): string {
    const encoded = encodeURIComponent(info);
    const name = encodeURIComponent(BANK_NAME);
    return `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encoded}&accountName=${name}`;
  }

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
            <input
              type="date"
              value={pickupDate}
              min={todayStr}
              onChange={e => handlePickupDate(e.target.value)}
              className="col-span-3 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
            />
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
            <input
              type="date"
              value={returnDate}
              min={pickupDate}
              onChange={e => setReturnDate(e.target.value)}
              className="col-span-3 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition-colors"
            />
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

            {/* Conflict warning */}
            {conflicts.length > 0 && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                <div>
                  <div className="font-semibold mb-0.5">Xe đã có lịch trong khoảng này</div>
                  {conflicts.map((r, i) => (
                    <div key={i}>
                      {fmtDateShort(r.from)} – {fmtDateShort(r.to)}
                      {r.type === 'rental' ? ' (đang cho thuê)' : r.type === 'maintenance' ? ' (bảo dưỡng)' : ' (bận)'}
                    </div>
                  ))}
                  <div className="mt-1 text-red-600">Liên hệ CarMatch để xác nhận lịch trống ạ.</div>
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
                  <p className="text-xs text-gray-400 mt-1">Áp dụng trong nội thành Hà Nội. Phí 2 chiều (giao + trả): {fmtVND(DELIVERY_FEE_PER_WAY * 2)}</p>
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
          <div className="bg-gray-50 rounded-xl overflow-hidden">
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
              {/* Promo code row */}
              {promoApplied ? (
                /* Applied state: compact, no duplicate description */
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-dashed border-gray-200">
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <Tag className="w-3 h-3 shrink-0" />
                    ✓ {promoApplied.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPromoApplied(null)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                  >
                    Xoá
                  </button>
                </div>
              ) : (
                /* Empty state: invite to add code */
                <button
                  type="button"
                  onClick={() => { setShowPromoModal(true); void fetchPromoList(); }}
                  className="flex items-center justify-between w-full px-1 py-2 mt-1 border-t border-dashed border-gray-200 text-brand-600 hover:text-brand-800 transition-colors rounded-lg hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    Thêm mã khuyến mãi
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Nhập mã ›</span>
                </button>
              )}
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-brand-50 border-t border-brand-100">
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
        <button
          onClick={() => { setShowBookingModal(true); setBookingStep(1); setBookingError(''); }}
          disabled={!result.valid}
          className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CalendarDays className="w-4 h-4" />
          Đặt xe ngay
        </button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={ZALO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-sm"
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
            Zalo
          </a>
          <a
            href={`tel:${ZALO_NUMBER}`}
            className="py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 text-sm"
          >
            <Phone className="w-4 h-4 text-gray-400" />
            Gọi
          </a>
        </div>

        {/* Trust list */}
        <ul className="space-y-1 pt-0.5">
          {[
            '✓ Giá đã bao gồm bảo hiểm',
            '✓ Không cọc trước khi xác nhận',
            '✓ Giao xe tận tòa nhà',
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
                {promoApplied && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Mã {promoApplied.code}</span>
                    <span className="font-semibold">-{fmtVND(promoApplied.discount)}</span>
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

    {/* ── Promo code modal — portal ── */}
    {showPromoModal && createPortal(
      <div
        className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
        onClick={() => { setShowPromoModal(false); setPromoError(''); }}
      >
        <div
          className="w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <h3 className="font-bold text-gray-900 text-lg">Mã khuyến mãi</h3>
            <button
              onClick={() => { setShowPromoModal(false); setPromoError(''); }}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1">
            {/* Input row */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                  onKeyDown={e => e.key === 'Enter' && void handlePromoValidate()}
                  placeholder="Nhập mã khuyến mãi"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold tracking-widest uppercase focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors placeholder:font-normal placeholder:tracking-normal"
                  autoCapitalize="characters"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => void handlePromoValidate()}
                  disabled={promoLoading || !promoInput.trim()}
                  className="shrink-0 px-5 py-3 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {promoLoading ? '…' : 'Áp dụng'}
                </button>
              </div>
              {promoError && (
                <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1.5">
                  <span className="shrink-0">⚠</span> {promoError}
                </p>
              )}
            </div>

            {/* Applied code banner */}
            {promoApplied && (
              <div className="mx-5 mb-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <div className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                    <span className="text-base">✓</span> {promoApplied.code} đã được áp dụng
                  </div>
                  <div className="text-xs text-green-600 mt-0.5">{promoApplied.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoApplied(null)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 shrink-0"
                >
                  Xoá
                </button>
              </div>
            )}

            {/* Code list */}
            {promoListLoading ? (
              <div className="px-5 pb-5 text-center text-sm text-gray-400 py-6">
                Đang tải danh sách mã…
              </div>
            ) : promoList.length > 0 ? (
              <div className="px-5 pb-5 space-y-3">
                {promoList.map((c) => {
                  const isApplied = promoApplied?.code === c.code;
                  const applicable = orderTotalBeforePromo >= (c.min_order ?? 0);
                  const expiringSoon = c.expiresInDays !== null && c.expiresInDays <= 3;
                  return (
                    <div
                      key={c.code}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        isApplied
                          ? 'border-green-300 bg-green-50'
                          : applicable
                          ? 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${
                        isApplied ? 'bg-green-500 text-white'
                        : applicable ? 'bg-green-100 text-green-600'
                        : 'bg-gray-200 text-gray-400'
                      }`}>
                        %
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm tracking-wide ${applicable || isApplied ? 'text-gray-900' : 'text-gray-400'}`}>
                          {c.code}
                        </div>
                        <div className={`text-xs mt-0.5 ${applicable || isApplied ? 'text-gray-500' : 'text-gray-400'}`}>
                          {c.description}
                        </div>
                        {expiringSoon && applicable && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-orange-500 font-medium">
                            <span>ⓘ</span>
                            Hết hạn sau {c.expiresInDays} ngày
                          </div>
                        )}
                        {!applicable && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                            <span>ⓘ</span>
                            {c.min_order > 0
                              ? `Đơn tối thiểu ${c.min_order.toLocaleString('vi-VN')}đ`
                              : 'Mã khuyến mãi không khả dụng'}
                          </div>
                        )}
                      </div>

                      {/* Button */}
                      <button
                        type="button"
                        disabled={!applicable || isApplied || promoLoading}
                        onClick={() => applicable && !isApplied && void handlePromoValidate(c.code)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          isApplied
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : applicable
                            ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isApplied ? '✓ Đã dùng' : 'Áp dụng'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 pb-6 text-center text-sm text-gray-400 py-4">
                Hiện chưa có mã khuyến mãi nào
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={() => { setShowPromoModal(false); setPromoError(''); }}
              className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Đóng
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
                  {promoApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Mã {promoApplied.code}</span>
                      <span className="font-medium">-{fmtVND(promoApplied.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-800">Tổng dự kiến</span>
                    <span className="font-bold text-brand-600 text-base">{result.valid ? fmtVND(result.total) : '—'}</span>
                  </div>
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
                    onChange={e => { setCustomerPhone(e.target.value); setBookingError(''); }}
                    placeholder="0912 345 678"
                    type="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                  />
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
              </div>
            )}

            {/* ══ STEP 2: QR deposit ══ */}
            {bookingStep === 2 && (
              <div className="px-5 py-4 space-y-4">
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-base">Đặt cọc để giữ xe</div>
                  <p className="text-sm text-gray-500 mt-1">Chuyển khoản <strong className="text-brand-600">{fmtVND(depositAmount)}</strong> để xác nhận đơn</p>
                </div>

                {/* QR code */}
                <div className="flex justify-center">
                  <div className="border-2 border-brand-100 rounded-2xl p-3 bg-white shadow-sm">
                    <img
                      src={buildVietQR(depositAmount, `DATXE ${bookingRef}`)}
                      alt="QR chuyển khoản"
                      className="w-52 h-52 object-contain"
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
                  <div className="flex justify-between items-start pt-1 border-t border-brand-200">
                    <span className="text-gray-500 shrink-0">Nội dung CK</span>
                    <span className="font-bold text-gray-900 font-mono bg-white px-2 py-0.5 rounded-lg border border-brand-200 text-xs tracking-wider">{`DATXE ${bookingRef}`}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3 text-xs text-amber-700">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>Nhập <strong>đúng nội dung chuyển khoản</strong> để CarMatch xác nhận tự động. Phần cọc sẽ trừ vào tổng tiền thuê.</span>
                </div>
              </div>
            )}

            {/* ══ STEP 3: Confirmation ══ */}
            {bookingStep === 3 && (
              <div className="px-5 py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✓</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Đặt xe thành công!</div>
                  <p className="text-sm text-gray-500 mt-1">CarMatch sẽ xác nhận trong vòng <strong>30 phút</strong></p>
                </div>
                <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-3 inline-block">
                  <div className="text-xs text-brand-500 font-medium mb-1">Mã đặt xe của bạn</div>
                  <div className="font-mono font-bold text-brand-700 text-xl tracking-widest">{bookingRef}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Xe</span>
                    <span className="font-semibold text-gray-800">{carName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nhận xe</span>
                    <span className="font-semibold text-gray-800">{displayDate(pickupDate)} · {pickupHour}:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trả xe</span>
                    <span className="font-semibold text-gray-800">{displayDate(returnDate)} · {returnHour}:00</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-gray-200">
                    <span className="text-gray-500">Tiền cọc đã CK</span>
                    <span className="font-bold text-brand-600">{fmtVND(depositAmount)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Lưu mã đặt xe để tra cứu. CarMatch sẽ liên hệ qua SĐT <strong>{customerPhone}</strong></p>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-2">
            {bookingStep === 1 && (
              <button
                onClick={handleBookingSubmit}
                disabled={bookingLoading}
                className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {bookingLoading ? <span className="animate-spin">⟳</span> : <CalendarDays className="w-4 h-4" />}
                {bookingLoading ? 'Đang xử lý…' : 'Tiếp tục — Xem QR đặt cọc'}
              </button>
            )}
            {bookingStep === 2 && (
              <>
                <button
                  onClick={() => setBookingStep(3)}
                  className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 active:scale-[0.98] transition-all"
                >
                  Tôi đã chuyển khoản xong ✓
                </button>
                <button
                  onClick={() => setBookingStep(1)}
                  className="w-full py-2.5 border border-gray-200 text-gray-500 font-medium rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
              </>
            )}
            {bookingStep === 3 && (
              <button
                onClick={() => { setShowBookingModal(false); setBookingStep(1); setCustomerName(''); setCustomerPhone(''); setCustomerNote(''); }}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
