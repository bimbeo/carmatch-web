import { useState, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import CarCard from '../components/CarCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

type FuelFilter  = 'all' | 'Điện' | 'Xăng' | 'Dầu';
type SeatsFilter = 'all' | '4' | '5' | '7' | '8+';
type SortOption  = 'default' | 'price-asc' | 'price-desc';

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

function Chip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
        active
          ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
      }`}
    >
      {children}
      {count !== undefined && count > 0 && !active && (
        <span className="ml-1 text-xs text-gray-400">({count})</span>
      )}
    </button>
  );
}

export default function Fleet() {
  const { cars, loading, error } = useVehicles();

  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [fuelFilter,  setFuelFilter]  = useState<FuelFilter>('all');
  const [seatsFilter, setSeatsFilter] = useState<SeatsFilter>('all');
  const [sortBy,      setSortBy]      = useState<SortOption>('default');

  // ── derive available facet values from unfiltered data ──────────────────────
  const brands = useMemo(() => {
    const set = new Set(cars.map((c) => c.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [cars]);

  const availableSeats = useMemo(() => {
    const set = new Set(cars.map((c) => c.seats));
    return Array.from(set).sort((a, b) => a - b);
  }, [cars]);

  const hasDiesel = useMemo(() => cars.some((c) => c.fuel === 'Dầu'), [cars]);

  // ── counts for chips (apply other active filters, not this dimension) ───────
  const brandCounts = useMemo(() => {
    const base = cars.filter((c) =>
      (fuelFilter === 'all' || c.fuel === fuelFilter) &&
      (seatsFilter === 'all' || c.seats === Number(seatsFilter))
    );
    const map: Record<string, number> = {};
    brands.forEach((b) => { map[b] = base.filter((c) => c.brand === b).length; });
    return map;
  }, [cars, brands, fuelFilter, seatsFilter]);

  const seatCounts = useMemo(() => {
    const base = cars.filter((c) =>
      (brandFilter === 'all' || c.brand === brandFilter) &&
      (fuelFilter === 'all' || c.fuel === fuelFilter)
    );
    const map: Record<number, number> = {};
    availableSeats.forEach((s) => { map[s] = base.filter((c) => c.seats === s).length; });
    return map;
  }, [cars, availableSeats, brandFilter, fuelFilter]);

  const fuelCounts = useMemo(() => {
    const base = cars.filter((c) =>
      (brandFilter === 'all' || c.brand === brandFilter) &&
      (seatsFilter === 'all' || c.seats === Number(seatsFilter))
    );
    return {
      Điện: base.filter((c) => c.fuel === 'Điện').length,
      Xăng: base.filter((c) => c.fuel === 'Xăng').length,
      Dầu:  base.filter((c) => c.fuel === 'Dầu').length,
    };
  }, [cars, brandFilter, seatsFilter]);

  // ── filtered + sorted result ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...cars];
    if (brandFilter  !== 'all') r = r.filter((c) => c.brand === brandFilter);
    if (fuelFilter   !== 'all') r = r.filter((c) => c.fuel === fuelFilter);
    if (seatsFilter  !== 'all') {
      if (seatsFilter === '8+') r = r.filter((c) => c.seats >= 8);
      else r = r.filter((c) => c.seats === Number(seatsFilter));
    }
    if (sortBy === 'price-asc')  r.sort((a, b) => (a.price || 9_999_999) - (b.price || 9_999_999));
    if (sortBy === 'price-desc') r.sort((a, b) => (b.price || 0) - (a.price || 0));
    return r;
  }, [cars, brandFilter, fuelFilter, seatsFilter, sortBy]);

  const activeCount =
    (brandFilter  !== 'all' ? 1 : 0) +
    (fuelFilter   !== 'all' ? 1 : 0) +
    (seatsFilter  !== 'all' ? 1 : 0);

  const resetAll = () => {
    setBrandFilter('all');
    setFuelFilter('all');
    setSeatsFilter('all');
    setSortBy('default');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* ── Header ── */}
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

        {/* ── Filter panel ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-8 divide-y divide-gray-50">

          {/* Row: Brand */}
          {brands.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 px-5 py-3.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 shrink-0">Hãng xe</span>
              <div className="flex flex-wrap gap-2">
                <Chip active={brandFilter === 'all'} onClick={() => setBrandFilter('all')}>
                  Tất cả
                </Chip>
                {brands.map((b) => (
                  <Chip
                    key={b}
                    active={brandFilter === b}
                    count={brandCounts[b]}
                    onClick={() => setBrandFilter(b)}
                  >
                    {b}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Row: Fuel */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-3.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 shrink-0">Nhiên liệu</span>
            <div className="flex flex-wrap gap-2">
              <Chip active={fuelFilter === 'all'} onClick={() => setFuelFilter('all')}>Tất cả</Chip>
              <Chip active={fuelFilter === 'Điện'} count={fuelCounts['Điện']} onClick={() => setFuelFilter('Điện')}>
                ⚡ Điện
              </Chip>
              <Chip active={fuelFilter === 'Xăng'} count={fuelCounts['Xăng']} onClick={() => setFuelFilter('Xăng')}>
                Xăng
              </Chip>
              {hasDiesel && (
                <Chip active={fuelFilter === 'Dầu'} count={fuelCounts['Dầu']} onClick={() => setFuelFilter('Dầu')}>
                  Dầu
                </Chip>
              )}
            </div>
          </div>

          {/* Row: Seats */}
          <div className="flex flex-wrap items-center gap-2 px-5 py-3.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 shrink-0">Số chỗ</span>
            <div className="flex flex-wrap gap-2">
              <Chip active={seatsFilter === 'all'} onClick={() => setSeatsFilter('all')}>Tất cả</Chip>
              {availableSeats.map((s) => (
                <Chip
                  key={s}
                  active={seatsFilter === String(s)}
                  count={seatCounts[s]}
                  onClick={() => setSeatsFilter(String(s) as SeatsFilter)}
                >
                  {s} chỗ
                </Chip>
              ))}
            </div>
          </div>

          {/* Row: Sort + result count + reset */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-gray-50/60 rounded-b-2xl">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-300"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá thấp → cao</option>
              <option value="price-desc">Giá cao → thấp</option>
            </select>

            <span className="text-sm text-gray-500 ml-1">
              {loading ? '...' : <><strong className="text-gray-900">{filtered.length}</strong> xe</>}
            </span>

            {activeCount > 0 && (
              <button
                onClick={resetAll}
                className="ml-auto flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Xóa bộ lọc ({activeCount})
              </button>
            )}
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-2">Không tìm thấy xe phù hợp</h3>
            <p className="text-gray-500 text-sm mb-6">
              Thử thay đổi bộ lọc hoặc liên hệ để được tư vấn trực tiếp
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetAll}
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
