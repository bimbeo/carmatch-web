import { type FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  Car,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useTravelContent } from '@/hooks/useTravelContent';
import { trackEvent } from '@/lib/analytics';
import type { TripDestination } from '@/data/tripDestinations';
import { destinationHeroClass, destinationImageStyle } from '@/lib/travelMedia';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TravelAssistant from '../components/TravelAssistant';
import ZaloFAB from '../components/ZaloFAB';

const collectionIcons = [CalendarDays, Users, Car, Route, Clock];

const filters = [
  { label: 'Tất cả', match: () => true },
  { label: 'Trong ngày', match: (text: string) => text.includes('trong ngày') },
  { label: '2 ngày 1 đêm', match: (text: string) => text.includes('2 ngày 1 đêm') || text.includes('1-2 ngày') },
  { label: 'Gia đình', match: (text: string) => text.includes('gia đình') },
  { label: 'Xe 7 chỗ', match: (text: string) => text.includes('7 chỗ') },
  { label: 'Đường dài', match: (text: string) => text.includes('đường dài') || text.includes('3 ngày') },
  { label: 'Dễ lái', match: (text: string) => text.includes('dễ lái') },
];

const quickNeeds = ['Cuối tuần', 'Gia đình có trẻ em', 'Xe 7 chỗ', 'Đi trong ngày'];

const tripLengthOptions = [
  { value: 'day', label: 'Đi trong ngày' },
  { value: 'weekend', label: '2 ngày 1 đêm' },
  { value: 'long', label: '3 ngày 2 đêm' },
];

const weatherOptions = [
  { value: 'dry', label: 'Nắng ráo / mát mẻ' },
  { value: 'hot', label: 'Trời nắng nóng' },
  { value: 'rain', label: 'Có thể mưa' },
];

const vibeOptions = [
  { value: 'family', label: 'Gia đình có trẻ em' },
  { value: 'food', label: 'Ăn uống / cafe' },
  { value: 'resort', label: 'Nghỉ dưỡng nhẹ' },
  { value: 'explore', label: 'Khám phá / đường dài' },
];

function trackGoWhere(event: string, payload: Record<string, unknown> = {}) {
  trackEvent(event, {
    page_group: 'go_where',
    ...payload,
  });
}

