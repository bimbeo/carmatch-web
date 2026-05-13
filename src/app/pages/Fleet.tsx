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
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...cars];

    if (fuelFilter !== 'all') {
      result = result.filter((c) => c.fuel === fuelFilter);
    }
    if (seatsFilter !== 'all') {
      result = result.filter((c) => c.seats === Number(seatsFilter));
    }

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
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Thuê Xe Tự Lái Hà Nội
            </h1>
            <p className="text-gray-400 text-base">
              {cars.length} mẫu xe đa dạng — xe điện VinFast đến xe xăng gia đình
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {/* Fuel filter */}
            <div className="flex items-center gap-2 bg-[#111111] border border-white/5 rounded-xl p-1">
              {(['all', 'Điện', 'Xăng', 'Dầu'] as FuelFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFuelFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    fuelFilter === f
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : f}
                </button>
              ))}
            </div>

            {/* Seats filter */}
            <div className="flex items-center gap-2 bg-[#111111] border border-white/5 rounded-xl p-1">
              {(['all', '5', '7'] as SeatsFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeatsFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    seatsFilter === s
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
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
              className="bg-[#111111] border border-white/5 text-gray-400 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-white/20 cursor-pointer"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Results count */}
          <p className="text-gray-600 text-sm mb-6">
            Hiển thị {filtered.length} / {cars.length} xe
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((car) => (
                <CarCard key={car.slug} car={car} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <SlidersHorizontal className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Không tìm thấy xe phù hợp</h3>
              <p className="text-gray-500 text-sm mb-6">
                Thử thay đổi bộ lọc hoặc liên hệ để được tư vấn xe phù hợp
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/5 transition-colors"
                >
                  Xóa bộ lọc
                </button>
                <a
                  href="https://zalo.me/0975563290"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#0068FF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  Tư vấn qua Zalo
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
