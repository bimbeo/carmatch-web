import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, Car, Clock, MapPin, Route, Search, Users } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useTravelContent } from '@/hooks/useTravelContent';
import type { TripDestination } from '@/data/tripDestinations';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

function trackGoWhere(event: string, payload: Record<string, unknown> = {}) {
  const trackedWindow = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  trackedWindow.dataLayer = trackedWindow.dataLayer || [];
  trackedWindow.dataLayer.push({
    event,
    page_group: 'go_where',
    ...payload,
  });
}

function destinationSearchText(destination: TripDestination) {
  return [
    destination.name,
    destination.region,
    destination.summary,
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

export default function GoWhere() {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const { destinations, collections, source } = useTravelContent();

  useSEO({
    title: 'Đi Đâu Bằng Xe Quanh Hà Nội',
    description:
      'Gợi ý điểm đi chơi, ăn uống và du lịch gần Hà Nội kèm lịch trình, chi phí di chuyển và loại xe tự lái phù hợp từ CarMatch.',
    canonical: 'https://www.carmatch.vn/di-dau',
  });

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

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <Navbar />

      <main className="pt-24">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                CarMatch Đi Đâu
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Đi đâu, đi xe gì, hết bao nhiêu?
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Một phễu nội dung mới cho CarMatch: gợi ý điểm ăn chơi, lịch trình cuối tuần và tính luôn xe phù hợp để khách chuyển sang đặt xe nhanh hơn.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/lap-ke-hoach-chuyen-di#trip-form"
                  onClick={() => trackGoWhere('go_where_cta_click', { cta: 'hero_trip_finder' })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Lập kế hoạch chuyến đi <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="#destinations"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
                >
                  Xem điểm đến
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
              <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
                <div className="flex items-center gap-3 text-sm font-semibold text-brand-100">
                  <Route className="h-5 w-5" />
                  Mẫu hành trình đang nổi bật
                </div>
                <h2 className="mt-5 text-3xl font-black">Hà Nội → Hạ Long</h2>
                <p className="mt-3 text-slate-300">2 ngày 1 đêm, xe 7 chỗ, gia đình 4-6 người.</p>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-slate-300">Quãng đường</p>
                    <p className="mt-1 font-black">320 km</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-slate-300">Cao tốc</p>
                    <p className="mt-1 font-black">450k</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-slate-300">Xe gợi ý</p>
                    <p className="mt-1 font-black">7 chỗ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid gap-4 md:grid-cols-3">
            {collections.slice(0, 5).map((item, index) => {
              const Icon = collectionIcons[index % collectionIcons.length];
              return (
                <Link
                  key={item.slug}
                  to={`/di-dau/chu-de/${item.slug}`}
                  onClick={() => trackGoWhere('go_where_collection_click', { collection: item.slug })}
                  className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Icon className="h-7 w-7 text-brand-600" />
                  <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-brand-600">{item.eyebrow}</p>
                  <h2 className="mt-2 text-xl font-black">{item.title}</h2>
                  <p className="mt-2 text-slate-600">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="destinations" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Gợi ý điểm đến</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Các tuyến dễ chuyển thành đơn thuê xe</h2>
            </div>
            <label className="flex max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-500">
              <Search className="h-5 w-5" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Tìm theo nhu cầu: gia đình, xe 7 chỗ, đi trong ngày..."
              />
            </label>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.label);
                  trackGoWhere('go_where_filter_click', { filter: filter.label });
                }}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  activeFilter === filter.label ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className="mb-5 text-sm font-semibold text-slate-500">
            Đang hiển thị {visibleDestinations.length}/{destinations.length} điểm đến. Nguồn dữ liệu: {source === 'supabase' ? 'Supabase Travel Content' : 'fallback hardcode'}.
          </p>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleDestinations.map((destination) => (
              <article key={destination.slug} className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {destination.region || 'Miền Bắc'}
                    </p>
                    <h3 className="mt-3 text-2xl font-black">{destination.name}</h3>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                    {destination.distanceKm} km/lượt
                  </span>
                </div>

                <p className="mt-4 min-h-[4.5rem] text-slate-600">{destination.summary}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(destination.tags || []).slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Clock className="mb-2 h-5 w-5 text-brand-600" />
                    <p className="font-bold">{destination.duration}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Car className="mb-2 h-5 w-5 text-brand-600" />
                    <p className="font-bold">{destination.recommendedVehicle || 'Xe phù hợp'}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    to={`/di-dau/${destination.slug}`}
                    onClick={() => trackGoWhere('go_where_card_click', { destination: destination.slug, action: 'view_guide' })}
                    className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-700"
                  >
                    Xem guide
                  </Link>
                  <Link
                    to={`/lap-ke-hoach-chuyen-di/${destination.slug}#trip-form`}
                    onClick={() => trackGoWhere('go_where_card_click', { destination: destination.slug, action: 'calculate_cost' })}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Tính chi phí
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {visibleDestinations.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-8 text-center">
              <h3 className="text-xl font-black">Chưa có điểm đến phù hợp</h3>
              <p className="mt-2 text-slate-600">Anh có thể thêm nội dung mới vào dữ liệu điểm đến, hoặc dùng Trip Finder để nhận tư vấn riêng.</p>
              <Link
                to="/lap-ke-hoach-chuyen-di#trip-form"
                className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-3 font-bold text-white"
              >
                Lập kế hoạch riêng
              </Link>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
      <ZaloFAB />
    </div>
  );
}
