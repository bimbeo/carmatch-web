import { useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { ArrowRight, CalendarDays, Car, CheckCircle2, CircleDollarSign, Clock, Heart, MapPin, MessageCircle, ParkingCircle, Route, Share2, ShieldCheck } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { submitLead } from '@/hooks/useLeads';
import { useTravelContent } from '@/hooks/useTravelContent';
import { trackEvent } from '@/lib/analytics';
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
  trackEvent(event, {
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
  const relatedDestinations = destinations
    .filter((item) => item.slug !== destination.slug)
    .map((item) => ({
      destination: item,
      score:
        (item.region === destination.region ? 4 : 0) +
        Math.max(0, 3 - Math.floor(Math.abs(item.distanceKm - destination.distanceKm) / 70)) +
        (item.tags || []).filter((tag) => destination.tags?.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.destination);
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
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-slate-200 bg-[#f4f6fa]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="min-w-0 p-5 sm:p-9 lg:p-12">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link to="/di-dau" className="text-sm font-black text-brand-700 hover:text-brand-800">
                  ← Quay lại Đi đâu
                </Link>
                <p className="inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700 sm:px-4 sm:py-2 sm:text-sm">
                  {destination.region || 'Miền Bắc'} · {destination.duration}
                </p>
              </div>
              <h1 className="mt-5 max-w-4xl text-[2rem] font-black leading-[1.12] text-slate-950 sm:text-5xl sm:leading-[1.08] lg:text-[3.5rem]">
                Đi {destination.name} bằng xe tự lái: lịch trình, chi phí, xe phù hợp
              </h1>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-600 sm:text-lg sm:leading-8">{destination.summary}</p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mt-7 sm:p-4">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-black text-slate-900 sm:gap-2 sm:text-sm">
                  {destination.route.split('→').map((point, index, arr) => (
                    <span key={`${point}-${index}`} className="inline-flex items-center gap-1.5 sm:gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2">{point.trim()}</span>
                      {index < arr.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-brand-600 sm:h-4 sm:w-4" /> : null}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3 text-xs sm:mt-6 sm:py-4 sm:text-sm">
                <div className="pr-3">
                  <Route className="mb-2 h-4 w-4 text-brand-600 sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-black sm:text-base">{roundTripKm} km</p>
                  <p className="text-xs text-slate-500">hai chiều</p>
                </div>
                <div className="px-3">
                  <CircleDollarSign className="mb-2 h-4 w-4 text-brand-600 sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-black sm:text-base">{money(mobilityEstimate)}</p>
                  <p className="text-xs text-slate-500">di chuyển</p>
                </div>
                <div className="pl-3">
                  <CalendarDays className="mb-2 h-4 w-4 text-brand-600 sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-black sm:text-base">{destination.duration}</p>
                  <p className="text-xs text-slate-500">nên đi</p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <Link
                  to={`/lap-ke-hoach-chuyen-di/${destination.slug}?diem-den=${destination.slug}#trip-form`}
                  onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'trip_finder_hero' })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-brand-700 sm:px-6 sm:text-base"
                >
                  Tính chuyến đi này <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'zalo_hero' })}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700 sm:px-6 sm:text-base"
                >
                  Hỏi xe qua Zalo
                </a>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveDestination}
                  className={`inline-flex items-center justify-center rounded-full px-3.5 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 sm:px-4 sm:text-sm ${
                    isSaved ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-100 hover:text-brand-700'
                  }`}
                  aria-pressed={isSaved}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Đã lưu tuyến' : 'Lưu tuyến'}
                </button>
                <button
                  type="button"
                  onClick={handleShareDestination}
                  className="inline-flex items-center justify-center rounded-full bg-slate-50 px-3.5 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-100 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Chia sẻ
                </button>
                {shareState ? <span aria-live="polite" className="inline-flex items-center rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-700 sm:px-4 sm:text-sm">{shareState}</span> : null}
              </div>
            </div>

            <div
              className={`min-h-[360px] bg-gradient-to-br bg-cover bg-center sm:min-h-[440px] lg:min-h-[620px] ${destinationHeroClass(destination)}`}
              style={destinationImageStyle(destination)}
            >
              <div className="flex h-full min-h-[360px] items-end bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-4 text-white sm:min-h-[440px] sm:p-8 lg:min-h-[620px] lg:p-10">
                <div className="w-full rounded-2xl bg-slate-950/55 p-4 backdrop-blur-md ring-1 ring-white/20 sm:p-5">
                  <p className="text-[15px] font-bold text-white/75 sm:text-sm">Nắm nhanh trước khi đi</p>
                  <div className="mt-3 grid gap-3 sm:mt-4">
                    {[
                      ['Xe', destination.recommendedVehicle || 'Xe Car Match phù hợp'],
                      ['Đường đi', destination.drivingNote || 'Kiểm tra tuyến trước khi xuất phát'],
                      ['Đỗ xe', destination.parkingNote || 'Hỏi trước điểm gửi xe'],
                    ].map(([label, value]) => (
                      <div key={label} className="border-t border-white/15 pt-3 first:border-t-0 first:pt-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/60 sm:text-xs sm:tracking-[0.14em]">{label}</p>
                        <p className="mt-1 text-[15px] font-bold leading-6 sm:text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <nav aria-label="Điều hướng nhanh nội dung chuyến đi" className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 sm:py-3 lg:px-8 [&::-webkit-scrollbar]:hidden">
            {[
              ['Tổng quan', '#overview', Route],
              ['Chuẩn bị', '#checklist', CheckCircle2],
              ['Lịch trình', '#itinerary', CalendarDays],
              ['Chi phí & bản đồ', '#cost-map', CircleDollarSign],
              ['Hỏi xe', '#consultation', MessageCircle],
            ].map(([label, href, Icon]) => (
              <a
                key={label as string}
                href={href as string}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[13px] font-black text-slate-700 transition hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Icon className="h-4 w-4" />
                {label as string}
              </a>
            ))}
          </div>
        </nav>

        <section id="overview" className="scroll-mt-36 bg-white py-10 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Chọn đúng chuyến</p>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Tuyến này hợp với ai?</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{destination.ideal}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(destination.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-600 ring-1 ring-slate-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-black sm:text-2xl">Tóm tắt chuyến đi</h2>
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
                    <p className="mt-1 text-2xl font-black text-brand-900 sm:text-3xl">{money(mobilityEstimate)}</p>
                  <p className="mt-1 text-sm text-slate-600">Gồm xăng/sạc và cao tốc/phí đường, chưa gồm tiền thuê xe.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-[#f4f6fa]">
          <div className="mx-auto grid max-w-7xl md:grid-cols-3">
            <div className="p-6 sm:p-8">
              <Car className="h-7 w-7 text-brand-600" />
              <h2 className="mt-4 text-lg font-black sm:text-xl">Nên đi xe gì?</h2>
              <p className="mt-2 text-[15px] leading-7 text-slate-600 sm:text-base">{destination.recommendedVehicle}</p>
            </div>
            <div className="border-t border-slate-200 p-6 sm:p-8 md:border-l md:border-t-0">
              <ShieldCheck className="h-7 w-7 text-brand-600" />
              <h2 className="mt-4 text-lg font-black sm:text-xl">Lưu ý đường đi</h2>
              <p className="mt-2 text-[15px] leading-7 text-slate-600 sm:text-base">{destination.drivingNote}</p>
            </div>
            <div className="border-t border-slate-200 p-6 sm:p-8 md:border-l md:border-t-0">
              <ParkingCircle className="h-7 w-7 text-brand-600" />
              <h2 className="mt-4 text-lg font-black sm:text-xl">Chỗ đỗ xe</h2>
              <p className="mt-2 text-[15px] leading-7 text-slate-600 sm:text-base">{destination.parkingNote}</p>
            </div>
          </div>
        </section>

        <section id="checklist" className="scroll-mt-36 bg-slate-950 py-10 text-white sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-200 sm:text-sm sm:tracking-[0.2em]">Chuẩn bị trước chuyến</p>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Checklist để không bỏ sót việc quan trọng</h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-300 sm:text-base">
                Phần này lấy từ dữ liệu tuyến, xe gợi ý và lưu ý vận hành của Car Match. Chi phí và lịch xe vẫn cần xác nhận lại theo ngày đi thực tế.
              </p>
            </div>
            <div className="grid gap-3">
              {prepChecklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl bg-white/10 p-3.5 text-[15px] font-bold leading-6 text-slate-100 ring-1 ring-white/10 sm:p-4 sm:text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-200 sm:h-5 sm:w-5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="itinerary" className="scroll-mt-36 bg-white py-10 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black sm:text-2xl">Lịch trình gợi ý</h2>
            <div className="mt-6 space-y-5">
              {destination.schedule.map((day) => (
                <div key={day.title} className="rounded-2xl bg-slate-50 p-4 sm:rounded-3xl sm:p-5">
                  <h3 className="text-lg font-black">{day.title}</h3>
                  <ul className="mt-4 space-y-3 text-[15px] leading-6 text-slate-700 sm:text-base">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black sm:text-2xl">Ăn gì, chơi gì, dừng ở đâu?</h2>
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
                    <p className="mt-2 text-[15px] leading-6 text-slate-600 sm:text-base">{place.note}</p>
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

            <div id="cost-map" className="scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black sm:text-2xl">Bản đồ tuyến đi</h2>
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
              <p className="mt-3 text-sm font-semibold text-slate-500">Kiểm tra lại thời gian di chuyển và tình trạng giao thông sát giờ xuất phát.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black sm:text-2xl">Chi phí cần tính trước</h2>
              <div className="mt-5 divide-y divide-slate-100 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-black">Xăng/sạc</p>
                    <p className="text-sm text-slate-500">{roundTripKm} km ước tính 2 chiều</p>
                  </div>
                  <p className="font-black">{money(energyEstimate)}</p>
                </div>
                <div className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-black">Cao tốc/phí đường</p>
                    <p className="text-sm text-slate-500">Theo tuyến phổ biến</p>
                  </div>
                  <p className="font-black">{money(destination.tollEstimate)}</p>
                </div>
                <div className="flex items-center justify-between gap-4 bg-brand-50 p-4">
                  <div>
                    <p className="font-black">Tổng di chuyển</p>
                    <p className="text-sm text-slate-500">Chưa gồm tiền thuê xe và phát sinh riêng</p>
                  </div>
                  <p className="shrink-0 text-xl font-black sm:text-2xl">{money(mobilityEstimate)}</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-[#f4f6fa] py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <TravelAssistant pageType="destination" destinationSlug={destination.slug} destinationName={destination.name} />
          </div>
        </section>

        <section id="consultation" className="mx-auto max-w-7xl scroll-mt-36 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6 lg:p-8">
              <div>
                <CircleDollarSign className="h-8 w-8 text-brand-200" />
                <h2 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">Muốn biết xe nào còn trống cho tuyến này?</h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-300 sm:text-base">Mở Trip Finder để chọn ngày đi, số người, phong cách chuyến đi và gửi yêu cầu về Car Match.</p>
              </div>
              <Link
                to={`/lap-ke-hoach-chuyen-di/${destination.slug}?diem-den=${destination.slug}#trip-form`}
                onClick={() => trackGoWhereDetail('go_where_detail_cta_click', { destination: destination.slug, cta: 'trip_finder_bottom' })}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-bold text-slate-950 transition hover:bg-brand-50"
              >
                Mở Trip Finder <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            <form onSubmit={handleLeadSubmit} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="flex items-start gap-3 sm:items-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <MessageCircle className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.18em]">Tư vấn chuyến này</p>
                  <h2 className="text-xl font-black leading-tight sm:text-2xl">Để lại Zalo, Car Match báo xe phù hợp</h2>
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
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">SĐT/Zalo</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="09..."
                    autoComplete="tel"
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
                className="mt-5 w-full rounded-full bg-brand-600 px-6 py-3 font-black text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitState === 'submitting' ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
              </button>

              {submitState === 'done' ? (
                <p role="status" className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  Đã ghi nhận yêu cầu. Car Match sẽ phản hồi qua Zalo/SĐT.
                </p>
              ) : null}
              {submitState === 'error' ? (
                <p role="alert" className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  Chưa gửi được yêu cầu. Anh/chị thử lại hoặc nhắn trực tiếp qua Zalo.
                </p>
              ) : null}
            </form>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f4f6fa] py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Có thể phù hợp với bạn</p>
                <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">So sánh thêm các tuyến gần giống</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Các lựa chọn có thời gian, quãng đường hoặc phong cách chuyến đi gần với {destination.name}.
                </p>
              </div>
              <Link to="/di-dau#destinations" className="inline-flex shrink-0 items-center text-sm font-black text-brand-700 hover:text-brand-800">
                Xem tất cả điểm đến <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {relatedDestinations.map((item) => (
                <Link
                  key={item.slug}
                  to={`/di-dau/${item.slug}`}
                  onClick={() => trackGoWhereDetail('go_where_detail_related_click', { destination: destination.slug, related_destination: item.slug })}
                  className={`group relative min-h-[280px] overflow-hidden rounded-2xl bg-gradient-to-br bg-cover bg-center shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 ${destinationHeroClass(item)}`}
                  style={destinationImageStyle(item)}
                >
                  <div className="flex min-h-[280px] flex-col justify-between bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/10 p-5 text-white">
                    <span className="w-fit rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-950">
                      {item.region || 'Miền Bắc'} · {item.duration}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white/75">{item.distanceKm * 2} km hai chiều</p>
                      <h3 className="mt-2 text-xl font-black sm:text-2xl">Hà Nội → {item.name}</h3>
                      <p className="mt-3 inline-flex items-center text-sm font-black">
                        Xem tuyến này <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ZaloFAB />
    </div>
  );
}
