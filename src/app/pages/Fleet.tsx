import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router';
import { MessageCircle, Phone, SlidersHorizontal, X } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import CarCard from '../components/CarCard';
import DateRangeFilter from '../components/DateRangeFilter';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0975563290';
const PHONE_LINK = 'tel:0975563290';

function buildZaloHref(message: string) {
  return `${ZALO_LINK}?text=${encodeURIComponent(message)}`;
}

type FuelFilter  = 'all' | 'Điện' | 'Xăng' | 'Dầu';
type SeatsFilter = 'all' | '4' | '5' | '7' | '8+';
type SortOption  = 'default' | 'price-asc' | 'price-desc';

function parseFuelFilter(value: string | null): FuelFilter {
  return value === 'Điện' || value === 'Xăng' || value === 'Dầu' ? value : 'all';
}

function parseSeatsFilter(value: string | null): SeatsFilter {
  return value === '4' || value === '5' || value === '7' || value === '8+' ? value : 'all';
}

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
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
      }`}
    >
      {children}
      {count !== undefined && count > 0 && !active && (
        <span className="ml-0.5 text-gray-400">{count}</span>
      )}
    </button>
  );
}

export default function Fleet() {
  const { search } = useLocation();
  const hasQueryParams = search.length > 0;
  const queryFilters = useMemo(() => {
    const params = new URLSearchParams(search);
    return {
      area: params.get('area') || '',
      from: params.get('from') || '',
      to: params.get('to') || '',
      fuel: parseFuelFilter(params.get('fuelFilter') || params.get('fuel')),
      seats: parseSeatsFilter(params.get('seatFilter') || params.get('seats')),
    };
  }, [search]);

  useSEO({
    title: 'Thuê Xe Tự Lái Hà Nội — 20+ Mẫu Xe | Car Match',
    description: 'Duyệt 20+ mẫu xe tự lái cho thuê tại Hà Nội: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 600K/ngày. Giao xe tận sảnh tòa nhà.',
    canonical: 'https://www.carmatch.vn/xe',
    noIndex: hasQueryParams,
  });

  const { cars, loading, error } = useVehicles();

  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [fuelFilter,  setFuelFilter]  = useState<FuelFilter>(queryFilters.fuel);
  const [seatsFilter, setSeatsFilter] = useState<SeatsFilter>(queryFilters.seats);
  const [sortBy,      setSortBy]      = useState<SortOption>('default');
  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [leadArea, setLeadArea] = useState(queryFilters.area);
  const [leadDate, setLeadDate] = useState(queryFilters.from);
  const [leadPassengers, setLeadPassengers] = useState('');
  const [leadNeed, setLeadNeed] = useState('');

  useEffect(() => {
    setFuelFilter(queryFilters.fuel);
    setSeatsFilter(queryFilters.seats);
  }, [queryFilters.fuel, queryFilters.seats]);

  useEffect(() => {
    if (queryFilters.area) setLeadArea(queryFilters.area);
    if (queryFilters.from) setLeadDate(queryFilters.from);
  }, [queryFilters.area, queryFilters.from]);

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
    if (unavailableModels.length > 0) {
      r = r.filter((c) => !unavailableModels.includes(c.name));
    }
    if (sortBy === 'price-asc')  r.sort((a, b) => (a.price || 9_999_999) - (b.price || 9_999_999));
    if (sortBy === 'price-desc') r.sort((a, b) => (b.price || 0) - (a.price || 0));
    return r;
  }, [cars, brandFilter, fuelFilter, seatsFilter, sortBy, unavailableModels]);

  const activeCount =
    (brandFilter  !== 'all' ? 1 : 0) +
    (fuelFilter   !== 'all' ? 1 : 0) +
    (seatsFilter  !== 'all' ? 1 : 0);

  const querySummary = [
    queryFilters.area && `Nhận xe: ${queryFilters.area}`,
    queryFilters.from && `Nhận ngày: ${queryFilters.from}`,
    queryFilters.to && `Trả ngày: ${queryFilters.to}`,
    queryFilters.seats !== 'all' && `Số chỗ: ${queryFilters.seats}`,
    queryFilters.fuel !== 'all' && `Nhiên liệu: ${queryFilters.fuel}`,
  ].filter(Boolean);

  const leadFilterSummary = useMemo(() => [
    brandFilter !== 'all' && `Hãng xe: ${brandFilter}`,
    fuelFilter !== 'all' && `Nhiên liệu: ${fuelFilter}`,
    seatsFilter !== 'all' && `Số chỗ: ${seatsFilter}`,
    sortBy !== 'default' && `Sắp xếp: ${sortBy === 'price-asc' ? 'giá thấp trước' : 'giá cao trước'}`,
  ].filter(Boolean), [brandFilter, fuelFilter, seatsFilter, sortBy]);

  const fleetZaloMessage = useMemo(() => [
    'Xin chào Car Match, tôi cần thuê xe tự lái tại Hà Nội.',
    leadArea.trim() ? `Khu vực nhận xe: ${leadArea.trim()}` : 'Khu vực nhận xe: cần tư vấn',
    leadDate ? `Ngày dự kiến nhận xe: ${leadDate}` : 'Ngày dự kiến nhận xe: cần tư vấn',
    leadPassengers.trim() ? `Số người/hành lý: ${leadPassengers.trim()}` : 'Số người/hành lý: chưa chắc',
    leadNeed.trim() ? `Nhu cầu chuyến đi: ${leadNeed.trim()}` : 'Nhu cầu chuyến đi: cần Car Match gợi ý xe phù hợp',
    leadFilterSummary.length ? `Bộ lọc đang xem: ${leadFilterSummary.join(', ')}` : null,
    `Số xe đang xem sau lọc: ${filtered.length}`,
    '',
    'Car Match kiểm tra giúp xe còn lịch trống, giá thuê, cọc và điểm giao nhận phù hợp ạ.',
  ].filter(Boolean).join('\n'), [
    filtered.length,
    leadArea,
    leadDate,
    leadFilterSummary,
    leadNeed,
    leadPassengers,
  ]);

  const fleetZaloHref = buildZaloHref(fleetZaloMessage);

  const handleLeadSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    trackZaloClick('fleet_quick_lead_form', {
      area: leadArea || null,
      pickup_date: leadDate || null,
      passengers: leadPassengers || null,
      need: leadNeed || null,
      filtered_count: filtered.length,
      brand_filter: brandFilter,
      fuel_filter: fuelFilter,
      seats_filter: seatsFilter,
    });
    window.open(fleetZaloHref, '_blank', 'noopener,noreferrer');
  };

  const resetAll = () => {
    setBrandFilter('all');
    setFuelFilter('all');
    setSeatsFilter('all');
    setSortBy('default');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="fleet" />

      {/* ── Header ── */}
      <div id="main-content" className="bg-white border-b border-gray-100 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Đội xe Car Match</p>
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
        <DateRangeFilter onFilter={setUnavailableModels} onActiveChange={setDateFilterActive} />

        {querySummary.length > 0 && (
          <div className="mb-5 grid gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold text-gray-900">Nhu cầu vừa chọn từ trang chủ</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{querySummary.join(' · ')}</p>
            </div>
            <a
              href={fleetZaloHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('fleet_query_summary')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              data-cta="fleet-query-zalo"
            >
              <MessageCircle className="h-4 w-4" />
              Kiểm tra lịch qua Zalo
            </a>
          </div>
        )}

        <div className="mb-6 grid gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold text-gray-900">Chưa chắc nên thuê xe nào?</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Gửi khu vực nhận xe, ngày đi và số người. Car Match sẽ lọc xe phù hợp rồi báo giá nhanh qua Zalo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <a
              href={fleetZaloHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('fleet_advice_banner')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              <MessageCircle className="h-4 w-4" />
              Tư vấn Zalo
            </a>
            <a
              href={PHONE_LINK}
              onClick={() => trackPhoneClick('fleet_advice_banner')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50"
            >
              <Phone className="h-4 w-4" />
              Gọi ngay
            </a>
            <a
              href="/thue-xe-thang"
              onClick={() => trackCtaClick('fleet_monthly_banner', { target_path: '/thue-xe-thang' })}
              className="col-span-2 inline-flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100 sm:col-span-1"
            >
              Thuê theo tháng
            </a>
          </div>
        </div>

        <form
          onSubmit={handleLeadSubmit}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          aria-label="Gửi nhu cầu thuê xe nhanh qua Zalo"
        >
          <div className="grid gap-4 lg:grid-cols-[0.95fr_2fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-black text-gray-900">Gửi nhu cầu nhanh</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Car Match nhận thông tin này qua Zalo rồi kiểm tra xe trống, giá và cọc trước khi chốt lịch.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="sr-only">Khu vực nhận xe</span>
                <input
                  value={leadArea}
                  onChange={(event) => setLeadArea(event.target.value)}
                  placeholder="Khu vực nhận xe"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="sr-only">Ngày nhận xe dự kiến</span>
                <input
                  type="date"
                  value={leadDate}
                  onChange={(event) => setLeadDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="sr-only">Số người và hành lý</span>
                <input
                  value={leadPassengers}
                  onChange={(event) => setLeadPassengers(event.target.value)}
                  placeholder="Số người / hành lý"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="sr-only">Nhu cầu chuyến đi</span>
                <input
                  value={leadNeed}
                  onChange={(event) => setLeadNeed(event.target.value)}
                  placeholder="Đi tỉnh, nội thành..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm font-semibold text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-black text-white transition-colors hover:bg-brand-700"
              data-cta="fleet-quick-lead-zalo"
            >
              <MessageCircle className="h-4 w-4" />
              Gửi Zalo
            </button>
          </div>
        </form>

        {dateFilterActive && !loading && (
          <div className="mb-5 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
            Đang lọc: {filtered.length} xe available cho ngày bạn chọn
          </div>
        )}

        {/* ── Filter panel ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-8">

          <div className="px-4 py-3 space-y-2.5">
            {/* Brand row */}
            {brands.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-14 shrink-0">Hãng xe</span>
                <Chip active={brandFilter === 'all'} onClick={() => setBrandFilter('all')}>Tất cả</Chip>
                {brands.map((b) => (
                  <Chip key={b} active={brandFilter === b} count={brandCounts[b]} onClick={() => setBrandFilter(b)}>
                    {b}
                  </Chip>
                ))}
              </div>
            )}

            {/* Fuel + Seats on same row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Fuel */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-14 shrink-0">Nhiên liệu</span>
                <Chip active={fuelFilter === 'all'} onClick={() => setFuelFilter('all')}>Tất cả</Chip>
                <Chip active={fuelFilter === 'Điện'} count={fuelCounts['Điện']} onClick={() => setFuelFilter('Điện')}>⚡ Điện</Chip>
                <Chip active={fuelFilter === 'Xăng'} count={fuelCounts['Xăng']} onClick={() => setFuelFilter('Xăng')}>Xăng</Chip>
                {hasDiesel && <Chip active={fuelFilter === 'Dầu'} count={fuelCounts['Dầu']} onClick={() => setFuelFilter('Dầu')}>Dầu</Chip>}
              </div>

              <div className="w-px h-4 bg-gray-200 hidden sm:block" />

              {/* Seats */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-10 shrink-0">Số chỗ</span>
                <Chip active={seatsFilter === 'all'} onClick={() => setSeatsFilter('all')}>Tất cả</Chip>
                {availableSeats.map((s) => (
                  <Chip key={s} active={seatsFilter === String(s)} count={seatCounts[s]}
                    onClick={() => setSeatsFilter(String(s) as SeatsFilter)}>
                    {s} chỗ
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Sort bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-50">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-gray-600 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-200 border border-gray-200"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá thấp → cao</option>
              <option value="price-desc">Giá cao → thấp</option>
            </select>

            <span className="text-xs text-gray-400">
              {loading ? '...' : <><strong className="text-gray-700">{filtered.length}</strong> xe</>}
            </span>

            {activeCount > 0 && (
              <button onClick={resetAll} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-3 h-3" /> Xóa lọc
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
            <a href={fleetZaloHref} target="_blank" rel="noopener noreferrer"
              onClick={() => trackZaloClick('fleet_error_state')}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
              Liên hệ qua Zalo
            </a>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
            {filtered.map((car) => (
              <CarCard key={car.id} car={car} source="fleet_list" />
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
                href={fleetZaloHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackZaloClick('fleet_empty_state')}
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
