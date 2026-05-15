import { useState, useMemo } from 'react';
import { MessageCircle, Phone, Info, ChevronDown } from 'lucide-react';

const ZALO_NUMBER = '0975563290';
const ZALO_LINK = `https://zalo.me/${ZALO_NUMBER}`;

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
// Based on CarMatch pricing formula spreadsheet
// Key rules:
//   • Ca xe: 7h–20h (standard)
//   • Minimum booking: 4 hours
//   • No booking start after 17h same-day
//   • Half-day = BP × 70%; only applies on weekdays (weekend = auto full day)
//   • Early pickup surcharge: 17–19h = +100k, 16–17h = +200k
//   • Late return surcharge: 21–22h = +100k, 22–23h = +200k, ≥23h = +0.5 BP
//   • Weekend surcharge: T7 return = +100k, CN return (weekday origin) = +200k
//                         T7 pickup → CN return = +100k, CN pickup → weekday = none

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
  if (calDays === 0 && pickupHour >= 17) {
    return { valid: false, error: 'Không thể nhận xe sau 17h trong ngày', total: 0, fees: [] };
  }

  const fees: Fee[] = [];
  const pDow = pDate.getDay(); // 0=Sun, 6=Sat
  const rDow = rDate.getDay();
  const isReturnSat = rDow === 6;
  const isReturnSun = rDow === 0;
  const isReturnWeekend = isReturnSat || isReturnSun;
  const isPickupSat = pDow === 6;
  const isPickupWeekday = pDow >= 1 && pDow <= 5;

  // ── SAME DAY ────────────────────────────────────────────────────────────────
  if (calDays === 0) {
    // All same-day: return ≤ 20h = half day (70%), > 20h = full day
    const base = returnHour <= 20 ? Math.round(BP * 0.7) : BP;
    fees.push({
      label: returnHour <= 20 ? `Nửa ngày × 70%` : '1 ngày',
      amount: base,
    });
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

  // Is last segment a half-day?
  // Applies only when: return is on a weekday AND pickup was evening (≥19h) AND return before noon
  const lastSegHalf = !isReturnWeekend && pickupHour >= 19 && returnHour <= 12;

  // Is first segment a half-day? (midday pickup: 12h ≤ t < 16h → adds 0.5 day at front)
  const firstSegHalf = pickupHour >= 12 && pickupHour < 16;

  // ── Calculate base days ─────────────────────────────────────────────────────
  let baseDays: number;
  let daysLabel: string;

  if (lastSegHalf && !firstSegHalf) {
    if (calDays === 1) {
      // Case 10: evening pickup, early return next morning → 70% BP
      baseDays = 0.7; // sentinel for 70% × BP
      daysLabel = 'Nửa ngày (×70%)';
    } else {
      baseDays = (calDays - 1) + 0.7;
      daysLabel = `${calDays - 1} ngày + nửa ngày`;
    }
  } else if (firstSegHalf && !lastSegHalf) {
    // Case 9: afternoon pickup + next day afternoon return → 1.5 days
    baseDays = calDays + 0.5;
    daysLabel = `${calDays}.5 ngày`;
  } else if (firstSegHalf && lastSegHalf) {
    // Case 13: 2 half-days = 1 full day
    baseDays = calDays;
    daysLabel = calDays === 1 ? '1 ngày (2 nửa ca)' : `${calDays} ngày`;
  } else {
    baseDays = calDays;
    daysLabel = calDays === 1 ? '1 ngày' : `${calDays} ngày`;
  }

  // Compute base amount
  let baseAmount: number;
  if (baseDays === 0.7) {
    baseAmount = Math.round(BP * 0.7);
  } else {
    // Handle fractional days (e.g. 1.5 = 1 × BP + 0.5 × BP)
    baseAmount = Math.round(BP * baseDays);
  }

  fees.push({ label: daysLabel, amount: baseAmount });

  // Late extra half-day (+0.5 BP when returning ≥ 23h)
  if (lateExtraHalf) {
    const halfExtra = Math.round(BP * 0.5);
    fees.push({ label: 'Nửa ca thêm (trả sau 23h)', amount: halfExtra });
    baseAmount += halfExtra;
  }

  // ── Weekend surcharge ────────────────────────────────────────────────────────
  let weekendFee = 0;
  let weekendLabel = '';
  if (isReturnSat) {
    weekendFee = 100_000;
    weekendLabel = 'Phụ phí Thứ 7';
  } else if (isReturnSun) {
    if (isPickupSat) {
      weekendFee = 100_000; // T7 pickup → CN return (case 49)
      weekendLabel = 'Phụ phí cuối tuần';
    } else if (isPickupWeekday) {
      weekendFee = 200_000; // weekday pickup → CN return (case 43)
      weekendLabel = 'Phụ phí Chủ nhật';
    }
    // CN pickup → weekday return: no surcharge (cases 54-62)
  }

  if (lateFee > 0) fees.push({ label: 'Phụ phí quá giờ', amount: lateFee });
  if (earlyFee > 0) fees.push({ label: 'Phụ phí nhận xe sớm', amount: earlyFee });
  if (weekendFee > 0) fees.push({ label: weekendLabel, amount: weekendFee });

  const total = baseAmount + lateFee + earlyFee + weekendFee;

  return {
    valid: true,
    total,
    fees,
    note: calDays > 14 ? 'Thuê dài ngày — liên hệ để nhận giá tốt hơn' : undefined,
  };
}

// ─── Hour options ─────────────────────────────────────────────────────────────
const PICKUP_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const RETURN_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  basePrice: number;
  carName: string;
  priceMonth?: number;
}

export default function BookingWidget({ basePrice, carName, priceMonth }: Props) {
  const today = new Date();
  const [pickupDate, setPickupDate] = useState(toDateStr(addDays(today, 1)));
  const [pickupHour, setPickupHour] = useState(20);
  const [returnDate, setReturnDate] = useState(toDateStr(addDays(today, 2)));
  const [returnHour, setReturnHour] = useState(20);

  const result = useMemo(
    () => calculateRental(pickupDate, pickupHour, returnDate, returnHour, basePrice),
    [pickupDate, pickupHour, returnDate, returnHour, basePrice],
  );

  const savings =
    priceMonth && basePrice > 0
      ? Math.round((1 - priceMonth / (basePrice * 30)) * 100)
      : 0;

  const handlePickupDate = (v: string) => {
    setPickupDate(v);
    if (v >= returnDate) setReturnDate(toDateStr(addDays(new Date(v), 1)));
  };

  const handleBook = () => {
    const priceText = result.valid ? fmtVND(result.total) : 'báo giá';
    const msg = encodeURIComponent(
      `[ĐẶT XE - ${carName}]\n` +
      `📅 Nhận xe: ${displayDate(pickupDate)} lúc ${pickupHour}:00\n` +
      `📅 Trả xe: ${displayDate(returnDate)} lúc ${returnHour}:00\n` +
      `💰 Dự kiến: ${priceText}\n\n` +
      `Anh/chị xác nhận giúp lịch xe và giá thuê ạ!`,
    );
    window.open(`${ZALO_LINK}?text=${msg}`, '_blank');
  };

  return (
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
  );
}