function destinationSearchText(destination: TripDestination) {
  return [
    destination.name,
    destination.region,
    destination.summary,
    destination.seoTitle,
    destination.seoDescription,
    destination.duration,
    destination.ideal,
    destination.route,
    destination.recommendedVehicle,
    destination.drivingNote,
    destination.parkingNote,
    ...(destination.tags || []),
    ...(destination.stops || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function money(value: number) {
  return value.toLocaleString('vi-VN') + 'đ';
}

function estimateMobility(destination: TripDestination) {
  const roundTripKm = destination.distanceKm * 2;
  const energyEstimate = Math.round((roundTripKm * (destination.fuelCostPerKm || 1800)) / 1000) * 1000;
  return energyEstimate + destination.tollEstimate;
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

function tripFinderUrl(destination: TripDestination, params: { travelers?: number; length?: string; vibe?: string } = {}) {
  const search = new URLSearchParams();
  search.set('diem-den', destination.slug);
  if (params.travelers) search.set('so-nguoi', String(params.travelers));
  if (params.length) search.set('thoi-gian', params.length);
  if (params.vibe) search.set('phong-cach', params.vibe);
  return `/lap-ke-hoach-chuyen-di/${destination.slug}?${search.toString()}#trip-form`;
}

function scoreDestinationForNeed(
  destination: TripDestination,
  need: { travelers: number; length: string; weather: string; vibe: string }
) {
  const text = destinationSearchText(destination);
  let score = 0;
  const reasons: string[] = [];

  if (need.travelers >= 5 && (text.includes('7 chỗ') || text.includes('suv') || text.includes('gia đình'))) {
    score += 26;
    reasons.push('hợp nhóm đông/nhà có nhiều hành lý');
  }
  if (need.travelers <= 4 && (text.includes('5 chỗ') || destination.distanceKm <= 120)) {
    score += 14;
    reasons.push('đi 2-4 người khá gọn');
  }
  if (need.length === 'day' && (text.includes('trong ngày') || destination.distanceKm <= 100)) {
    score += 30;
    reasons.push('có thể đi gọn trong ngày');
  }
  if (need.length === 'weekend' && (text.includes('2 ngày 1 đêm') || text.includes('1-2 ngày'))) {
    score += 30;
    reasons.push('hợp lịch cuối tuần');
  }
  if (need.length === 'long' && (text.includes('3 ngày') || destination.distanceKm >= 180)) {
    score += 28;
    reasons.push('hợp chuyến dài ngày');
  }
  if (need.weather === 'rain' && !text.includes('đường đèo') && destination.distanceKm <= 170) {
    score += 14;
    reasons.push('ít rủi ro hơn khi thời tiết xấu');
  }
  if (need.weather === 'hot' && (text.includes('biển') || text.includes('nghỉ dưỡng') || destination.name.includes('Hạ Long') || destination.name.includes('Đại Lải'))) {
    score += 12;
    reasons.push('hợp nghỉ mát/đổi gió');
  }
  if (need.vibe === 'family' && text.includes('gia đình')) {
    score += 20;
    reasons.push('có tag gia đình');
  }
  if (need.vibe === 'food' && (text.includes('ăn uống') || text.includes('cafe') || text.includes('food'))) {
    score += 18;
    reasons.push('có điểm ăn uống/cafe');
  }
  if (need.vibe === 'resort' && (text.includes('resort') || text.includes('nghỉ dưỡng') || text.includes('2 ngày'))) {
    score += 18;
    reasons.push('hợp nghỉ dưỡng nhẹ');
  }
  if (need.vibe === 'explore' && (text.includes('khám phá') || text.includes('đường dài') || text.includes('xe gầm cao'))) {
    score += 18;
    reasons.push('hợp nhóm thích khám phá');
  }

  score += Math.max(0, 12 - Math.floor(destination.distanceKm / 60));

  return {
    destination,
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 3),
  };
}

function destinationCard(destination: TripDestination, index: number, source: string) {
  return (
    <article
      key={destination.slug}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <Link
        to={`/di-dau/${destination.slug}`}
        onClick={() => trackGoWhere('go_where_card_click', { source, destination: destination.slug, action: 'hero_image' })}
        className={`relative block h-48 overflow-hidden bg-gradient-to-br bg-cover bg-center ${destinationHeroClass(destination)}`}
        style={destinationImageStyle(destination)}
        aria-label={`Xem guide ${destination.name}`}
      >
        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
          #{index + 1} gợi ý
        </div>
        <div className="flex h-full items-end bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent p-5 text-white transition duration-300 group-hover:bg-slate-950/10">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-white/85">
              <MapPin className="h-4 w-4" />
              {destination.region || 'Miền Bắc'}
            </p>
            <h3 className="mt-1 text-2xl font-black">{destination.name}</h3>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="min-h-[4rem] text-sm leading-6 text-slate-600">{destination.summary}</p>

        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3 text-xs sm:py-4 sm:text-sm">
          <div className="pr-3">
            <Route className="mb-2 h-4 w-4 text-brand-600" />
            <p className="font-black">{destination.distanceKm} km</p>
            <p className="text-xs text-slate-500">một lượt</p>
          </div>
          <div className="px-2 sm:px-3">
            <Clock className="mb-2 h-4 w-4 text-brand-600" />
            <p className="font-black">{destination.duration}</p>
            <p className="text-xs text-slate-500">nên đi</p>
          </div>
          <div className="pl-2 sm:pl-3">
            <Wallet className="mb-2 h-4 w-4 text-brand-600" />
            <p className="font-black">{money(estimateMobility(destination))}</p>
            <p className="text-xs text-slate-500">di chuyển</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-brand-50 p-3.5 sm:p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Xe phù hợp</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{destination.recommendedVehicle || 'Xe Car Match phù hợp'}</p>
        </div>

        <div className="mt-auto flex gap-3 pt-5">
          <Link
            to={`/di-dau/${destination.slug}`}
            onClick={() => trackGoWhere('go_where_card_click', { source, destination: destination.slug, action: 'view_guide' })}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            Xem guide
          </Link>
          <Link
            to={tripFinderUrl(destination)}
            onClick={() => trackGoWhere('go_where_card_click', { source, destination: destination.slug, action: 'calculate_cost' })}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
          >
            Tính chi phí
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function GoWhere() {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [travelers, setTravelers] = useState(4);
  const [tripLength, setTripLength] = useState('weekend');
  const [weather, setWeather] = useState('dry');
  const [vibe, setVibe] = useState('family');
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [savedSlugs] = useState<string[]>(getSavedDestinations);
  const { destinations, collections } = useTravelContent();

  useSEO({
    title: 'Đi Đâu Bằng Xe Quanh Hà Nội',
    description:
      'Gợi ý điểm đi chơi, ăn uống và du lịch gần Hà Nội kèm lịch trình, chi phí di chuyển và loại xe tự lái phù hợp từ Car Match.',
    canonical: 'https://www.carmatch.vn/di-dau',
  });

  const featuredDestinations = useMemo(() => destinations.slice(0, 4), [destinations]);

  const visibleDestinations = useMemo(() => {
    const selected = filters.find((filter) => filter.label === activeFilter) || filters[0];
    const normalizedQuery = query.trim().toLowerCase();

    return destinations.filter((destination) => {
      const text = destinationSearchText(destination);
      const matchesFilter = selected.match(text);
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query, destinations]);

  const heroDestination = destinations[0];
  const savedDestinations = useMemo(
    () => savedSlugs.map((slug) => destinations.find((destination) => destination.slug === slug)).filter(Boolean) as TripDestination[],
    [destinations, savedSlugs]
  );
  const personalizedDestinations = useMemo(() => {
    return destinations
      .map((destination) => scoreDestinationForNeed(destination, { travelers, length: tripLength, weather, vibe }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [destinations, travelers, tripLength, weather, vibe]);
  const displayedDestinations = showAllDestinations ? visibleDestinations : visibleDestinations.slice(0, 6);
  const hasActiveDestinationFilters = activeFilter !== 'Tất cả' || Boolean(query.trim());

  function jumpToDestinations() {
    document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submitDestinationSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowAllDestinations(false);
    trackGoWhere('go_where_search_submit', { query: query.trim(), results: visibleDestinations.length });
    jumpToDestinations();
  }

  function resetDestinationFilters() {
    setQuery('');
    setActiveFilter('Tất cả');
    setShowAllDestinations(false);
    trackGoWhere('go_where_filter_reset');
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-slate-200 bg-[#f4f6fa]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="flex min-w-0 flex-col justify-center p-5 sm:p-9 lg:p-12">
                <p className="inline-flex w-fit rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700 sm:px-4 sm:py-2 sm:text-sm">
                  Car Match Đi đâu
                </p>
                <h1 className="mt-5 max-w-3xl text-[2.1rem] font-black leading-[1.12] text-slate-950 sm:text-5xl sm:leading-[1.08] lg:text-[3.5rem]">
                  Chọn điểm đi chơi quanh Hà Nội, tính luôn xe và chi phí.
                </h1>
                <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  Khám phá tuyến phù hợp theo số người, thời gian, đường đi và loại xe. Mỗi điểm đến đều có lịch trình, chi phí di chuyển, lưu ý lái xe và form hỏi xe nhanh.
                </p>

                <form onSubmit={submitDestinationSearch} className="mt-6 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 sm:mt-7 sm:p-3">
                  <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-brand-200 sm:gap-3 sm:px-4 sm:py-3">
                    <Search className="h-5 w-5 shrink-0 text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setShowAllDestinations(false);
                      }}
                      className="min-w-0 w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Tìm: Hạ Long, cuối tuần, xe 7 chỗ..."
                      aria-label="Tìm điểm đến theo nhu cầu"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setShowAllDestinations(false);
                        }}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                        aria-label="Xóa nội dung tìm kiếm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      className="inline-flex shrink-0 rounded-full bg-slate-950 px-3.5 py-2 text-sm font-black text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 sm:px-5"
                    >
                      Tìm
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickNeeds.map((need) => {
                      const isActive = query.trim().toLowerCase() === need.toLowerCase();
                      return (
                        <button
                          key={need}
                          type="button"
                          onClick={() => {
                            setQuery(need.toLowerCase());
                            setShowAllDestinations(false);
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 sm:py-2 ${
                            isActive
                              ? 'border-brand-200 bg-brand-50 text-brand-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700'
                          }`}
                          aria-pressed={isActive}
                        >
                          {need}
                        </button>
                      );
                    })}
                  </div>
                </form>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/lap-ke-hoach-chuyen-di#trip-form"
                    onClick={() => trackGoWhere('go_where_cta_click', { cta: 'hero_trip_finder' })}
                    className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-brand-700 sm:px-6 sm:py-3.5 sm:text-base"
                  >
                    Lập kế hoạch chuyến đi <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <a
                    href="#collections"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700 sm:px-6 sm:py-3.5 sm:text-base"
                  >
                    Xem chủ đề gợi ý
                  </a>
                </div>
              </div>

              <div
                className={`min-h-[400px] bg-gradient-to-br bg-cover bg-center lg:min-h-[560px] ${heroDestination ? destinationHeroClass(heroDestination) : ''}`}
                style={heroDestination ? destinationImageStyle(heroDestination) : undefined}
              >
                <div className="flex h-full min-h-[400px] flex-col justify-end bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-5 text-white sm:p-8 lg:min-h-[560px] lg:p-10">
                  <div className="max-w-md rounded-2xl bg-slate-950/55 p-4 backdrop-blur-md ring-1 ring-white/20 sm:p-5">
                    <p className="text-[15px] font-bold text-white/75 sm:text-sm">Tuyến nổi bật</p>
                    <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Hà Nội → {heroDestination?.name || 'Hạ Long'}</h2>
                    <div className="mt-4 grid grid-cols-3 divide-x divide-white/20 rounded-xl bg-white/10 py-3 text-xs sm:mt-5 sm:text-sm">
                      <div className="px-2 sm:px-3">
                        <Route className="mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <p className="font-black">{heroDestination ? heroDestination.distanceKm * 2 : 380} km</p>
                        <p className="mt-0.5 text-xs text-white/60">hai chiều</p>
                      </div>
                      <div className="px-2 sm:px-3">
                        <CalendarDays className="mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <p className="font-black">{heroDestination?.duration || '2 ngày'}</p>
                        <p className="mt-0.5 text-xs text-white/60">nên đi</p>
                      </div>
                      <div className="px-2 sm:px-3">
                        <Wallet className="mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <p className="font-black">{heroDestination ? money(estimateMobility(heroDestination)) : '1.1tr'}</p>
                        <p className="mt-0.5 text-xs text-white/60">di chuyển</p>
                      </div>
                    </div>
                    {heroDestination ? (
                      <Link
                        to={`/di-dau/${heroDestination.slug}`}
                        className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-brand-50"
                      >
                        Xem tuyến này <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl md:grid-cols-3">
            {[
              ['Chọn tuyến', 'Xem nhanh quãng đường, thời gian, điểm dừng và mức độ phù hợp.', Compass],
              ['Tính xe', 'Ước tính loại xe, chi phí xăng/sạc, phí đường và ngày thuê.', Car],
              ['Gửi yêu cầu', 'Chuyển kế hoạch thành lead Zalo để Car Match kiểm tra xe thật.', ShieldCheck],
            ].map(([title, desc, Icon], index) => (
              <div
                key={title as string}
                className={`flex gap-4 px-5 py-6 sm:px-6 lg:px-8 ${index > 0 ? 'border-t border-slate-200 md:border-l md:border-t-0' : ''}`}
              >
                <Icon className="h-6 w-6 shrink-0 text-brand-600" />
                <div>
                  <h2 className="text-base font-black">{title as string}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{desc as string}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Tuyến đang được quan tâm</p>
                <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Chọn nhanh theo hành trình</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Xem trước thời gian, quãng đường và chi phí di chuyển của những tuyến được quan tâm nhiều.
                </p>
              </div>
              <Link to="/lap-ke-hoach-chuyen-di#trip-form" className="hidden shrink-0 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700 sm:inline-flex">
                Tự tính chuyến riêng
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featuredDestinations.map((destination, index) => (
                <Link
                  key={destination.slug}
                  to={`/di-dau/${destination.slug}`}
                  onClick={() => trackGoWhere('go_where_featured_route_click', { destination: destination.slug })}
                  className={`group relative min-h-[260px] overflow-hidden rounded-2xl bg-cover bg-center shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lg ${destinationHeroClass(destination)}`}
                  style={destinationImageStyle(destination)}
                >
                  <div className="flex min-h-[260px] flex-col justify-between bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/10 p-5 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-950">0{index + 1}</span>
                      <span className="rounded-full bg-slate-950/45 px-3 py-1 text-xs font-black backdrop-blur">{money(estimateMobility(destination))}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/75">{destination.duration} · {destination.distanceKm * 2} km hai chiều</p>
                      <h3 className="mt-2 text-xl font-black sm:text-2xl">Hà Nội → {destination.name}</h3>
                      <p className="mt-3 flex items-center gap-2 text-sm font-black">
                        Xem lộ trình <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {savedDestinations.length ? (
          <section className="border-y border-brand-100 bg-brand-50/60 py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Tuyến đã lưu</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Các chuyến bạn đang cân nhắc</h2>
                </div>
                <Link to="/lap-ke-hoach-chuyen-di#trip-form" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">
                  Lập kế hoạch từ tuyến đã lưu
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {savedDestinations.slice(0, 6).map((destination) => (
                  <Link
                    key={destination.slug}
                    to={`/di-dau/${destination.slug}`}
                    className="rounded-xl border border-brand-100 bg-white p-4 transition hover:border-brand-200"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-700">{destination.region || 'Miền Bắc'}</p>
                    <h3 className="mt-2 text-xl font-black">{destination.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{destination.duration} · {money(estimateMobility(destination))} di chuyển</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-slate-950 py-12 text-white sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
            <div>
              <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-brand-100 ring-1 ring-white/15">
                Gợi ý theo nhu cầu
              </p>
              <h2 className="mt-5 text-2xl font-black leading-tight sm:text-4xl">Cuối tuần này nhà mình nên đi đâu?</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-300 sm:text-sm sm:leading-6">
                Chọn nhanh số người, thời gian và gu chuyến đi. Car Match sẽ xếp hạng các tuyến đang có dữ liệu, kèm lý do và chi phí di chuyển ước tính.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">Số người</span>
                  <select
                    value={travelers}
                    onChange={(event) => setTravelers(Number(event.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none"
                  >
                    {[2, 3, 4, 5, 6, 7].map((value) => (
                      <option key={value} value={value}>{value} người</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">Thời gian</span>
                  <select
                    value={tripLength}
                    onChange={(event) => setTripLength(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none"
                  >
                    {tripLengthOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">Thời tiết</span>
                  <select
                    value={weather}
                    onChange={(event) => setWeather(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none"
                  >
                    {weatherOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">Gu chuyến đi</span>
                  <select
                    value={vibe}
                    onChange={(event) => setVibe(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none"
                  >
                    {vibeOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-3">
              {personalizedDestinations.map(({ destination, reasons }, index) => (
                <article key={destination.slug} className="rounded-2xl bg-white p-4 text-slate-950 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-700">Gợi ý #{index + 1}</p>
                      <h3 className="mt-1 text-lg font-black sm:text-2xl">Hà Nội → {destination.name}</h3>
                      <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500 sm:text-sm">
                        {destination.duration} · {destination.distanceKm * 2} km hai chiều · {money(estimateMobility(destination))} di chuyển
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(reasons.length ? reasons : ['phù hợp dữ liệu hiện có']).map((reason) => (
                          <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        to={`/di-dau/${destination.slug}`}
                        className="rounded-full border border-slate-200 px-3.5 py-2.5 text-sm font-black text-slate-900 hover:border-brand-200 hover:text-brand-700 sm:px-4 sm:py-3"
                      >
                        Xem guide
                      </Link>
                      <Link
                        to={tripFinderUrl(destination, { travelers, length: tripLength, vibe })}
                        className="rounded-full bg-brand-600 px-3.5 py-2.5 text-sm font-black text-white hover:bg-brand-700 sm:px-4 sm:py-3"
                      >
                        Tính chuyến
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="collections" className="scroll-mt-24 border-b border-slate-200 bg-[#f4f6fa] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Chủ đề du lịch</p>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Duyệt như một bộ sưu tập chuyến đi</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Chọn theo thời gian, nhóm đi và loại xe trước khi đi sâu vào từng điểm đến.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections.slice(0, 6).map((item, index) => {
                const Icon = collectionIcons[index % collectionIcons.length];
                const count = item.destinationSlugs?.length || 0;
                return (
                  <Link
                    key={item.slug}
                    to={`/di-dau/chu-de/${item.slug}`}
                    onClick={() => trackGoWhere('go_where_collection_click', { collection: item.slug })}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{count} điểm</span>
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-brand-600">{item.eyebrow}</p>
                    <h3 className="mt-2 text-xl font-black leading-tight sm:text-2xl">{item.title}</h3>
                    <p className="mt-3 min-h-[4rem] text-sm leading-6 text-slate-600">{item.description}</p>
                    <p className="mt-5 inline-flex items-center text-sm font-black text-slate-950 group-hover:text-brand-700">
                      Mở bộ sưu tập <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="destinations" className="scroll-mt-24 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Tất cả điểm đến</p>
                <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">So sánh nhanh trước khi chọn xe</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Lọc theo lịch đi và nhu cầu, sau đó mở guide để xem lịch trình chi tiết.
                </p>
              </div>
              <label className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-sm focus-within:border-brand-200 focus-within:ring-2 focus-within:ring-brand-100">
                <Search className="h-5 w-5 shrink-0" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowAllDestinations(false);
                  }}
                  className="min-w-0 w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Tìm theo nhu cầu: gia đình, xe 7 chỗ, đi trong ngày..."
                  aria-label="Tìm trong tất cả điểm đến"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setShowAllDestinations(false);
                    }}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    aria-label="Xóa nội dung tìm kiếm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </label>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {filters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter.label);
                    setShowAllDestinations(false);
                    trackGoWhere('go_where_filter_click', { filter: filter.label });
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 sm:px-4 sm:text-sm ${
                    activeFilter === filter.label ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-700'
                  }`}
                  aria-pressed={activeFilter === filter.label}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-500" aria-live="polite">
                Đang hiển thị {displayedDestinations.length} trong {visibleDestinations.length} điểm đến phù hợp.
              </p>
              {hasActiveDestinationFilters ? (
                <button
                  type="button"
                  onClick={resetDestinationFilters}
                  className="inline-flex items-center gap-1.5 text-sm font-black text-brand-700 transition hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                >
                  <X className="h-4 w-4" />
                  Xóa bộ lọc
                </button>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {displayedDestinations.map((destination, index) => destinationCard(destination, index, 'destination_grid'))}
            </div>

            {visibleDestinations.length > 6 ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAllDestinations((current) => !current);
                    if (showAllDestinations) jumpToDestinations();
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 sm:px-6 sm:text-base"
                >
                  {showAllDestinations ? 'Thu gọn danh sách' : `Xem thêm ${visibleDestinations.length - displayedDestinations.length} điểm đến`}
                  <ChevronRight className={`ml-2 h-5 w-5 transition ${showAllDestinations ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              </div>
            ) : null}

            {visibleDestinations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-brand-600" />
                <h3 className="mt-3 text-xl font-black">Chưa có điểm đến phù hợp</h3>
                <p className="mt-2 text-slate-600">Bạn có thể dùng Trip Finder để Car Match gợi ý xe và lịch trình theo điểm đến riêng.</p>
                <Link
                  to="/lap-ke-hoach-chuyen-di#trip-form"
                  className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-3 font-black text-white"
                >
                  Lập kế hoạch riêng
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f4f6fa] py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <TravelAssistant pageType="go_where" />
          </div>
        </section>
      </main>

      <Footer />
      <ZaloFAB />
    </div>
  );
}
