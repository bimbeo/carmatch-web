import { Link, useLocation } from 'react-router';
import { ArrowRight, CalendarDays, Fuel, Users, Zap } from 'lucide-react';
import { Car, formatPrice } from '@/data/cars';
import { trackVehicleClick } from '@/lib/analytics';
import { vehicleImageAlt } from '@/lib/imageAlt';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';

const fuelBadge: Record<Car['fuel'], { class: string; icon: React.ReactNode }> = {
  'Điện': {
    class: 'bg-brand-100 text-brand-700 border border-brand-200',
    icon: <Zap className="w-3 h-3" />,
  },
  'Xăng': {
    class: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: <Fuel className="w-3 h-3" />,
  },
  'Dầu': {
    class: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <Fuel className="w-3 h-3" />,
  },
};

interface CarCardProps {
  car: Car;
  compact?: boolean;
  mode?: 'standard' | 'listing';
  source?: string;
}

const PRESERVED_QUERY_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'promo'];

function withPreservedCampaign(path: string, search: string, hash = '') {
  const current = new URLSearchParams(search);
  const next = new URLSearchParams();
  PRESERVED_QUERY_KEYS.forEach((key) => {
    const value = current.get(key);
    if (value) next.set(key, value);
  });
  const query = next.toString();
  return `${path}${query ? `?${query}` : ''}${hash}`;
}

export default function CarCard({ car, compact = false, mode = 'standard', source = 'vehicle_card' }: CarCardProps) {
  const location = useLocation();
  const badge = fuelBadge[car.fuel];
  const vehicleLinkLabel = [car.name, car.description, car.plateNumber].filter(Boolean).join(' - ');
  const detailHref = withPreservedCampaign(`/xe/${car.slug}`, location.search);
  const bookingHref = withPreservedCampaign(`/xe/${car.slug}`, location.search, '#booking');
  const trackCar = (action: string) => trackVehicleClick(action, {
    source,
    vehicle_id: car.id,
    vehicle_slug: car.slug,
    vehicle_name: car.name,
    vehicle_price: car.price,
  });

  if (mode === 'listing') {
    return (
      <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)]">
        <Link
          to={detailHref}
          onClick={() => trackCar('image_click')}
          className="relative block overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <span className="sr-only">Xem chi tiết {vehicleLinkLabel}</span>
          <div className="aspect-[4/3]">
            <img
              src={optimizedImageUrl(car.images[0], 640, 60)}
              srcSet={optimizedImageSrcSet(car.images[0], [480, 720, 960], 60)}
              sizes="(min-width: 1280px) 302px, (min-width: 768px) 33vw, 100vw"
              alt={vehicleImageAlt(car)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              width={720}
              height={540}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute left-3 top-3 pointer-events-none">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur-md ${badge.class} bg-white/90`}>
              {badge.icon}
              {car.fuel}
            </span>
          </div>
          {car.popular && (
            <div className="absolute right-3 top-3 pointer-events-none">
              <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                Phổ biến
              </span>
            </div>
          )}
        </Link>

        <div className="p-4">
          <Link
            to={detailHref}
            onClick={() => trackCar('title_click')}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <h3 id={`xe-${car.slug}`} className="line-clamp-1 text-lg font-bold tracking-tight text-slate-950">{car.name}</h3>
            {!compact && car.description && (
              <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">{car.description}</p>
            )}
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              {car.seats} chỗ
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{car.transmission}</span>
            {car.model_year && (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{car.model_year}</span>
              </>
            )}
          </div>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              {car.price > 0 ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black tracking-tight text-brand-600">{formatPrice(car.price)}</span>
                  <span className="text-sm font-semibold text-slate-500">/ngày</span>
                </div>
              ) : (
                <span className="text-base font-bold text-brand-600">Liên hệ báo giá</span>
              )}
            </div>
            <Link
              to={detailHref}
              onClick={() => trackCar('detail_click')}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Xem xe
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group">
      {/* Image */}
      <Link
        to={detailHref}
        onClick={() => trackCar('image_click')}
        className="relative block overflow-hidden aspect-video bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <span className="sr-only">Xem chi tiết {vehicleLinkLabel} </span>
        <img
          src={optimizedImageUrl(car.images[0], 480, 58)}
          srcSet={optimizedImageSrcSet(car.images[0], [480, 720], 58)}
          sizes="(min-width: 1280px) 411px, (min-width: 768px) 33vw, 100vw"
          alt={vehicleImageAlt(car)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          width={720}
          height={405}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm ${badge.class}`}>
            {badge.icon}
            {car.fuel}
          </span>
        </div>
        {car.popular && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="px-2.5 py-1 bg-brand-600 text-white rounded-full text-xs font-semibold shadow-sm">
              Phổ biến
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <h3 id={`xe-${car.slug}`} className="font-semibold text-gray-900 text-base mb-1">{car.name}</h3>

        {!compact && car.description && (
          <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{car.description}</p>
        )}

        {/* Specs */}
        <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {car.seats} chỗ
          </span>
          <span className="text-gray-300">•</span>
          <span>{car.transmission}</span>
          {car.model_year && (
            <>
              <span className="text-gray-300">•</span>
              <span>{car.model_year}</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-4">
          {car.price > 0 ? (
            <>
              <span className="text-brand-600 font-bold text-lg">{formatPrice(car.price)}</span>
              <span className="text-gray-600 text-xs">/ngày</span>
            </>
          ) : (
            <span className="text-brand-600 font-semibold text-base">Liên hệ báo giá</span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Link
            to={detailHref}
            onClick={() => trackCar('detail_click')}
            className="flex-1 py-2.5 text-center text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Chi tiết<span className="sr-only"> {vehicleLinkLabel}</span>
          </Link>
          <Link
            to={bookingHref}
            onClick={() => trackCar('book_click')}
            className="flex-1 py-2.5 text-center text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Đặt xe<span className="sr-only"> {vehicleLinkLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
