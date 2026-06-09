import { Link, Navigate, useParams } from 'react-router';
import { ArrowRight, Car, Clock, Compass, MapPin, Route, ShieldCheck, Wallet } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useTravelContent } from '@/hooks/useTravelContent';
import type { TripDestination } from '@/data/tripDestinations';
import { destinationHeroClass, destinationImageStyle } from '@/lib/travelMedia';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

function trackCollection(event: string, payload: Record<string, unknown> = {}) {
  const trackedWindow = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  trackedWindow.dataLayer = trackedWindow.dataLayer || [];
  trackedWindow.dataLayer.push({
    event,
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

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <Navbar />

      <main className="pt-24">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <Link to="/di-dau" className="inline-flex items-center text-sm font-black text-brand-700 hover:text-brand-800">
                ← Quay lại Đi đâu
              </Link>
              <p className="mt-8 inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-700">
                {collection.eyebrow}
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{collection.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{collection.description}</p>

              <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Compass className="mb-2 h-5 w-5 text-brand-600" />
                  <p className="font-black">{destinations.length} tuyến</p>
                  <p className="text-slate-500">đã lọc sẵn</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Clock className="mb-2 h-5 w-5 text-brand-600" />
                  <p className="font-black">{heroDestination?.duration || '1-2 ngày'}</p>
                  <p className="text-slate-500">dễ chọn</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <Car className="mb-2 h-5 w-5 text-brand-600" />
                  <p className="font-black">Có xe gợi ý</p>
                  <p className="text-slate-500">theo tuyến</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/lap-ke-hoach-chuyen-di#trip-form"
                  onClick={() => trackCollection('go_where_collection_cta_click', { collection: collection.slug, cta: 'hero_trip_finder' })}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 font-black text-white transition hover:bg-brand-700"
                >
                  {collection.ctaLabel} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="#routes"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
                >
                  So sánh điểm đến
                </a>
              </div>
            </div>

            <div
              className={`min-h-[460px] bg-gradient-to-br bg-cover bg-center ${heroDestination ? destinationHeroClass(heroDestination) : ''}`}
              style={heroDestination ? destinationImageStyle(heroDestination) : undefined}
            >
              <div className="flex h-full items-end bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-6 text-white sm:p-8 lg:p-10">
                <div className="w-full rounded-[1.5rem] bg-white/12 p-5 backdrop-blur ring-1 ring-white/20">
                  <p className="text-sm font-bold text-white/75">Tuyến đầu tiên trong bộ sưu tập</p>
                  <h2 className="mt-2 text-3xl font-black">{heroDestination?.name || 'Điểm đến nổi bật'}</h2>
                  {heroDestination ? (
                    <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-2xl bg-white/14 p-3">
                        <Route className="mb-2 h-5 w-5" />
                        <p className="font-black">{heroDestination.distanceKm * 2} km</p>
                      </div>
                      <div className="rounded-2xl bg-white/14 p-3">
                        <Wallet className="mb-2 h-5 w-5" />
                        <p className="font-black">{money(estimateMobility(heroDestination))}</p>
                      </div>
                      <div className="rounded-2xl bg-white/14 p-3">
                        <ShieldCheck className="mb-2 h-5 w-5" />
                        <p className="font-black">{heroDestination.tags?.[0] || 'Dễ chọn'}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="routes" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-600">Danh sách gợi ý</p>
              <h2 className="mt-2 text-3xl font-black">{destinations.length} điểm đến phù hợp</h2>
            </div>
            <Link
              to="/lap-ke-hoach-chuyen-di#trip-form"
              onClick={() => trackCollection('go_where_collection_cta_click', { collection: collection.slug, cta: 'top_trip_finder' })}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-brand-700"
            >
              Tính chuyến riêng <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {destinations.map((destination, index) => (
              <article key={destination.slug} className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="grid sm:grid-cols-[240px_1fr]">
                  <Link
                    to={`/di-dau/${destination.slug}`}
                    onClick={() => trackCollection('go_where_collection_card_click', { collection: collection.slug, destination: destination.slug, action: 'hero_image' })}
                    className={`relative block min-h-64 bg-gradient-to-br bg-cover bg-center ${destinationHeroClass(destination)}`}
                    style={destinationImageStyle(destination)}
                    aria-label={`Xem guide ${destination.name}`}
                  >
                    <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
                      Tuyến {index + 1}
                    </span>
                  </Link>

                  <div className="p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
                      <MapPin className="h-4 w-4" />
                      {destination.region || 'Miền Bắc'}
                    </p>
                    <h3 className="mt-2 text-2xl font-black">{destination.name}</h3>
                    <p className="mt-3 min-h-[4rem] text-sm leading-6 text-slate-600">{destination.summary}</p>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <Route className="mb-2 h-5 w-5 text-brand-600" />
                        <p className="font-black">{destination.distanceKm} km</p>
                        <p className="text-xs text-slate-500">một lượt</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <Clock className="mb-2 h-5 w-5 text-brand-600" />
                        <p className="font-black">{destination.duration}</p>
                        <p className="text-xs text-slate-500">thời gian</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <Wallet className="mb-2 h-5 w-5 text-brand-600" />
                        <p className="font-black">{money(estimateMobility(destination))}</p>
                        <p className="text-xs text-slate-500">di chuyển</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-brand-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-700">Xe phù hợp</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{destination.recommendedVehicle || 'Xe Car Match phù hợp'}</p>
                    </div>

                    <div className="mt-5 flex gap-3">
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
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <ZaloFAB />
    </div>
  );
}
