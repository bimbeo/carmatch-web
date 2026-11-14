import { useState } from 'react';
import { ArrowRight, ExternalLink, ShieldAlert } from 'lucide-react';
import type { Car } from '@/data/cars';
import { formatPrice } from '@/data/cars';
import { EV_VEHICLE_SPECS, evFamilyFromCar, findExactVehicleForSpec, type EvVehicleSpec } from '@/data/evVehicleSpecs';
import { trackEvent } from '@/lib/analytics';

function specValue(value: number | null, suffix: string) {
  return value === null ? 'Chờ xác minh theo đời xe' : `${value.toLocaleString('vi-VN')} ${suffix}`;
}

function MetricBar({ label, value, display, max }: { label: string; value: number | null; display: string; max: number }) {
  const width = value === null ? 0 : Math.min(100, Math.max(8, value / max * 100));
  return <div><div className="flex justify-between gap-3 text-xs"><span className="text-slate-500">{label}</span><strong className="text-right text-slate-950">{display}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} /></div></div>;
}

function CompareCell({ spec, cars, onSelect }: { spec: EvVehicleSpec; cars: Car[]; onSelect: (car: Car, source: string) => void }) {
  const car = findExactVehicleForSpec(spec, cars);
  const visualCar = cars.find((candidate) => evFamilyFromCar(candidate) === spec.family && Boolean(candidate.images?.[0])) ?? car ?? null;
  return (
    <div className="space-y-3">
      {visualCar?.images?.[0] ? <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-200"><img src={visualCar.images[0]} alt={`Ảnh dòng xe ${spec.family} từ danh mục Car Match`} className="absolute inset-0 h-full w-full object-contain p-2" loading="lazy" decoding="async" /><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase text-slate-800">Ảnh xe trong danh mục</span></div> : null}
      <p className="text-2xl font-black">{spec.displayName}</p>
      <p className="text-sm text-slate-500">{car ? `Giá thuê tham khảo từ ${formatPrice(car.price)}/ngày` : 'Chưa xác định đúng xe và phiên bản đang cho thuê'}</p>
      <div className="space-y-4 rounded-2xl bg-white p-4">
        <MetricBar label="Dung lượng pin công bố" value={spec.batteryCapacityKwh} display={specValue(spec.batteryCapacityKwh, 'kWh')} max={80} />
        <MetricBar label="Quãng đường công bố" value={spec.rangeKm} display={spec.rangeKm ? `${spec.rangeKm.toLocaleString('vi-VN')} km` : 'Chờ xác minh'} max={550} />
        <MetricBar label="Sạc DC tối đa" value={spec.dcMaxKw} display={specValue(spec.dcMaxKw, 'kW')} max={150} />
        <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{spec.fastCharge ?? 'Thời gian sạc chưa xác minh'}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Nguồn hãng · {spec.verifiedAt}</span></div>
      </div>
      {car ? (
        <button type="button" onClick={() => {
          trackEvent('ev_compare_vehicle_select', { spec_key: spec.key, vehicle_id: car.id });
          onSelect(car, 'ev_comparison');
        }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white hover:bg-emerald-800">Chọn xe này để đặt lịch <ArrowRight className="h-4 w-4" /></button>
      ) : (
        <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800"><ShieldAlert className="h-4 w-4 flex-none" />Cần chọn xe cụ thể đã được vận hành xác minh phiên bản trước khi gửi booking.</p>
      )}
    </div>
  );
}
export default function EvVehicleComparison({ cars, onSelect }: { cars: Car[]; onSelect: (car: Car, source: string) => void }) {
  const initialA = EV_VEHICLE_SPECS.find((spec) => spec.key === 'vf5-current') ?? EV_VEHICLE_SPECS[0];
  const initialB = EV_VEHICLE_SPECS.find((spec) => spec.key === 'vf6-eco-current') ?? EV_VEHICLE_SPECS[1];
  const [aKey, setAKey] = useState(initialA.key);
  const [bKey, setBKey] = useState(initialB.key);
  const a = EV_VEHICLE_SPECS.find((spec) => spec.key === aKey) ?? initialA;
  const b = EV_VEHICLE_SPECS.find((spec) => spec.key === bKey) ?? initialB;
  const selectClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <section id="ev-comparison" className="scroll-mt-24 border-t border-slate-200 bg-white py-16 sm:py-20" aria-labelledby="ev-comparison-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">So sánh theo đúng phiên bản</p>
            <h2 id="ev-comparison-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Pin bao nhiêu? Đi được bao xa? Sạc nhanh thế nào?</h2>
            <p className="mt-4 max-w-3xl text-slate-600">Quãng đường công bố là số km hãng đo trong điều kiện thử nghiệm; thực tế có thể thấp hơn tùy tốc độ, điều hòa, tải trọng và thời tiết. Xe Car Match vẫn cần được đối chiếu đúng đời xe trước khi chọn.</p>
          </div>
          <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-emerald-800 hover:underline">Xem nguồn hãng <ExternalLink className="h-4 w-4" /></a>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">Mẫu xe / phiên bản A
            <select className={selectClass} value={aKey} onChange={(event) => setAKey(event.target.value)}>{EV_VEHICLE_SPECS.map((spec) => <option key={spec.key} value={spec.key}>{spec.displayName}</option>)}</select>
          </label>
          <label className="text-sm font-bold text-slate-700">Mẫu xe / phiên bản B
            <select className={selectClass} value={bKey} onChange={(event) => setBKey(event.target.value)}>{EV_VEHICLE_SPECS.map((spec) => <option key={spec.key} value={spec.key}>{spec.displayName}</option>)}</select>
          </label>
        </div>
        <div className="mt-6 grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-7 lg:grid-cols-2 lg:gap-10">
          <CompareCell spec={a} cars={cars} onSelect={onSelect} />
          <CompareCell spec={b} cars={cars} onSelect={onSelect} />
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Thông số tham chiếu được kiểm tra ngày 14/11/2026. Thông số hiện hành có thể khác xe đời 2023–2025 đang cho thuê.</p>
      </div>
    </section>
  );
}
