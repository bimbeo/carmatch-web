import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, LogOut, RefreshCw, Search, XCircle } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

type Screen = 'login' | 'dashboard';
type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';
type StatusFilter = 'all' | BookingStatus;

interface AdminBooking {
  booking_ref: string;
  deposit_amount: number | null;
  source: string | null;
  name: string | null;
  phone: string | null;
  customer_type: string | null;
  form_type: string | null;
  quantity: string | null;
  duration: string | null;
  car_model: string | null;
  building: string | null;
  note: string | null;
  status: BookingStatus | string | null;
  created_at: string;
}

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Huỷ' },
];

const STATUS_ACTIONS: Array<{ value: BookingStatus; label: string }> = [
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Huỷ' },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'Mới', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Huỷ', cls: 'bg-red-100 text-red-700 border-red-200' },
};

function toDateInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatVND(value: number) {
  return `${Math.round(value || 0).toLocaleString('vi-VN')}đ`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pickupFromDuration(duration: string | null) {
  return duration?.split('→')[0]?.trim() || '—';
}

function parseTotalFromNote(note: string | null, fallback: number | null) {
  const match = note?.match(/Tổng dự kiến:\s*([\d.,]+)/i);
  if (!match) return Number(fallback || 0);
  return Number(match[1].replace(/[^\d]/g, '')) || Number(fallback || 0);
}

function StatusBadge({ status }: { status: string | null }) {
  const meta = STATUS_META[status || ''] || { label: status || '—', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export default function Admin() {
  useSEO({
    title: 'Admin Dashboard — CarMatch',
    description: 'CarMatch admin booking dashboard.',
    noIndex: true,
  });

  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);

  const [screen, setScreen] = useState<Screen>(() => (sessionStorage.getItem('carmatch_admin_pin') ? 'dashboard' : 'login'));
  const [pin, setPin] = useState(() => sessionStorage.getItem('carmatch_admin_pin') || '');
  const [pinInput, setPinInput] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [from, setFrom] = useState(toDateInput(monthStart));
  const [to, setTo] = useState(toDateInput(now));
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [actionRef, setActionRef] = useState<string | null>(null);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => (
      sum + parseTotalFromNote(booking.note, booking.deposit_amount)
    ), 0);
    return {
      total: bookings.length,
      newCount: bookings.filter(booking => booking.status === 'new').length,
      totalRevenue,
    };
  }, [bookings]);

  const fetchBookings = async (activePin = pin) => {
    if (!activePin) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        pin: activePin,
        status,
        from,
        to,
      });
      const res = await fetch(`/api/admin-bookings?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Không thể tải danh sách booking');
      setBookings(Array.isArray(json) ? json : []);
    } catch (e) {
      const message = (e as Error).message || 'Không thể tải danh sách booking';
      setError(message === 'Unauthorized' ? 'PIN không đúng hoặc đã hết phiên' : message);
      if (message === 'Unauthorized') {
        sessionStorage.removeItem('carmatch_admin_pin');
        setScreen('login');
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = async () => {
    const nextPin = pinInput.trim();
    if (nextPin.length < 4 || nextPin.length > 8) {
      setError('PIN phải có từ 4 đến 8 ký tự');
      return;
    }
    setLoginLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        pin: nextPin,
        status: 'all',
        from,
        to,
        limit: '1',
      });
      const res = await fetch(`/api/admin-bookings?${params.toString()}`);
      if (!res.ok) throw new Error('PIN không đúng');
      sessionStorage.setItem('carmatch_admin_pin', nextPin);
      setPin(nextPin);
      setScreen('dashboard');
      await fetchBookings(nextPin);
    } catch (e) {
      setError((e as Error).message || 'Không thể đăng nhập');
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('carmatch_admin_pin');
    setPin('');
    setPinInput('');
    setBookings([]);
    setScreen('login');
    setError('');
  };

  const updateStatus = async (bookingRef: string, nextStatus: BookingStatus) => {
    setActionRef(bookingRef);
    setError('');
    try {
      const params = new URLSearchParams({ pin });
      const res = await fetch(`/api/admin-bookings?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_ref: bookingRef, status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Không thể cập nhật trạng thái');
      setBookings(prev => prev.map(booking => (
        booking.booking_ref === bookingRef ? { ...booking, ...json } : booking
      )));
    } catch (e) {
      setError((e as Error).message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionRef(null);
    }
  };

  const copyRef = async (bookingRef: string) => {
    try {
      await navigator.clipboard.writeText(bookingRef);
      setCopiedRef(bookingRef);
      window.setTimeout(() => setCopiedRef(null), 1200);
    } catch {
      setError('Không thể copy mã booking');
    }
  };

  useEffect(() => {
    if (screen === 'dashboard') void fetchBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (screen === 'login') {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-sm items-center">
          <section className="w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-black text-white">
                CM
              </div>
              <h1 className="text-xl font-black text-slate-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-slate-500">Nhập PIN để quản lý đơn đặt xe</p>
            </div>

            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              PIN
            </label>
            <input
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setError('');
              }}
              onKeyDown={e => e.key === 'Enter' && void verifyPin()}
              type="password"
              minLength={4}
              maxLength={8}
              placeholder="••••"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg font-black tracking-[0.35em] text-slate-900 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
            {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}

            <button
              type="button"
              onClick={() => void verifyPin()}
              disabled={loginLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
            >
              {loginLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Vào
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">
              CM
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Admin Dashboard</h1>
              <p className="text-xs font-medium text-slate-500">Quản lý booking website</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </header>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StatusFilter)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Từ ngày</label>
              <input
                value={from}
                onChange={e => setFrom(e.target.value)}
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Đến ngày</label>
              <input
                value={to}
                onChange={e => setTo(e.target.value)}
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void fetchBookings()}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 lg:w-auto"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Tìm
              </button>
            </div>
          </div>
        </section>

        <section className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng đơn</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Mới</p>
            <p className="mt-1 text-2xl font-black text-amber-600">{stats.newCount}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng doanh thu</p>
            <p className="mt-1 text-2xl font-black text-brand-600">{formatVND(stats.totalRevenue)}</p>
          </div>
        </section>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
          {loading ? (
            <SkeletonRows />
          ) : bookings.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-12 text-center text-sm font-semibold text-slate-400">
              Không có đơn nào trong khoảng thời gian này
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3">Ref</th>
                      <th className="px-3 py-3">Khách</th>
                      <th className="px-3 py-3">Xe</th>
                      <th className="px-3 py-3">Nhận xe</th>
                      <th className="px-3 py-3 text-right">Tiền cọc</th>
                      <th className="px-3 py-3">Trạng thái</th>
                      <th className="px-3 py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr
                        key={booking.booking_ref}
                        onClick={() => setExpandedRef(expandedRef === booking.booking_ref ? null : booking.booking_ref)}
                        className="cursor-pointer border-b border-slate-50 align-top transition-colors hover:bg-slate-50"
                      >
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              void copyRef(booking.booking_ref);
                            }}
                            className="inline-flex items-center gap-1 font-mono text-xs font-black text-blue-600 hover:underline"
                          >
                            <Clipboard className="h-3.5 w-3.5" />
                            {copiedRef === booking.booking_ref ? 'Đã copy' : booking.booking_ref}
                          </button>
                          {expandedRef === booking.booking_ref && (
                            <pre className="mt-3 max-w-lg whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-xs leading-5 text-slate-100">
                              {booking.note || 'Không có ghi chú'}
                            </pre>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900">{booking.name || '—'}</div>
                          <div className="text-xs font-medium text-slate-400">{booking.phone || '—'}</div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700">{booking.car_model || '—'}</td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-700">{pickupFromDuration(booking.duration)}</div>
                          <div className="text-xs text-slate-400">{formatDateTime(booking.created_at)}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-cyan-600">
                          {formatVND(Number(booking.deposit_amount || 0))}
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={booking.status} /></td>
                        <td className="px-3 py-3">
                          <select
                            value=""
                            disabled={actionRef === booking.booking_ref}
                            onClick={e => e.stopPropagation()}
                            onChange={e => {
                              void updateStatus(booking.booking_ref, e.target.value as BookingStatus);
                              e.currentTarget.value = '';
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-cyan-400"
                          >
                            <option value="">Đổi status</option>
                            {STATUS_ACTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 lg:hidden">
                {bookings.map(booking => (
                  <article
                    key={booking.booking_ref}
                    onClick={() => setExpandedRef(expandedRef === booking.booking_ref ? null : booking.booking_ref)}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          void copyRef(booking.booking_ref);
                        }}
                        className="font-mono text-xs font-black text-blue-600"
                      >
                        {copiedRef === booking.booking_ref ? 'Đã copy' : booking.booking_ref}
                      </button>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Khách</p>
                        <p className="font-bold text-slate-900">{booking.name || '—'}</p>
                        <p className="text-xs text-slate-400">{booking.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Tiền cọc</p>
                        <p className="font-mono font-bold text-cyan-600">{formatVND(Number(booking.deposit_amount || 0))}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-bold uppercase text-slate-400">Xe</p>
                        <p className="font-semibold text-slate-800">{booking.car_model || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-bold uppercase text-slate-400">Nhận xe</p>
                        <p className="font-semibold text-slate-800">{pickupFromDuration(booking.duration)}</p>
                      </div>
                    </div>
                    {expandedRef === booking.booking_ref && (
                      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-xs leading-5 text-slate-100">
                        {booking.note || 'Không có ghi chú'}
                      </pre>
                    )}
                    <select
                      value=""
                      disabled={actionRef === booking.booking_ref}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        void updateStatus(booking.booking_ref, e.target.value as BookingStatus);
                        e.currentTarget.value = '';
                      }}
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:border-cyan-400"
                    >
                      <option value="">Đổi trạng thái</option>
                      {STATUS_ACTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
