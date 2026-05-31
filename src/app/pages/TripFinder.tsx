import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Route,
  Send,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { submitLead } from '@/hooks/useLeads';
import { cars as fallbackCars, formatPrice, type Car as CarModel } from '@/data/cars';
import { tripDestinations } from '@/data/tripDestinations';
import {
  addTripDays,
  calculateRentalDays,
  estimateEnergyCost,
  findTripDestination,
  formatCurrencyShort,
  parseTripDate,
  toDateInput,
} from '@/lib/tripFinder';
import { useSEO } from '@/hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';

const ZALO_LINK = 'https://zalo.me/0975563290';

const tripStyles = [
  { value: 'family', label: 'Gia đình' },
  { value: 'friends', label: 'Nhóm bạn' },
  { value: 'business', label: 'Công tác' },
  { value: 'airport', label: 'Sân bay' },
];

const tripPriorities = [
  { value: 'balanced', label: 'Cân bằng', desc: 'Giá hợp lý, xe dễ dùng' },
  { value: 'saving', label: 'Tiết kiệm', desc: 'Ưu tiên xe giá tốt' },
  { value: 'comfort', label: 'Rộng rãi', desc: 'Ưu tiên cốp/rộng/chở gia đình' },
  { value: 'electric', label: 'Xe điện', desc: 'Ưu tiên tiết kiệm xăng/sạc' },
];

const lodgingStyles = [
  { value: 'none', label: 'Chưa cần lưu trú', costPerNight: 0 },
  { value: 'homestay', label: 'Homestay', costPerNight: 700000 },
  { value: 'hotel', label: 'Khách sạn', costPerNight: 1200000 },
  { value: 'resort', label: 'Resort/nghỉ dưỡng', costPerNight: 2200000 },
];

const mealStyles = [
  { value: 'simple', label: 'Ăn đơn giản', costPerPersonDay: 220000 },
  { value: 'local', label: 'Đặc sản địa phương', costPerPersonDay: 350000 },
  { value: 'comfort', label: 'Ăn thoải mái', costPerPersonDay: 550000 },
];

function scoreCar(car: CarModel, travelers: number, style: string, priority: string) {
  let score = 0;
  if (car.seats >= travelers) score += 30;
  if (travelers >= 5 && car.seats >= 7) score += 25;
  if (travelers <= 4 && car.seats <= 5) score += 15;
  if (style === 'airport' && car.seats >= 5) score += 10;
  if (style === 'business' && (car.name.includes('Carnival') || car.name.includes('VF8'))) score += 18;
  if (style === 'family' && car.seats >= 7) score += 12;
  if (car.fuel === 'Điện') score += 6;
  if (car.popular) score += 8;
  if (car.price > 0) score += Math.max(0, 12 - Math.floor(car.price / 500000));
  if (priority === 'saving') score += Math.max(0, 30 - Math.floor(car.price / 100000));
  if (priority === 'comfort' && car.seats >= Math.max(5, travelers)) score += 18;
  if (priority === 'comfort' && (car.name.includes('Carnival') || car.name.includes('Innova'))) score += 12;
  if (priority === 'electric' && car.fuel === 'Điện') score += 35;
  if (priority === 'electric' && car.fuel !== 'Điện') score -= 10;
  return score;
}

function carRecommendationReasons(car: CarModel | undefined, travelers: number, styleLabel: string, priorityLabel: string) {
  if (!car) return ['CarMatch sẽ kiểm tra xe phù hợp theo lịch thực tế.'];

  return [
    `${car.seats} chỗ phù hợp nhóm ${travelers} người`,
    `${car.fuel === 'Điện' ? 'Xe điện, chi phí vận hành ước tính thấp hơn' : `${car.fuel}, dễ dùng cho tuyến đi tỉnh`}`,
    `Phù hợp kiểu chuyến: ${styleLabel.toLowerCase()}`,
    `Ưu tiên của bạn: ${priorityLabel.toLowerCase()}`,
  ];
}

