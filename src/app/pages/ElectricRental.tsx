import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BatteryCharging, CalendarCheck2, CheckCircle2, ExternalLink, MapPin, MessageCircle, Phone, PlugZap, Route, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { cars as fallbackCars, formatPrice, type Car as CarModel } from '@/data/cars';
import { EV_FAMILIES, evFamilyFromCar, exactSpecForCar } from '@/data/evVehicleSpecs';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackEvent, trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import BookingWidget, { BOOKING_PICKUP_LOCATIONS, type BookingOpenRequest, type BookingSummary } from '../components/BookingWidget';
import EvRecommendationQuiz from '../components/EvRecommendationQuiz';
import EvRoutePlanner from '../components/EvRoutePlanner';
import EvVehicleComparison from '../components/EvVehicleComparison';
import Footer from '../components/Footer';
import MobileConversionBar from '../components/MobileConversionBar';
import Navbar from '../components/Navbar';
import ZaloFAB from '../components/ZaloFAB';

const ZALO_LINK = 'https://zalo.me/0971163290';
const PHONE_LINK = 'tel:0971163290';

const costItems = [
  [WalletCards, 'Giá thuê xe', 'Tính theo xe thực tế, lịch thuê, phụ phí và ưu đãi từ công cụ đặt xe dùng chung.'],
  [BatteryCharging, 'Điện sạc tại trụ', 'Đã nằm trong giá thuê theo chính sách Car Match; không cộng thêm giá điện giả định.'],
  [MapPin, 'Giao nhận xe', 'Tính theo hình thức nhận/trả, địa chỉ và chính sách đang áp dụng.'],
  [ShieldCheck, 'Khoản ngoài chính sách', 'Cầu đường, gửi xe, km vượt hoặc phí chiếm dụng trụ có thể phát sinh.'],
];

const electricFaqs = [
  { question: 'Nếu pin xuống thấp trong chuyến thì nên làm gì?', answer: 'Giảm tải điện không cần thiết, mở ứng dụng VinFast hoặc bản đồ để tìm trụ phù hợp và chuẩn bị một trạm dự phòng. Không cố đi tiếp nếu mức pin không đủ an toàn theo quãng đường còn lại.' },
  { question: 'Mức pin khi nhận và trả xe được xác nhận thế nào?', answer: 'Khách và nhân viên Car Match chụp mức pin, số km và tình trạng phụ kiện khi bàn giao. Mức pin trả xe cùng các khoản ngoài chính sách cần được thống nhất trước khi nhận.' },
  { question: 'Chi phí sạc có bao gồm trong giá thuê không?', answer: 'Có. Theo chính sách kinh doanh Car Match cung cấp cho trang này, điện sạc tại trụ nằm trong giá thuê. Khách vẫn cần xác minh phạm vi trụ áp dụng, mức pin giao/trả và các khoản ngoài tiền điện như phí chiếm dụng vị trí sạc.' },
  { question: 'Nếu trụ sạc lỗi hoặc đang bận thì xử lý ra sao?', answer: 'Kiểm tra trạng thái trên ứng dụng VinFast, chuyển sang trạm dự phòng và liên hệ hỗ trợ khi cần. Trang này không có dữ liệu trạm theo thời gian thực nên không khẳng định trụ đang trống hoặc hoạt động.' },
  { question: 'Gửi yêu cầu có nghĩa là xe đã được xác nhận chưa?', answer: 'Chưa. Hệ thống ghi nhận yêu cầu và mã tham chiếu; Car Match chỉ xác nhận đơn đặt xe sau khi kiểm tra lịch xe, điều kiện thuê và khoản cọc cần thiết.' },
];

