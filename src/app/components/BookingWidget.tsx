import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { MessageCircle, Phone, Info, ChevronDown, MapPin, Truck, CalendarDays, X } from 'lucide-react';
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
interface Props {
  basePrice: number;
  carName: string;
  priceMonth?: number;
  vehicleId?: string;
  kmPerDay?: number;
}

export default function BookingWidget({ basePrice, carName, priceMonth, vehicleId, kmPerDay = 300 }: Props) {
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
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{
    code: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

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
  const orderTotalBeforePromo = rentalResult.valid ? rentalResult.total + deliveryFee : 0;
  const totalAmount = orderTotalBeforePromo;

  const result = useMemo(() => {
    if (!rentalResult.valid) return rentalResult;
    const extraFees: Fee[] = deliveryMode === 'delivery'
      ? [{ label: 'Phí giao/trả xe (2 chiều)', amount: deliveryFee }]
      : [];
    const promoFee: Fee[] = promoResult
      ? [{ label: `Mã ${promoResult.code}`, amount: -promoResult.discount_amount, highlight: true }]
      : [];
    return {
      ...rentalResult,
      fees: [...rentalResult.fees, ...extraFees, ...promoFee],
      total: Math.max(0, orderTotalBeforePromo - (promoResult?.discount_amount ?? 0)),
    };
  }, [rentalResult, deliveryMode, deliveryFee, orderTotalBeforePromo, promoResult]);

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
      const res = await fetch(
        `/api/promo-validate?code=${encodeURIComponent(promoCode.trim())}&total=${totalAmount}`,
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
          customer_email: customerEmail.trim() || null,
          customer_note: customerNote.trim() || null,
          pickup_date: pickupDate,
          pickup_hour: pickupHour,
          return_date: returnDate,
          return_hour: returnHour,
          delivery_mode: deliveryMode,
          location_name: deliveryMode === 'self' ? loc?.name : 'Giao tận nơi',
          base_amount: rentalResult.valid ? rentalResult.total : 0,
          delivery_fee: deliveryFee,
          promo_code: promoResult?.code ?? null,
          promo_discount: promoResult?.discount_amount ?? 0,
          total_amount: result.valid ? result.total : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo đơn');
      setBookingRef(data.bookingRef);
      setDepositAmount(data.depositAmount);
      setBookingStep(BANK_QR_ENABLED ? 2 : 3);
    } catch (e: unknown) {
      setBookingError((e as Error)?.message || 'Lỗi kết nối, thử lại sau');
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
      `Tổng giá: ${finalTotal.toLocaleString('vi-VN')}đ`,
      promoDiscount > 0 ? `Giảm giá (${appliedPromo}): -${promoDiscount.toLocaleString('vi-VN')}đ` : null,
      `${BANK_QR_ENABLED ? 'Đã cọc' : 'Tiền cọc dự kiến'}: ${depositAmount.toLocaleString('vi-VN')}đ`,
      deliveryFee > 0 ? `Phí giao nhận xe: ${deliveryFee.toLocaleString('vi-VN')}đ` : null,
      'Bảo hiểm chuyến đi: 0đ',
      `Thanh toán khi nhận xe: ${remainingAmount.toLocaleString('vi-VN')}đ`,
      '',
      `Giới hạn: ${kmPerDay} km/ngày | Phụ trội: 3.000đ/km | 100.000đ/giờ`,
      'Liên hệ: Car Match Vận Hành 0971593290',
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

            {/* Hard conflict — xe đang bận hẳn — cảnh báo đỏ */}
            {hardConflicts.length > 0 && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                <div>
                  <div className="font-semibold mb-0.5">Xe đã có lịch trong khoảng này</div>
                  {hardConflicts.map((r, i) => (
                    <div key={i}>
                      {fmtDateShort(r.from)} – {fmtDateShort(r.to)}
                      {r.type === 'rental' ? ' (đang cho thuê)' : r.type === 'maintenance' ? ' (bảo dưỡng)' : ' (bận)'}
                    </div>
                  ))}
                  <div className="mt-1 text-red-600">Liên hệ CarMatch để xác nhận lịch trống ạ.</div>
                </div>
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
                      : <><strong>Trả xe trước 20:00</strong> để CarMatch kịp chuẩn bị cho ca tiếp theo.</>
                    }{' '}CarMatch sẽ xác nhận lại lịch với bạn.
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

        {/* ── Promo code ── */}
        {result.valid && (
          <div>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={e => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                  setPromoResult(null);
                }}
                onKeyDown={e => e.key === 'Enter' && void validatePromo()}
                placeholder="Mã giảm giá (tuỳ chọn)"
                type="text"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                autoCapitalize="characters"
              />
              <button
                type="button"
                onClick={() => void validatePromo()}
                disabled={promoLoading || Boolean(promoResult)}
                className="px-3 py-2 rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {promoLoading ? '...' : 'Áp dụng'}
              </button>
            </div>
            {promoResult && (
              <div className="mt-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs text-green-700 flex items-center justify-between gap-1.5">
                <span>✅ Mã <strong>{promoResult.code}</strong> — giảm {fmtVND(promoResult.discount_amount)}</span>
                <button
                  type="button"
                  onClick={clearPromo}
                  className="font-bold text-green-700 hover:text-red-500"
                  aria-label="Xóa mã giảm giá"
                >×</button>
              </div>
            )}
            {promoError && (
              <p className="text-xs text-red-500 font-medium mt-1">{promoError}</p>
            )}
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
            '✓ Đặt cọc 30% giữ xe, còn lại thanh toán khi nhận xe',
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
                    Email nhận xác nhận <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                  </label>
                  <input
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
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
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors"
                      autoCapitalize="characters"
                    />
                    <button
                      type="button"
                      onClick={() => void validatePromo()}
                      disabled={promoLoading || Boolean(promoResult)}
                      className="px-3 py-2 rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {promoLoading ? '...' : 'Áp dụng'}
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

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">ℹ️</span>
                      <span>
                        <strong>Chính sách hủy:</strong> Hủy trước 24h được hoàn 100% tiền cọc.
                        Hủy trong 24h hoặc không đến nhận xe sẽ mất cọc.{' '}
                        <a href="/chinh-sach" className="underline text-amber-600 hover:text-amber-800" target="_blank" rel="noopener noreferrer">
                          Xem chi tiết →
                        </a>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    CarMatch chưa bật QR chuyển khoản online. Đơn của bạn đã được gửi tới CSKH, team sẽ liên hệ để xác nhận lịch xe và hướng dẫn đặt cọc bằng tài khoản chính thức.
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
                      <span className="font-bold text-slate-900">{finalTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Giảm giá ({appliedPromo})</span>
                        <span className="font-semibold text-green-600">-{promoDiscount.toLocaleString('vi-VN')}đ</span>
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
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bảo hiểm chuyến đi</span>
                      <span className="text-slate-400">0đ</span>
                    </div>
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
                    <p className="text-slate-500">• Tài sản thế chấp (giữ lại): Theo thoả thuận</p>
                  </div>

                  <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                    <p className="font-semibold text-slate-700">Liên hệ nhận xe & xử lý sự cố</p>
                    <p className="text-slate-500">📞 Car Match Vận Hành: <span className="font-semibold text-slate-800">0971 593 290</span></p>
                    {selectedLocationInfo?.name && (
                      <p className="text-slate-500">📍 {selectedLocationInfo.name}</p>
                    )}
                  </div>
                </div>

                {/* Nút copy */}
                <button
                  onClick={() => void copyBookingConfirmation()}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  📋 Copy xác nhận
                </button>

                <Link
                  to={`/dat-xe?ref=${bookingRef}`}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl border border-cyan-200 bg-cyan-50 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-100 transition-colors"
                >
                  🔍 Xem & lưu trang xác nhận
                </Link>

                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingStep(1);
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerEmail('');
                    setCustomerNote('');
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
          </div>
          )}
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
