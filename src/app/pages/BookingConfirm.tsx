import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSEO } from '@/hooks/useSEO';

interface BookingData {
  booking_ref: string;
  name: string;
  phone_masked: string;
  car_model: string;
  duration: string;
  deposit_amount: number;
  note: string;
  status: string;
  building: string | null;
  created_at: string;
  payment_proof_url: string | null;
  payment_required: boolean;
  requires_confirmation: boolean;
}

const cleanBankValue = (value: unknown) => String(value ?? '').replace(/\\[rn]/g, '').trim();
const BANK_ID = cleanBankValue(import.meta.env.VITE_BANK_ID || 'MB');
const BANK_ACCOUNT_RAW = cleanBankValue(import.meta.env.VITE_BANK_ACCOUNT || '');
const BANK_ACCOUNT = BANK_ACCOUNT_RAW === '0399118989' ? '' : BANK_ACCOUNT_RAW;
const BANK_NAME = cleanBankValue(import.meta.env.VITE_BANK_ACCOUNT_NAME || 'CONG TY TNHH CAR MATCH');

function buildVietQR(amount: number, info: string): string {
  const encodedInfo = encodeURIComponent(info);
  const encodedName = encodeURIComponent(BANK_NAME);
  return `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodedInfo}&accountName=${encodedName}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700' },
    partner_pending: { label: 'Đang kiểm tra lịch xe', cls: 'bg-amber-100 text-amber-700' },
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
    description: 'Tra cứu thông tin đặt xe Car Match bằng mã booking và số điện thoại đã đặt.',
    noIndex: true,
  });
  const [params] = useSearchParams();
  const refParam = params.get('ref') || '';
  const phoneParam = params.get('phone') || '';

  const [inputRef, setInputRef] = useState(refParam.toUpperCase());
  const [inputPhone, setInputPhone] = useState(phoneParam);
  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState('');

  const lookup = useCallback(async (ref: string, phone: string, silent = false) => {
    if (!ref.trim()) {
      setError('Vui lòng nhập mã booking');
      return;
    }
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại đã đặt xe');
      return;
    }
    if (!silent) setLoading(true);
    setError('');
    if (!silent) setData(null);
    try {
      const qs = new URLSearchParams({
        ref: ref.trim().toUpperCase(),
        phone: phone.trim(),
      });
      const res = await fetch(`/api/bookings?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Không tìm thấy');
      setData(json);
    } catch (e: unknown) {
      setError((e as Error).message || 'Lỗi tra cứu, thử lại sau');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (refParam && phoneParam) void lookup(refParam, phoneParam);
  }, [lookup, phoneParam, refParam]);

  useEffect(() => {
    if (!data?.requires_confirmation || !inputRef || !inputPhone) return;
    const timer = window.setInterval(() => {
      void lookup(inputRef, inputPhone, true);
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [data?.requires_confirmation, inputPhone, inputRef, lookup]);

  const transferContent = data ? `DATXE ${data.booking_ref}` : '';

  const copyTransferInfo = async () => {
    if (!data) return;
    const text = `Ngân hàng ${BANK_ID}\nSố tài khoản: ${BANK_ACCOUNT}\nChủ tài khoản: ${BANK_NAME}\nSố tiền: ${Number(data.deposit_amount).toLocaleString('vi-VN')}đ\nNội dung: ${transferContent}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setProofError('Không sao chép được. Vui lòng sao chép thủ công thông tin chuyển khoản.');
    }
  };

  const uploadProof = async () => {
    if (!data || !proofFile) return;
    setProofLoading(true);
    setProofError('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không đọc được ảnh'));
        reader.readAsDataURL(proofFile);
      });
      const res = await fetch('/api/bookings?action=upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_ref: data.booking_ref,
          phone: inputPhone.trim(),
          file_base64: base64,
          file_name: proofFile.name,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Không tải được ảnh chuyển khoản');
      setProofFile(null);
      await lookup(inputRef, inputPhone, true);
    } catch (e: unknown) {
      setProofError(e instanceof Error ? e.message : 'Không tải được ảnh chuyển khoản');
    } finally {
      setProofLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Tra cứu đơn đặt xe</h1>
            <p className="text-sm text-gray-500 mt-1">Nhập mã booking và số điện thoại đã đặt để xem thông tin chuyến thuê</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Mã booking
            </label>
            <div className="space-y-3">
              <input
                value={inputRef}
                onChange={e => setInputRef(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && void lookup(inputRef, inputPhone)}
                placeholder="CMOTTL250523-BW001"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
              <input
                type="tel"
                value={inputPhone}
                onChange={e => setInputPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void lookup(inputRef, inputPhone)}
                placeholder="Số điện thoại đã đặt xe"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
              <button
                onClick={() => void lookup(inputRef, inputPhone)}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50"
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
                  <p className="font-semibold text-slate-900">{data.phone_masked}</p>
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

              {data.requires_confirmation && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-bold">Car Match đang kiểm tra lịch và giờ bàn giao</p>
                  <p className="mt-1 text-xs leading-relaxed">Trang này tự cập nhật. Khi nhân viên xác nhận xe còn trống, mã QR đặt cọc sẽ xuất hiện ngay tại đây.</p>
                  <button
                    type="button"
                    onClick={() => void lookup(inputRef, inputPhone)}
                    disabled={loading}
                    className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                  >
                    {loading ? 'Đang kiểm tra…' : 'Kiểm tra lại trạng thái'}
                  </button>
                </div>
              )}

              {data.payment_required && BANK_ACCOUNT && (
                <div className="space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                  <div className="text-center">
                    <p className="font-bold text-slate-900">Đặt cọc để giữ xe</p>
                    <p className="mt-1 text-xs text-slate-500">Quét QR và chuyển đúng nội dung để Car Match đối soát nhanh.</p>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={buildVietQR(Number(data.deposit_amount), transferContent)}
                      alt="QR chuyển khoản đặt cọc"
                      className="h-56 w-56 rounded-xl border border-cyan-100 bg-white object-contain p-2"
                      width={224}
                      height={224}
                    />
                  </div>
                  <div className="space-y-2 rounded-xl border border-cyan-100 bg-white p-3 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Ngân hàng</span><strong>{BANK_ID}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Số tài khoản</span><strong className="font-mono">{BANK_ACCOUNT}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Chủ tài khoản</span><strong className="text-right">{BANK_NAME}</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Số tiền</span><strong className="text-cyan-700">{Number(data.deposit_amount).toLocaleString('vi-VN')}đ</strong></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Nội dung</span><strong className="font-mono text-blue-700">{transferContent}</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyTransferInfo()}
                    className="w-full rounded-xl border border-cyan-200 bg-white py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
                  >
                    {copied ? '✓ Đã sao chép thông tin' : 'Sao chép thông tin chuyển khoản'}
                  </button>
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-600">Gửi ảnh chuyển khoản để xác nhận nhanh hơn</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-100 file:px-3 file:py-2 file:font-semibold file:text-cyan-700"
                    />
                    {proofFile && (
                      <button
                        type="button"
                        onClick={() => void uploadProof()}
                        disabled={proofLoading}
                        className="mt-3 w-full rounded-lg bg-green-500 py-2.5 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        {proofLoading ? 'Đang gửi ảnh…' : 'Gửi ảnh chuyển khoản'}
                      </button>
                    )}
                    {proofError && <p className="mt-2 text-xs font-medium text-red-600">{proofError}</p>}
                  </div>
                </div>
              )}

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
