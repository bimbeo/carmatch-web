import { useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { ArrowRight, CalendarDays, Car, CheckCircle2, CircleDollarSign, Clock, Heart, MapPin, MessageCircle, ParkingCircle, Route, Share2, ShieldCheck } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { submitLead } from '@/hooks/useLeads';
import { useTravelContent } from '@/hooks/useTravelContent';
import { destinationHeroClass, destinationImageStyle } from '@/lib/travelMedia';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TravelAssistant from '../components/TravelAssistant';
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

function getSavedDestinations() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('carmatch_saved_destinations');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function isEmbeddableMapUrl(value?: string) {
  if (!value) return false;
  const url = extractGoogleMapsUrl(value);
  return /google\.com\/maps\/embed|output=embed/i.test(url || '');
}

function extractGoogleMapsUrl(value?: string) {
  if (!value) return '';
  const trimmed = value.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const rawUrl = srcMatch?.[1] || trimmed;
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = rawUrl;
    return textarea.value;
  } catch {
    return rawUrl;
  }
}

function RouteMapPreview({
  destinationName,
  mapUrl,
  roundTripKm,
}: {
  destinationName: string;
  mapUrl?: string;
  roundTripKm: number;
}) {
  const cleanMapUrl = extractGoogleMapsUrl(mapUrl);
  return (
    <div className="relative h-72 p-5">
      <div className="absolute inset-x-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20" />
      <div className="relative flex h-full flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
        <div className="rounded-2xl bg-white p-4 text-slate-950 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Xuất phát</p>
          <p className="mt-1 font-black">Hà Nội</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-brand-500 px-4 py-2 text-center text-sm font-black">
            {roundTripKm} km hai chiều
          </div>
          {cleanMapUrl ? (
            <a
              href={cleanMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-brand-50"
            >
              Mở Google Maps
            </a>
          ) : null}
        </div>
        <div className="rounded-2xl bg-white p-4 text-slate-950 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Điểm đến</p>
          <p className="mt-1 font-black">{destinationName}</p>
        </div>
      </div>
    </div>
  );
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
  const [shareState, setShareState] = useState('');
  const [savedSlugs, setSavedSlugs] = useState<string[]>(getSavedDestinations);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const roundTripKm = destination ? destination.distanceKm * 2 : 0;
  const energyEstimate = destination ? Math.round((roundTripKm * (destination.fuelCostPerKm || 1800)) / 1000) * 1000 : 0;
  const mobilityEstimate = destination ? energyEstimate + destination.tollEstimate : 0;

  useSEO({
    title: destination?.seoTitle || `Đi ${seoName} Bằng Xe Tự Lái`,
    description: destination?.seoDescription || `Gợi ý lịch trình đi ${seoName} từ Hà Nội: đường đi, chỗ đỗ, ăn chơi, chi phí di chuyển và loại xe Car Match phù hợp.`,
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
  const isSaved = savedSlugs.includes(destination.slug);
  const prepChecklist = destination.checklist?.length ? destination.checklist : [
    `Chọn xe: ${destination.recommendedVehicle || 'xe phù hợp theo số người và hành lý'}`,
    `Dự phòng chi phí di chuyển khoảng ${money(mobilityEstimate)} chưa gồm tiền thuê xe`,
    destination.drivingNote || 'Kiểm tra đường đi, tốc độ và điểm dừng nghỉ trước khi xuất phát',
    destination.parkingNote || 'Hỏi trước bãi đỗ tại điểm đến hoặc nơi lưu trú',
    'Chụp ảnh xe, giấy tờ và thống nhất giờ trả xe trước chuyến đi',
  ];

  const handleSaveDestination = () => {
    const nextSaved = isSaved ? savedSlugs.filter((item) => item !== destination.slug) : [...savedSlugs, destination.slug];
    setSavedSlugs(nextSaved);
    window.localStorage.setItem('carmatch_saved_destinations', JSON.stringify(nextSaved));
    trackGoWhereDetail('go_where_detail_save_click', { destination: destination.slug, saved: !isSaved });
  };

  const handleShareDestination = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `Đi ${destination.name} bằng xe tự lái cùng Car Match`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: destination.summary, url: shareUrl });
        setShareState('Đã mở chia sẻ tuyến.');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareState('Đã copy link tuyến.');
      }
      trackGoWhereDetail('go_where_detail_share_click', { destination: destination.slug });
    } catch {
      setShareState('Chưa chia sẻ được, bạn có thể copy link trên trình duyệt.');
    }
  };

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
      car_model: destination.recommendedVehicle || 'Xe Car Match phù hợp',
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
          <div className="mb-8 grid overflow-hidden rounded-[2.25rem] bg-white shadow-sm ring-1 ring-slate-100 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <Link to="/di-dau" className="text-sm font-black text-brand-700 hover:text-brand-800">
                ← Quay lại Đi đâu
              </Link>
              <p className="mt-8 inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-700">
                {destination.region || 'Miền Bắc'} · {destination.duration}
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Đi {destination.name} bằng xe tự lái: lịch trình, chi phí, xe phù hợp
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{destination.summary}</p>

              <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-900">
                  {destination.route.split('→').map((point, index, arr) => (
                    <span key={`${point}-${index}`} className="inline-flex items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">{point.trim()}</span>
                      {index < arr.length - 1 ? <ArrowRight className="h-4 w-4 text-brand-600" /> : null}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Route className="mb-2 h-5 w-5 text-brand-600" />
                  <p className="font-black">{roundTripKm} km</p>
                  <p className="text-slate-500">hai chiều</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <CircleDollarSign className="mb-2 h-5 w-5 text-brand-600" />
                  <p className="font-black">{money(mobilityEstimate)}</p>
                  <p className="text-slate-500">di chuyển</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <CalendarDays className="mb-2 h-5 w-5 text-brand-600" />
                  <p className="font-black">{destination.duration}</p>
                  <p className="text-slate-500">nên đi</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/lap-ke-hoach-chuyen-di/${destination.slug}?diem-den=${destination.slug}#trip-form`}
                  onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'trip_finder_hero' })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 font-black text-white shadow-sm transition hover:bg-brand-700"
                >
                  Tính chuyến đi này <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'zalo_hero' })}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Hỏi xe qua Zalo
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveDestination}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-black transition ${
                    isSaved ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-100 hover:text-brand-700'
                  }`}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Đã lưu tuyến' : 'Lưu tuyến'}
                </button>
                <button
                  type="button"
                  onClick={handleShareDestination}
                  className="inline-flex items-center justify-center rounded-full bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-100 transition hover:text-brand-700"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Chia sẻ
                </button>
                {shareState ? <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{shareState}</span> : null}
              </div>
            </div>

            <div
              className={`min-h-[500px] bg-gradient-to-br bg-cover bg-center ${destinationHeroClass(destination)}`}
              style={destinationImageStyle(destination)}
            >
              <div className="flex h-full items-end bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-6 text-white sm:p-8 lg:p-10">
                <div className="w-full rounded-[1.5rem] bg-white/12 p-5 backdrop-blur ring-1 ring-white/20">
                  <p className="text-sm font-bold text-white/75">Checklist trước khi đi</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      ['Xe', destination.recommendedVehicle || 'Xe Car Match phù hợp'],
                      ['Đường đi', destination.drivingNote || 'Kiểm tra tuyến trước khi xuất phát'],
                      ['Đỗ xe', destination.parkingNote || 'Hỏi trước điểm gửi xe'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-white/14 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/60">{label}</p>
                        <p className="mt-1 text-sm font-bold leading-6">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-black">Tuyến này hợp với ai?</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">{destination.ideal}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(destination.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-600 ring-1 ring-slate-100">
                    {tag}
                  </span>
                ))}
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

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid gap-5 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-600">Chuẩn bị trước chuyến</p>
              <h2 className="mt-2 text-3xl font-black">Checklist để không bỏ sót việc quan trọng</h2>
              <p className="mt-3 text-slate-600">
                Phần này lấy từ dữ liệu tuyến, xe gợi ý và lưu ý vận hành của Car Match. Chi phí và lịch xe vẫn cần xác nhận lại theo ngày đi thực tế.
              </p>
            </div>
            <div className="grid gap-3">
              {prepChecklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <span>{item}</span>
                </div>
              ))}
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
                  <div key={place.name} className="overflow-hidden rounded-2xl bg-slate-50">
                    {place.imageUrl ? <img src={place.imageUrl} alt={place.name} className="h-36 w-full object-cover" loading="lazy" /> : null}
                    <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-brand-700">{place.type}</p>
                        <h3 className="mt-1 text-lg font-black">{place.name}</h3>
                      </div>
                      {place.price ? <span className="text-sm font-bold text-slate-500">{place.price}</span> : null}
                    </div>
                    <p className="mt-2 text-slate-600">{place.note}</p>
                    <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
                      {place.openingHours ? <span>Giờ mở cửa: {place.openingHours}</span> : null}
                      {place.familyFit ? <span>Gia đình: {place.familyFit}</span> : null}
                      {place.parkingNote ? <span className="sm:col-span-2">Đỗ xe: {place.parkingNote}</span> : null}
                    </div>
                    {place.sourceUrl ? (
                      <a href={place.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-black text-brand-700">
                        Xem thêm
                      </a>
                    ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">Bản đồ tuyến đi</h2>
              <div className="mt-5 overflow-hidden rounded-3xl bg-slate-950 text-white">
                {destination.mapUrl && isEmbeddableMapUrl(destination.mapUrl) ? (
                  <iframe
                    title={`Bản đồ ${destination.name}`}
                    src={extractGoogleMapsUrl(destination.mapUrl)}
                    className="h-72 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <RouteMapPreview destinationName={destination.name} mapUrl={destination.mapUrl} roundTripKm={roundTripKm} />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Link Google Maps thường sẽ mở ở tab mới. Nếu muốn nhúng bản đồ trực tiếp, dùng link Embed từ Google Maps.
              </p>
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

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <TravelAssistant pageType="destination" destinationSlug={destination.slug} destinationName={destination.name} />
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white lg:p-8">
              <div>
                <CircleDollarSign className="h-8 w-8 text-brand-200" />
                <h2 className="mt-4 text-3xl font-black">Muốn biết xe nào còn trống cho tuyến này?</h2>
                <p className="mt-3 text-slate-300">Mở Trip Finder để chọn ngày đi, số người, phong cách chuyến đi và gửi yêu cầu về Car Match.</p>
              </div>
              <Link
                to={`/lap-ke-hoach-chuyen-di/${destination.slug}?diem-den=${destination.slug}#trip-form`}
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
                  <h2 className="text-2xl font-black">Để lại Zalo, Car Match báo xe phù hợp</h2>
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
                  Đã ghi nhận yêu cầu. Car Match sẽ phản hồi qua Zalo/SĐT.
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
