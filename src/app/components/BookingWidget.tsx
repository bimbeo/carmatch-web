import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { MessageCircle, Phone, Info, ChevronDown, ChevronRight, MapPin, Truck, CalendarDays, X, Tag, ImageIcon, Upload, Copy, Check } from 'lucide-react';
import { DayPicker, type DayContentProps } from 'react-day-picker';
import { vi } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { trackBookingSubmit, trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { useIsMobile } from './ui/use-mobile';

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

interface HolidayBookingWindow {
  pickup_date: string;
  return_date: string;
  label?: string | null;
  rule_name?: string;
  adjustment_value?: number;
}

interface HolidayPricingRule {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  adjustment_type: 'fixed' | 'percent';
  adjustment_value: number;
  booking_windows?: HolidayBookingWindow[];
  note?: string | null;
}

interface AppliedHolidayPricing {
  rule_id: string;
  name: string;
  dates: string[];
  adjustment_type: 'fixed' | 'percent';
  adjustment_value: number;
  amount: number;
  pricing_mode?: 'daily_adjustment' | 'combo';
  booking_window_label?: string | null;
  combo_days?: number;
  combo_adjustment_value?: number;
}

export interface BookingAvailabilityStatus {
  isLoading: boolean;
  hasBlockedRanges: boolean;
  selectedRangeHasHardConflict: boolean;
  selectedRangeHasBoundaryConflict: boolean;
  requiresConfirmation: boolean;
  firstHardConflict: Pick<BlockedRange, 'from' | 'to' | 'type'> | null;
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

function fmtCalendarPrice(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;
  }
  return `${Math.round(n / 1_000)}K`;
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

function rentalDurationHours(
  pickupDate: string,
  pickupHour: number,
  returnDate: string,
  returnHour: number,
): number {
  const pickup = parseDateStr(pickupDate);
  pickup.setHours(pickupHour, 0, 0, 0);
  const dropoff = parseDateStr(returnDate);
  dropoff.setHours(returnHour, 0, 0, 0);
  return Math.max(0, Math.round((dropoff.getTime() - pickup.getTime()) / 3_600_000));
}

function rentalDurationLabel(
  pickupDate: string,
  pickupHour: number,
  returnDate: string,
  returnHour: number,
): string {
  const hours = rentalDurationHours(pickupDate, pickupHour, returnDate, returnHour);
  if (hours === 24) return '1 ngày';
  if (hours < 24) return `${hours} giờ`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours === 0
    ? `${days} ngày`
    : `${days} ngày ${remainingHours} giờ`;
}

/**
 * Khoảng ngày được tô trên lịch là các ngày tính tiền xe, không phải cả hai
 * mốc bàn giao. Với ca nhận từ 16:00, ngày nhận chỉ là tối bàn giao trước;
 * ngày xe đầu tiên được tính từ ngày hôm sau.
 */
function getBillableDayRange(
  pickupDate: string,
  pickupHour: number,
  returnDate: string,
): { from: Date; to?: Date } {
  const pickup = parseDateStr(pickupDate);
  const dropoff = parseDateStr(returnDate);
  const firstBillableDay = pickupHour >= 16 && dropoff > pickup
    ? addDays(pickup, 1)
    : pickup;

  return firstBillableDay <= dropoff
    ? { from: firstBillableDay, to: dropoff }
    : { from: pickup };
}

function getBillableDateStrings(
  pickupDate: string,
  pickupHour: number,
  returnDate: string,
): string[] {
  const range = getBillableDayRange(pickupDate, pickupHour, returnDate);
  const to = range.to ?? range.from;
  const dates: string[] = [];
  for (let current = range.from, guard = 0; current <= to && guard < 370; current = addDays(current, 1), guard += 1) {
    dates.push(toDateStr(current));
  }
  return dates;
}

function holidayDailySurcharge(rule: HolidayPricingRule, basePrice: number): number {
  if (rule.adjustment_type === 'fixed') return Math.max(0, rule.adjustment_value);
  return Math.max(0, Math.round((basePrice * rule.adjustment_value / 100) / 1000) * 1000);
}

function findHolidayCombo(
  rules: HolidayPricingRule[],
  pickupDate: string,
  returnDate: string,
) {
  for (const rule of rules) {
    const window = (rule.booking_windows ?? []).find((item) => (
      item.pickup_date === pickupDate && item.return_date === returnDate
    ));
    if (window) return { rule, window };
  }
  return null;
}

function inclusiveDateCount(from: string, to: string): number {
  return Math.max(1, calDaysDiff(parseDateStr(from), parseDateStr(to)) + 1);
}

function calculateHolidayPricing(
  rules: HolidayPricingRule[],
  pickupDate: string,
  pickupHour: number,
  returnDate: string,
  basePrice: number,
  baseRentalAmount: number,
): { total: number; applied: AppliedHolidayPricing[]; fees: Fee[] } {
  const comboMatch = findHolidayCombo(rules, pickupDate, returnDate);
  if (comboMatch) {
    const { rule, window } = comboMatch;
    const comboDays = inclusiveDateCount(window.pickup_date, window.return_date);
    const dailyAdjustment = Math.max(0, Number(window.adjustment_value ?? rule.adjustment_value));
    const comboBaseAmount = basePrice * comboDays;
    const baseDayAdjustment = Math.max(0, comboBaseAmount - Math.max(0, baseRentalAmount));
    const peakPriceAdjustment = dailyAdjustment * comboDays;
    const amount = baseDayAdjustment + peakPriceAdjustment;
    const dates = getBillableDateStrings(pickupDate, pickupHour, returnDate)
      .filter((date) => rule.start_date <= date && rule.end_date >= date);
    const applied: AppliedHolidayPricing[] = amount > 0 ? [{
      rule_id: rule.id,
      name: rule.name,
      dates,
      adjustment_type: rule.adjustment_type,
      adjustment_value: rule.adjustment_value,
      amount,
      pricing_mode: 'combo',
      booking_window_label: window.label ?? null,
      combo_days: comboDays,
      combo_adjustment_value: dailyAdjustment,
    }] : [];
    return {
      total: amount,
      applied,
      fees: amount > 0 ? [
        ...(baseDayAdjustment > 0 ? [{
          label: `Bổ sung đủ ${comboDays} ngày của combo`,
          amount: baseDayAdjustment,
        }] : []),
        ...(peakPriceAdjustment > 0 ? [{
          label: `🎉 ${window.label || rule.name} · +${fmtVND(dailyAdjustment)}/ngày × ${comboDays} ngày`,
          amount: peakPriceAdjustment,
        }] : []),
      ] : [],
    };
  }

  const grouped = new Map<string, AppliedHolidayPricing>();

  for (const date of getBillableDateStrings(pickupDate, pickupHour, returnDate)) {
    const candidates = rules
      .filter((rule) => rule.start_date <= date && rule.end_date >= date)
      .map((rule) => ({ rule, amount: holidayDailySurcharge(rule, basePrice) }))
      .filter((candidate) => candidate.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    const selected = candidates[0];
    if (!selected) continue;

    const existing = grouped.get(selected.rule.id);
    if (existing) {
      existing.dates.push(date);
      existing.amount += selected.amount;
    } else {
      grouped.set(selected.rule.id, {
        rule_id: selected.rule.id,
        name: selected.rule.name,
        dates: [date],
        adjustment_type: selected.rule.adjustment_type,
        adjustment_value: selected.rule.adjustment_value,
        amount: selected.amount,
        pricing_mode: 'daily_adjustment',
      });
    }
  }

  const applied = [...grouped.values()];
  return {
    total: applied.reduce((sum, item) => sum + item.amount, 0),
    applied,
    fees: applied.map((item) => ({
      label: `🎉 Phụ thu ${item.name} (${item.dates.length} ngày)`,
      amount: item.amount,
    })),
  };
}

function formatHolidayBookingWindow(window: HolidayBookingWindow): string {
  return window.label?.trim()
    || `${displayDateSlash(window.pickup_date)} – ${displayDateSlash(window.return_date)}`;
}

function bookingRangeOverlapsHoliday(rule: HolidayPricingRule, pickupDate: string, returnDate: string): boolean {
  return pickupDate <= rule.end_date && returnDate >= rule.start_date;
}

function dedupeHolidayBookingWindows(windows: HolidayBookingWindow[]): HolidayBookingWindow[] {
  const seen = new Set<string>();
  return windows.filter((window) => {
    const key = `${window.pickup_date}:${window.return_date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getInitialBookingSelection(today: Date) {
  const todayStr = toDateStr(today);
  const defaultPickupDate = toDateStr(addDays(today, 1));
  const defaultReturnDate = toDateStr(addDays(today, 2));
  if (typeof window === 'undefined') {
    return {
      pickupDate: defaultPickupDate,
      returnDate: defaultReturnDate,
      pickupHour: 20,
      returnHour: 20,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const requestedPickup = params.get('from');
  const pickupDate =
    requestedPickup && /^\d{4}-\d{2}-\d{2}$/.test(requestedPickup) && requestedPickup >= todayStr
      ? requestedPickup
      : defaultPickupDate;
  const requestedReturn = params.get('to');
  const returnDate =
    requestedReturn && /^\d{4}-\d{2}-\d{2}$/.test(requestedReturn) && requestedReturn > pickupDate
      ? requestedReturn
      : pickupDate === defaultPickupDate
        ? defaultReturnDate
        : toDateStr(addDays(parseDateStr(pickupDate), 1));
  const parseHour = (key: string) => {
    const value = Number(params.get(key));
    return Number.isInteger(value) && value >= 7 && value <= 23 ? value : 20;
  };

  return {
    pickupDate,
    returnDate,
    pickupHour: parseHour('pickupHour'),
    returnHour: parseHour('returnHour'),
  };
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
  if (calDays === 0) {
    const inMorning = pickupHour >= 7 && pickupHour <= 12 && returnHour <= 12;
    const inAfternoon = pickupHour >= 13 && returnHour <= 20;
    const isHalfDay = inMorning || inAfternoon;

    let base = isHalfDay ? Math.round(BP * 0.7) : BP;
    fees.push({ label: isHalfDay ? 'Nửa ngày (×70%)' : '1 ngày', amount: base });

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

  if (lateFee > 0) fees.push({ label: 'Phụ phí quá giờ', amount: lateFee });
  if (earlyFee > 0) fees.push({ label: 'Phụ phí nhận xe sớm', amount: earlyFee });

  const total = baseAmount + lateFee + earlyFee;

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
  kmSurcharge?: number;
  relatedCars?: RelatedCar[];
  onAvailabilityStatusChange?: (status: BookingAvailabilityStatus) => void;
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for iOS in-app browsers / older Safari
  return new Promise((resolve, reject) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    ok ? resolve() : reject(new Error('execCommand copy failed'));
  });
}

function ReferralCopyBlock({ referralCode, rewardAmount }: { referralCode: string; rewardAmount: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const msg = `Thuê xe tự lái tại Car Match — chất lượng, giao tận nơi!\nDùng mã giới thiệu của mình: ${referralCode}\ncarmatch.vn/?ref=${referralCode}`;
    copyToClipboard(msg)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        // Last resort: prompt user to copy manually
        window.prompt('Copy mã giới thiệu:', referralCode);
      });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
      <p className="font-bold text-amber-900 text-sm mb-1">🎁 Giới thiệu bạn bè — nhận mã giảm giá</p>
      <p className="mb-2">Bạn bè đặt xe thành công bằng mã của bạn → nhận <strong>mã giảm giá {rewardAmount > 0 ? rewardAmount.toLocaleString('vi-VN') + 'đ' : '100.000đ'}</strong> cho chuyến thuê tiếp theo</p>
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-colors ${copied ? 'border-green-300 bg-green-50 text-green-700' : 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100'}`}
      >
        <Copy className="w-3.5 h-3.5" />
        {copied ? 'Đã copy!' : `Copy mã ${referralCode}`}
      </button>
    </div>
  );
}

export default function BookingWidget({
  basePrice,
  carName,
  priceMonth,
  vehicleId,
  carSlug,
  kmPerDay = 300,
  kmSurcharge = 3000,
  relatedCars = [],
  onAvailabilityStatusChange,
}: Props) {
  const isMobile = useIsMobile();
  // Local midnight — avoids toISOString UTC offset shifting day back in GMT+7
  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);
  const todayStr = toDateStr(today);
  const initialBookingSelection = useMemo(() => getInitialBookingSelection(today), [today]);
  const [pickupDate, setPickupDate] = useState(initialBookingSelection.pickupDate);
  const [pickupHour, setPickupHour] = useState(initialBookingSelection.pickupHour);
  const [returnDate, setReturnDate] = useState(initialBookingSelection.returnDate);
  const [returnHour, setReturnHour] = useState(initialBookingSelection.returnHour);
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'delivery'>('self');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('times-city');
  const [showModal, setShowModal] = useState(false);
  const initialPromoCode = useMemo(() => getInitialPromoCodeFromUrl(), []);

  // ── Availability ──────────────────────────────────────────────────────────
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availabilityUnavailable, setAvailabilityUnavailable] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [holidayPricingRules, setHolidayPricingRules] = useState<HolidayPricingRule[]>([]);

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
  const bookingIdempotencyRef = useRef('');

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
  const [bookingNeedsConfirmation, setBookingNeedsConfirmation] = useState(false);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [customerReferralCode, setCustomerReferralCode] = useState('');
  const [activeSuggestedCodes, setActiveSuggestedCodes] = useState<Array<{ code: string; discount_value: number; expires_at: string }>>([]);
  const [recentBookingsCount, setRecentBookingsCount] = useState(0);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [pointsPerTenK, setPointsPerTenK] = useState(1); // default 1 pt per 10k VND (overridden by DB setting)
  const [referralRewardAmount, setReferralRewardAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    bookingIdempotencyRef.current = '';
  }, [
    vehicleId,
    pickupDate,
    pickupHour,
    returnDate,
    returnHour,
    deliveryMode,
    deliveryAddress,
    selectedLocation,
    customerName,
    customerPhone,
    customerEmail,
    customerNote,
    promoResult?.code,
    promoResult?.discount_amount,
    loyaltyDiscount?.discount_amount,
  ]);

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
    setAvailabilityUnavailable(false);
    try {
      const from = todayStr;
      const to = toDateStr(addDays(today, 120));
      const res = await fetch(`/api/vehicle-availability?vehicleId=${vehicleId}&from=${from}&to=${to}`);
      if (!res.ok) throw new Error('availability request failed');
      const data = await res.json();
      setBlockedRanges(data.blockedRanges || []);
      setRequiresConfirmation(data.requires_confirmation === true);
      setAvailabilityUnavailable(data.availability_unavailable === true);
      if (data.recent_bookings_count > 0) setRecentBookingsCount(data.recent_bookings_count);
    } catch {
      setAvailabilityUnavailable(true);
      setRequiresConfirmation(true);
    } finally {
      setAvailLoading(false);
    }
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    fetch('/api/holiday-pricing')
      .then((response) => response.ok ? response.json() : null)
      .then((json) => {
        const rules = Array.isArray(json?.rules) ? json.rules : [];
        setHolidayPricingRules(rules.map((rule: HolidayPricingRule) => ({
          ...rule,
          adjustment_value: Number(rule.adjustment_value),
          booking_windows: Array.isArray(rule.booking_windows)
            ? rule.booking_windows.map((window) => ({
                pickup_date: String(window.pickup_date || ''),
                return_date: String(window.return_date || ''),
                label: window.label ? String(window.label) : null,
                adjustment_value: Number(window.adjustment_value ?? rule.adjustment_value),
              }))
            : [],
        })));
      })
      .catch(() => setHolidayPricingRules([]));
  }, []);

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
  const needsManualConfirmation = requiresConfirmation || boundaryConflicts.length > 0;

  const availabilityStatus = useMemo<BookingAvailabilityStatus>(() => ({
    isLoading: availLoading,
    hasBlockedRanges: blockedRanges.length > 0,
    selectedRangeHasHardConflict: hardConflicts.length > 0,
    selectedRangeHasBoundaryConflict: boundaryConflicts.length > 0,
    requiresConfirmation,
    firstHardConflict: hardConflicts[0]
      ? { from: hardConflicts[0].from, to: hardConflicts[0].to, type: hardConflicts[0].type }
      : null,
  }), [availLoading, blockedRanges.length, boundaryConflicts, hardConflicts, requiresConfirmation]);

  useEffect(() => {
    onAvailabilityStatusChange?.(availabilityStatus);
  }, [availabilityStatus, onAvailabilityStatusChange]);

  // Giữ biến `conflicts` để tương thích với calendar modifiers bên dưới
  const conflicts = [...hardConflicts, ...boundaryConflicts];

  const rentalResult = useMemo(
    () => calculateRental(pickupDate, pickupHour, returnDate, returnHour, basePrice),
    [pickupDate, pickupHour, returnDate, returnHour, basePrice],
  );

  const holidayPricing = useMemo(
    () => calculateHolidayPricing(
      holidayPricingRules,
      pickupDate,
      pickupHour,
      returnDate,
      basePrice,
      rentalResult.fees[0]?.amount ?? rentalResult.total,
    ),
    [basePrice, holidayPricingRules, pickupDate, pickupHour, rentalResult.fees, rentalResult.total, returnDate],
  );
  const matchedHolidayCombo = holidayPricing.applied.find((item) => item.pricing_mode === 'combo') ?? null;
  const upcomingHolidayRules = useMemo(
    () => holidayPricingRules.filter((rule) => rule.end_date >= todayStr).slice(0, 3),
    [holidayPricingRules, todayStr],
  );
  const upcomingHolidayWindows = useMemo(
    () => dedupeHolidayBookingWindows(
      upcomingHolidayRules.flatMap((rule) => (
        rule.booking_windows ?? []
      ).map((window) => ({
        ...window,
        rule_name: rule.name,
      })).filter((window) => window.pickup_date && window.return_date)),
    ),
    [upcomingHolidayRules],
  );
  const holidayBookingPolicy = useMemo(() => {
    const overlappingRules = holidayPricingRules.filter((rule) => (
      bookingRangeOverlapsHoliday(rule, pickupDate, returnDate)
    ));
    const restrictedRules = overlappingRules.filter((rule) => (rule.booking_windows?.length ?? 0) > 0);
    const windows = dedupeHolidayBookingWindows(
      restrictedRules.flatMap((rule) => (
        rule.booking_windows ?? []
      ).map((window) => ({
        ...window,
        rule_name: rule.name,
      })).filter((window) => window.pickup_date && window.return_date)),
    );
    const matchedWindow = windows.find((window) => (
      window.pickup_date === pickupDate && window.return_date === returnDate
    )) ?? null;

    return {
      hasHoliday: overlappingRules.length > 0,
      isComboRestricted: restrictedRules.length > 0,
      allowed: restrictedRules.length === 0 || Boolean(matchedWindow),
      matchedWindow,
      windows,
    };
  }, [holidayPricingRules, pickupDate, returnDate]);
  const holidayPromoBlocked = holidayBookingPolicy.hasHoliday;
  const holidayBookingBlocked = holidayBookingPolicy.hasHoliday
    && holidayBookingPolicy.isComboRestricted
    && !holidayBookingPolicy.allowed;
  const holidayComboText = holidayBookingPolicy.windows
    .map(formatHolidayBookingWindow)
    .join(', ');
  const holidayComboBlockMessage = holidayComboText
    ? `Kỳ lễ này chỉ nhận ${holidayComboText}. Đặt lẻ ngày không nhận.`
    : 'Kỳ lễ này chỉ nhận đúng combo đã công bố. Đặt lẻ ngày không nhận.';
  const holidayPromoBlockMessage = 'Mã giảm giá không áp dụng vào ngày lễ / cao điểm.';
  const selectedComboDays = holidayBookingPolicy.matchedWindow
    ? inclusiveDateCount(
        holidayBookingPolicy.matchedWindow.pickup_date,
        holidayBookingPolicy.matchedWindow.return_date,
      )
    : null;
  const selectedDurationLabel = selectedComboDays
    ? `${selectedComboDays} ngày`
    : rentalDurationLabel(pickupDate, pickupHour, returnDate, returnHour);

  const deliveryFee = deliveryMode === 'delivery' ? DELIVERY_FEE_PER_WAY * 2 : 0;
  const orderTotalBeforePromo = rentalResult.valid
    ? rentalResult.total + holidayPricing.total + deliveryFee
    : 0;
  const totalAmount = orderTotalBeforePromo;
  const loyaltyDiscountAmount = loyaltyDiscount?.discount_amount ?? 0;

  const result = useMemo(() => {
    if (!rentalResult.valid) return rentalResult;
    const extraFees: Fee[] = deliveryMode === 'delivery'
      ? [{ label: 'Phí giao/trả xe (2 chiều)', amount: deliveryFee }]
      : [];
    const loyaltyFee: Fee[] = loyaltyDiscount
      ? [{ label: loyaltyDiscount.tier === 'vip' ? '⭐ Ưu đãi VIP' : '✓ Ưu đãi khách thân thiết', amount: -loyaltyDiscountAmount, highlight: true }]
      : [];
    const promoFee: Fee[] = promoResult
      ? [{ label: `Mã ${promoResult.code}`, amount: -promoResult.discount_amount, highlight: true }]
      : [];
    return {
      ...rentalResult,
      fees: [...rentalResult.fees, ...holidayPricing.fees, ...extraFees, ...loyaltyFee, ...promoFee],
      total: Math.max(0, orderTotalBeforePromo - loyaltyDiscountAmount - (promoResult?.discount_amount ?? 0)),
    };
  }, [rentalResult, holidayPricing.fees, deliveryMode, deliveryFee, orderTotalBeforePromo, loyaltyDiscount, loyaltyDiscountAmount, promoResult]);

  useEffect(() => {
    if (!holidayPromoBlocked) return;
    setPromoResult(null);
    setPromoError('');
  }, [holidayPromoBlocked]);

  const savings =
    priceMonth && basePrice > 0
      ? Math.round((1 - priceMonth / (basePrice * 30)) * 100)
      : 0;

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
  const holidayPricingIntervals = useMemo(
    () => holidayPricingRules.map((rule) => ({
      from: parseDateStr(rule.start_date),
      to: parseDateStr(rule.end_date),
    })),
    [holidayPricingRules],
  );
  const CalendarDayContent = useCallback(({ date, activeModifiers }: DayContentProps) => {
    const dateStr = toDateStr(date);
    const holidayRule = holidayPricingRules
      .filter((rule) => rule.start_date <= dateStr && rule.end_date >= dateStr)
      .map((rule) => ({ rule, surcharge: holidayDailySurcharge(rule, basePrice) }))
      .sort((a, b) => b.surcharge - a.surcharge)[0];
    const comboSurcharge = holidayBookingPolicy.matchedWindow
      && holidayBookingPolicy.matchedWindow.pickup_date <= dateStr
      && holidayBookingPolicy.matchedWindow.return_date >= dateStr
      ? Math.max(0, Number(holidayBookingPolicy.matchedWindow.adjustment_value) || 0)
      : null;
    const showPrice = basePrice > 0 && !activeModifiers.disabled && !activeModifiers.blocked;

    return (
      <span className="carmatch-cal-day-content">
        <span className="carmatch-cal-day-number">
          {date.getDate()}
          {holidayRule && <span className="carmatch-cal-day-spark" aria-hidden="true">◆</span>}
        </span>
        {showPrice && (
          <span className="carmatch-cal-day-price">
            {fmtCalendarPrice(basePrice + (comboSurcharge ?? holidayRule?.surcharge ?? 0))}
          </span>
        )}
      </span>
    );
  }, [basePrice, holidayBookingPolicy.matchedWindow, holidayPricingRules]);

  // Step mode: first click = pickup, second = return
  const [rangeStep, setRangeStep] = useState<'from' | 'to'>('from');
  const [calendarStartPreview, setCalendarStartPreview] = useState<Date | null>(null);

  // Keep the visual range anchored to the exact dates the customer clicked,
  // as Mioto does. Billable dates remain a separate pricing concern handled
  // by getBillableDayRange/getBillableDateStrings.
  const selectedRange = useMemo(
    () => rangeStep === 'to' && calendarStartPreview
      ? { from: calendarStartPreview }
      : { from: parseDateStr(pickupDate), to: parseDateStr(returnDate) },
    [calendarStartPreview, pickupDate, rangeStep, returnDate],
  );

  // Use onDayClick instead of onSelect — onSelect has stale-range issues in v8
  // when an existing range is already selected and user starts fresh
  const handleDayClick = useCallback((day: Date, modifiers: Record<string, boolean>) => {
    if (modifiers.disabled || modifiers.blocked) return;
    const ds = toDateStr(day);
    if (rangeStep === 'from') {
      setPickupDate(ds);
      setReturnDate(toDateStr(addDays(day, 1)));
      setCalendarStartPreview(day);
      setRangeStep('to');
    } else {
      if (ds > pickupDate) {
        setReturnDate(ds);
        setCalendarStartPreview(null);
        setRangeStep('from');
      } else if (ds === pickupDate) {
        // Mioto-style same-day rental: a second click on the start date
        // completes a one-cell range. If the current hours cannot form the
        // minimum 4-hour rental, move pickup to opening time and keep return.
        setReturnDate(ds);
        if (returnHour - pickupHour < 4) {
          setPickupHour(7);
          if (returnHour < 11) setReturnHour(11);
        }
        setCalendarStartPreview(null);
        setRangeStep('from');
      } else {
        // Clicking before pickup starts a fresh selection from that day.
        setPickupDate(ds);
        setReturnDate(toDateStr(addDays(day, 1)));
        setCalendarStartPreview(day);
        setRangeStep('to');
      }
    }
  }, [pickupDate, pickupHour, rangeStep, returnHour]);

  const selectHolidayCombo = useCallback((window: HolidayBookingWindow) => {
    setPickupDate(window.pickup_date);
    setReturnDate(window.return_date);
    setCalendarStartPreview(null);
    setRangeStep('from');
  }, []);

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    if (holidayPromoBlocked) {
      setPromoResult(null);
      setPromoError(holidayPromoBlockMessage);
      return;
    }
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const phoneParam = customerPhone.trim() ? `&phone=${encodeURIComponent(customerPhone.trim())}` : '';
      const res = await fetch(
        `/api/promo-validate?code=${encodeURIComponent(promoCode.trim())}&total=${totalAmount}&pickup_date=${pickupDate}&return_date=${returnDate}${phoneParam}`,
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
      const res = await fetch(`/api/promo-list?total=${totalAmount}&pickup_date=${pickupDate}&return_date=${returnDate}`);
      const json = await res.json();
      if (res.ok) setPromoList(json.promos || []);
    } catch { /* silent */ } finally {
      setPromoListLoading(false);
    }
  }, [pickupDate, returnDate, totalAmount]);

  const openPromoModal = () => {
    if (holidayPromoBlocked) return;
    setShowPromoModal(true);
    void fetchPromoList();
  };

  const applyPromoFromList = async (code: string) => {
    if (holidayPromoBlocked) {
      setPromoCode(code);
      setPromoResult(null);
      setPromoError(holidayPromoBlockMessage);
      return;
    }
    setPromoCode(code);
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const phoneParam = customerPhone.trim() ? `&phone=${encodeURIComponent(customerPhone.trim())}` : '';
      const res = await fetch(`/api/promo-validate?code=${encodeURIComponent(code)}&total=${totalAmount}&pickup_date=${pickupDate}&return_date=${returnDate}${phoneParam}`);
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
    if (!initialPromoCode || promoAutoAppliedRef.current || totalAmount <= 0 || holidayPromoBlocked) return;
    promoAutoAppliedRef.current = true;
    void applyPromoFromList(initialPromoCode);
    // Run once when the calculator has a valid amount; `applyPromoFromList` reads the latest booking state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPromoCode, totalAmount, holidayPromoBlocked]);

  const handleBookingSubmit = async () => {
    if (availLoading || availabilityUnavailable) {
      setBookingError('Chưa kiểm tra được lịch xe. Vui lòng thử lại trước khi gửi yêu cầu.');
      return;
    }
    if (hardConflicts.length > 0) {
      setBookingError('Xe đã có lịch trong khoảng này. Vui lòng chọn ngày khác.');
      return;
    }
    if (!customerName.trim()) { setBookingError('Vui lòng nhập họ tên'); return; }
    const phoneClean = customerPhone.trim().replace(/\s/g, '');
    if (!/^(0[3-9]\d{8})$/.test(phoneClean)) { setBookingError('Số điện thoại không hợp lệ'); return; }
    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      setBookingError('Vui lòng nhập địa chỉ giao xe');
      return;
    }
    if (holidayBookingBlocked) {
      setBookingError(holidayComboBlockMessage);
      return;
    }
    if (holidayPromoBlocked && promoResult) {
      setPromoResult(null);
      setBookingError(holidayPromoBlockMessage);
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    const promoForBooking = holidayPromoBlocked ? null : promoResult;
    trackBookingSubmit('attempt', {
      vehicle_id: vehicleId || null,
      vehicle_name: carName,
      rental_days: rentalDays,
      total_amount: finalTotal,
      delivery_mode: deliveryMode,
      pickup_date: pickupDate,
      return_date: returnDate,
      promo_code: promoForBooking?.code ?? null,
    });
    try {
      const loc = LOCATIONS.find(l => l.id === selectedLocation);
      if (!bookingIdempotencyRef.current) {
        bookingIdempotencyRef.current = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      }
      const idempotencyKey = bookingIdempotencyRef.current;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
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
          holiday_surcharge: holidayPricing.total,
          holiday_pricing: holidayPricing.applied,
          delivery_fee: deliveryFee,
          loyalty_tier: loyaltyDiscount?.tier ?? null,
          loyalty_discount: loyaltyDiscountAmount,
          promo_code: promoForBooking?.code ?? null,
          promo_discount: promoForBooking?.discount_amount ?? 0,
          total_amount: result.valid ? result.total : 0,
          requires_confirmation: needsManualConfirmation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo đơn');
      setBookingRef(data.bookingRef);
      setDepositAmount(data.depositAmount);
      setBookingNeedsConfirmation(needsManualConfirmation);
      setBookingStep(BANK_QR_ENABLED && data.paymentRequired !== false && !needsManualConfirmation ? 2 : 3);
      trackBookingSubmit('success', {
        vehicle_id: vehicleId || null,
        vehicle_name: carName,
        booking_ref: data.bookingRef,
        rental_days: rentalDays,
        total_amount: result.valid ? result.total : 0,
          deposit_amount: needsManualConfirmation ? 0 : data.depositAmount,
        delivery_mode: deliveryMode,
        promo_code: promoForBooking?.code ?? null,
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
    const holidayComboLine = holidayBookingPolicy.matchedWindow
      ? `🎉 Combo lễ: ${formatHolidayBookingWindow(holidayBookingPolicy.matchedWindow)}\n`
      : '';
    const promoLine = promoResult
      ? `🏷️ Mã giảm giá: ${promoResult.code} (-${fmtVND(promoResult.discount_amount)})\n`
      : '';
    return (
      `[ĐẶT XE - ${carName}]\n` +
      `📅 Nhận xe: ${displayDate(pickupDate)} lúc ${pickupHour}:00\n` +
      `📅 Trả xe: ${displayDate(returnDate)} lúc ${returnHour}:00\n` +
      `${locationLine}\n` +
      `${holidayComboLine}` +
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
  const estimatedDepositAmount = finalTotal > 0
    ? Math.max(200_000, Math.round(finalTotal * 0.3 / 10_000) * 10_000)
    : 0;
  const estimatedRemainingAmount = Math.max(0, finalTotal - estimatedDepositAmount);
  const promoDiscount = promoResult?.discount_amount ?? 0;
  const appliedPromo = promoResult?.code ?? '';
  const pickupDt = parseDateStr(pickupDate);
  pickupDt.setHours(pickupHour, 0, 0, 0);
  const returnDt = parseDateStr(returnDate);
  returnDt.setHours(returnHour, 0, 0, 0);
  const actualRentalDays = Math.max(1, Math.ceil((returnDt.getTime() - pickupDt.getTime()) / 86_400_000));
  const rentalDays = selectedComboDays ?? actualRentalDays;
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
      holidayBookingPolicy.matchedWindow ? `Combo lễ: ${formatHolidayBookingWindow(holidayBookingPolicy.matchedWindow)}` : null,
      `Số ngày thuê: ${rentalDays} ngày`,
      '',
      `Tổng giá: ${orderTotalBeforePromo.toLocaleString('vi-VN')}đ`,
      matchedHolidayCombo
        ? `Mức tăng combo lễ: +${Number(matchedHolidayCombo.combo_adjustment_value).toLocaleString('vi-VN')}đ/ngày × ${matchedHolidayCombo.combo_days} ngày`
        : holidayPricing.total > 0 ? `Phụ thu giá lễ: +${holidayPricing.total.toLocaleString('vi-VN')}đ` : null,
      loyaltyDiscountAmount > 0 ? `Ưu đãi ${loyaltyDiscount?.tier === 'vip' ? 'VIP' : 'khách thân thiết'}: -${loyaltyDiscountAmount.toLocaleString('vi-VN')}đ` : null,
      promoDiscount > 0 ? `Giảm giá (${appliedPromo}): -${promoDiscount.toLocaleString('vi-VN')}đ` : null,
      (loyaltyDiscountAmount > 0 || promoDiscount > 0) ? `Tổng sau ưu đãi: ${finalTotal.toLocaleString('vi-VN')}đ` : null,
      `${BANK_QR_ENABLED ? 'Đã cọc' : 'Tiền cọc dự kiến'}: ${depositAmount.toLocaleString('vi-VN')}đ`,
      deliveryFee > 0 ? `Phí giao nhận xe: ${deliveryFee.toLocaleString('vi-VN')}đ` : null,
      `Thanh toán khi nhận xe: ${remainingAmount.toLocaleString('vi-VN')}đ`,
      '',
      `Giới hạn: ${kmPerDay} km/ngày | Phụ trội: ${kmSurcharge.toLocaleString('vi-VN')}đ/km | 100.000đ/giờ`,
      'Liên hệ: Car Match Vận Hành 0975563290',
    ].filter(l => l !== null).join('\n');
    try {
      await navigator.clipboard.writeText(lines);
    } catch { /* clipboard may be blocked */ }
  };

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-200/70">
      <div className="border-b border-gray-100 px-5 pb-3 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-gray-950">Đặt lịch thuê xe</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-gray-500">Chọn thời gian thuê xe để xem tổng dự kiến.</p>
          </div>
          {basePrice > 0 ? (
            <div className="shrink-0 text-right">
              <div className="text-lg font-black text-brand-700">{fmtVND(basePrice)}</div>
              <div className="text-xs font-semibold text-gray-400">/ngày</div>
            </div>
          ) : (
            <div className="shrink-0 text-right text-sm font-black text-brand-700">Liên hệ</div>
          )}
        </div>

        {priceMonth && savings > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
            <div className="flex-1">
              <div className="text-xs text-emerald-700">Thuê theo tháng</div>
              <div className="font-black text-gray-950">{fmtVND(priceMonth)}/tháng</div>
            </div>
            <span className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-black text-emerald-700">
              Tiết kiệm {savings}%
            </span>
          </div>
        )}

      </div>

      {/* ── Consolidated rental time picker ── */}
      <div className="px-5 py-4 space-y-3.5">
        {vehicleId && (
          <div>
            <button
              type="button"
              onClick={() => {
                setShowCalModal(true);
                setRangeStep('from');
                setCalendarStartPreview(null);
                void fetchAvailability();
              }}
              aria-label="Chọn thời gian nhận và trả xe"
              className="group w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <span className="grid grid-cols-2 divide-x divide-gray-200">
                <span className="px-3.5 py-3">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-400">Nhận xe</span>
                  <span className="mt-1 block text-sm font-black text-gray-900">
                    {pickupHour}:00 · {displayDateSlash(pickupDate)}
                  </span>
                </span>
                <span className="px-3.5 py-3">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-gray-400">Trả xe</span>
                  <span className="mt-1 block text-sm font-black text-gray-900">
                    {returnHour}:00 · {displayDateSlash(returnDate)}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-brand-700 transition group-hover:bg-brand-50">
                <CalendarDays className="h-4 w-4 shrink-0" />
                {availLoading ? 'Đang tải lịch xe…' : 'Đổi thời gian trên lịch'}
                <span className="ml-auto font-semibold text-gray-500">
                  {selectedComboDays ? `${selectedDurationLabel} combo` : selectedDurationLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-gray-400" />
              </span>
            </button>
            {(availLoading || availabilityUnavailable) && (
              <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${availabilityUnavailable ? 'text-red-600' : 'text-amber-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  availLoading ? 'animate-pulse bg-amber-400' : 'bg-red-500'
                }`} />
                {availLoading
                  ? 'Đang tải lịch xe…'
                  : 'Chưa tải được lịch xe — vui lòng thử lại'}
              </p>
            )}

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
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white divide-y divide-gray-100">
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
              <>
                <button
                  type="button"
                  onClick={openPromoModal}
                  disabled={holidayPromoBlocked}
                  title={holidayPromoBlocked ? holidayPromoBlockMessage : 'Mở mã khuyến mãi'}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-sm transition-colors ${
                    holidayPromoBlocked
                      ? 'cursor-not-allowed bg-amber-50 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      holidayPromoBlocked ? 'bg-amber-100' : 'bg-gray-200'
                    }`}>
                      <Tag className={`w-3.5 h-3.5 ${holidayPromoBlocked ? 'text-amber-600' : 'text-gray-500'}`} />
                    </div>
                    Mã khuyến mãi
                  </span>
                  {holidayPromoBlocked ? (
                    <span className="text-[11px] font-bold">Không áp dụng</span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {holidayPromoBlocked && (
                  <p className="px-4 py-2 text-xs font-medium text-amber-700 bg-amber-50">
                    {holidayPromoBlockMessage}
                  </p>
                )}
              </>
            )}

            {/* Total row */}
            <div className="flex justify-between items-center px-4 py-3 bg-brand-50">
              <div>
                <div className="text-xs text-brand-600 font-bold">Tổng dự kiến</div>
                {result.note && (
                  <div className="text-xs text-gray-400 mt-0.5">{result.note}</div>
                )}
              </div>
              <span className="font-black text-brand-700 text-xl">
                {fmtVND(result.total)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 px-4 py-3 text-xs">
              <div>
                <div className="font-medium text-slate-500">
                  {needsManualConfirmation ? 'Cọc sau khi xác nhận' : 'Cọc giữ xe dự kiến'}
                </div>
                <div className="mt-1 font-bold text-blue-700">{fmtVND(estimatedDepositAmount)}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-slate-500">Còn lại khi nhận xe</div>
                <div className="mt-1 font-bold text-slate-900">{fmtVND(estimatedRemainingAmount)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <div className="font-bold text-slate-800">Phụ phí có thể phát sinh</div>
          <div className="mt-2 flex justify-between gap-3">
            <span>Vượt {kmPerDay} km/ngày</span>
            <span className="font-semibold text-slate-800">{fmtVND(kmSurcharge)}/km</span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3">
            <span>Trả xe trễ</span>
            <span className="font-semibold text-slate-800">100.000đ/giờ</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-500">Chỉ tính theo sử dụng thực tế, chưa cộng vào tổng dự kiến.</p>
        </div>

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
            setBookingNeedsConfirmation(false);
            setBookingError('');
            setConfirmTransfer(false);
          }}
          disabled={!result.valid || hardConflicts.length > 0 || availabilityUnavailable || availLoading || holidayBookingBlocked}
          className="w-full py-3.5 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CalendarDays className="w-4 h-4" />
          {holidayBookingBlocked ? 'Chọn đúng combo lễ' : needsManualConfirmation ? 'Gửi yêu cầu xác nhận lịch' : 'Kiểm tra lịch & đặt xe'}
        </button>
        {needsManualConfirmation && (
          <p className="text-center text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            Car Match sẽ xác nhận chính xác giờ trống trước. Bạn chưa cần chuyển khoản ở bước này.
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

      </div>
    </div>

    {/* ── Calendar Modal — portal to document.body (escapes sticky stacking context) ── */}
    {showCalModal && createPortal(
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6"
        onClick={() => setShowCalModal(false)}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-y-auto"
          style={{ width: '94vw', maxWidth: 900, maxHeight: '94vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="relative flex items-center justify-center px-6 py-4 border-b border-gray-100 shrink-0">
            <h3 className="text-xl font-black text-gray-950">Thời gian</h3>
            <button
              type="button"
              aria-label="Đóng lịch"
              onClick={() => setShowCalModal(false)}
              className="absolute right-4 p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {upcomingHolidayWindows.length > 0 && (
            <div className="shrink-0 border-b border-amber-100 bg-amber-50/70 px-4 py-3 sm:px-8">
              <p className="mb-2 text-xs font-black text-amber-900">Chọn nhanh combo lễ</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {upcomingHolidayWindows.map((window) => {
                  const active = pickupDate === window.pickup_date && returnDate === window.return_date;
                  const comboDays = inclusiveDateCount(window.pickup_date, window.return_date);
                  return (
                    <button
                      key={`${window.pickup_date}-${window.return_date}`}
                      type="button"
                      onClick={() => selectHolidayCombo(window)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                          : 'border-amber-200 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      <span className="block text-xs font-black">{window.label || `Combo ${comboDays} ngày`}</span>
                      <span className={`mt-0.5 block text-[11px] font-semibold ${active ? 'text-amber-50' : 'text-amber-700'}`}>
                        {displayDateSlash(window.pickup_date)} – {displayDateSlash(window.return_date)} · {comboDays} ngày
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Calendar ── */}
          <div className="carmatch-cal shrink-0 overflow-x-hidden px-3 pt-3 sm:px-8 sm:pt-5">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p className={`text-sm font-bold ${rangeStep === 'from' ? 'text-brand-700' : 'text-emerald-700'}`}>
                {rangeStep === 'from' ? '① Chọn ngày nhận xe' : '② Chọn ngày trả xe'}
              </p>
              <p className="hidden text-xs font-medium text-gray-400 sm:block">
                Ngày có giá cao hơn được đánh dấu màu cam
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-1 py-2 shadow-sm sm:px-3 sm:py-3" style={{ minWidth: isMobile ? 300 : 680 }}>
              <DayPicker
                mode="range"
                selected={selectedRange}
                onDayClick={handleDayClick}
                numberOfMonths={isMobile ? 1 : 2}
                pagedNavigation={!isMobile}
                locale={vi}
                disabled={[{ before: today }, ...blockedIntervals]}
                modifiers={{ blocked: blockedIntervals, holidayPrice: holidayPricingIntervals }}
                modifiersClassNames={{ blocked: 'rdp-day_blocked', holidayPrice: 'rdp-day_holiday_price' }}
                fromDate={today}
                showOutsideDays={false}
                components={{ DayContent: CalendarDayContent }}
              />
            </div>
          </div>

          {/* ── Time pickers ── */}
          <div className="px-4 py-4 sm:px-8 shrink-0">
            <div className="relative grid grid-cols-2 gap-4 sm:gap-8">
              {/* Nhận xe */}
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold text-gray-500">Nhận xe</div>
                <div className="relative mt-0.5">
                  <select
                    value={pickupHour}
                    onChange={e => setPickupHour(+e.target.value)}
                    className="w-full appearance-none bg-transparent py-1 text-lg font-black text-gray-950 focus:outline-none pr-8 cursor-pointer"
                  >
                    {PICKUP_HOURS.map(h => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </div>

              {/* Trả xe */}
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold text-gray-500">Trả xe</div>
                <div className="relative mt-0.5">
                  <select
                    value={returnHour}
                    onChange={e => setReturnHour(+e.target.value)}
                    className="w-full appearance-none bg-transparent py-1 text-lg font-black text-gray-950 focus:outline-none pr-8 cursor-pointer"
                  >
                    {RETURN_HOURS.map(h => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="px-4 pb-3 sm:px-8 flex flex-wrap gap-x-5 gap-y-1.5 shrink-0">
            {[
              { color: 'bg-brand-600 rounded-full', label: 'Khoảng ngày đã chọn' },
              { color: 'bg-amber-50 border border-amber-300 rounded', label: 'Giá lễ' },
              { color: 'bg-red-100 border border-red-200 rounded', label: 'Đã có lịch (bận)' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`w-3 h-3 inline-block shrink-0 ${color}`} />
                {label}
              </span>
            ))}
          </div>

          {hardConflicts.length > 0 && (
            <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 sm:mx-6">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <div className="font-bold">Khoảng thời gian này trùng lịch xe đang bận.</div>
                <div className="mt-0.5">Vui lòng chọn lại ngày không có ô màu đỏ trước khi xác nhận.</div>
              </div>
            </div>
          )}

          {holidayBookingPolicy.hasHoliday && holidayBookingPolicy.isComboRestricted && (
            <div className={`mx-4 mb-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:mx-6 ${
              holidayBookingBlocked
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              <Info className={`mt-0.5 h-4 w-4 shrink-0 ${holidayBookingBlocked ? 'text-red-500' : 'text-amber-500'}`} />
              <div>
                <div className="font-bold">
                  {holidayBookingBlocked
                    ? holidayComboBlockMessage
                    : `Combo lễ hợp lệ: ${holidayBookingPolicy.matchedWindow ? formatHolidayBookingWindow(holidayBookingPolicy.matchedWindow) : holidayComboText}`}
                </div>
                <div className="mt-0.5">{holidayPromoBlockMessage}</div>
              </div>
            </div>
          )}

          {/* ── Bottom bar ── */}
          <div className="px-4 py-4 sm:px-8 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              {/* Summary */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-950 text-sm sm:text-base">
                  {rangeStep === 'to'
                    ? `${pickupHour}:00 ${displayDate(pickupDate)} – Chọn ngày kết thúc`
                    : `${pickupHour}:00 ${displayDate(pickupDate)} – ${returnHour}:00 ${displayDate(returnDate)}`}
                </div>
                {rangeStep === 'from' && (
                  <div className="mt-1 text-xs font-medium text-gray-500">
                    {selectedComboDays ? 'Số ngày combo' : 'Thời gian thuê'}:{' '}
                    <strong className="text-emerald-600">{selectedDurationLabel}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCalModal(false)}
                disabled={rangeStep === 'to' || hardConflicts.length > 0 || !result.valid || availabilityUnavailable || availLoading || holidayBookingBlocked}
                className="shrink-0 py-3.5 px-8 bg-emerald-500 text-white font-black rounded-xl text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {holidayBookingBlocked ? 'Chọn combo lễ' : 'Tiếp tục'}
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
                placeholder={holidayPromoBlocked ? 'Không áp dụng trong kỳ lễ' : 'Nhập mã khuyến mãi'}
                type="text"
                autoFocus
                disabled={holidayPromoBlocked}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors disabled:bg-amber-50 disabled:text-amber-700"
                autoCapitalize="characters"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!promoCode.trim()) return;
                  await applyPromoFromList(promoCode.trim());
                }}
                disabled={promoLoading || !promoCode.trim() || holidayPromoBlocked}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {promoLoading ? '...' : 'Áp dụng'}
              </button>
            </div>
            {holidayPromoBlocked && (
              <p className="text-xs text-amber-700 font-medium mt-2">{holidayPromoBlockMessage}</p>
            )}
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
                    (!item.applicable || holidayPromoBlocked) ? 'opacity-50' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.applicable && !holidayPromoBlocked ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Tag className={`w-5 h-5 ${item.applicable && !holidayPromoBlocked ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${item.applicable && !holidayPromoBlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                      {item.code}
                    </div>
                    <div className={`text-xs mt-0.5 ${item.applicable && !holidayPromoBlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.description}
                      {item.discount_amount > 0 && !holidayPromoBlocked && (
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
                    disabled={!item.applicable || holidayPromoBlocked}
                    onClick={() => void applyPromoFromList(item.code)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      item.applicable && !holidayPromoBlocked
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
                    {s === 1
                      ? 'Thông tin'
                      : s === 2
                        ? needsManualConfirmation || bookingNeedsConfirmation
                          ? 'Xác nhận lịch'
                          : 'Đặt cọc'
                        : 'Hoàn tất'}
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
                  {holidayBookingPolicy.matchedWindow && (
                    <div className="flex justify-between text-amber-700">
                      <span>Combo lễ</span>
                      <span className="font-medium text-right max-w-[55%]">
                        {formatHolidayBookingWindow(holidayBookingPolicy.matchedWindow)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Địa điểm</span>
                    <span className="font-medium text-right max-w-[55%]">
                      {deliveryMode === 'self' ? LOCATIONS.find(l => l.id === selectedLocation)?.name : 'Giao tận nơi'}
                    </span>
                  </div>
                  {result.valid && result.fees.map((fee, index) => (
                    <div
                      key={`${fee.label}-${index}`}
                      className={`flex justify-between gap-3 ${fee.amount < 0 ? 'text-green-600' : 'text-gray-600'}`}
                    >
                      <span>{fee.label}</span>
                      <span className="font-medium">{fee.amount < 0 ? '-' : ''}{fmtVND(Math.abs(fee.amount))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-800">Tổng dự kiến</span>
                    <span className="font-bold text-brand-600 text-base">{result.valid ? fmtVND(result.total) : '—'}</span>
                  </div>
                  {result.valid && (
                    <>
                      <div className="flex justify-between text-blue-700">
                        <span>{needsManualConfirmation ? 'Cọc sau khi xác nhận lịch' : 'Cọc giữ xe dự kiến'}</span>
                        <span className="font-semibold">{fmtVND(estimatedDepositAmount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Còn lại khi nhận xe</span>
                        <span className="font-semibold text-gray-900">{fmtVND(estimatedRemainingAmount)}</span>
                      </div>
                    </>
                  )}
                  {needsManualConfirmation && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                      Đây là yêu cầu xác nhận lịch. Car Match sẽ gọi lại trước khi gửi QR đặt cọc.
                    </div>
                  )}
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
                      placeholder={holidayPromoBlocked ? 'Không áp dụng trong kỳ lễ' : 'SUMMER10'}
                      type="text"
                      disabled={Boolean(promoResult) || holidayPromoBlocked}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                      autoCapitalize="characters"
                    />
                    <button
                      type="button"
                      onClick={() => void validatePromo()}
                      disabled={promoLoading || Boolean(promoResult) || holidayPromoBlocked}
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
                  {holidayPromoBlocked && (
                    <p className="text-xs text-amber-700 font-medium mt-1">{holidayPromoBlockMessage}</p>
                  )}
                  {promoError && (
                    <p className="text-xs text-red-500 font-medium mt-1">{promoError}</p>
                  )}
                  {!promoResult && !holidayPromoBlocked && activeSuggestedCodes.length > 0 && (
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
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 ${bookingNeedsConfirmation ? 'bg-amber-100' : 'bg-green-100'}`}>
                    <svg className={`w-7 h-7 ${bookingNeedsConfirmation ? 'text-amber-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {bookingNeedsConfirmation ? 'Đã gửi yêu cầu xác nhận lịch' : 'Đặt xe thành công!'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {bookingNeedsConfirmation
                      ? 'Car Match sẽ kiểm tra giờ trống và liên hệ trước khi gửi QR đặt cọc.'
                      : 'Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút'}
                  </p>
                </div>

                {/* Card xác nhận */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-900 text-base">
                      {bookingNeedsConfirmation ? 'YÊU CẦU XÁC NHẬN LỊCH' : 'ĐƠN XÁC NHẬN ĐẶT XE'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bookingNeedsConfirmation ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {bookingNeedsConfirmation ? 'Chờ xác nhận' : 'Đã đặt'}
                    </span>
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

                    {holidayBookingPolicy.matchedWindow && (
                      <>
                        <span className="text-slate-500">Combo lễ</span>
                        <span className="font-semibold text-amber-700">{formatHolidayBookingWindow(holidayBookingPolicy.matchedWindow)}</span>
                      </>
                    )}

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
                      <span className="text-slate-500">
                        {bookingNeedsConfirmation
                          ? 'Cọc sau khi xác nhận lịch'
                          : BANK_QR_ENABLED ? 'Đã cọc (chuyển khoản)' : 'Tiền cọc dự kiến'}
                      </span>
                      <span className="font-semibold text-blue-600">{depositAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phí giao nhận xe</span>
                        <span className="font-semibold text-slate-900">{deliveryFee.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    {!bookingNeedsConfirmation && (
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                        <span className="font-bold text-slate-900">Thanh toán khi nhận xe</span>
                        <span className="font-black text-red-600 text-base">{remainingAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between"><span>Giới hạn Km</span><span className="text-slate-700">{kmPerDay} km/ngày</span></div>
                    <div className="flex justify-between"><span>Phụ trội quá km</span><span className="text-slate-700">{kmSurcharge.toLocaleString('vi-VN')} đ/km</span></div>
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
                  {bookingNeedsConfirmation ? (
                    <>
                      <p>1️⃣ Nhân viên kiểm tra xe và giờ bàn giao.</p>
                      <p>2️⃣ Khi lịch chắc chắn, Car Match mới gửi <strong>QR cọc {depositAmount.toLocaleString('vi-VN')}đ</strong>.</p>
                      <p>3️⃣ Khách xác nhận cọc để giữ xe.</p>
                    </>
                  ) : (
                    <>
                      <p>1️⃣ Nhân viên gọi xác nhận trong <strong>30 phút</strong> (giờ hành chính)</p>
                      <p>2️⃣ Chuẩn bị <strong>CCCD + GPLX</strong> khi đến nhận xe</p>
                      <p>3️⃣ Thanh toán phần còn lại <strong>{remainingAmount.toLocaleString('vi-VN')}đ</strong> khi nhận xe</p>
                    </>
                  )}
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
                  <ReferralCopyBlock
                    referralCode={customerReferralCode}
                    rewardAmount={referralRewardAmount}
                  />
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
                {bookingLoading
                  ? 'Đang xử lý…'
                  : needsManualConfirmation
                    ? 'Gửi yêu cầu xác nhận lịch'
                    : BANK_QR_ENABLED ? 'Tiếp tục — Xem QR đặt cọc' : 'Gửi yêu cầu đặt xe'}
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
