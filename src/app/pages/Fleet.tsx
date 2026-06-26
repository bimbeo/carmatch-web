import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] animate-pulse">
      <div className="relative aspect-[4/3] bg-slate-100">
        <div className="absolute left-3 top-3 h-7 w-16 rounded-full bg-white/80" />
      </div>
      <div className="p-4">
        <div className="h-5 w-2/3 rounded bg-slate-100" />
        <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
        <div className="mt-4 flex items-center gap-3">
          <div className="h-4 w-14 rounded bg-slate-100" />
          <div className="h-1 w-1 rounded-full bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-100" />
          <div className="h-1 w-1 rounded-full bg-slate-200" />
          <div className="h-4 w-10 rounded bg-slate-100" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="h-6 w-24 rounded bg-slate-100" />
          <div className="h-9 w-24 rounded-full bg-slate-100" />
        </div>
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
      className={`h-9 px-3.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
        active
          ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-none ring-1 ring-brand-100'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-950'
      }`}
    >
      {children}
      {count !== undefined && count > 0 && !active && (
        <span className="ml-1 text-slate-400">{count}</span>
      )}
    </button>
  );
}

export default function Fleet() {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasQueryParams = searchParams.toString().length > 0;

  // Filter values derived directly from URL — chips and sort stay in sync automatically
  const brandFilter  = searchParams.get('brand') || 'all';
  const fuelFilter   = parseFuelFilter(searchParams.get('fuelFilter') || searchParams.get('fuel'));
  const seatsFilter  = parseSeatsFilter(searchParams.get('seatFilter') || searchParams.get('seats'));
  const sortByRaw    = searchParams.get('sort') || '';
  const sortBy       = (sortByRaw === 'price-asc' || sortByRaw === 'price-desc' ? sortByRaw : 'default') as SortOption;

  // Setters update URL, preserving unrelated params (area, from, to, etc.)
  const setBrandFilter = (v: string) => setSearchParams(prev => {
    const n = new URLSearchParams(prev);
    if (v === 'all') n.delete('brand'); else n.set('brand', v);
    return n;
  }, { replace: true });

  const setFuelFilter = (v: FuelFilter) => setSearchParams(prev => {
    const n = new URLSearchParams(prev);
    if (v === 'all') n.delete('fuelFilter'); else n.set('fuelFilter', v);
    return n;
  }, { replace: true });

  const setSeatsFilter = (v: SeatsFilter) => setSearchParams(prev => {
    const n = new URLSearchParams(prev);
    if (v === 'all') n.delete('seatFilter'); else n.set('seatFilter', v);
    return n;
  }, { replace: true });

  const setSortBy = (v: SortOption) => setSearchParams(prev => {
    const n = new URLSearchParams(prev);
    if (v === 'default') n.delete('sort'); else n.set('sort', v);
    return n;
  }, { replace: true });

  useSEO({
    title: 'Thuê Xe Tự Lái Hà Nội — 20+ Mẫu Xe | Car Match',
    description: 'Duyệt 20+ xe tự lái Hà Nội, giá từ 600.000đ/ngày. Lọc theo ngày, số chỗ, nhiên liệu và nhắn Zalo để Car Match kiểm tra lịch.',
    canonical: 'https://www.carmatch.vn/xe',
    noIndex: hasQueryParams,
  });

  const { cars, loading, error } = useVehicles();

  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [leadArea, setLeadArea] = useState(searchParams.get('area') || '');
  const [leadDate, setLeadDate] = useState(searchParams.get('from') || '');
  const [leadPassengers, setLeadPassengers] = useState('');
  const [leadNeed, setLeadNeed] = useState('');

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

  const totalFuelCounts = useMemo(() => ({
    Điện: cars.filter((c) => c.fuel === 'Điện').length,
    Xăng: cars.filter((c) => c.fuel === 'Xăng').length,
  }), [cars]);

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
    searchParams.get('area') && `Nhận xe: ${searchParams.get('area')}`,
    searchParams.get('from') && `Nhận ngày: ${searchParams.get('from')}`,
    searchParams.get('to') && `Trả ngày: ${searchParams.get('to')}`,
    seatsFilter !== 'all' && `Số chỗ: ${seatsFilter}`,
    fuelFilter !== 'all' && `Nhiên liệu: ${fuelFilter}`,
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

  const resetAll = () => setSearchParams(prev => {
    const n = new URLSearchParams(prev);
    ['brand', 'fuelFilter', 'seatFilter', 'sort'].forEach(k => n.delete(k));
    return n;
  }, { replace: true });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="fleet" />

      {/* ── Header ── */}
      <div id="main-content" className="border-b border-slate-100 bg-white pt-24 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">Đội xe Car Match</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Thuê Xe Tự Lái Hà Nội
              </h1>
              <p className="mt-3 text-base font-medium text-slate-500">
                {loading
                  ? 'Đang tải danh sách xe...'
                  : `${cars.length} mẫu xe — Giao tận tòa nhà · Đặt qua Zalo · Xác nhận 30 phút`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[420px]">
              {[
                [loading ? '...' : `${cars.length}`, 'mẫu xe'],
                [`${totalFuelCounts['Điện'] || 0}`, 'xe điện'],
                [`${totalFuelCounts['Xăng'] || 0}`, 'xe xăng'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xl font-semibold tracking-tight text-slate-950">{value}</div>
                  <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {querySummary.length > 0 && (
          <div className="mb-5 grid gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-gray-900">Nhu cầu vừa chọn từ trang chủ</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{querySummary.join(' · ')}</p>
            </div>
            <a
              href={fleetZaloHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackZaloClick('fleet_query_summary')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              data-cta="fleet-query-zalo"
            >
              <MessageCircle className="h-4 w-4" />
              Kiểm tra lịch qua Zalo
            </a>
          </div>
        )}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Chọn xe</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{loading ? 'Đang tải xe...' : `${filtered.length} xe phù hợp`}</p>
          </div>
          {activeCount > 0 && (
            <button onClick={resetAll} className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900">
              <X className="h-3.5 w-3.5" /> Xóa lọc
            </button>
          )}
        </div>

        <DateRangeFilter onFilter={setUnavailableModels} onActiveChange={setDateFilterActive} />

        {dateFilterActive && !loading && (
          <div className="mb-4 inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
            Đang lọc: {filtered.length} xe trống lịch cho ngày bạn chọn
          </div>
        )}

        {/* ── Filter bar (Mioto-style) ── */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          {/* Scrollable chip row */}
          <div className="relative min-w-0 flex-1">
            <div className="overflow-x-auto pr-8 sm:pr-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              <div className="flex min-w-max items-center gap-2">
                {/* Brand chips */}
                {brands.length > 1 && (
                  <>
                    <Chip active={brandFilter === 'all'} onClick={() => setBrandFilter('all')}>Tất cả</Chip>
                    {brands.map((b) => (
                      <Chip key={b} active={brandFilter === b} count={brandCounts[b]} onClick={() => setBrandFilter(b)}>{b}</Chip>
                    ))}
                    <span className="mx-1 h-6 w-px flex-shrink-0 bg-slate-200" />
                  </>
                )}
                {/* Fuel chips */}
                <Chip active={fuelFilter === 'Điện'} count={fuelCounts['Điện']} onClick={() => setFuelFilter(fuelFilter === 'Điện' ? 'all' : 'Điện')}>⚡ Điện</Chip>
                <Chip active={fuelFilter === 'Xăng'} count={fuelCounts['Xăng']} onClick={() => setFuelFilter(fuelFilter === 'Xăng' ? 'all' : 'Xăng')}>Xăng</Chip>
                {hasDiesel && <Chip active={fuelFilter === 'Dầu'} count={fuelCounts['Dầu']} onClick={() => setFuelFilter(fuelFilter === 'Dầu' ? 'all' : 'Dầu')}>Dầu</Chip>}
                <span className="mx-1 h-6 w-px flex-shrink-0 bg-slate-200" />
                {/* Seat chips */}
                {availableSeats.map((s) => (
                  <Chip
                    key={s}
                    active={seatsFilter === String(s)}
                    count={seatCounts[s]}
                    onClick={() => setSeatsFilter(seatsFilter === String(s) ? 'all' : String(s) as SeatsFilter)}
                  >
                    {s} chỗ
                  </Chip>
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white via-white/90 to-transparent sm:hidden" />
          </div>

          {/* Count + reset */}
          <div className="flex flex-shrink-0 items-center gap-2 border-l border-slate-100 pl-3">
            <span className="hidden whitespace-nowrap text-sm font-medium text-slate-500 sm:inline">
              {loading ? '...' : <><strong className="text-slate-950">{filtered.length}</strong> xe</>}
            </span>
            {/* Bộ lọc button */}
            <button
              onClick={() => setShowFilter(true)}
              className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                sortBy !== 'default'
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'border-slate-300 text-slate-700 hover:border-slate-500 bg-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
              {sortBy !== 'default' && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white" />}
            </button>
          </div>
        </div>

        {/* ── Bộ lọc modal ── */}
        {showFilter && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) setShowFilter(false); }}
          >
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Bộ lọc nâng cao</h3>
                <button type="button" onClick={() => setShowFilter(false)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Sắp xếp */}
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Sắp xếp</p>
                  <div className="flex flex-col gap-3">
                    {([
                      ['default', 'Tối ưu (mặc định)'],
                      ['price-asc', 'Giá thấp trước'],
                      ['price-desc', 'Giá cao trước'],
                    ] as const).map(([val, label]) => (
                      <label key={val} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortBy === val}
                          onChange={() => setSortBy(val)}
                          className="w-4 h-4 accent-gray-900 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nhiên liệu */}
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Nhiên liệu</p>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      ['all', 'Tất cả'],
                      ['Điện', '⚡ Điện'],
                      ['Xăng', 'Xăng'],
                      ...(hasDiesel ? [['Dầu', 'Dầu']] : []),
                    ] as [FuelFilter, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFuelFilter(val)}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          fuelFilter === val ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Số chỗ */}
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Số chỗ</p>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      ['all', 'Tất cả'],
                      ...availableSeats.map((s) => [String(s), `${s} chỗ`]),
                    ] as [SeatsFilter, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSeatsFilter(val)}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          seatsFilter === val ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="border-t border-gray-100 px-5 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { resetAll(); setShowFilter(false); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilter(false)}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                  Xem {filtered.length} xe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((car) => (
              <CarCard key={car.id} car={car} mode="listing" source="fleet_list" />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleLeadSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          aria-label="Gửi nhu cầu thuê xe nhanh qua Zalo"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Chưa chắc nên thuê xe nào?</p>
              <p className="mt-0.5 text-xs text-gray-500">Điền thông tin — Car Match kiểm tra xe trống và báo giá qua Zalo.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={PHONE_LINK}
                onClick={() => trackPhoneClick('fleet_advice_banner')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Phone className="h-3.5 w-3.5" />
                Gọi ngay
              </a>
              <a
                href="/thue-xe-thang"
                onClick={() => trackCtaClick('fleet_monthly_banner', { target_path: '/thue-xe-thang' })}
                className="hidden sm:inline-flex items-center rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
              >
                Thuê theo tháng
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="sr-only">Khu vực nhận xe</span>
                <input
                  value={leadArea}
                  onChange={(event) => setLeadArea(event.target.value)}
                  placeholder="Khu vực nhận xe"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="sr-only">Ngày nhận xe dự kiến</span>
                <div className="relative h-10 w-full">
                  <div className="h-10 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm text-gray-800 flex items-center pointer-events-none">
                    {leadDate ? leadDate.split('-').reverse().join('/') : 'Ngày nhận xe'}
                  </div>
                  <input
                    type="date"
                    value={leadDate}
                    onChange={(event) => setLeadDate(event.target.value)}
                    onClick={(event) => (event.currentTarget as HTMLInputElement & { showPicker?(): void }).showPicker?.()}
                    className="absolute inset-0 opacity-0 w-full cursor-pointer"
                  />
                </div>
              </label>
              <label className="block">
                <span className="sr-only">Số người và hành lý</span>
                <input
                  value={leadPassengers}
                  onChange={(event) => setLeadPassengers(event.target.value)}
                  placeholder="Số người / hành lý"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="sr-only">Nhu cầu chuyến đi</span>
                <input
                  value={leadNeed}
                  onChange={(event) => setLeadNeed(event.target.value)}
                  placeholder="Đi tỉnh, nội thành..."
                  className="h-10 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              data-cta="fleet-quick-lead-zalo"
            >
              <MessageCircle className="h-4 w-4" />
              Gửi Zalo
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
