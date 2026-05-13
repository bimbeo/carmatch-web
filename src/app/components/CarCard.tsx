import { Link } from 'react-router';
import { Users, Zap, Fuel, MessageCircle } from 'lucide-react';
import { Car, formatPrice } from '@/data/cars';

const ZALO_LINK = 'https://zalo.me/0975563290';

const fuelColors: Record<Car['fuel'], string> = {
  'Điện': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  'Xăng': 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  'Dầu': 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
};

const fuelIcons: Record<Car['fuel'], React.ReactNode> = {
  'Điện': <Zap className="w-3 h-3" />,
  'Xăng': <Fuel className="w-3 h-3" />,
  'Dầu': <Fuel className="w-3 h-3" />,
};

interface CarCardProps {
  car: Car;
  compact?: boolean;
}

export default function CarCard({ car, compact = false }: CarCardProps) {
  const zaloMessage = encodeURIComponent(`Xin chào CarMatch! Tôi muốn hỏi về xe ${car.name}`);

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group">
      {/* Image */}
      <div className="relative overflow-hidden aspect-video bg-gray-900">
        <img
          src={car.images[0]}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${fuelColors[car.fuel]}`}>
            {fuelIcons[car.fuel]}
            {car.fuel}
          </span>
        </div>
        {car.popular && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-[#4ade80]/90 text-black rounded-full text-xs font-semibold">
              Phổ biến
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-base mb-1">{car.name}</h3>

        {!compact && car.description && (
          <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{car.description}</p>
        )}

        {/* Specs */}
        <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {car.seats} chỗ
          </span>
          <span className="text-gray-700">•</span>
          <span>{car.transmission}</span>
          <span className="text-gray-700">•</span>
          <span>{car.kmPerDay} km/ngày</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-[#4ade80] font-bold text-lg">{formatPrice(car.price)}</span>
          <span className="text-gray-600 text-xs">/ngày</span>
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Link
            to={`/xe/${car.slug}`}
            className="flex-1 py-2.5 text-center text-sm font-medium text-white border border-white/10 rounded-xl hover:border-white/20 hover:bg-white/5 transition-all"
          >
            Chi tiết
          </Link>
          <a
            href={`${ZALO_LINK}?text=${zaloMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-center text-sm font-semibold bg-[#0068FF] text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Đặt ngay
          </a>
        </div>
      </div>
    </div>
  );
}
