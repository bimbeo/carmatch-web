import { Link, Navigate, useParams } from 'react-router';
import { ArrowRight, Car, Clock, MapPin, Route } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useTravelContent } from '@/hooks/useTravelContent';
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
      <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
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
    .filter(Boolean) as typeof allDestinations;

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <Navbar />

      <main className="pt-24">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Link to="/di-dau" className="text-sm font-bold text-brand-700 hover:text-brand-800">
            ← Quay lại Đi đâu
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
                {collection.eyebrow}
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                {collection.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{collection.description}</p>
            </div>
            <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Mục tiêu trang</p>
              <h2 className="mt-3 text-2xl font-black">Biến nhu cầu du lịch thành lead thuê xe</h2>
              <p className="mt-3 text-slate-600">
                Trang này gom điểm đến theo intent tìm kiếm, sau đó kéo khách về Trip Finder hoặc form tư vấn từng điểm.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Danh sách gợi ý</p>
              <h2 className="mt-2 text-3xl font-black">{destinations.length} điểm đến phù hợp</h2>
            </div>
            <Link
              to="/lap-ke-hoach-chuyen-di#trip-form"
              onClick={() => trackCollection('go_where_collection_cta_click', { collection: collection.slug, cta: 'top_trip_finder' })}
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700"
            >
              {collection.ctaLabel} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {destinations.map((destination) => (
              <article key={destination.slug} className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {destination.region || 'Miền Bắc'}
                </p>
                <h3 className="mt-3 text-2xl font-black">{destination.name}</h3>
                <p className="mt-3 min-h-[4.5rem] text-slate-600">{destination.summary}</p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Route className="mb-2 h-5 w-5 text-brand-600" />
                    <p className="font-bold">{destination.distanceKm} km/lượt</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Clock className="mb-2 h-5 w-5 text-brand-600" />
                    <p className="font-bold">{destination.duration}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-brand-50 p-4">
                  <Car className="mb-2 h-5 w-5 text-brand-700" />
                  <p className="text-sm font-semibold text-slate-700">{destination.recommendedVehicle || 'Xe CarMatch phù hợp'}</p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    to={`/di-dau/${destination.slug}`}
                    onClick={() => trackCollection('go_where_collection_card_click', { collection: collection.slug, destination: destination.slug, action: 'view_guide' })}
                    className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-700"
                  >
                    Xem guide
                  </Link>
                  <Link
                    to={`/lap-ke-hoach-chuyen-di/${destination.slug}#trip-form`}
                    onClick={() => trackCollection('go_where_collection_card_click', { collection: collection.slug, destination: destination.slug, action: 'calculate_cost' })}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Tính chi phí
                  </Link>
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
