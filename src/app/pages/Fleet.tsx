import { useState, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import CarCard from '../components/CarCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

type FuelFilter = 'all' | 'Điện' | 'Xăng' | 'Dầu';
type SeatsFilter = 'all' | '4' | '5' | '7' | '8+';
type PriceFilter = 'all' | 'under800' | '800to1500' | 'over1500' | 'contact';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'seats-asc';

const PRICE_LABELS: Record<PriceFilter, string> = {
  all: 'Mọi mức giá',
  under800: 'Dưới 800K',
  '800to1500': '800K – 1.5M',
  over1500: 'Trên 1.5M',
  contact: 'Liên hệ báo giá',
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded mt-4" />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function Fleet() {
  const { cars, loading, error } = useVehicles();
  const [fuelFilter, setFuelFilter] = useState<FuelFilter>('all');
  const [seatsFilter, setSeatsFilter] = useState<SeatsFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showAllFilters, setShowAllFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...cars];

    if (fuelFilter !== 'all') result = result.filter((c) => c.fuel === fuelFilter);

    if (seatsFilter !== 'all') {
      if (seatsFilter === '8+') result = result.filter((c) => c.seats >= 8);
      else result = result.filter((c) => c.seats === Number(seatsFilter));
    }

    if (priceFilter !== 'all') {
      if (priceFilter === 'contact') result = result.filter((c) => c.price === 0);
      else if (priceFilter === 'under800') result = result.filter((c) => c.price > 0 && c.price < 800000);
      else if (priceFilter === '800to1500') result = result.filter((c) => c.price >= 800000 && c.price <= 1500000);
      else if (priceFilter === 'over1500') result = result.filter((c) => c.price > 1500000);
    }

    if (sortBy === 'price-asc') result.sort((a, b) => (a.price || 9999999) - (b.price || 9999999));
    else if (sortBy === 'price-desc') result.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'seats-asc') result.sort((a, b) => a.seats - b.seats);

    return result;
  }, [cars, fuelFilter, seatsFilter, priceFilter, sortBy]);

  const activeFilterCount =
    (fuelFilter !== 'all' ? 1 : 0) +
    (seatsFilter !== 'all' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setFuelFilter('all');
    setSeatsFilter('all');
    setPriceFilter('all');
    setSortBy('default');
  };

  // Dynamic seat options from actual data
  const availableSeats = useMemo(() => {
    const seats = [...new Set(cars.map((c) => c.seats))].sort((a, b) => a - b);
    return seats;
  }, [cars]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Đội xe CarMatch</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Thuê Xe Tự Lái Hà Nội
          </h1>
          <p className="text-gray-500">
            {loading
              ? 'Đang tải danh sách xe...'
              : `${cars.length} mẫu xe — Giao tận tòa nhà · Đặt qua Zalo · Xác nhận 30 phút`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter panel */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
          {/* Row 1: Fuel + Sort + Count */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Nhiên liệu</span>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
              {(['all', 'Điện', 'Xăng', 'Dầu'] as FuelFilter[]).map((f) => (
                <FilterChip key={f} active={fuelFilter === f} onClick={() => setFuelFilter(f)}>
                  {f === 'all' ? 'Tất cả' : f}
                </FilterChip>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-gray-50 border border-gray-100 text-gray-600 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-brand-300 cursor-pointer"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
                <option value="seats-asc">Số chỗ tăng dần</option>
              </select>

              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  showAllFilters || activeFilterCount > 0
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Lọc thêm
                {activeFilterCount > 0 && (
                  <span className="bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllFilters ? 'rotate-180' : ''}`} />
              </button>

              <span className="text-sm text-gray-400 hidden sm:block">
                {loading ? '...' : `${filtered.length} xe`}
              </span>
            </div>
          </div>

          {/* Row 2: Extended filters (collapsible) */}
          {showAllFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50/50 border-b border-gray-100">
              {/* Seats */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Số chỗ</span>
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
                  <FilterChip active={seatsFilter === 'all'} onClick={() => setSeatsFilter('all')}>
                    Tất cả
                  </FilterChip>
                  {availableSeats.map((s) => (
                    <FilterChip
                      key={s}
                      active={seatsFilter === String(s) as SeatsFilter}
                      onClick={() => setSeatsFilter(String(s) as SeatsFilter)}
                    >
                      {s} chỗ
                    </FilterChip>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Giá/ngày</span>
                <div className="flex flex-wrap items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
                  {(Object.keys(PRICE_LABELS) as PriceFilter[]).map((p) => (
                    <FilterChip key={p} active={priceFilter === p} onClick={() => setPriceFilter(p)}>
                      {PRICE_LABELS[p]}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active filter tags + reset */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
              <span className="text-xs text-gray-400">Đang lọc:</span>
              {fuelFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                  {fuelFilter}
                  <button onClick={() => setFuelFilter('all')} className="hover:text-brand-900">×</button>
                </span>
              )}
              {seatsFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                  {seatsFilter} chỗ
                  <button onClick={() => setSeatsFilter('all')} className="hover:text-brand-900">×</button>
                </span>
              )}
              {priceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                  {PRICE_LABELS[priceFilter]}
                  <button onClick={() => setPriceFilter('all')} className="hover:text-brand-900">×</button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors ml-1"
              >
                <X className="w-3 h-3" /> Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-gray-500 mb-4">{error}</p>
            <a href="https://zalo.me/0975563290" target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
              Liên hệ qua Zalo
            </a>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
            {filtered.map((car) => (
              <CarCard key={car.slug} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <SlidersHorizontal className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-semibold text-lg mb-2">Không tìm thấy xe phù hợp</h3>
            <p className="text-gray-500 text-sm mb-6">
              Thử thay đổi bộ lọc hoặc liên hệ để được tư vấn trực tiếp
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
              <a
                href="https://zalo.me/0975563290"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Tư vấn qua Zalo
              </a>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