export default function TripFinder() {
  const { slug } = useParams();
  const destinationFromSlug = useMemo(
    () => tripDestinations.find((item) => item.slug === slug)?.name || 'Hạ Long',
    [slug]
  );

  useSEO({
    title: slug
      ? `Thuê Xe Tự Lái Đi ${destinationFromSlug} — Lịch Trình & Chi Phí | CarMatch`
      : 'Lập Kế Hoạch Thuê Xe Tự Lái Theo Chuyến | CarMatch',
    description:
      `Lập kế hoạch thuê xe tự lái đi ${destinationFromSlug}: gợi ý xe phù hợp, chi phí dự kiến, lịch trình tham khảo và gửi yêu cầu qua Zalo CarMatch.`,
    canonical: `https://www.carmatch.vn/lap-ke-hoach-chuyen-di${slug ? `/${slug}` : ''}`,
  });

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return toDateInput(date);
  }, []);
  const dayAfterTomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return toDateInput(date);
  }, []);

  const { cars, loading: carsLoading } = useVehicles();
  const displayCars = cars.length > 0 ? cars : fallbackCars;
  const [destination, setDestination] = useState(destinationFromSlug);
  const [travelers, setTravelers] = useState(4);
  const [pickupDate, setPickupDate] = useState(tomorrow);
  const [returnDate, setReturnDate] = useState(dayAfterTomorrow);
  const [style, setStyle] = useState('family');
  const [priority, setPriority] = useState('balanced');
  const [lodging, setLodging] = useState('homestay');
  const [mealStyle, setMealStyle] = useState('local');
  const [pickupArea, setPickupArea] = useState('Vinhomes Ocean Park / nội thành Hà Nội');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  useEffect(() => {
    setDestination(destinationFromSlug);
  }, [destinationFromSlug]);

  const rentalDays = calculateRentalDays(pickupDate, returnDate);
  const tripPlan = findTripDestination(destination);
  const roundTripKm = Math.max(30, tripPlan.distanceKm * 2);
  useEffect(() => {
    const controller = new AbortController();
    if (!pickupDate || !returnDate) return;

    fetch(`/api/availability?pickup=${pickupDate}&return=${returnDate}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { unavailable_models: [] }))
      .then((data) => {
        setUnavailableModels(Array.isArray(data.unavailable_models) ? data.unavailable_models : []);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setUnavailableModels([]);
      });

    return () => controller.abort();
  }, [pickupDate, returnDate]);

  const recommendedCars = useMemo(() => {
    return [...displayCars]
      .filter((car) => car.price > 0 && car.seats >= Math.min(travelers, 7))
      .sort((a, b) => {
        const aUnavailable = unavailableModels.includes(a.name) ? 1 : 0;
        const bUnavailable = unavailableModels.includes(b.name) ? 1 : 0;
        if (aUnavailable !== bUnavailable) return aUnavailable - bUnavailable;
        return scoreCar(b, travelers, style, priority) - scoreCar(a, travelers, style, priority);
      })
      .slice(0, 3);
  }, [displayCars, style, travelers, unavailableModels, priority]);
  const primaryCar = recommendedCars.find((car) => car.id === selectedCarId) || recommendedCars[0];
  const primaryCarUnavailable = primaryCar ? unavailableModels.includes(primaryCar.name) : false;
  const rentalEstimate = primaryCar ? primaryCar.price * rentalDays : 0;
  const runningEstimate = estimateEnergyCost(roundTripKm, primaryCar?.fuel, tripPlan);
  const tollEstimate = tripPlan.tollEstimate;
  const lodgingChoice = lodgingStyles.find((item) => item.value === lodging) || lodgingStyles[0];
  const mealChoice = mealStyles.find((item) => item.value === mealStyle) || mealStyles[1];
  const nights = Math.max(0, rentalDays - 1);
  const lodgingEstimate = lodgingChoice.costPerNight * nights;
  const mealEstimate = mealChoice.costPerPersonDay * travelers * rentalDays;
  const mobilityEstimate = rentalEstimate + runningEstimate + tollEstimate;
  const totalEstimate = mobilityEstimate + lodgingEstimate + mealEstimate;

  const selectedStyleLabel = tripStyles.find((item) => item.value === style)?.label || 'Gia đình';
  const selectedPriorityLabel = tripPriorities.find((item) => item.value === priority)?.label || 'Cân bằng';
  const suggestedVehicleType = travelers >= 5 ? 'xe 7 chỗ' : primaryCar?.fuel === 'Điện' ? 'xe điện 5 chỗ' : 'xe 5 chỗ';
  const recommendationReasons = carRecommendationReasons(primaryCar, travelers, selectedStyleLabel, selectedPriorityLabel);
  const timelineItems = [
    { time: 'Sáng', title: `Nhận xe tại ${pickupArea}`, desc: `Kiểm tra giấy tờ, ảnh xe và xuất phát đi ${tripPlan.name}.`, cost: rentalEstimate },
    { time: 'Trưa', title: 'Dừng nghỉ / ăn trưa trên tuyến', desc: `Gợi ý theo tuyến: ${tripPlan.stops.slice(0, 2).join(', ') || tripPlan.name}.`, cost: Math.round(mealEstimate / Math.max(1, rentalDays * 2)) },
    { time: 'Chiều', title: `Tới ${tripPlan.name} và check-in`, desc: nights > 0 ? `${lodgingChoice.label} dự kiến ${formatPrice(lodgingEstimate)} cho ${nights} đêm.` : 'Chuyến trong ngày, ưu tiên lịch trình gọn.',
      cost: lodgingEstimate,
    },
    { time: 'Tối', title: 'Ăn tối / nghỉ ngơi', desc: `${mealChoice.label}, ngân sách ăn uống đang tính theo ${travelers} người.`, cost: Math.round(mealEstimate / Math.max(1, rentalDays * 2)) },
  ];

  const zaloMessage = encodeURIComponent(
    `[TRIP FINDER]\nĐiểm đến: ${tripPlan.name}\nNhận xe: ${pickupArea}\nNgày đi: ${pickupDate}\nNgày về: ${returnDate}\nSố người: ${travelers}\nPhong cách: ${selectedStyleLabel}\nƯu tiên: ${selectedPriorityLabel}\nXe gợi ý: ${primaryCar?.name || suggestedVehicleType}\nChi phí dự kiến: ${formatPrice(totalEstimate)}\nTên: ${name || ''}\nSĐT: ${phone || ''}`
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitState('submitting');

    const note = [
      '[TRIP FINDER]',
      `Điểm đến: ${tripPlan.name}`,
      `Tuyến: ${tripPlan.route}`,
      `Khu vực nhận xe: ${pickupArea}`,
      `Ngày đi/về: ${pickupDate} → ${returnDate}`,
      `Số ngày tính phí: ${rentalDays}`,
      `Số người: ${travelers}`,
      `Phong cách: ${selectedStyleLabel}`,
      `Ưu tiên: ${selectedPriorityLabel}`,
      `Lưu trú: ${lodgingChoice.label}`,
      `Ăn uống: ${mealChoice.label}`,
      `Xe gợi ý: ${primaryCar?.name || suggestedVehicleType}`,
      `Chi phí thuê xe dự kiến: ${formatPrice(rentalEstimate)}`,
      `Chi phí sạc/xăng + cao tốc dự kiến: ${formatPrice(runningEstimate + tollEstimate)}`,
      `Lưu trú dự kiến: ${formatPrice(lodgingEstimate)}`,
      `Ăn uống dự kiến: ${formatPrice(mealEstimate)}`,
      `Tổng dự kiến: ${formatPrice(totalEstimate)}`,
    ].join('\n');

    const result = await submitLead({
      source: 'b2b',
      name: name.trim(),
      phone: phone.trim(),
      customer_type: 'resident',
      form_type: 'trip_finder',
      quantity: `${travelers} người`,
      duration: `${pickupDate} → ${returnDate}`,
      car_model: primaryCar?.name || suggestedVehicleType,
      building: pickupArea,
      note,
    });

    setSubmitState(result.ok ? 'done' : 'error');
    if (result.ok) {
      window.open(`${ZALO_LINK}?text=${zaloMessage}`, '_blank');
    }
  };

  const handlePickupDateChange = (value: string) => {
    setPickupDate(value);
    if (!returnDate || (parseTripDate(returnDate)?.getTime() || 0) < (parseTripDate(value)?.getTime() || 0)) {
      setReturnDate(addTripDays(value, 1));
    }
  };

  useEffect(() => {
    if (recommendedCars.length === 0) {
      setSelectedCarId(null);
      return;
    }
    if (!selectedCarId || !recommendedCars.some((car) => car.id === selectedCarId)) {
      setSelectedCarId(recommendedCars[0].id);
    }
  }, [recommendedCars, selectedCarId]);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 pt-28 pb-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_30%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-cyan-100 ring-1 ring-white/15 mb-6">
                <Sparkles className="h-4 w-4" />
                Trip Finder · AI gợi ý xe theo chuyến đi
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Đi đâu từ Hà Nội?
                <span className="block text-cyan-200">CarMatch gợi ý xe phù hợp.</span>
              </h1>
              <p className="text-slate-200 text-lg sm:text-xl leading-relaxed max-w-2xl mb-8">
                Nhập điểm đến, ngày đi và số người. Hệ thống sẽ gợi ý loại xe, lịch trình, chi phí dự kiến và xe CarMatch phù hợp để đặt nhanh.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#trip-form" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-7 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-300 transition-colors">
                  Tính chuyến đi ngay
                  <ArrowRight className="h-5 w-5" />
                </a>
                <Link to="/xe" className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-3.5 font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 transition-colors">
                  Xem đội xe
                  <Car className="h-5 w-5" />
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-200">
                {['Gợi ý xe theo số người', 'Ước tính chi phí chuyến đi', 'Gửi yêu cầu qua Zalo'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
              <div className="rounded-2xl bg-white p-5 text-gray-900 shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Gợi ý nhanh</p>
                    <h2 className="text-xl font-bold">Hà Nội → {tripPlan.name}</h2>
                  </div>
                  <div className="rounded-2xl bg-brand-50 px-3 py-2 text-right">
                    <p className="text-xs text-gray-500">Từ</p>
                    <p className="font-bold text-brand-700">{formatCurrencyShort(totalEstimate)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <Route className="h-5 w-5 text-brand-600 mb-2" />
                    <p className="font-semibold">{roundTripKm} km</p>
                    <p className="text-gray-500">ước tính 2 chiều</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <CalendarDays className="h-5 w-5 text-brand-600 mb-2" />
                    <p className="font-semibold">{rentalDays} ngày</p>
                    <p className="text-gray-500">thời gian thuê</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <Users className="h-5 w-5 text-brand-600 mb-2" />
                    <p className="font-semibold">{travelers} người</p>
                    <p className="text-gray-500">{suggestedVehicleType}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <Wallet className="h-5 w-5 text-brand-600 mb-2" />
                    <p className="font-semibold">{formatCurrencyShort(runningEstimate + tollEstimate)}</p>
                    <p className="text-gray-500">xăng/sạc + phí đường</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="trip-form" className="scroll-mt-24 py-14 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
          <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm h-fit">
            <div className="mb-5">
              <p className="text-brand-600 font-bold text-sm uppercase tracking-wide">Bước 1</p>
              <h2 className="text-2xl font-bold text-gray-900">Nhập kế hoạch chuyến đi</h2>
              <p className="text-gray-500 mt-1">Chọn nhanh điểm đến phổ biến hoặc nhập điểm đến riêng.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {tripDestinations.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setDestination(item.name)}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm transition-all ${
                    destination === item.name
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                  }`}
                >
                  <span className="font-semibold">{item.name}</span>
                  <span className="block text-xs text-gray-500">{item.distanceKm} km/lượt</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Điểm đến</span>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  placeholder="Ví dụ: Hạ Long, Ninh Bình, Tam Đảo..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Khu vực nhận xe</span>
                <input
                  value={pickupArea}
                  onChange={(event) => setPickupArea(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  placeholder="Ví dụ: Ocean Park, Times City, Nội Bài..."
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Ngày đi</span>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(event) => handlePickupDateChange(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Ngày về</span>
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate}
                    onChange={(event) => setReturnDate(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Số người</span>
                  <select
                    value={travelers}
                    onChange={(event) => setTravelers(Number(event.target.value))}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                      <option key={value} value={value}>{value} người</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Kiểu chuyến đi</span>
                  <select
                    value={style}
                    onChange={(event) => setStyle(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  >
                    {tripStyles.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-700">Ưu tiên chọn xe</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {tripPriorities.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value)}
                      className={`rounded-2xl border p-3 text-left transition-all ${
                        priority === item.value
                          ? 'border-brand-500 bg-brand-50 text-brand-900'
                          : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                      }`}
                    >
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className="block text-xs text-gray-500">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Lưu trú</span>
                  <select
                    value={lodging}
                    onChange={(event) => setLodging(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  >
                    {lodgingStyles.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Ăn uống</span>
                  <select
                    value={mealStyle}
                    onChange={(event) => setMealStyle(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  >
                    {mealStyles.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-brand-600 font-bold text-sm uppercase tracking-wide">Bước 2</p>
                  <h2 className="text-2xl font-bold text-gray-900">Kế hoạch gợi ý</h2>
                </div>
                <div className="hidden sm:flex rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
                  {formatCurrencyShort(totalEstimate)} dự kiến
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <MapPin className="h-5 w-5 text-brand-600 mb-2" />
                  <p className="text-sm text-gray-500">Tuyến</p>
                  <p className="font-semibold text-gray-900">{tripPlan.route}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <Clock className="h-5 w-5 text-brand-600 mb-2" />
                  <p className="text-sm text-gray-500">Nên đi</p>
                  <p className="font-semibold text-gray-900">{tripPlan.duration}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <Users className="h-5 w-5 text-brand-600 mb-2" />
                  <p className="text-sm text-gray-500">Phù hợp</p>
                  <p className="font-semibold text-gray-900">{tripPlan.ideal}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                {[
                  ['Thuê xe', formatPrice(rentalEstimate || 0), `${rentalDays} ngày x ${primaryCar ? primaryCar.name : 'xe phù hợp'}${primaryCarUnavailable ? ' (cần kiểm tra lại)' : ''}`],
                  ['Xăng/sạc', formatPrice(runningEstimate), `${roundTripKm} km ước tính 2 chiều`],
                  ['Cao tốc/phí đường', formatPrice(tollEstimate), 'ước tính theo tuyến phổ biến'],
                  ['Lưu trú', formatPrice(lodgingEstimate), nights > 0 ? `${nights} đêm x ${lodgingChoice.label.toLowerCase()}` : 'Chuyến trong ngày, chưa tính lưu trú'],
                  ['Ăn uống', formatPrice(mealEstimate), `${travelers} người x ${rentalDays} ngày · ${mealChoice.label.toLowerCase()}`],
                ].map(([label, amount, note]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0">
                    <div>
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{note}</p>
                    </div>
                    <p className="font-bold text-gray-900 whitespace-nowrap">{amount}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 bg-brand-50 px-4 py-4">
                  <div>
                    <p className="font-bold text-brand-900">Tổng dự kiến</p>
                    <p className="text-sm text-brand-700">Gồm xe + di chuyển + ăn/lưu trú ước tính</p>
                  </div>
                  <p className="text-xl font-bold text-brand-700">{formatPrice(totalEstimate)}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                  {tripPlan.stops.map((stop) => (
                  <span key={stop} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                    {stop}
                  </span>
                ))}
              </div>
            </div>

            {primaryCar && (
              <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
                <div className="grid md:grid-cols-[240px_1fr]">
                  <Link to={`/xe/${primaryCar.slug}`} className="block min-h-56 bg-gray-100">
                    <img src={primaryCar.images[0]} alt={primaryCar.name} className="h-full w-full object-cover" loading="lazy" />
                  </Link>
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-brand-600 font-bold text-sm uppercase tracking-wide">Xe đang chọn</p>
                        <h2 className="mt-1 text-2xl font-bold text-gray-900">{primaryCar.name}</h2>
                        <p className="mt-1 text-gray-500">
                          {primaryCar.seats} chỗ · {primaryCar.fuel} · {primaryCar.transmission} · {primaryCar.kmPerDay} km/ngày
                        </p>
                      </div>
                      <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
                        <p className="text-xs font-semibold text-brand-700">Dự kiến chuyến này</p>
                        <p className="text-xl font-bold text-brand-800">{formatPrice(totalEstimate)}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid sm:grid-cols-2 gap-3">
                      {recommendationReasons.map((reason) => (
                        <div key={reason} className="flex gap-2 rounded-2xl bg-gray-50 p-3 text-sm text-gray-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    {primaryCarUnavailable && (
                      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                        Xe này có thể đang bận theo lịch website. CarMatch sẽ kiểm tra lại trước khi xác nhận.
                      </div>
                    )}

                    <div className="mt-5 flex flex-col sm:flex-row gap-2">
                      <a
                        href="#lead-form"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700"
                      >
                        Giữ xe này
                        <ArrowRight className="h-4 w-4" />
                      </a>
                      <Link
                        to={`/xe/${primaryCar.slug}`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Xem chi tiết xe
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-brand-600 font-bold text-sm uppercase tracking-wide">Bước 3</p>
                <h2 className="text-2xl font-bold text-gray-900">Xe phù hợp cho chuyến này</h2>
                <p className="text-gray-500 mt-1">
                  {carsLoading && cars.length === 0
                    ? `Đang dùng danh sách xe mẫu để gợi ý theo ${travelers} người, ${selectedStyleLabel.toLowerCase()}, tuyến ${tripPlan.name}.`
                    : `Gợi ý theo ${travelers} người, ${selectedStyleLabel.toLowerCase()}, tuyến ${tripPlan.name}.`}
                </p>
              </div>

              {recommendedCars.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {recommendedCars.map((car) => (
                    <div
                      key={car.id}
                      className={`rounded-2xl border bg-white overflow-hidden transition-all ${
                        selectedCarId === car.id ? 'border-brand-500 ring-4 ring-brand-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <Link to={`/xe/${car.slug}`} className="block aspect-video bg-gray-100 overflow-hidden">
                        <img src={car.images[0]} alt={car.name} className="h-full w-full object-cover" loading="lazy" />
                      </Link>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-gray-900">{car.name}</h3>
                            <p className="text-sm text-gray-500">{car.seats} chỗ · {car.fuel} · {car.transmission}</p>
                          </div>
                          {unavailableModels.includes(car.name) ? (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Cần check</span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Ưu tiên</span>
                          )}
                        </div>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-lg font-bold text-brand-700">{formatPrice(car.price)}</span>
                          <span className="text-xs text-gray-400">/ngày</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCarId(car.id)}
                            className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                              selectedCarId === car.id
                                ? 'bg-brand-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Chọn xe này
                          </button>
                          <Link
                            to={`/xe/${car.slug}`}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-5 text-gray-600">
                  Chưa tìm được xe phù hợp từ dữ liệu hiện tại. Bạn gửi yêu cầu, CarMatch sẽ check xe trống và báo lại nhanh.
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-brand-600 font-bold text-sm uppercase tracking-wide">Bước 4</p>
                <h2 className="text-2xl font-bold text-gray-900">Timeline ngày đầu</h2>
                <p className="text-gray-500 mt-1">Lấy cảm hứng từ travel planner: có giờ, hoạt động và ngân sách từng mục.</p>
              </div>
              <div className="space-y-3 mb-6">
                {timelineItems.map((item) => (
                  <div key={`${item.time}-${item.title}`} className="grid grid-cols-[64px_1fr_auto] gap-3 rounded-2xl bg-gray-50 p-4">
                    <div className="font-mono text-sm font-bold text-brand-600">{item.time}</div>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <div className="hidden sm:block text-sm font-bold text-gray-700">{item.cost > 0 ? formatPrice(item.cost) : '-'}</div>
                  </div>
                ))}
              </div>
              <div className="mb-5 border-t border-gray-100 pt-5">
                <h3 className="font-bold text-gray-900">Lịch trình tham khảo theo tuyến</h3>
                <p className="text-sm text-gray-500 mt-1">Phần này có thể chỉnh trong dữ liệu tuyến, phù hợp để làm content SEO sau này.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {tripPlan.schedule.map((block) => (
                  <div key={block.title} className="rounded-2xl bg-gray-50 p-4">
                    <h3 className="font-bold text-gray-900 mb-3">{block.title}</h3>
                    <ul className="space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="lead-form" className="scroll-mt-24 py-14 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="rounded-3xl bg-brand-50 p-6">
            <p className="text-brand-700 font-bold text-sm uppercase tracking-wide mb-2">Dữ liệu có thể tùy chỉnh</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Các số liệu hiện là cấu hình mẫu</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Khoảng cách, phí đường, điểm dừng, lịch trình và FAQ đang lấy từ file cấu hình nội bộ. Khi vận hành thật, CarMatch có thể sửa lại theo kinh nghiệm tuyến đường, dữ liệu VETC và phản hồi khách hàng.
            </p>
            <div className="rounded-2xl bg-white p-4 text-sm text-gray-600">
              File cấu hình: <span className="font-semibold text-gray-900">src/data/tripDestinations.ts</span>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lưu ý trước khi đặt xe</h2>
            <div className="space-y-3">
              {tripPlan.notes.map((note) => (
                <div key={note} className="flex gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-950 p-5 sm:p-8 text-white">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
            <div>
              <p className="text-cyan-300 font-bold text-sm uppercase tracking-wide mb-2">Giữ xe nhanh</p>
              <h2 className="text-3xl font-bold mb-3">Muốn CarMatch check xe trống cho chuyến này?</h2>
              <p className="text-slate-300 leading-relaxed">
                Để lại số điện thoại, CarMatch sẽ kiểm tra lịch xe và báo phương án phù hợp qua Zalo/điện thoại.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-4 focus:ring-cyan-400/30"
                  placeholder="Tên của bạn"
                  required
                />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-4 focus:ring-cyan-400/30"
                  placeholder="Số điện thoại/Zalo"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitState === 'submitting'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3.5 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
              >
                {submitState === 'submitting' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Gửi yêu cầu & mở Zalo
              </button>
              <a
                href={`${ZALO_LINK}?text=${zaloMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Chat Zalo không cần gửi form
              </a>
              {submitState === 'done' && (
                <p className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                  Đã lưu yêu cầu. CarMatch sẽ liên hệ lại để chốt xe phù hợp.
                </p>
              )}
              {submitState === 'error' && (
                <p className="rounded-2xl bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">
                  Chưa lưu được form, nhưng bạn vẫn có thể gửi qua Zalo bằng nút phía trên.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-wide mb-2">Gợi ý chuyến phổ biến</p>
            <h2 className="text-3xl font-bold text-gray-900">Các chuyến đi dễ lên kế hoạch từ Hà Nội</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {tripDestinations.slice(0, 3).map((item) => (
              <Link
                key={item.name}
                to={`/lap-ke-hoach-chuyen-di/${item.slug}#trip-form`}
                className="rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{item.ideal}</p>
                <div className="flex items-center justify-between text-sm font-semibold text-brand-600">
                  <span>{item.duration}</span>
                  <span>{item.distanceKm} km/lượt</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-wide mb-2">FAQ theo chuyến</p>
            <h2 className="text-3xl font-bold text-gray-900">Câu hỏi thường gặp về tuyến {tripPlan.name}</h2>
          </div>
          <div className="space-y-3">
            {tripPlan.faq.map((item) => (
              <div key={item.question} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <h3 className="font-bold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
