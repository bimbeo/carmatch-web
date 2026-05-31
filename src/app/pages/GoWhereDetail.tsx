import { useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { ArrowRight, Car, CircleDollarSign, Clock, MapPin, MessageCircle, ParkingCircle, Route, ShieldCheck } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { submitLead } from '@/hooks/useLeads';
import { useTravelContent } from '@/hooks/useTravelContent';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

const ZALO_LINK = 'https://zalo.me/0975563290';

function money(value: number) {
  return value.toLocaleString('vi-VN') + 'đ';
}

function trackGoWhereDetail(event: string, payload: Record<string, unknown> = {}) {
  const trackedWindow = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  trackedWindow.dataLayer = trackedWindow.dataLayer || [];
  trackedWindow.dataLayer.push({
    event,
    page_group: 'go_where_detail',
    ...payload,
  });
}

export default function GoWhereDetail() {
  const { slug } = useParams();
  const { destinations, loading } = useTravelContent();
  const destination = destinations.find((item) => item.slug === slug);
  const seoName = destination?.name || 'đi chơi quanh Hà Nội';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [needType, setNeedType] = useState('Tự lái');
  const [note, setNote] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const roundTripKm = destination ? destination.distanceKm * 2 : 0;
  const energyEstimate = destination ? Math.round((roundTripKm * (destination.fuelCostPerKm || 1800)) / 1000) * 1000 : 0;
  const mobilityEstimate = destination ? energyEstimate + destination.tollEstimate : 0;

  useSEO({
    title: `Đi ${seoName} Bằng Xe Tự Lái`,
    description: `Gợi ý lịch trình đi ${seoName} từ Hà Nội: đường đi, chỗ đỗ, ăn chơi, chi phí di chuyển và loại xe CarMatch phù hợp.`,
    canonical: `https://www.carmatch.vn/di-dau/${destination?.slug || ''}`,
  });

  if (!destination && loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
        <Navbar />
        <main className="pt-32">
          <div className="mx-auto max-w-7xl px-4 text-sm font-bold text-slate-500 sm:px-6 lg:px-8">Đang tải dữ liệu...</div>
        </main>
      </div>
    );
  }

  if (!destination) return <Navigate to="/di-dau" replace />;

  const zaloMessage = encodeURIComponent(
    `[DI DAU]\nĐiểm đến: ${destination.name}\nNhu cầu: ${needType}\nNgày đi: ${travelDate || 'Chưa chọn'}\nTên: ${name || ''}\nSĐT: ${phone || ''}\nGhi chú: ${note || ''}`
  );

  const handleLeadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSubmitState('submitting');
    trackGoWhereDetail('go_where_lead_submit_attempt', { destination: destination.slug, need_type: needType });

    const leadNote = [
      '[DI DAU DETAIL]',
      `Điểm đến: ${destination.name}`,
      `Tuyến: ${destination.route}`,
      `Nhu cầu: ${needType}`,
      `Ngày đi dự kiến: ${travelDate || 'Chưa chọn'}`,
      `Chi phí di chuyển ước tính: ${money(mobilityEstimate)}`,
      `Xe gợi ý: ${destination.recommendedVehicle || 'Chưa có'}`,
      `Ghi chú khách: ${note || 'Không có'}`,
    ].join('\n');

    const result = await submitLead({
      source: 'b2b',
      name: name.trim(),
      phone: phone.trim(),
      customer_type: 'travel_lead',
      form_type: 'di_dau_detail',
      quantity: needType,
      duration: travelDate || destination.duration,
      car_model: destination.recommendedVehicle || 'Xe CarMatch phù hợp',
      building: destination.name,
      note: leadNote,
    });

    setSubmitState(result.ok ? 'done' : 'error');
    trackGoWhereDetail(result.ok ? 'go_where_lead_submit_success' : 'go_where_lead_submit_error', {
      destination: destination.slug,
      need_type: needType,
    });

    if (result.ok) {
      window.open(`${ZALO_LINK}?text=${zaloMessage}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <Navbar />

      <main className="pt-24">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <Link to="/di-dau" className="text-sm font-bold text-brand-700 hover:text-brand-800">
                ← Quay lại Đi đâu
              </Link>
              <p className="mt-6 inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                {destination.region || 'Miền Bắc'} · {destination.duration}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Đi {destination.name} bằng xe tự lái: lịch trình, chi phí, xe phù hợp
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">{destination.summary}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/lap-ke-hoach-chuyen-di/${destination.slug}#trip-form`}
                  onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'trip_finder_top' })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Tính chuyến đi này <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'zalo_top' })}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Hỏi xe qua Zalo
                </a>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Tóm tắt chuyến đi</h2>
              <div className="mt-5 grid gap-3">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <Route className="mt-1 h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Tuyến</p>
                    <p className="font-bold">{destination.route}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <MapPin className="mb-2 h-5 w-5 text-brand-600" />
                    <p className="text-sm text-slate-500">Quãng đường</p>
                    <p className="font-black">{roundTripKm} km 2 chiều</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Clock className="mb-2 h-5 w-5 text-brand-600" />
                    <p className="text-sm text-slate-500">Nên đi</p>
                    <p className="font-black">{destination.duration}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-brand-50 p-4">
                  <p className="text-sm font-semibold text-brand-700">Chi phí di chuyển ước tính</p>
                  <p className="mt-1 text-3xl font-black text-brand-900">{money(mobilityEstimate)}</p>
                  <p className="mt-1 text-sm text-slate-600">Gồm xăng/sạc và cao tốc/phí đường, chưa gồm tiền thuê xe.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <Car className="h-7 w-7 text-brand-600" />
              <h2 className="mt-4 text-xl font-black">Nên đi xe gì?</h2>
              <p className="mt-2 text-slate-600">{destination.recommendedVehicle}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <ShieldCheck className="h-7 w-7 text-brand-600" />
              <h2 className="mt-4 text-xl font-black">Lưu ý đường đi</h2>
              <p className="mt-2 text-slate-600">{destination.drivingNote}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <ParkingCircle className="h-7 w-7 text-brand-600" />
              <h2 className="mt-4 text-xl font-black">Chỗ đỗ xe</h2>
              <p className="mt-2 text-slate-600">{destination.parkingNote}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 pb-12">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Lịch trình gợi ý</h2>
            <div className="mt-6 space-y-5">
              {destination.schedule.map((day) => (
                <div key={day.title} className="rounded-3xl bg-slate-50 p-5">
                  <h3 className="text-lg font-black">{day.title}</h3>
                  <ul className="mt-4 space-y-3 text-slate-700">
                    {day.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Ăn gì, chơi gì, dừng ở đâu?</h2>
              <div className="mt-5 grid gap-3">
                {(destination.nearbyPlaces || []).map((place) => (
                  <div key={place.name} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-brand-700">{place.type}</p>
                        <h3 className="mt-1 text-lg font-black">{place.name}</h3>
                      </div>
                      {place.price ? <span className="text-sm font-bold text-slate-500">{place.price}</span> : null}
                    </div>
                    <p className="mt-2 text-slate-600">{place.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Chi phí cần tính trước</h2>
              <div className="mt-5 divide-y divide-slate-100 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-black">Xăng/sạc</p>
                    <p className="text-sm text-slate-500">{roundTripKm} km ước tính 2 chiều</p>
                  </div>
                  <p className="font-black">{money(energyEstimate)}</p>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-black">Cao tốc/phí đường</p>
                    <p className="text-sm text-slate-500">Theo tuyến phổ biến</p>
                  </div>
                  <p className="font-black">{money(destination.tollEstimate)}</p>
                </div>
                <div className="flex items-center justify-between bg-brand-50 p-4">
                  <div>
                    <p className="font-black">Tổng di chuyển</p>
                    <p className="text-sm text-slate-500">Chưa gồm tiền thuê xe và phát sinh riêng</p>
                  </div>
                  <p className="text-2xl font-black">{money(mobilityEstimate)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white lg:p-8">
              <div>
                <CircleDollarSign className="h-8 w-8 text-brand-200" />
                <h2 className="mt-4 text-3xl font-black">Muốn biết xe nào còn trống cho tuyến này?</h2>
                <p className="mt-3 text-slate-300">Mở Trip Finder để chọn ngày đi, số người, phong cách chuyến đi và gửi yêu cầu về CarMatch.</p>
              </div>
              <Link
                to={`/lap-ke-hoach-chuyen-di/${destination.slug}#trip-form`}
                onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'trip_finder_bottom' })}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-bold text-slate-950 transition hover:bg-brand-50"
              >
                Mở Trip Finder <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <form onSubmit={handleLeadSubmit} className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-sm lg:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <MessageCircle className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Tư vấn chuyến này</p>
                  <h2 className="text-2xl font-black">Để lại Zalo, CarMatch báo xe phù hợp</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Tên của anh/chị</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="VD: Anh Hưng"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">SĐT/Zalo</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="09..."
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Ngày đi dự kiến</span>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(event) => setTravelDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Nhu cầu</span>
                  <select
                    value={needType}
                    onChange={(event) => setNeedType(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  >
                    <option>Tự lái</option>
                    <option>Có lái</option>
                    <option>Taxi/đưa đón</option>
                    <option>Chưa rõ, cần tư vấn</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Ghi chú thêm</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  placeholder="VD: Đi 5 người, cần xe 7 chỗ, nhận xe ở Ocean Park..."
                />
              </label>

              <button
                type="submit"
                disabled={submitState === 'submitting'}
                className="mt-5 w-full rounded-full bg-brand-600 px-6 py-3 font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitState === 'submitting' ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
              </button>

              {submitState === 'done' ? (
                <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  Đã ghi nhận yêu cầu. CarMatch sẽ phản hồi qua Zalo/SĐT.
                </p>
              ) : null}
              {submitState === 'error' ? (
                <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  Chưa gửi được yêu cầu. Anh/chị thử lại hoặc nhắn trực tiếp qua Zalo.
                </p>
              ) : null}
            </form>
          </div>
        </section>
      </main>

      <Footer />
      <ZaloFAB />
    </div>
  );
}
