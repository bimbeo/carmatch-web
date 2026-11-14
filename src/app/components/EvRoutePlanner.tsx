import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, BatteryCharging, Coffee, Copy, ExternalLink, MapPin, MapPinned, PlugZap, Save, ShieldCheck } from 'lucide-react';
import type { Car } from '@/data/cars';
import { exactSpecForCar } from '@/data/evVehicleSpecs';
import { estimateEvTrip } from '@/lib/evTripPlanning';
import { trackEvent } from '@/lib/analytics';
import type { BookingSummary } from './BookingWidget';

function tomorrowLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(8, 0, 0, 0);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function bookingDeparture(summary: BookingSummary | null) {
  if (!summary) return tomorrowLocal();
  return `${summary.pickupDate}T${String(summary.pickupHour).padStart(2, '0')}:00`;
}

function isOutsideRental(departure: string, summary: BookingSummary | null) {
  if (!summary || !departure) return false;
  const rentalStart = `${summary.pickupDate}T${String(summary.pickupHour).padStart(2, '0')}:00`;
  const rentalEnd = `${summary.returnDate}T${String(summary.returnHour).padStart(2, '0')}:00`;
  return departure < rentalStart || departure > rentalEnd;
}

export default function EvRoutePlanner({ cars, selectedCar, bookingSummary, onSelect, onTripPlanChange }: {
  cars: Car[];
  selectedCar: Car;
  bookingSummary: BookingSummary | null;
  onSelect: (car: Car, source: string, pickupDate?: string, customerNote?: string) => void;
  onTripPlanChange?: (summary: string) => void;
}) {
  const [origin, setOrigin] = useState('Hà Nội');
  const [destination, setDestination] = useState('');
  const [departure, setDeparture] = useState(() => bookingDeparture(bookingSummary));
  const [departureTouched, setDepartureTouched] = useState(false);
  const [roundTrip, setRoundTrip] = useState(false);
  const [vehicleId, setVehicleId] = useState(selectedCar.id);
  const [vehicleTouched, setVehicleTouched] = useState(false);
  const [distance, setDistance] = useState(0);
  const [driveHours, setDriveHours] = useState(0);
  const [startSoc, setStartSoc] = useState(85);
  const [reserveSoc, setReserveSoc] = useState(15);
  const [condition, setCondition] = useState<'normal' | 'favorable' | 'demanding'>('normal');
  const [chargerKw, setChargerKw] = useState(60);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmVehicleSwitch, setConfirmVehicleSwitch] = useState(false);

  useEffect(() => {
    if (!vehicleTouched) setVehicleId(selectedCar.id);
  }, [selectedCar.id, vehicleTouched]);

  useEffect(() => {
    if (bookingSummary && !departureTouched) setDeparture(bookingDeparture(bookingSummary));
  }, [bookingSummary, departureTouched]);

  const vehicle = cars.find((car) => car.id === vehicleId) ?? selectedCar;
  const spec = exactSpecForCar(vehicle);
  const conditionFactor = condition === 'favorable' ? 0.8 : condition === 'demanding' ? 0.6 : 0.7;
  const estimate = useMemo(() => spec ? estimateEvTrip({ spec, routeDistanceKm: distance, roundTrip, startSoc, reserveSoc, conditionFactor, chargerKw }) : null, [chargerKw, conditionFactor, distance, reserveSoc, roundTrip, spec, startSoc]);
  const vehicleMismatch = vehicle.id !== selectedCar.id;
  const departureOutsideRental = isOutsideRental(departure, bookingSummary);
  const averageSpeed = distance > 0 && driveHours > 0 ? distance / driveHours : null;
  const speedNeedsReview = averageSpeed !== null && (averageSpeed < 15 || averageSpeed > 120);
  const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-bold text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20';
  const summary = estimate ? `[Kế hoạch chuyến đi]\n${origin} → ${destination}; quãng đường khách tự nhập: ${estimate.totalDistanceKm} km; ${roundTrip ? 'khứ hồi' : 'một chiều'}; xe: ${vehicle.name}; ${estimate.needsCharging ? `dự trù sạc bổ sung khoảng ${estimate.estimatedChargeMinutes} phút` : 'chưa cần dừng sạc theo giả định'}; pin dự kiến khi đến: khoảng ${estimate.expectedArrivalSoc}%; khởi hành: ${departure}; thời gian lái một chiều khách nhập: ${driveHours || 'chưa nhập'} giờ; nguồn khoảng cách/thời gian: khách tự nhập.` : '';

  const transferToBooking = () => {
    if (!estimate || departureOutsideRental) return;
    if (vehicleMismatch && !confirmVehicleSwitch) {
      setConfirmVehicleSwitch(true);
      return;
    }
    trackEvent('ev_trip_plan_to_booking', { vehicle_id: vehicle.id, distance_km: estimate.totalDistanceKm, round_trip: roundTrip, source: 'user_entered_route' });
    onTripPlanChange?.(summary);
    onSelect(vehicle, 'ev_route_planner', departure.slice(0, 10), summary);
    setConfirmVehicleSwitch(false);
    setVehicleTouched(false);
  };

  return (
    <section id="route-planner" className="scroll-mt-24 overflow-hidden bg-slate-950 py-16 text-white sm:py-20" aria-labelledby="ev-route-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">04 / Pin, sạc và hành trình</p>
            <h2 id="ev-route-heading" className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Ước tính pin và khả năng cần dừng sạc.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">Điện sạc tại trụ trong phạm vi chính sách thuê Car Match đã bao gồm trong giá thuê. Công cụ chỉ dùng quãng đường bạn nhập để ước tính pin và thời gian dừng.</p>
            <div className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {selectedCar.images?.[0] ? <img src={selectedCar.images[0]} alt={`Xe ${selectedCar.name} đang chọn thuê`} className="aspect-[16/9] w-full bg-slate-900 object-contain p-2 opacity-90" loading="lazy" decoding="async" /> : null}
              <div className="p-5">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">Xe và kỳ thuê hiện tại</span>
                <strong className="mt-2 block text-xl">{selectedCar.name}</strong>
                <p className="mt-1 text-sm text-slate-300">{bookingSummary ? `${bookingSummary.pickupDate} ${bookingSummary.pickupHour}:00 → ${bookingSummary.returnDate} ${bookingSummary.returnHour}:00` : 'Chọn lịch trong công cụ đặt xe để đồng bộ ngày khởi hành.'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Công cụ cho khách thuê xe điện</p><h3 className="mt-2 text-2xl font-black">Nhập điểm đi, điểm đến và quãng đường dự kiến</h3></div>
              <MapPinned className="h-8 w-8 flex-none text-emerald-300" />
            </div>
            <form className="mt-7" onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              setConfirmVehicleSwitch(false);
              trackEvent('ev_trip_plan_complete', { vehicle_id: vehicle.id, distance_km: distance, round_trip: roundTrip, has_estimate: Boolean(estimate), source: 'user_entered_route' });
            }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-200">Điểm xuất phát<input required className={fieldClass} value={origin} onChange={(e) => setOrigin(e.target.value)} /></label>
                <label className="text-sm font-bold text-slate-200">Điểm đến<input required className={fieldClass} placeholder="VD: Ninh Bình" value={destination} onChange={(e) => setDestination(e.target.value)} /></label>
                <label className="text-sm font-bold text-slate-200">Khởi hành lúc<input required type="datetime-local" className={fieldClass} value={departure} onChange={(e) => { setDeparture(e.target.value); setDepartureTouched(true); }} /></label>
                <label className="text-sm font-bold text-slate-200">Chiều đi<select className={fieldClass} value={roundTrip ? 'round' : 'one'} onChange={(e) => setRoundTrip(e.target.value === 'round')}><option value="one">Một chiều</option><option value="round">Khứ hồi cùng tuyến</option></select></label>
                <label className="text-sm font-bold text-slate-200">Xe dự kiến thuê<select className={fieldClass} value={vehicle.id} onChange={(e) => { setVehicleId(e.target.value); setVehicleTouched(true); setConfirmVehicleSwitch(false); }}>{cars.map((car) => <option key={car.id} value={car.id}>{car.name}</option>)}</select></label>
                <label className="text-sm font-bold text-slate-200">Khoảng cách một chiều do bạn nhập (km)<input required min={1} max={3000} type="number" className={fieldClass} value={distance || ''} placeholder="Sao chép từ ứng dụng bản đồ" onChange={(e) => setDistance(Number(e.target.value))} /></label>
                <label className="text-sm font-bold text-slate-200">Thời gian lái một chiều do bạn nhập (giờ)<input required min={0.1} max={48} step={0.1} type="number" className={fieldClass} value={driveHours || ''} placeholder="Sao chép từ ứng dụng bản đồ" onChange={(e) => setDriveHours(Number(e.target.value))} /></label>
                <label className="text-sm font-bold text-slate-200">Điều kiện lái<select className={fieldClass} value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)}><option value="normal">Hỗn hợp, dự phòng thận trọng</option><option value="favorable">Đường thuận lợi</option><option value="demanding">Cao tốc / tải nặng / đèo</option></select></label>
                <label className="text-sm font-bold text-slate-200">Pin lúc nhận xe (%)<input min={20} max={100} type="number" className={fieldClass} value={startSoc} onChange={(e) => setStartSoc(Number(e.target.value))} /></label>
                <label className="text-sm font-bold text-slate-200">Dự phòng khi đến (%)<input min={5} max={50} type="number" className={fieldClass} value={reserveSoc} onChange={(e) => setReserveSoc(Number(e.target.value))} /></label>
                <label className="text-sm font-bold text-slate-200 sm:col-span-2">Công suất trụ muốn đối chiếu<select className={fieldClass} value={chargerKw} onChange={(e) => setChargerKw(Number(e.target.value))}><option value={30}>DC 30 kW</option><option value={60}>DC 60 kW</option><option value={120}>DC 120 kW</option><option value={150}>DC 150 kW</option></select></label>
              </div>
              {vehicleMismatch && <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />Bạn đang lập kế hoạch cho xe khác với xe đã chọn thuê: <strong>{vehicle.name}</strong> thay vì <strong>{selectedCar.name}</strong>.</div>}
              {departureOutsideRental && <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100"><strong>Ngày khởi hành nằm ngoài kỳ thuê.</strong><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => { setDeparture(bookingDeparture(bookingSummary)); setDepartureTouched(false); }} className="rounded-lg bg-amber-200 px-3 py-2 text-xs font-black text-slate-950">Dùng ngày nhận xe</button><button type="button" onClick={() => document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="rounded-lg border border-amber-200/40 px-3 py-2 text-xs font-black">Đổi lịch thuê</button></div></div>}
              {speedNeedsReview && <p className="mt-3 text-xs font-semibold text-amber-200">Thời gian bạn nhập tương đương khoảng {Math.round(averageSpeed ?? 0)} km/h. Hãy đối chiếu lại trên ứng dụng bản đồ.</p>}
              <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 font-black text-slate-950 hover:bg-emerald-200">Ước tính pin và nhu cầu sạc <ArrowRight className="h-4 w-4" /></button>
            </form>

            {submitted && (
              <div className="mt-6 rounded-2xl bg-white p-5 text-slate-950" aria-live="polite">
                {!spec ? (
                  <p className="font-bold text-amber-800">Chưa thể tính pin: xe này chưa được ánh xạ đúng phiên bản/đời xe. Hãy chọn xe đã xác minh hoặc liên hệ vận hành.</p>
                ) : estimate ? (
                  <>
                    <div className="rounded-2xl bg-slate-950 p-4 text-white">
                      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                        <div className="rounded-xl bg-white/10 p-3"><MapPin className="h-5 w-5 text-emerald-300" /><span className="mt-2 block text-xs text-slate-400">Xuất phát</span><strong>{origin}</strong></div>
                        <div className="relative flex items-center justify-center gap-1 text-emerald-300"><span className="h-0.5 w-8 bg-emerald-300/50" /><PlugZap className="h-5 w-5" /><span className="h-0.5 w-8 bg-emerald-300/50" /></div>
                        <div className="rounded-xl bg-white/10 p-3"><ShieldCheck className="h-5 w-5 text-emerald-300" /><span className="mt-2 block text-xs text-slate-400">Điểm đến</span><strong>{destination}</strong></div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/10 px-3 py-1.5">{estimate.totalDistanceKm} km · do bạn nhập</span><span className="rounded-full bg-white/10 px-3 py-1.5">{driveHours || '—'} giờ · do bạn nhập</span><span className="rounded-full bg-white/10 px-3 py-1.5">{roundTrip ? 'Khứ hồi' : 'Một chiều'}</span></div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-100 p-3"><BatteryCharging className="h-5 w-5 text-emerald-700" /><span className="mt-2 block text-xs text-slate-500">Có cần sạc bổ sung?</span><strong className="mt-1 block">{estimate.needsCharging ? 'Có, cần dự trù' : 'Chưa cần theo giả định'}</strong></div>
                      <div className="rounded-xl bg-slate-100 p-3"><ShieldCheck className="h-5 w-5 text-emerald-700" /><span className="mt-2 block text-xs text-slate-500">Pin dự kiến khi đến</span><strong className="mt-1 block">Khoảng {estimate.expectedArrivalSoc}%</strong></div>
                      <div className="rounded-xl bg-slate-100 p-3"><Coffee className="h-5 w-5 text-emerald-700" /><span className="mt-2 block text-xs text-slate-500">Dừng nghỉ / sạc thêm</span><strong className="mt-1 block">{estimate.estimatedChargeMinutes} phút ước tính</strong></div>
                    </div>
                    {estimate.needsCharging && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Điểm dừng chưa được chỉ định.</strong> Công cụ không có API trạm realtime; hãy mở bản đồ hoặc ứng dụng VinFast để chọn trạm chính và trạm dự phòng.</div>}
                    <details className="mt-4 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-500"><summary className="cursor-pointer font-black text-slate-800">Cách tính và giả định kỹ thuật</summary><p className="mt-2">Tầm lập kế hoạch {estimate.conservativeRangeKm} km; phần tầm còn dùng được sau dự phòng {estimate.usableRangeKm} km; năng lượng bổ sung ước tính {estimate.additionalEnergyKwh} kWh. Công suất tính không vượt quá mức sạc nhanh tối đa {spec.dcMaxKw} kW của xe, dùng trung bình 62% và cộng 8 phút thao tác. Đây không phải thời gian sạc thực tế hay xác nhận trụ đang hoạt động.</p></details>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={() => { localStorage.setItem('carmatch_ev_trip_v1', JSON.stringify({ origin, destination, departure, roundTrip, vehicleId: vehicle.id, distance, driveHours, startSoc, reserveSoc, condition, chargerKw, source: 'user_entered_route' })); setSaved(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50"><Save className="h-4 w-4" />{saved ? 'Đã lưu' : 'Lưu kế hoạch'}</button>
                      <button type="button" onClick={() => { void navigator.clipboard?.writeText(summary); trackEvent('ev_plan_copy', { vehicle_id: vehicle.id }); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50"><Copy className="h-4 w-4" />Sao chép</button>
                      <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50">Mở Google Maps <ExternalLink className="h-4 w-4" /></a>
                    </div>
                    {confirmVehicleSwitch && vehicleMismatch && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Đổi xe đặt thuê sang {vehicle.name}?</strong><p className="mt-1">Ngày, điểm nhận và thông tin đã nhập sẽ được giữ; lịch và giá của xe mới sẽ được kiểm tra lại.</p><div className="mt-3 flex gap-2"><button type="button" onClick={transferToBooking} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">Xác nhận đổi xe</button><button type="button" onClick={() => setConfirmVehicleSwitch(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black">Giữ xe hiện tại</button></div></div>}
                    <button type="button" disabled={departureOutsideRental} onClick={transferToBooking} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{departureOutsideRental ? 'Điều chỉnh ngày khởi hành trước' : vehicleMismatch ? `Chọn ${vehicle.name} và chuyển sang đặt` : 'Giữ xe, ngày và hành trình để đặt'} <ArrowRight className="h-4 w-4" /></button>
                  </>
                ) : <p className="font-bold text-amber-800">Hãy nhập quãng đường hợp lệ để xem kế hoạch.</p>}
              </div>
            )}
          </div>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-400">Không có dữ liệu trạm realtime trong công cụ này. Hãy kiểm tra trụ đang khả dụng trên ứng dụng VinFast trước khi đi. Phí cầu đường, gửi xe, giao nhận, km vượt hoặc phí chiếm dụng vị trí sạc có thể nằm ngoài giá thuê.</p>
      </div>
    </section>
  );
}