function familyFit(family: string, car: CarModel) {
  if (family === 'VF3') return 'Đi phố, 1–4 người, ưu tiên xe nhỏ gọn.';
  if (family === 'VF5') return 'Đi làm hằng ngày, gia đình nhỏ, dễ di chuyển nội đô.';
  if (family === 'VF6') return 'Gia đình 5 người, cân bằng không gian và chi phí.';
  if (family === 'VF7') return 'Gia đình, đi tỉnh, cần crossover rộng hơn.';
  if (family === 'VF8') return 'Ưu tiên không gian, tiện nghi và hành trình dài.';
  if (family === 'Limo Green') return 'Nhóm đông người hoặc gia đình cần xe 7 chỗ.';
  return `${car.seats} chỗ, phù hợp nhu cầu cần xe điện tự lái.`;
}
function pickRepresentativeCars(cars: CarModel[]) {
  const result = new Map<string, CarModel>();
  for (const family of EV_FAMILIES) {
    const match = cars.find((car) => evFamilyFromCar(car) === family);
    if (match) result.set(family, match);
  }
  return [...result.values()];
}

export default function ElectricRental() {
  useSEO({
    title: 'Thuê Xe Điện Tự Lái Hà Nội | Car Match',
    description: 'Khám phá xe điện VinFast tại Hà Nội, so sánh pin và phiên bản, lập kế hoạch chuyến đi, kiểm tra lịch và gửi yêu cầu thuê ngay trên Car Match.',
    canonical: 'https://www.carmatch.vn/thue-xe-dien-ha-noi',
  });

  const { cars } = useVehicles();
  const availableCatalog = cars.length > 0 ? cars : fallbackCars;
  const electricCars = useMemo(() => availableCatalog.filter((car) => car.fuel === 'Điện' && car.price > 0).sort((a, b) => a.price - b.price), [availableCatalog]);
  const bookableCars = useMemo(() => electricCars.filter((car) => car.available !== false), [electricCars]);
  const showroomCars = useMemo(() => pickRepresentativeCars(bookableCars), [bookableCars]);
  const initialCar = bookableCars.find((car) => evFamilyFromCar(car) === 'VF5') ?? bookableCars[0] ?? electricCars[0] ?? fallbackCars[0];
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialCar.id);
  const [bookingOpenRequest, setBookingOpenRequest] = useState<BookingOpenRequest | null>(null);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [tripPlanSummary, setTripPlanSummary] = useState('');
  const [showroomImageIndex, setShowroomImageIndex] = useState(0);
  const selectedCar = bookableCars.find((car) => car.id === selectedVehicleId) ?? bookableCars[0] ?? initialCar;
  const selectedSpec = exactSpecForCar(selectedCar);
  const selectedImages = selectedCar.images?.slice(0, 4) ?? [];
  const startingPrice = electricCars.length > 0 ? Math.min(...electricCars.map((car) => car.price)) : null;
  const zaloHref = `${ZALO_LINK}?text=${encodeURIComponent('Tôi muốn thuê xe điện tự lái tại Hà Nội. Nhờ Car Match kiểm tra mẫu xe và lịch phù hợp.')}`;

  useEffect(() => setShowroomImageIndex(0), [selectedCar.id]);

  const chooseForBooking = (car: CarModel, source: string, pickupDate?: string, customerNote?: string) => {
    if (car.available === false) return;
    setSelectedVehicleId(car.id);
    if (customerNote) setTripPlanSummary(customerNote);
    setBookingOpenRequest({ id: Date.now(), source, vehicleId: car.id, pickupDate, customerNote });
    trackEvent('booking_start', { vehicle_id: car.id, vehicle_name: car.name, source, pickup_date: pickupDate ?? null });
    requestAnimationFrame(() => document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="min-h-screen bg-[#f8f6ef] pb-28 text-slate-950 sm:pb-0">
      <Navbar />
      <main id="main-content">
        <section className="relative isolate overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(52,211,153,0.16),transparent_28%),radial-gradient(circle_at_48%_110%,rgba(59,130,246,0.12),transparent_38%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-900/80" />
          <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Car Match / Khám phá xe điện</p>
              <h1 aria-label="Thuê xe điện tự lái tại Hà Nội" className="mt-5 text-5xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">Thuê xe điện<br /><span className="text-emerald-300">tự lái tại Hà Nội.</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">Khám phá VF3–VF8 và Limo Green, so sánh phiên bản, lập kế hoạch pin–sạc, kiểm tra lịch và gửi yêu cầu thuê ngay trên trang.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#fleet" onClick={() => trackCtaClick('electric_v5_explore', { target_path: '#fleet' })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 font-black text-slate-950 hover:bg-emerald-200">Chọn xe & xem lịch <ArrowRight className="h-4 w-4" /></a>
                <a href="#route-planner" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 font-black text-white hover:bg-white/15">Tìm hiểu pin & sạc <BatteryCharging className="h-4 w-4" /></a>
              </div>
              <div className="mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Danh mục hiện tại</span><strong className="mt-1 block text-2xl">{electricCars.length} xe điện</strong></div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-xs text-slate-400">Giá ngày từ</span><strong className="mt-1 block text-2xl">{startingPrice ? formatPrice(startingPrice) : 'Đang cập nhật'}</strong></div>
                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-1"><span className="text-xs text-slate-400">Đặt ngay trên trang</span><strong className="mt-1 block text-2xl">Gửi yêu cầu trực tuyến</strong></div>
              </div>
            </div>
            <div className="relative hidden min-h-[450px] items-center justify-center lg:flex" aria-label="VinFast VF5 trắng của Car Match">
              <div className="absolute h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
              <img src="/images/electric-hero-crossover.webp" alt="VinFast VF5 trắng Car Match đã được tách nền" className="relative h-auto max-h-[550px] w-[116%] max-w-none -translate-x-2 object-contain drop-shadow-[0_30px_36px_rgba(0,0,0,0.45)] xl:w-[122%]" fetchPriority="high" decoding="async" />
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-7" aria-label="Trả lời nhanh về thuê xe điện"><div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">{[
          ['Mẫu xe', showroomCars.length > 0 ? `${showroomCars.map((car) => evFamilyFromCar(car)).filter(Boolean).join(', ')} trong danh mục hiện tại.` : 'Danh mục xe đang được cập nhật.'],
          ['Giá thuê', startingPrice ? `Từ ${formatPrice(startingPrice)}/ngày; tổng giá thay đổi theo xe, lịch và giao nhận.` : 'Xem giá trên từng xe trước khi gửi yêu cầu.'],
          ['Điện sạc', 'Điện tại trụ nằm trong giá thuê trong phạm vi chính sách; phí đỗ hoặc chiếm dụng trụ có thể tách riêng.'],
          ['Đặt thuê', 'Chọn xe và thời gian để kiểm tra lịch. Yêu cầu cần điều phối sẽ được xác nhận trước khi hướng dẫn cọc.'],
        ].map(([title, answer]) => <article key={title} className="rounded-2xl bg-slate-50 p-4"><h2 className="text-sm font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{answer}</p></article>)}</div></section>

        <section id="fleet" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">01 / Khám phá đội xe điện</p>
            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><h2 className="text-4xl font-black tracking-tight sm:text-5xl">Khám phá mẫu xe.<br />Đặt lịch khi bạn sẵn sàng.</h2><p className="mt-4 max-w-2xl text-slate-600">Chọn một xe cụ thể từ danh mục Car Match. Công cụ đặt xe sẽ kiểm tra lại giá và lịch của đúng xe đó.</p></div><Link to="/xe?fuelFilter=%C4%90i%E1%BB%87n" className="inline-flex items-center gap-2 font-black text-emerald-800">Xem toàn bộ xe điện <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Chọn xe điện">
              {showroomCars.map((car) => { const active = car.id === selectedCar.id; return <button key={car.id} type="button" role="tab" aria-selected={active} onClick={() => { setSelectedVehicleId(car.id); trackEvent('ev_showroom_vehicle_select', { vehicle_id: car.id, vehicle_name: car.name, source: 'showroom_tab' }); }} className={`min-w-32 rounded-xl border px-4 py-3 text-left transition ${active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-emerald-400'}`}><span className="block text-[10px] font-black uppercase tracking-wider opacity-60">VinFast / Điện</span><strong className="mt-1 block">{evFamilyFromCar(car) ?? car.name}</strong></button>; })}
            </div>
            <div className="mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/20 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="bg-slate-100 p-3 sm:p-4"><div className="relative min-h-80 overflow-hidden rounded-2xl bg-slate-200 lg:min-h-[430px]">{selectedImages[showroomImageIndex] ? <img src={selectedImages[showroomImageIndex]} alt={`Ảnh ${showroomImageIndex + 1} của xe ${selectedCar.name}`} className="absolute inset-0 h-full w-full object-contain p-3" loading="lazy" decoding="async" /> : <div className="flex h-full items-center justify-center font-black text-slate-500">Ảnh xe đang cập nhật</div>}<span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-black shadow">Ảnh thật từ danh mục Car Match</span></div>{selectedImages.length > 1 && <div className="mt-3 grid grid-cols-3 gap-2">{selectedImages.slice(0, 3).map((image, index) => <button key={image} type="button" aria-label={`Xem ảnh ${index + 1} của ${selectedCar.name}`} onClick={() => setShowroomImageIndex(index)} className={`overflow-hidden rounded-xl border-2 bg-slate-200 ${showroomImageIndex === index ? 'border-emerald-500' : 'border-transparent'}`}><img src={image} alt="" className="aspect-[16/9] w-full object-contain p-1" loading="lazy" decoding="async" /></button>)}</div>}</div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Mẫu xe đang khám phá</p><h3 className="mt-3 text-4xl font-black">{selectedCar.name}</h3><p className="mt-4 leading-7 text-slate-600">{selectedCar.description || familyFit(evFamilyFromCar(selectedCar) ?? selectedCar.name, selectedCar)}</p>
                <div className="mt-6 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-100 p-3"><Users className="h-4 w-4 text-emerald-700" /><span className="mt-2 block text-xs text-slate-500">Chỗ ngồi</span><strong>{selectedCar.seats} chỗ</strong></div><div className="rounded-xl bg-slate-100 p-3"><BatteryCharging className="h-4 w-4 text-emerald-700" /><span className="mt-2 block text-xs text-slate-500">Pin công bố</span><strong>{selectedSpec?.batteryCapacityKwh ? `${selectedSpec.batteryCapacityKwh.toLocaleString('vi-VN')} kWh` : 'Cần xác minh'}</strong></div><div className="rounded-xl bg-slate-100 p-3"><Route className="h-4 w-4 text-emerald-700" /><span className="mt-2 block text-xs text-slate-500">Quãng đường công bố</span><strong>{selectedSpec?.rangeKm ? `${selectedSpec.rangeKm.toLocaleString('vi-VN')} km` : 'Cần xác minh'}</strong></div></div>
                <p className="mt-3 text-xs leading-5 text-slate-500">Số km hãng đo trong điều kiện thử nghiệm; thực tế có thể thấp hơn. Giới hạn km thuê được hiển thị trong công cụ đặt xe.</p>
                <div className="mt-7"><span className="text-sm text-slate-500">Giá thuê tham khảo từ</span><strong className="mt-1 block text-3xl">{formatPrice(selectedCar.price)}<span className="text-sm">/ngày</span></strong></div>
                <button type="button" onClick={() => chooseForBooking(selectedCar, 'ev_showroom')} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 font-black text-white hover:bg-emerald-800">Xem lịch xe <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </section>

        <section id="reserve" className="scroll-mt-24 border-y border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">02 / Chọn lịch và chi phí</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
              <div className="lg:sticky lg:top-24"><h2 className="text-4xl font-black tracking-tight sm:text-5xl">Chọn lịch thuê.<br />Tự tin trước khi đặt.</h2><p className="mt-4 leading-7 text-slate-600">Chọn ngày giờ, điểm nhận xe và xem chi phí dự kiến trước khi gửi yêu cầu thuê.</p><div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-[#f8f6ef]">{selectedCar.images?.[0] ? <img src={selectedCar.images[0]} alt={`Xe ${selectedCar.name} đang chọn đặt`} className="aspect-[16/9] w-full bg-slate-200 object-contain p-2" loading="lazy" decoding="async" /> : null}<div className="p-4"><strong className="text-xl">{selectedCar.name}</strong><span className="mt-1 block text-sm text-slate-600">{bookingSummary ? `${bookingSummary.pickupDate} ${bookingSummary.pickupHour}:00 → ${bookingSummary.returnDate} ${bookingSummary.returnHour}:00` : `${selectedCar.seats} chỗ · Giá từ ${formatPrice(selectedCar.price)}/ngày`}</span>{tripPlanSummary && <span className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-900"><Route className="h-4 w-4 flex-none" />Hành trình đã được giữ trong yêu cầu đặt xe.</span>}</div></div><div className="mt-5 grid gap-3">{[[CalendarCheck2, 'Chọn lịch', 'Chọn ngày, giờ và điểm nhận xe.'], [WalletCards, 'Xem chi phí dự kiến', 'Giá và phụ phí được đối chiếu theo lựa chọn.'], [CheckCircle2, 'Gửi yêu cầu', 'Car Match kiểm tra lịch trước khi xác nhận cọc.']].map(([Icon, title, note], index) => <div key={String(title)} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Icon className="h-4 w-4" /></span><div><span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Bước {index + 1}</span><strong className="block">{String(title)}</strong><p className="mt-1 text-xs leading-5 text-slate-500">{String(note)}</p></div></div>)}</div></div>
              <div className="min-w-0"><BookingWidget basePrice={selectedCar.price} carName={selectedCar.name} carSlug={selectedCar.slug} priceMonth={selectedCar.priceMonth} vehicleId={selectedCar.id} kmPerDay={selectedCar.kmPerDay} kmSurcharge={selectedCar.kmSurcharge} relatedCars={bookableCars.filter((car) => car.id !== selectedCar.id).slice(0, 3).map((car) => ({ slug: car.slug, name: car.name, price: car.price }))} externalOpenRequest={bookingOpenRequest} onBookingSummaryChange={setBookingSummary} onBookingSubmitted={({ bookingRef, requiresConfirmation }) => { if (typeof window !== 'undefined') sessionStorage.setItem('carmatch_ev_booking_ref', bookingRef); trackEvent('booking_request_success', { vehicle_id: selectedCar.id, booking_ref: bookingRef, requires_confirmation: requiresConfirmation }); }} /></div>
            </div>
          </div>
        </section>

        <EvRecommendationQuiz cars={bookableCars} onSelect={chooseForBooking} />
        <EvVehicleComparison cars={bookableCars} onSelect={chooseForBooking} />
        <EvRoutePlanner cars={bookableCars} selectedCar={selectedCar} bookingSummary={bookingSummary} onSelect={chooseForBooking} onTripPlanChange={setTripPlanSummary} />

        <section className="bg-emerald-50 py-16 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Chi phí minh bạch</p><h2 className="mt-3 text-4xl font-black tracking-tight">Thuê xe điện cần tính những chi phí gì?</h2><p className="mt-4 leading-7 text-slate-600">Không lấy khoản tiền điện ước tính từ công cụ hành trình để cộng vào giá thuê. Hệ thống đặt xe vẫn là nguồn xác thực cuối cùng về giá và trạng thái yêu cầu.</p></div><div className="grid gap-3 sm:grid-cols-2">{costItems.map(([Icon, title, note]) => <article key={String(title)} className="group rounded-2xl border border-emerald-100 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-black">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{String(note)}</p></article>)}</div></div></div></section>

        <section className="bg-white py-16 sm:py-20"><div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Sạc và bàn giao</p><h2 className="mt-3 text-3xl font-black tracking-tight">Kiểm tra pin trước khi bắt đầu chuyến đi</h2><div className="relative mt-7 space-y-3 before:absolute before:bottom-8 before:left-[1.65rem] before:top-8 before:w-px before:bg-emerald-200">{[[BatteryCharging, 'Ghi nhận mức pin', 'Chụp mức pin và số km tại thời điểm nhận xe.'], [PlugZap, 'Kiểm tra trạm và phụ kiện', 'Đối chiếu phụ kiện, đầu sạc và trạng thái trạm trên ứng dụng VinFast.'], [ShieldCheck, 'Xác nhận điều kiện trả', 'Thống nhất phần trăm pin khi trả xe và khoản ngoài chính sách trước khi nhận.']].map(([Icon, title, desc], index) => <div key={String(title)} className="relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"><span className="z-10 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Icon className="h-5 w-5" /></span><div><span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Kiểm tra {index + 1}</span><h3 className="font-black">{String(title)}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{String(desc)}</p></div></div>)}</div></div><div><p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Giao nhận tại Hà Nội</p><h2 className="mt-3 text-3xl font-black tracking-tight">Các điểm nhận xe tham khảo tại Hà Nội</h2><p className="mt-4 text-slate-600">Điểm bàn giao cụ thể sẽ được xác nhận sau khi kiểm tra xe và lịch thuê. Các điểm tự nhận dưới đây không tính phí giao nhận; khu vực khác được báo phí theo địa chỉ.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{BOOKING_PICKUP_LOCATIONS.map((location) => <div key={location.id} className="rounded-2xl bg-slate-100 p-4"><div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 flex-none text-emerald-700" /><div><strong>{location.name}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{location.address}</span></div></div><a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-emerald-800">Xem bản đồ <ExternalLink className="h-3.5 w-3.5" /></a></div>)}</div><button type="button" onClick={() => chooseForBooking(selectedCar, 'ev_delivery_area')} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white">Chọn hình thức nhận xe <CalendarCheck2 className="h-4 w-4" /></button></div></div></section>

        <section id="faq" className="bg-[#f2efe7] py-16 sm:py-20"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><div className="mb-12 grid overflow-hidden rounded-3xl bg-slate-950 text-white sm:grid-cols-[0.8fr_1.2fr]">{selectedCar.images?.[0] ? <img src={selectedCar.images[0]} alt={`Xe ${selectedCar.name} trước phần giải đáp`} className="h-full min-h-52 w-full bg-slate-900 object-contain p-2" loading="lazy" decoding="async" /> : null}<div className="flex flex-col justify-center p-6 sm:p-8"><span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Đang xem {selectedCar.name}</span><h2 className="mt-2 text-2xl font-black">Cần kiểm tra lịch trước khi quyết định?</h2><p className="mt-3 text-sm leading-6 text-slate-300">Giữ xe và ngày đã chọn, Car Match sẽ đối chiếu lịch, giá và điểm nhận trước khi hướng dẫn cọc.</p><button type="button" onClick={() => chooseForBooking(selectedCar, 'ev_pre_faq_cta')} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-sm font-black text-slate-950">Gửi yêu cầu kiểm tra lịch <ArrowRight className="h-4 w-4" /></button></div></div><p className="text-center text-xs font-black uppercase tracking-[0.22em] text-emerald-700">05 / Giải đáp</p><h2 className="mt-3 text-center text-4xl font-black tracking-tight">Câu hỏi thường gặp khi thuê xe điện Hà Nội</h2><div className="mt-8 space-y-3">{electricFaqs.map((item) => <details key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm"><summary className="cursor-pointer list-none pr-8 font-black marker:hidden">{item.question}</summary><p className="mt-3 leading-7 text-slate-600">{item.answer}</p></details>)}</div><div className="mt-7 flex flex-wrap justify-center gap-3 text-sm font-black"><Link to="/thue-xe-thang" className="rounded-full border border-slate-300 bg-white px-4 py-2">Xe điện theo tháng</Link><Link to="/thue-xe-7-cho-tu-lai-ha-noi" className="rounded-full border border-slate-300 bg-white px-4 py-2">Xe 7 chỗ</Link><Link to="/chinh-sach" className="rounded-full border border-slate-300 bg-white px-4 py-2">Điều kiện thuê xe</Link></div></div></section>

        <section className="bg-emerald-800 py-14 text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Car Match / Hà Nội</p><h2 className="mt-2 text-3xl font-black">Chọn đúng xe. Hành trình nhẹ nhàng hơn.</h2><p className="mt-2 text-emerald-100">Xem xe, đối chiếu nhu cầu và kiểm tra lịch ngay trên trang.</p></div><div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"><a href={PHONE_LINK} onClick={() => trackPhoneClick('electric_v5_footer')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-5 font-black"><Phone className="h-4 w-4" />Gọi 0971 163 290</a><a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('electric_v5_footer')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-emerald-800"><MessageCircle className="h-4 w-4" />Nhắn Zalo</a></div></div></section>
      </main>
      <Footer />
      <ZaloFAB />
      <MobileConversionBar source="electric_v5" zaloHref={zaloHref} note={`Đang chọn ${selectedCar.name}`} />
    </div>
  );
}
