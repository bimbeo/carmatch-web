import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSEO } from '@/hooks/useSEO';

interface BookingData {
  booking_ref: string;
  name: string;
  phone: string;
  car_model: string;
  duration: string;
  deposit_amount: number;
  note: string;
  status: string;
  building: string | null;
  created_at: string;
  payment_proof_url: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700' },
    contacted: { label: 'Đã xác nhận', cls: 'bg-green-100 text-green-700' },
    confirmed: { label: 'Đã xác nhận', cls: 'bg-green-100 text-green-700' },
    completed: { label: 'Hoàn thành', cls: 'bg-blue-100 text-blue-700' },
    cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function BookingConfirm() {
  useSEO({
    title: 'Tra cứu đặt xe — Car Match',
    description: 'Tra cứu thông tin đặt xe Car Match bằng mã booking.',
    noIndex: true,
  });
  const [params] = useSearchParams();
  const refParam = params.get('ref') || '';

  const [inputRef, setInputRef] = useState(refParam.toUpperCase());
  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (ref: string) => {
    if (!ref.trim()) {
      setError('Vui lòng nhập mã booking');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`/api/bookings?ref=${encodeURIComponent(ref.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Không tìm thấy');
      setData(json);
    } catch (e: unknown) {
      setError((e as Error).message || 'Lỗi tra cứu, thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refParam) void lookup(refParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Tra cứu đơn đặt xe</h1>
            <p className="text-sm text-gray-500 mt-1">Nhập mã booking để xem thông tin chuyến thuê</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Mã booking
            </label>
            <div className="flex gap-2">
              <input
                value={inputRef}
                onChange={e => setInputRef(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && void lookup(inputRef)}
                placeholder="CMOTTL250523-BW001"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
              <button
                onClick={() => void lookup(inputRef)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'Tra cứu'}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-500 font-medium">⚠ {error}</p>}
          </div>

          {data && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Mã Booking</p>
                  <p className="font-black text-blue-600 text-lg font-mono">{data.booking_ref}</p>
                </div>
                <StatusBadge status={data.status} />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Khách hàng</p>
                  <p className="font-semibold text-slate-900">{data.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Số điện thoại</p>
                  <p className="font-semibold text-slate-900">{data.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Tên xe</p>
                  <p className="font-semibold text-slate-900">{data.car_model}</p>
                </div>
                {data.building && (
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Địa điểm</p>
                    <p className="font-semibold text-slate-900">{data.building}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs mb-0.5">Thời gian thuê</p>
                  <p className="font-semibold text-slate-900">{data.duration}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Tiền cọc</p>
                  <p className="font-semibold text-cyan-600">{Number(data.deposit_amount).toLocaleString('vi-VN')}đ</p>
                </div>
              </div>

              {data.payment_proof_url ? (
                <div>
                  <p className="text-gray-400 text-xs mb-1.5">Ảnh xác nhận thanh toán</p>
                  <a href={data.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                      src={data.payment_proof_url}
                      alt="Ảnh thanh toán"
                      className="w-full max-h-48 object-contain rounded-xl border border-gray-100 bg-gray-50"
                    />
                    <p className="text-center text-[11px] text-cyan-600 mt-1 hover:underline">Xem ảnh đầy đủ ↗</p>
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-xs text-gray-400">
                  Chưa có ảnh xác nhận thanh toán
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <strong>Chính sách hủy:</strong> Hủy trước 24h — hoàn 100% cọc. Hủy trong 24h — mất cọc.
              </div>

              <a
                href={`https://zalo.me/0975563290?text=${encodeURIComponent(`Mã booking của tôi: ${data.booking_ref}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#0068FF] text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                💬 Liên hệ Car Match qua Zalo
              </a>
            </div>
          )}

          {!data && !loading && !error && (
            <p className="text-center text-sm text-gray-400 mt-4">
              Mã booking có dạng: <span className="font-mono text-gray-600">CMOTTL250523-BW001</span>
            </p>
          )}

          <div className="text-center mt-8">
            <Link to="/xe" className="text-sm text-cyan-600 hover:underline">← Quay lại xem xe</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
