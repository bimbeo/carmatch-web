import { useState, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { cars } from '@/data/cars';
import CarCard from '../components/CarCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

type FuelFilter = 'all' | 'Điện' | 'Xăng' | 'Dầu';
type SeatsFilter = 'all' | '5' | '7';
type SortOption = 'popular' | 'price-asc' | 'price-desc';

export default function Fleet() {
  const [fuelFilter, setFuelFilter] = useState<FuelFilter>('all');
  const [seatsFilter, setSeatsFilter] = useState<SeatsFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const filtered = useMemo(() => {
    let result = [...cars];
    if (fuelFilter !== 'all') result = result.filter((c) => c.fuel === fuelFilter);
    if (seatsFilter !== 'all') result = result.filter((c) => c.seats === Number(seatsFilter));
    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    return result;
  }, [fuelFilter, seatsFilter, sortBy]);

  const activeFilterCount = (fuelFilter !== 'all' ? 1 : 0) + (seatsFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setFuelFilter('all');
    setSeatsFilter('all');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-green-600 font-semibold text-sm uppercase tracking-wide mb-2">Đội xe</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Thuê Xe Tự Lái Hà Nội
          </h1>
          <p className="text-gray-500">
            {cars.length} mẫu xe đa dạng — xe điện VinFast đến xe xăng gia đình
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Fuel filter */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
              {(['all', 'Điện', 'Xăng', 'Dầu'] as FuelFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFuelFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    fuelFilter === f
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : f}
                </button>
              ))}
            </div>

            {/* Seats filter */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
              {(['all', '5', '7'] as SeatsFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeatsFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    seatsFilter === s
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {s === 'all' ? 'Mọi chỗ ngồi' : `${s} chỗ`}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-gray-50 border border-gray-100 text-gray-600 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-green-300 focus:ring-1 focus:ring-green-200 cursor-pointer"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc ({activeFilterCount})
              </button>
            )}

            <span className="ml-auto text-sm text-gray-400">{filtered.length} xe</span>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
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
              Thử thay đổi bộ lọc hoặc liên hệ để được tư vấn
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
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
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
