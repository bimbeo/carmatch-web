import { Link, Navigate, useParams } from 'react-router';
import { ArrowRight, CalendarDays, ChevronRight, Clock, Compass, MapPin, Route, ShieldCheck, Wallet } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useTravelContent } from '@/hooks/useTravelContent';
import { trackEvent } from '@/lib/analytics';
import type { TripDestination } from '@/data/tripDestinations';
import { destinationHeroClass, destinationImageStyle } from '@/lib/travelMedia';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

function trackCollection(event: string, payload: Record<string, unknown> = {}) {
  trackEvent(event, {
    page_group: 'go_where_collection',
    ...payload,
  });
}

function money(value: number) {
  return value.toLocaleString('vi-VN') + 'đ';
}

function estimateMobility(destination: TripDestination) {
  const roundTripKm = destination.distanceKm * 2;
  const energyEstimate = Math.round((roundTripKm * (destination.fuelCostPerKm || 1800)) / 1000) * 1000;
  return energyEstimate + destination.tollEstimate;
}

export default function GoWhereCollection() {
  const { slug } = useParams();
  const { destinations: allDestinations, collections, loading } = useTravelContent();
  const collection = collections.find((item) => item.slug === slug);

  useSEO({
    title: collection?.seoTitle || 'Chủ Đề Du Lịch Quanh Hà Nội',
    description: collection?.seoDescription || 'Gợi ý điểm đến, lịch trình và xe phù hợp cho các chuyến đi từ Hà Nội.',
    canonical: `https://www.carmatch.vn/di-dau/chu-de/${collection?.slug || ''}`,
  });

  if (!collection && loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
        <Navbar />
        <main className="pt-32">
          <div className="mx-auto max-w-7xl px-4 text-sm font-bold text-slate-500 sm:px-6 lg:px-8">Đang tải dữ liệu...</div>
        </main>
      </div>
    );
  }

  if (!collection) return <Navigate to="/di-dau" replace />;

  const destinations = collection.destinationSlugs
    .map((destinationSlug) => allDestinations.find((destination) => destination.slug === destinationSlug))
    .filter(Boolean) as TripDestination[];
  const heroDestination = destinations[0];
  const otherCollections = collections.filter((item) => item.slug !== collection.slug).slice(0, 4);
  const shortestDistance = destinations.length ? Math.min(...destinations.map((item) => item.distanceKm)) : 0;
  const longestDistance = destinations.length ? Math.max(...destinations.map((item) => item.distanceKm)) : 0;
  const lowestMobility = destinations.length ? Math.min(...destinations.map(estimateMobility)) : 0;

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navbar />

      <main className="pt-16">
        <section className="border-b border-slate-200 bg-[#f4f6fa]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="min-w-0 p-5 sm:p-9 lg:p-12">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link to="/di-dau" className="inline-flex items-center text-sm font-black text-brand-700 hover:text-brand-800">
                  ← Quay lại Đi đâu
                </Link>
                <p className="inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700 sm:px-4 sm:py-2 sm:text-sm">
                  {collection.eyebrow}
                </p>
              </div>
              <h1 className="mt-5 text-[2rem] font-black leading-[1.12] sm:text-5xl sm:leading-[1.08] lg:text-[3.5rem]">{collection.title}</h1>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-600 sm:text-lg sm:leading-8">{collection.description}</p>

              <div className="mt-6 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-3 text-xs sm:mt-7 sm:py-4 sm:text-sm">
                <div className="pr-3">
                  <Compass className="mb-2 h-4 w-4 text-brand-600 sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-black sm:text-base">{destinations.length} tuyến</p>
                  <p className="text-xs text-slate-500">đã lọc sẵn</p>
                </div>
                <div className="px-2 sm:px-3">
                  <Route className="mb-2 h-4 w-4 text-brand-600 sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-black sm:text-base">{shortestDistance}-{longestDistance} km</p>
                  <p className="text-xs text-slate-500">một lượt</p>
                </div>
                <div className="pl-2 sm:pl-3">
                  <Wallet className="mb-2 h-4 w-4 text-brand-600 sm:h-5 sm:w-5" />
                  <p className="text-[15px] font-black sm:text-base">Từ {money(lowestMobility)}</p>
                  <p className="text-xs text-slate-500">di chuyển</p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <Link
                  to="/lap-ke-hoach-chuyen-di#trip-form"
                  onClick={() => trackCollection('go_where_collection_cta_click', { collection: collection.slug, cta: 'hero_trip_finder' })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white transition hover:bg-brand-700 sm:px-6 sm:text-base"
                >
                  {collection.ctaLabel} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="#routes"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700 sm:px-6 sm:text-base"
                >
                  So sánh điểm đến
                </a>
              </div>
            </div>

            <div
              className={`min-h-[360px] bg-gradient-to-br bg-cover bg-center sm:min-h-[440px] lg:min-h-[600px] ${heroDestination ? destinationHeroClass(heroDestination) : ''}`}
              style={heroDestination ? destinationImageStyle(heroDestination) : undefined}
            >
              <div className="flex h-full min-h-[360px] items-end bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-4 text-white sm:min-h-[440px] sm:p-8 lg:min-h-[600px] lg:p-10">
                <div className="w-full rounded-2xl bg-slate-950/55 p-4 backdrop-blur-md ring-1 ring-white/20 sm:p-5">
                  <p className="text-[15px] font-bold text-white/75 sm:text-sm">Gợi ý nổi bật trong chủ đề</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{heroDestination?.name || 'Điểm đến nổi bật'}</h2>
                  {heroDestination ? (
                    <div className="mt-4 grid grid-cols-3 divide-x divide-white/20 rounded-xl bg-white/10 py-3 text-xs sm:mt-5 sm:text-sm">
                      <div className="px-2 sm:px-3">
                        <Route className="mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <p className="font-black">{heroDestination.distanceKm * 2} km</p>
                        <p className="mt-0.5 text-xs text-white/60">hai chiều</p>
                      </div>
                      <div className="px-2 sm:px-3">
                        <Wallet className="mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <p className="font-black">{money(estimateMobility(heroDestination))}</p>
                        <p className="mt-0.5 text-xs text-white/60">di chuyển</p>
                      </div>
                      <div className="px-2 sm:px-3">
                        <CalendarDays className="mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <p className="font-black">{heroDestination.duration}</p>
                        <p className="mt-0.5 text-xs text-white/60">nên đi</p>
                      </div>
                    </div>
                  ) : null}
                  {heroDestination ? (
                    <Link
                      to={`/di-dau/${heroDestination.slug}`}
                      className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-brand-50"
                    >
                      Xem tuyến nổi bật <ChevronRight className="ml-1 h-4 w-4" />
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
              ['Đã lọc đúng nhu cầu', `${destinations.length} tuyến trong chủ đề này, không cần xem lại toàn bộ danh sách.`, Compass],
              ['Có chi phí để so sánh', 'Mỗi tuyến đều hiển thị quãng đường, thời gian và chi phí di chuyển ước tính.', Wallet],
              ['Có xe phù hợp', 'Mở từng guide để xem loại xe, lưu ý đường đi, chỗ đỗ và lịch trình.', ShieldCheck],
            ].map(([title, description, Icon], index) => (
              <div key={title as string} className={`flex gap-4 px-5 py-6 sm:px-6 lg:px-8 ${index > 0 ? 'border-t border-slate-200 md:border-l md:border-t-0' : ''}`}>
                <Icon className="h-6 w-6 shrink-0 text-brand-600" />
                <div>
                  <h2 className="text-base font-black">{title as string}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description as string}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="routes" className="scroll-mt-24 bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Danh sách gợi ý</p>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">{destinations.length} điểm đến phù hợp</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">So sánh nhanh trước khi mở guide chi tiết và chọn xe cho chuyến đi.</p>
            </div>
            <Link
              to="/lap-ke-hoach-chuyen-di#trip-form"
              onClick={() => trackCollection('go_where_collection_cta_click', { collection: collection.slug, cta: 'top_trip_finder' })}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-brand-700 sm:text-base"
            >
              Tính chuyến riêng <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {destinations.map((destination, index) => (
              <article key={destination.slug} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <Link
                    to={`/di-dau/${destination.slug}`}
                    onClick={() => trackCollection('go_where_collection_card_click', { collection: collection.slug, destination: destination.slug, action: 'hero_image' })}
                    className={`relative block h-52 bg-gradient-to-br bg-cover bg-center ${destinationHeroClass(destination)}`}
                    style={destinationImageStyle(destination)}
                    aria-label={`Xem guide ${destination.name}`}
                  >
                    <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
                      Tuyến {index + 1}
                    </span>
                    <div className="flex h-full items-end bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent p-5 text-white">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-white/80"><MapPin className="h-4 w-4" />{destination.region || 'Miền Bắc'}</p>
                        <h3 className="mt-1 text-2xl font-black">{destination.name}</h3>
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <p className="mt-3 min-h-[4rem] text-sm leading-6 text-slate-600">{destination.summary}</p>

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

                    <div className="mt-5 rounded-2xl bg-brand-50 p-3.5 sm:p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-700">Xe phù hợp</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{destination.recommendedVehicle || 'Xe Car Match phù hợp'}</p>
                    </div>

                    <div className="mt-auto flex gap-3 pt-5">
                      <Link
                        to={`/di-dau/${destination.slug}`}
                        onClick={() => trackCollection('go_where_collection_card_click', { collection: collection.slug, destination: destination.slug, action: 'view_guide' })}
                        className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-brand-700"
                      >
                        Xem guide
                      </Link>
                      <Link
                        to={`/lap-ke-hoach-chuyen-di/${destination.slug}#trip-form`}
                        onClick={() => trackCollection('go_where_collection_card_click', { collection: collection.slug, destination: destination.slug, action: 'calculate_cost' })}
                        className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
                      >
                        Tính chi phí
                      </Link>
                    </div>
                  </div>
              </article>
            ))}
          </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f4f6fa] py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.16em]">Khám phá theo chủ đề khác</p>
              <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">Đổi cách chọn chuyến đi</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Xem thêm các nhóm tuyến được lọc theo thời gian, nhóm đi và loại xe.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {otherCollections.map((item) => (
                <Link
                  key={item.slug}
                  to={`/di-dau/chu-de/${item.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg sm:p-5"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">{item.eyebrow}</p>
                  <h3 className="mt-3 text-lg font-black leading-tight sm:text-xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  <p className="mt-5 inline-flex items-center text-sm font-black text-slate-950 group-hover:text-brand-700">
                    Xem chủ đề <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
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
