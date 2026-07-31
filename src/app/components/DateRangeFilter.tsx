import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, RotateCcw, X } from 'lucide-react';

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, index) => index + 7);

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export interface AvailabilityResult {
  unavailableVehicleIds: string[];
  unavailableModels: string[];
}

interface Props {
  onFilter: (availability: AvailabilityResult) => void;
  onActiveChange?: (active: boolean) => void;
  onRangeChange?: (pickupDate: string, returnDate: string, pickupHour: number, returnHour: number) => void;
  initialPickupDate?: string;
  initialReturnDate?: string;
  initialPickupHour?: number;
  initialReturnHour?: number;
}

function isValidDateString(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default function DateRangeFilter({
  onFilter,
  onActiveChange,
  onRangeChange,
  initialPickupDate,
  initialReturnDate,
  initialPickupHour = 20,
  initialReturnHour = 20,
}: Props) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayStr = toDateStr(today);
  const defaultPickupDate = toDateStr(addDays(today, 1));
  const safeInitialPickup =
    isValidDateString(initialPickupDate) && initialPickupDate >= todayStr
      ? initialPickupDate
      : defaultPickupDate;
  const safeInitialReturn =
    isValidDateString(initialReturnDate) && initialReturnDate > safeInitialPickup
      ? initialReturnDate
      : toDateStr(addDays(new Date(`${safeInitialPickup}T00:00:00`), 1));
  const [pickupDate, setPickupDate] = useState(safeInitialPickup);
  const [returnDate, setReturnDate] = useState(safeInitialReturn);
  const [pickupHour, setPickupHour] = useState(initialPickupHour);
  const [returnHour, setReturnHour] = useState(initialReturnHour);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);
  const latestRequest = useRef(0);

  const checkAvailability = useCallback(async () => {
    if (!pickupDate || !returnDate || returnDate <= pickupDate) {
      setError('Ngày trả phải sau ngày nhận');
      return;
    }

    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        pickup: pickupDate,
        return: returnDate,
        pickupHour: String(pickupHour),
        returnHour: String(returnHour),
      });
      const res = await fetch(`/api/availability?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không kiểm tra được lịch xe');
      if (requestId !== latestRequest.current) return;
      onFilter({
        unavailableVehicleIds: Array.isArray(data.unavailable_vehicle_ids) ? data.unavailable_vehicle_ids : [],
        unavailableModels: Array.isArray(data.unavailable_models) ? data.unavailable_models : [],
      });
      setActive(true);
      onActiveChange?.(true);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(err instanceof Error ? err.message : 'Không kiểm tra được lịch xe');
      onFilter({ unavailableVehicleIds: [], unavailableModels: [] });
      setActive(false);
      onActiveChange?.(false);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [onActiveChange, onFilter, pickupDate, pickupHour, returnDate, returnHour]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkAvailability();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [checkAvailability]);

  function reset() {
    const nextPickup = toDateStr(addDays(today, 1));
    const nextReturn = toDateStr(addDays(today, 2));
    setPickupDate(nextPickup);
    setReturnDate(nextReturn);
    setPickupHour(20);
    setReturnHour(20);
    setError('');
    setActive(false);
    onFilter({ unavailableVehicleIds: [], unavailableModels: [] });
    onActiveChange?.(false);
    onRangeChange?.(nextPickup, nextReturn, 20, 20);
  }

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Nhận xe</label>
          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
            <div className="relative w-full">
              <div className="pointer-events-none flex h-12 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-medium text-slate-950">
                <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
                {pickupDate ? pickupDate.split('-').reverse().join('/') : ''}
              </div>
              <input
                type="date"
                min={todayStr}
                value={pickupDate}
                onChange={event => {
                  const nextPickup = event.target.value;
                  let nextReturn = returnDate;
                  setPickupDate(nextPickup);
                  if (nextPickup >= returnDate) {
                    nextReturn = toDateStr(addDays(new Date(`${nextPickup}T00:00:00`), 1));
                    setReturnDate(nextReturn);
                  }
                  onRangeChange?.(nextPickup, nextReturn, pickupHour, returnHour);
                }}
                onClick={event => (event.currentTarget as HTMLInputElement & { showPicker?(): void }).showPicker?.()}
                aria-label="Ngày nhận xe"
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
            <select
              value={pickupHour}
              onChange={(event) => {
                const nextHour = Number(event.target.value);
                setPickupHour(nextHour);
                onRangeChange?.(pickupDate, returnDate, nextHour, returnHour);
              }}
              aria-label="Giờ nhận xe"
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-900 outline-none focus:border-brand-400"
            >
              {HOUR_OPTIONS.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Trả xe</label>
          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
            <div className="relative w-full">
              <div className="pointer-events-none flex h-12 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-medium text-slate-950">
                <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
                {returnDate ? returnDate.split('-').reverse().join('/') : ''}
              </div>
              <input
                type="date"
                min={pickupDate}
                value={returnDate}
                onChange={event => {
                  setReturnDate(event.target.value);
                  onRangeChange?.(pickupDate, event.target.value, pickupHour, returnHour);
                }}
                onClick={event => (event.currentTarget as HTMLInputElement & { showPicker?(): void }).showPicker?.()}
                aria-label="Ngày trả xe"
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
            <select
              value={returnHour}
              onChange={(event) => {
                const nextHour = Number(event.target.value);
                setReturnHour(nextHour);
                onRangeChange?.(pickupDate, returnDate, pickupHour, nextHour);
              }}
              aria-label="Giờ trả xe"
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-900 outline-none focus:border-brand-400"
            >
              {HOUR_OPTIONS.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void checkAvailability()}
            disabled={loading}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(13,22,71,0.16)] transition-colors hover:bg-brand-700 disabled:opacity-50 lg:flex-none"
          >
            <CalendarDays className="h-4 w-4" />
            {loading ? 'Đang kiểm tra...' : active ? 'Cập nhật lịch' : 'Kiểm tra lịch'}
          </button>
          {active && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-500 transition-colors hover:bg-slate-50"
              aria-label="Xóa lọc ngày"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
