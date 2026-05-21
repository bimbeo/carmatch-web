import { useState, useMemo, useEffect, useCallback } from 'react';
import { MessageCircle, Phone, Info, ChevronDown, MapPin, Truck, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const ZALO_NUMBER = '0975563290';
const ZALO_LINK = `https://zalo.me/${ZALO_NUMBER}`;

// ─── Availability types ────────────────────────────────────────────────────────

interface BlockedRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  type: string; // rental | blocked | maintenance | ...
  allDay: boolean;
}

function isDateInRange(dateStr: string, range: BlockedRange): boolean {
  return dateStr >= range.from && dateStr <= range.to;
}

function isDateBlocked(dateStr: string, ranges: BlockedRange[]): boolean {
  return ranges.some((r) => isDateInRange(dateStr, r));
}

function rangeOverlapsBlocked(fromStr: string, toStr: string, ranges: BlockedRange[]): BlockedRange[] {
  return ranges.filter((r) => r.from <= toStr && r.to >= fromStr);
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ─── Mini Availability Calendar ───────────────────────────────────────────────

const WEEKDAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                   'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

interface MiniCalProps {
  year: number;
  month: number; // 0-based
  blockedRanges: BlockedRange[];
  pickupDate: string;
  returnDate: string;
  today: string;
  onDateClick?: (dateStr: string) => void;
}

function MiniCal({ year, month, blockedRanges, pickupDate, returnDate, today, onDateClick }: MiniCalProps) {
  // Build day grid
  const firstDay = new Date(year, month, 1);
  // JS getDay(): 0=Sun..6=Sat → convert to Mon-first index
  const startOffset = (firstDay.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function dateStr(day: number) { return `${year}-${pad(month + 1)}-${pad(day)}`; }

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold text-gray-600 text-center mb-2">
        {MONTHS_VI[month]} {year}
      </div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const ds = dateStr(day);
          const isPast = ds < today;
          const isBlocked = isDateBlocked(ds, blockedRanges);
          const isPickup = ds === pickupDate;
          const isReturn = ds === returnDate;
          const inSelection = pickupDate && returnDate && ds > pickupDate && ds < returnDate;

          let cellClass = 'relative flex items-center justify-center rounded text-[11px] h-6 cursor-default select-none ';
          if (isPickup || isReturn) {
            cellClass += 'bg-brand-600 text-white font-bold';
          } else if (inSelection) {
            cellClass += 'bg-brand-100 text-brand-700 font-medium';
          } else if (isPast) {
            cellClass += 'text-gray-300';
          } else if (isBlocked) {
            cellClass += 'bg-red-100 text-red-400 line-through cursor-not-allowed';
          } else {
            cellClass += 'text-gray-700 hover:bg-gray-100';
            if (onDateClick) cellClass += ' cursor-pointer';
          }

          return (
            <div
              key={idx}
              className={cellClass}
              onClick={() => {
                if (!isPast && !isBlocked && onDateClick) onDateClick(ds);
              }}
              title={isBlocked ? 'Xe đang bận ngày này' : undefined}
            >
              {day}
              {ds === today && !isPickup && !isReturn && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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

function displayDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

// ─── Pricing engine ───────────────────────────────────────────────────────────
// CarMatch pricing rules (updated):
//   • Minimum booking: 4 hours
//   • Pure half-day: 70% BP
//       - Same-day within one session, or one overnight half-day (pickup ≥19h, return ≤12h)
//   • Full-day + extra half-day: extra half-day is 50% BP
//   • Multi-day: BP × days, with early/late surcharges
//   • Weekend surcharge: +100k ONLY when booking = exactly 1 day (same-day or 1 overnight)
//       on T7 or CN. No surcharge for 2+ day rentals.
//   • Early pickup surcharge (multi-day): 17–19h = +100k, 16–17h = +200k
//   • Late return surcharge: 21–22h = +100k, 22–23h = +200k, ≥23h = +0.5 BP

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
  const pDow = pDate.getDay(); // 0=Sun, 6=Sat
  const rDow = rDate.getDay();
  const isReturnSat = rDow === 6;
  const isReturnSun = rDow === 0;
  const isReturnWeekend = isReturnSat || isReturnSun;
  const isPickupWeekend = pDow === 0 || pDow === 6;
  // isPickupWeekend used for same-day weekend check above

  // ── SAME DAY ────────────────────────────────────────────────────────────────
  if (calDays === 0) {
    // Half-day: booking must be WITHIN one session
    //   Buổi sáng: pickup ∈ [7,12] AND return ≤ 12
    //   Buổi chiều: pickup ∈ [13,20] AND return ≤ 20
    const inMorning = pickupHour >= 7 && pickupHour <= 12 && returnHour <= 12;
    const inAfternoon = pickupHour >= 13 && returnHour <= 20;
    const isHalfDay = inMorning || inAfternoon;

    let base = isHalfDay ? Math.round(BP * 0.7) : BP;
    fees.push({ label: isHalfDay ? 'Nửa ngày (×70%)' : '1 ngày', amount: base });

    // Weekend surcharge: +100k for 1-day booking on T7 or CN
    if (isPickupWeekend) {
      fees.push({ label: 'Phụ phí cuối tuần', amount: 100_000 });
      base += 100_000;
    }
    return { valid: true, total: base, fees };
  }

  // ── MULTI-DAY ───────────────────────────────────────────────────────────────

  // Early pickup surcharge
  let earlyFee = 0;
  if (pickupHour >= 17 && pickupHour < 19) earlyFee = 100_000;
  else if (pickupHour >= 16 && pickupHour < 17) earlyFee = 200_000;

  // Late return surcharge
  let lateFee = 0;
  let lateExtraHalf = false;
  if (returnHour >= 23) lateExtraHalf = true;
  else if (returnHour >= 22) lateFee = 200_000;
  else if (returnHour >= 21) lateFee = 100_000;

  // ── Calculate base days ─────────────────────────────────────────────────────
  // Logic dựa theo ca xe CarMatch:
  //   • Sáng (7h–11h): ngày đầu tính đủ 1 ngày → baseDays = calDays + 1
  //   • Trưa (12h–15h): ngày đầu tính nửa ngày  → baseDays = calDays + 0.5
  //       Ngoại lệ: nếu trả xe trước 12h ngày hôm sau (2 nửa ca = 1 ngày) → baseDays = calDays
  //   • Chiều/tối (16h+): tính theo số ca đêm chuẩn → baseDays = calDays
  //       Ngoại lệ: tối (≥19h) + trả sáng sớm (≤12h):
  //         - chỉ 1 đêm = nửa ngày 70%
  //         - từ 2 đêm trở lên = ngày nguyên + nửa ngày 50%

  let baseDays: number;

  if (pickupHour <= 11) {
    // Sáng sớm: ngày đầu tiên tính full → +1
    baseDays = calDays + 1;
  } else if (pickupHour <= 15) {
    // Trưa: ngày đầu tính nửa → +0.5
    // Nhưng nếu trả trước 12h hôm sau = 2 nửa ca = 1 ngày (không cộng thêm)
    if (returnHour <= 12 && !isReturnWeekend) {
      baseDays = calDays; // case 13: 2 nửa ca = calDays ngày
    } else {
      baseDays = calDays + 0.5; // case 9: 1.5 ngày
    }
  } else {
    // Chiều muộn / tối (16h+): tính theo số ca đêm
    baseDays = calDays;
    // Tối (≥19h) + trả sáng sớm hôm sau (≤12h):
    // - 1 đêm: pure half-day = 70% BP
    // - 2+ đêm: phần lẻ nửa ngày chỉ tính 50% BP
    if (pickupHour >= 19 && returnHour <= 12 && !isReturnWeekend) {
      baseDays = calDays === 1 ? 0.7 : (calDays - 1) + 0.5;
    }
  }

  // Compute base amount (baseDays = 0.7 là sentinel cho "70% BP")
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

  // Late extra half-day (+0.5 BP when returning ≥ 23h)
  if (lateExtraHalf) {
    const halfExtra = Math.round(BP * 0.5);
    fees.push({ label: 'Nửa ca thêm (trả sau 23h)', amount: halfExtra });
    baseAmount += halfExtra;
  }

  // ── Weekend surcharge ────────────────────────────────────────────────────────
  // Rule: +100k ONLY when total rental = exactly 1 overnight day (calDays === 1)
  //       AND that day falls on T7 or CN.
  //       For 2+ day rentals: no weekend surcharge.
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

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  basePrice: number;
  carName: string;
  priceMonth?: number;
  vehicleId?: string;
}

export default function BookingWidget({ basePrice, carName, priceMonth, vehicleId }: Props) {
  const today = new Date();
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
  const [showAvailCal, setShowAvailCal] = useState(false);

  // Calendar view: month/year for the mini calendar
  const [calPage, setCalPage] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const fetchAvailability = useCallback(async () => {
    if (!vehicleId) return;
    setAvailLoading(true);
    try {
      const from = toDateStr(today);
      const to = toDateStr(addDays(today, 120));
      const res = await fetch(`/api/vehicle-availability?vehicleId=${vehicleId}&from=${from}&to=${to}`);
      if (!res.ok) return;
      const data = await res.json();
      setBlockedRanges(data.blockedRanges || []);
    } catch {
      // graceful — no availability shown
    } finally {
      setAvailLoading(false);
    }
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

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

  const result = useMemo(() => {
    if (!rentalResult.valid) return rentalResult;
    const extraFees = deliveryMode === 'delivery'
      ? [{ label: 'Phí giao/trả xe (2 chiều)', amount: deliveryFee }]
      : [];
    return {
      ...rentalResult,
      fees: [...rentalResult.fees, ...extraFees],
      total: rentalResult.total + deliveryFee,
    };
  }, [rentalResult, deliveryMode, deliveryFee]);

  const savings =
    priceMonth && basePrice > 0
      ? Math.round((1 - priceMonth / (basePrice * 30)) * 100)
      : 0;

  const handlePickupDate = (v: string) => {
    setPickupDate(v);
    if (v >= returnDate) setReturnDate(toDateStr(addDays(new Date(v), 1)));
  };

  const buildMessage = () => {
    const priceText = result.valid ? fmtVND(result.total) : 'báo giá';
    const loc = LOCATIONS.find(l => l.id === selectedLocation)!;
    const locationLine = deliveryMode === 'self'
      ? `📍 Địa điểm: ${loc.name} (${loc.address})`
      : `🚗 Giao xe tận nơi (phí 100.000đ/chiều)`;
    return (
      `[ĐẶT XE - ${carName}]\n` +
      `📅 Nhận xe: ${displayDate(pickupDate)} lúc ${pickupHour}:00\n` +
      `📅 Trả xe: ${displayDate(returnDate)} lúc ${returnHour}:00\n` +
      `${locationLine}\n` +
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
              min={toDateStr(today)}
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

        {/* ── Availability calendar toggle ── */}
        {vehicleId && (
          <div>
            <button
              type="button"
              onClick={() => setShowAvailCal((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {availLoading ? 'Đang tải lịch xe…' : 'Xem lịch trống'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showAvailCal ? 'rotate-180' : ''}`} />
            </button>

            {showAvailCal && (
              <div className="mt-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setCalPage((p) => {
                      const d = new Date(p.year, p.month - 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <div className="flex gap-6">
                    {/* Show 2 months side by side */}
                    <MiniCal
                      year={calPage.year}
                      month={calPage.month}
                      blockedRanges={blockedRanges}
                      pickupDate={pickupDate}
                      returnDate={returnDate}
                      today={todayStr}
                      onDateClick={(ds) => {
                        if (ds >= todayStr) {
                          if (!pickupDate || (pickupDate && returnDate) || ds < pickupDate) {
                            setPickupDate(ds);
                            setReturnDate(toDateStr(addDays(new Date(ds), 1)));
                          } else {
                            setReturnDate(ds);
                          }
                        }
                      }}
                    />
                    {(() => {
                      const next = new Date(calPage.year, calPage.month + 1, 1);
                      return (
                        <MiniCal
                          year={next.getFullYear()}
                          month={next.getMonth()}
                          blockedRanges={blockedRanges}
                          pickupDate={pickupDate}
                          returnDate={returnDate}
                          today={todayStr}
                          onDateClick={(ds) => {
                            if (ds >= todayStr) {
                              if (!pickupDate || (pickupDate && returnDate) || ds < pickupDate) {
                                setPickupDate(ds);
                                setReturnDate(toDateStr(addDays(new Date(ds), 1)));
                              } else {
                                setReturnDate(ds);
                              }
                            }
                          }}
                        />
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalPage((p) => {
                      const d = new Date(p.year, p.month + 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-600 inline-block" /> Ngày chọn</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Đã có lịch</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Trống</span>
                </div>
              </div>
            )}

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
                  <span className="text-gray-500">{fee.label}</span>
                  <span className="font-semibold text-gray-800">{fmtVND(fee.amount)}</span>
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

        {/* ── CTAs ── */}
        <button
          onClick={handleBook}
          className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-200"
        >
          <MessageCircle className="w-4 h-4" />
          Đặt xe qua Zalo
        </button>

        <a
          href={`tel:${ZALO_NUMBER}`}
          className="w-full py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Phone className="w-4 h-4 text-gray-500" />
          Gọi {ZALO_NUMBER}
        </a>

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

    {/* ── Booking confirm modal ── */}
    {showModal && (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-500">Dự kiến</span>
                <span className="font-bold text-brand-600 text-base">{fmtVND(result.total)}</span>
              </div>
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
      </div>
    )}
    </>
  );
}
