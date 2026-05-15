import { Link } from 'react-router';
import { Users, Zap, Fuel, MessageCircle } from 'lucide-react';
import { Car, formatPrice } from '@/data/cars';

const ZALO_LINK = 'https://zalo.me/0975563290';

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
}

export default function CarCard({ car, compact = false }: CarCardProps) {
  const badge = fuelBadge[car.fuel];
  const zaloMessage = encodeURIComponent(`Xin chào CarMatch! Tôi muốn hỏi về xe ${car.name}`);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group">
      {/* Image */}
      <div className="relative overflow-hidden aspect-video bg-gray-100">
        <img
          src={car.images[0]}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm ${badge.class}`}>
            {badge.icon}
            {car.fuel}
          </span>
        </div>
        {car.popular && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-brand-600 text-white rounded-full text-xs font-semibold shadow-sm">
              Phổ biến
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base mb-1">{car.name}</h3>

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
          <span className="text-gray-300">•</span>
          <span>{car.kmPerDay} km/ngày</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-4">
          {car.price > 0 ? (
            <>
              <span className="text-brand-600 font-bold text-lg">{formatPrice(car.price)}</span>
              <span className="text-gray-400 text-xs">/ngày</span>
            </>
          ) : (
            <span className="text-brand-600 font-semibold text-base">Liên hệ báo giá</span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Link
            to={`/xe/${car.slug}`}
            className="flex-1 py-2.5 text-center text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Chi tiết
          </Link>
          <a
            href={`${ZALO_LINK}?text=${zaloMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-center text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Đặt ngay
          </a>
        </div>
      </div>
    </div>
  );
}
