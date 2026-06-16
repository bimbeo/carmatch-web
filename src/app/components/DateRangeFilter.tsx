import { useMemo, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';

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

interface Props {
  onFilter: (unavailableModels: string[]) => void;
  onActiveChange?: (active: boolean) => void;
}

export default function DateRangeFilter({ onFilter, onActiveChange }: Props) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const todayStr = toDateStr(today);
  const [pickupDate, setPickupDate] = useState(toDateStr(addDays(today, 1)));
  const [returnDate, setReturnDate] = useState(toDateStr(addDays(today, 2)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);

  async function checkAvailability() {
    if (!pickupDate || !returnDate || returnDate <= pickupDate) {
      setError('Ngày trả phải sau ngày nhận');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ pickup: pickupDate, return: returnDate });
      const res = await fetch(`/api/availability?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không kiểm tra được lịch xe');
      onFilter(Array.isArray(data.unavailable_models) ? data.unavailable_models : []);
      setActive(true);
      onActiveChange?.(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không kiểm tra được lịch xe');
      onFilter([]);
      setActive(false);
      onActiveChange?.(false);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPickupDate(toDateStr(addDays(today, 1)));
    setReturnDate(toDateStr(addDays(today, 2)));
    setError('');
    setActive(false);
    onFilter([]);
    onActiveChange?.(false);
  }

  return (
    <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Ngày nhận xe</label>
          <input
            type="date"
            min={todayStr}
            value={pickupDate}
            onChange={event => {
              const nextPickup = event.target.value;
              setPickupDate(nextPickup);
              if (nextPickup >= returnDate) {
                setReturnDate(toDateStr(addDays(new Date(nextPickup), 1)));
              }
            }}
            onClick={event => (event.currentTarget as HTMLInputElement & { showPicker?(): void }).showPicker?.()}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Ngày trả xe</label>
          <input
            type="date"
            min={pickupDate}
            value={returnDate}
            onChange={event => setReturnDate(event.target.value)}
            onClick={event => (event.currentTarget as HTMLInputElement & { showPicker?(): void }).showPicker?.()}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void checkAvailability()}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 lg:flex-none"
          >
            <CalendarDays className="h-4 w-4" />
            {loading ? 'Đang kiểm tra...' : 'Kiểm tra ngày'}
          </button>
          {active && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2.5 text-gray-500 transition-colors hover:bg-gray-50"
              aria-label="Xóa lọc ngày"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
