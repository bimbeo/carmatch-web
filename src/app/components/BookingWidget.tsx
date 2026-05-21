import { useState, useMemo, useEffect, useCallback } from 'react';
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

function rangeOverlapsBlocked(fromStr: string, toStr: string, ranges: BlockedRange[]): BlockedRange[] {
  return ranges.filter((r) => r.from <= toStr && r.to >= fromStr);
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
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
  const [showCalModal, setShowCalModal] = useState(false);

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

  const handleDaySelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    if (rangeStep === 'from') {
      if (range.from) {
        const ds = toDateStr(range.from);
        setPickupDate(ds);
        setReturnDate(toDateStr(addDays(range.from, 1)));
        setRangeStep('to');
      }
    } else {
      if (range.to) {
        const ds = toDateStr(range.to);
        if (ds > pickupDate) {
          setReturnDate(ds);
          setRangeStep('from');
        } else {
          // clicked before pickup → reset pickup
          setPickupDate(ds);
          setReturnDate(toDateStr(addDays(new Date(ds), 1)));
          setRangeStep('to');
        }
      } else if (range.from) {
        const ds = toDateStr(range.from);
        setPickupDate(ds);
        setReturnDate(toDateStr(addDays(new Date(ds), 1)));
        setRangeStep('to');
      }
    }
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

    {/* ── Calendar Modal ── */}
    {showCalModal && (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => setShowCalModal(false)}
      >
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {/* Step pills */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${rangeStep === 'from' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">1</span>
                Nhận xe
              </div>
              <span className="text-gray-300 text-xs">›</span>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${rangeStep === 'to' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">2</span>
                Trả xe
              </div>
            </div>
            <button
              onClick={() => setShowCalModal(false)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Day Picker */}
          <div className="carmatch-cal flex justify-center px-4 py-2">
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleDaySelect as (range: { from?: Date; to?: Date } | undefined) => void}
              numberOfMonths={1}
              locale={vi}
              disabled={[
                { before: today },
                ...blockedIntervals,
              ]}
              modifiers={{ blocked: blockedIntervals }}
              modifiersClassNames={{ blocked: 'rdp-day_blocked' }}
              fromDate={today}
              showOutsideDays={false}
            />
          </div>

          {/* Bottom bar: legend + date summary + confirm */}
          <div className="px-5 pb-4 pt-3 border-t border-gray-100">
            {/* Legend row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3.5 h-3.5 rounded-full bg-brand-600 inline-block shrink-0" />
                Ngày chọn
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3.5 h-3.5 rounded bg-brand-100 inline-block border border-brand-200 shrink-0" />
                Trong khoảng
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3.5 h-3.5 rounded bg-red-100 inline-block border border-red-200 shrink-0" />
                Đã có lịch
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3.5 h-3.5 rounded bg-gray-100 inline-block border border-gray-200 opacity-50 shrink-0" />
                Không khả dụng
              </span>
            </div>

            {/* Date chips + confirm button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Nhận xe</div>
                  <div className="font-bold text-gray-900 text-sm truncate">{displayDate(pickupDate)}</div>
                </div>
                <span className="text-gray-300 text-base shrink-0">→</span>
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Trả xe</div>
                  <div className="font-bold text-gray-900 text-sm truncate">{displayDate(returnDate)}</div>
                </div>
              </div>
              <button
                onClick={() => setShowCalModal(false)}
                className="shrink-0 py-2.5 px-6 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 active:scale-[0.98] transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Booking confirm modal ── */}
    {showModal && (
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
