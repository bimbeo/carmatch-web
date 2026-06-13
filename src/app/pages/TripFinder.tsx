import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  Car,
  ChevronDown,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Route,
  Search,
  Send,
  Share2,
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
import TravelAssistant from '../components/TravelAssistant';
import ZaloFAB from '../components/ZaloFAB';
import { trackLeadSubmit, trackZaloClick } from '@/lib/analytics';

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

const featuredDestinationSlugs = ['ha-long', 'ninh-binh', 'tam-dao', 'hai-phong', 'cat-ba', 'moc-chau', 'ba-vi', 'soc-son'];

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
  if (!car) return ['Car Match sẽ kiểm tra xe phù hợp theo lịch thực tế.'];

  return [
    `${car.seats} chỗ phù hợp nhóm ${travelers} người`,
    `${car.fuel === 'Điện' ? 'Xe điện, chi phí vận hành ước tính thấp hơn' : `${car.fuel}, dễ dùng cho tuyến đi tỉnh`}`,
    `Phù hợp kiểu chuyến: ${styleLabel.toLowerCase()}`,
    `Ưu tiên của bạn: ${priorityLabel.toLowerCase()}`,
  ];
}

function findDestinationFromText(text: string) {
  const normalized = text.toLowerCase();
  return tripDestinations.find((item) => normalized.includes(item.name.toLowerCase()));
}

function parseTravelersFromText(text: string) {
  const normalized = text.toLowerCase();
  const peopleMatch = normalized.match(/(\d+)\s*(người|nguoi|khách|khach|bé|be)/);
  if (peopleMatch) return Math.min(7, Math.max(1, Number(peopleMatch[1])));
  if (normalized.includes('gia đình') || normalized.includes('nhà mình')) return 4;
  if (normalized.includes('cặp đôi')) return 2;
  return null;
}

export default function TripFinder() {
  const { slug } = useParams();
  const location = useLocation();
  const destinationFromSlug = useMemo(
    () => tripDestinations.find((item) => item.slug === slug)?.name || 'Hạ Long',
    [slug]
  );

  useSEO({
    title: slug
      ? `Thuê Xe Tự Lái Đi ${destinationFromSlug} — Lịch Trình & Chi Phí | Car Match`
      : 'Lập Kế Hoạch Thuê Xe Tự Lái Theo Chuyến | Car Match',
    description:
      `Lập kế hoạch thuê xe tự lái đi ${destinationFromSlug}: gợi ý xe phù hợp, chi phí dự kiến, lịch trình tham khảo và gửi yêu cầu qua Zalo Car Match.`,
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
  const [quickPrompt, setQuickPrompt] = useState('');
  const [quickPromptResult, setQuickPromptResult] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [unavailableModels, setUnavailableModels] = useState<string[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showAllDestinations, setShowAllDestinations] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    setDestination(destinationFromSlug);
  }, [destinationFromSlug]);

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const destinationSlug = search.get('diem-den');
    const travelerCount = Number(search.get('so-nguoi'));
    const tripLength = search.get('thoi-gian');
    const tripStyle = search.get('phong-cach');
    const tripPriority = search.get('uu-tien');
    const matchedDestination = destinationSlug
      ? tripDestinations.find((item) => item.slug === destinationSlug)
      : null;

    if (matchedDestination) {
      setDestination(matchedDestination.name);
    }
    if (Number.isFinite(travelerCount) && travelerCount >= 1) {
      setTravelers(Math.min(7, Math.max(1, travelerCount)));
    }
    if (tripStyle && tripStyles.some((item) => item.value === tripStyle)) {
      setStyle(tripStyle);
    }
    if (tripPriority && tripPriorities.some((item) => item.value === tripPriority)) {
      setPriority(tripPriority);
    }
    if (tripLength === 'day') {
      setReturnDate(pickupDate);
      setLodging('none');
    }
    if (tripLength === 'weekend') {
      setReturnDate(addTripDays(pickupDate, 1));
      setLodging('homestay');
    }
    if (tripLength === 'long') {
      setReturnDate(addTripDays(pickupDate, 2));
      setLodging('hotel');
    }
  }, [location.search]);

  const rentalDays = calculateRentalDays(pickupDate, returnDate);
  const tripPlan = findTripDestination(destination);
  const roundTripKm = Math.max(30, tripPlan.distanceKm * 2);
  const destinationOptions = useMemo(() => {
    const query = destinationSearch.trim().toLowerCase();
    const featured = featuredDestinationSlugs
      .map((item) => tripDestinations.find((destinationItem) => destinationItem.slug === item))
      .filter(Boolean) as typeof tripDestinations;
    const currentDestination = tripDestinations.find((item) => item.name === destination);
    const baseOptions = query
      ? tripDestinations.filter((item) => {
          const haystack = `${item.name} ${item.region || ''} ${item.tags?.join(' ') || ''}`.toLowerCase();
          return haystack.includes(query);
        })
      : showAllDestinations
        ? tripDestinations
        : featured;
    const withCurrent = currentDestination && !baseOptions.some((item) => item.slug === currentDestination.slug)
      ? [currentDestination, ...baseOptions]
      : baseOptions;
    return withCurrent.slice(0, query ? 12 : showAllDestinations ? tripDestinations.length : 8);
  }, [destination, destinationSearch, showAllDestinations]);
  const hiddenDestinationCount = Math.max(0, tripDestinations.length - destinationOptions.length);
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
  const lowestRecommendedPrice = recommendedCars.reduce((lowest, car) => Math.min(lowest, car.price), Number.POSITIVE_INFINITY);
  const getCarOptionLabel = (car: CarModel, index: number) => {
    if (index === 0) return 'Phù hợp nhất';
    if (car.price === lowestRecommendedPrice) return 'Tiết kiệm';
    if (car.seats >= Math.max(7, travelers)) return 'Rộng rãi';
    return 'Phương án dự phòng';
  };
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
  const tripVisualImageUrl = tripPlan.imageUrl || tripDestinations[0]?.imageUrl || primaryCar?.images[0] || '';
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

  const handleSharePlan = async () => {
    const matchedDestination = tripDestinations.find((item) => item.name === tripPlan.name) || tripPlan;
    const search = new URLSearchParams();
    search.set('diem-den', matchedDestination.slug);
    search.set('so-nguoi', String(travelers));
    search.set('phong-cach', style);
    search.set('uu-tien', priority);
    const shareUrl = `${window.location.origin}/lap-ke-hoach-chuyen-di/${matchedDestination.slug}?${search.toString()}#trip-form`;
    const shareTitle = `Kế hoạch đi ${tripPlan.name} cùng Car Match`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: `Gợi ý xe và chi phí đi ${tripPlan.name}`, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setQuickPromptResult('Đã copy link kế hoạch chuyến đi.');
      }
    } catch {
      setQuickPromptResult('Chưa chia sẻ được, bạn có thể copy link trên trình duyệt.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitState('submitting');
    trackLeadSubmit('attempt', {
      lead_source: 'trip_finder',
      form_type: 'trip_finder',
      destination: tripPlan.slug,
      rental_days: rentalDays,
      travelers,
      vehicle_name: primaryCar?.name || suggestedVehicleType,
      total_estimate: totalEstimate,
    });

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
    trackLeadSubmit(result.ok ? 'success' : 'error', {
      lead_source: 'trip_finder',
      form_type: 'trip_finder',
      destination: tripPlan.slug,
      rental_days: rentalDays,
      travelers,
      vehicle_name: primaryCar?.name || suggestedVehicleType,
      total_estimate: totalEstimate,
      error_message: result.error,
    });
    if (result.ok) {
      trackZaloClick('trip_finder_form_submit', {
        lead_source: 'trip_finder',
        destination: tripPlan.slug,
      });
      window.open(`${ZALO_LINK}?text=${zaloMessage}`, '_blank');
    }
  };

  const handlePickupDateChange = (value: string) => {
    setPickupDate(value);
    if (!returnDate || (parseTripDate(returnDate)?.getTime() || 0) < (parseTripDate(value)?.getTime() || 0)) {
      setReturnDate(addTripDays(value, 1));
    }
  };

  const applyQuickPrompt = () => {
    const normalized = quickPrompt.trim().toLowerCase();
    if (!normalized) return;

    const matchedDestination = findDestinationFromText(normalized);
    const parsedTravelers = parseTravelersFromText(normalized);
    const updates: string[] = [];

    if (matchedDestination) {
      setDestination(matchedDestination.name);
      updates.push(`điểm đến ${matchedDestination.name}`);
    }
    if (parsedTravelers) {
      setTravelers(parsedTravelers);
      updates.push(`${parsedTravelers} người`);
    }
    if (normalized.includes('trẻ') || normalized.includes('tre') || normalized.includes('gia đình') || normalized.includes('nhà mình')) {
      setStyle('family');
      setPriority(parsedTravelers && parsedTravelers >= 5 ? 'comfort' : 'balanced');
      updates.push('phong cách gia đình');
    }
    if (normalized.includes('tiết kiệm') || normalized.includes('re') || normalized.includes('rẻ')) {
      setPriority('saving');
      updates.push('ưu tiên tiết kiệm');
    }
    if (normalized.includes('rộng') || normalized.includes('thoải mái') || normalized.includes('7 chỗ') || normalized.includes('đông')) {
      setPriority('comfort');
      updates.push('ưu tiên xe rộng');
    }
    if (normalized.includes('xe điện') || normalized.includes('sạc')) {
      setPriority('electric');
      updates.push('ưu tiên xe điện');
    }
    if (normalized.includes('công tác')) {
      setStyle('business');
      updates.push('kiểu chuyến công tác');
    }
    if (normalized.includes('sân bay') || normalized.includes('nội bài')) {
      setStyle('airport');
      setDestination('Sân bay Nội Bài');
      updates.push('tuyến sân bay');
    }
    if (normalized.includes('trong ngày')) {
      setReturnDate(pickupDate);
      setLodging('none');
      updates.push('chuyến trong ngày');
    }
    if (normalized.includes('2 ngày') || normalized.includes('qua đêm') || normalized.includes('1 đêm')) {
      setReturnDate(addTripDays(pickupDate, 1));
      updates.push('2 ngày 1 đêm');
    }
    if (normalized.includes('3 ngày') || normalized.includes('2 đêm')) {
      setReturnDate(addTripDays(pickupDate, 2));
      updates.push('3 ngày 2 đêm');
    }

    const resultText = updates.length
      ? `Đã tự điền: ${Array.from(new Set(updates)).join(', ')}. Bạn kiểm tra lại ngày đi/ngày về trước khi gửi lead.`
      : 'Chưa nhận ra đủ thông tin. Bạn thử ghi rõ điểm đến, số người, thời gian và ưu tiên xe.';
    setQuickPromptResult(resultText);
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
    <div className="min-h-screen bg-white pb-24 text-gray-900 lg:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      <section className="bg-[#f5f7fb] pt-24 pb-10 sm:pt-28 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-100 sm:rounded-[2rem] lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="p-6 sm:p-8 lg:p-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-700">
                <Sparkles className="h-4 w-4" />
                Trip Finder · Tính nhanh chuyến đi
              </div>
              <h1 className="mb-5 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Tính nhanh chuyến đi, chọn đúng xe trước khi đặt.
              </h1>
              <p className="mb-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-xl">
                Nhập điểm đến, ngày đi và số người. Car Match sẽ gợi ý tuyến, ngân sách, loại xe phù hợp và cách gửi yêu cầu qua Zalo.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap">
                <a href="#trip-form" className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-brand-700">
                  Tính chuyến đi ngay
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/di-dau" className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition-colors hover:border-brand-200 hover:text-brand-700">
                  Xem điểm đến
                  <MapPin className="h-4 w-4" />
                </Link>
                <Link to="/xe" className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition-colors hover:border-brand-200 hover:text-brand-700">
                  Xem đội xe
                  <Car className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500 sm:text-sm">
                {['Gợi ý xe theo người', 'Ước tính chi phí', 'Gửi Zalo nhanh'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>

            <div className="hidden bg-slate-950 p-5 text-white sm:p-6 lg:flex lg:items-center lg:p-8">
              <div className="w-full rounded-[1.5rem] bg-white p-5 text-gray-900 shadow-2xl">
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
                <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Luồng thao tác</p>
                  <div className="mt-4 grid gap-3 text-sm font-bold">
                    {['Chọn tuyến và ngày', 'Xem xe và tổng chi phí', 'Để lại Zalo để giữ xe'].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950 text-xs">{index + 1}</span>
                        {item}
                      </div>
                    ))}
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

            <div className="mb-5 rounded-3xl bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-200" />
                <p className="text-sm font-black">Nhập nhanh nhu cầu</p>
              </div>
              <textarea
                value={quickPrompt}
                onChange={(event) => setQuickPrompt(event.target.value)}
                className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none"
                placeholder="VD: Gia đình 6 người có trẻ em muốn đi Hạ Long 2 ngày 1 đêm, ưu tiên xe rộng..."
              />
              <button
                type="button"
                onClick={applyQuickPrompt}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-black text-white hover:bg-brand-600"
              >
                Tự điền kế hoạch từ mô tả
              </button>
              {quickPromptResult ? (
                <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100">{quickPromptResult}</p>
              ) : null}
            </div>

            <div className="mb-5">
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={destinationSearch}
                  onChange={(event) => setDestinationSearch(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  placeholder="Tìm nhanh: Hạ Long, Ninh Bình, đi biển..."
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {destinationOptions.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setDestination(item.name);
                      setDestinationSearch('');
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm transition-all ${
                      destination === item.name
                        ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm'
                        : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{item.distanceKm} km/lượt · {item.duration}</span>
                  </button>
                ))}
              </div>
              {destinationOptions.length === 0 ? (
                <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                  Chưa thấy tuyến phù hợp. Bạn có thể nhập điểm đến riêng ở ô bên dưới.
                </div>
              ) : null}
              {!destinationSearch ? (
                <button
                  type="button"
                  aria-expanded={showAllDestinations}
                  onClick={() => setShowAllDestinations((value) => !value)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
                >
                  {showAllDestinations ? 'Thu gọn điểm đến' : `Xem thêm ${hiddenDestinationCount} điểm đến`}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllDestinations ? 'rotate-180' : ''}`} />
                </button>
              ) : null}
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

              <div className="grid gap-3 sm:grid-cols-2">
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

              <div className="grid gap-3 sm:grid-cols-2">
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

              <button
                type="button"
                aria-expanded={showAdvancedOptions}
                onClick={() => setShowAdvancedOptions((value) => !value)}
                className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-800 sm:hidden"
              >
                Tùy chỉnh xe, lưu trú, ăn uống
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${showAdvancedOptions ? 'block' : 'hidden'} space-y-4 sm:block`}>
                <div>
                  <span className="text-sm font-semibold text-gray-700">Ưu tiên chọn xe</span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
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

                <div className="grid gap-3 sm:grid-cols-2">
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
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-brand-600 font-bold text-sm uppercase tracking-wide">Bước 2</p>
                  <h2 className="text-2xl font-bold text-gray-900">Kế hoạch gợi ý</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSharePlan}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-200 hover:text-brand-700"
                    aria-label="Chia sẻ kế hoạch"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <div className="hidden rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 sm:flex">
                    {formatCurrencyShort(totalEstimate)} dự kiến
                  </div>
                </div>
              </div>

              <div className="mb-5 overflow-hidden rounded-[1.75rem] bg-slate-950 text-white">
                <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_180px] md:items-stretch">
                  <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Tổng ngân sách dự kiến</p>
                    <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
                      <p className="text-3xl font-black sm:text-4xl">{formatPrice(totalEstimate)}</p>
                      <p className="pb-1 text-sm font-semibold text-slate-300">{rentalDays} ngày · {travelers} người · {suggestedVehicleType}</p>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      Tuyến {tripPlan.route}. Chi phí gồm thuê xe, xăng/sạc, phí đường, ăn uống và lưu trú ước tính.
                    </p>
                    <a
                      href={`${ZALO_LINK}?text=${zaloMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackZaloClick('trip_finder_result_summary', {
                        destination: tripPlan.slug,
                        rental_days: rentalDays,
                        travelers,
                      })}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 sm:w-fit"
                    >
                      Gửi Zalo giữ xe
                      <Send className="h-4 w-4" />
                    </a>
                  </div>
                  {tripVisualImageUrl ? (
                    <div className="relative hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:block">
                      <img
                        src={tripVisualImageUrl}
                        alt={`Hình ảnh tuyến ${tripPlan.name}`}
                        className="h-full min-h-40 w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">Tuyến đang tính</p>
                        <p className="text-sm font-black text-white">{tripPlan.name}</p>
                      </div>
                    </div>
                  ) : null}
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
                        Xe này có thể đang bận theo lịch website. Car Match sẽ kiểm tra lại trước khi xác nhận.
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
                    ? `Đang tải danh sách xe phù hợp cho ${travelers} người, ${selectedStyleLabel.toLowerCase()}, tuyến ${tripPlan.name}.`
                    : `Gợi ý theo ${travelers} người, ${selectedStyleLabel.toLowerCase()}, tuyến ${tripPlan.name}.`}
                </p>
              </div>

              {recommendedCars.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {recommendedCars.map((car, index) => (
                    <div
                      key={car.id}
                      className={`flex h-full flex-col overflow-hidden rounded-[1.35rem] border bg-white transition-all ${
                        selectedCarId === car.id ? 'border-brand-500 shadow-sm ring-4 ring-brand-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                      } ${index === 0 ? 'xl:col-span-2 xl:grid xl:grid-cols-[0.9fr_1.1fr]' : ''}`}
                    >
                      <Link
                        to={`/xe/${car.slug}`}
                        className={`relative block overflow-hidden bg-gray-100 ${index === 0 ? 'aspect-[16/9] xl:aspect-auto xl:h-full xl:min-h-[280px]' : 'aspect-[16/9]'}`}
                      >
                        <img src={car.images[0]} alt={car.name} className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
                          <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-black leading-none shadow-sm ${
                            index === 0 ? 'bg-brand-600 text-white' : 'bg-white/95 text-slate-800'
                          }`}>
                            {getCarOptionLabel(car, index)}
                          </span>
                          <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-black leading-none shadow-sm ${
                            unavailableModels.includes(car.name) ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {unavailableModels.includes(car.name) ? 'Cần check' : 'Ưu tiên'}
                          </span>
                        </div>
                      </Link>
                      <div className={`flex flex-1 flex-col p-4 ${index === 0 ? 'xl:p-5' : ''}`}>
                        <div>
                          <h3 className="text-lg font-black leading-snug text-gray-900">{car.name}</h3>
                          <p className="mt-1 text-sm font-semibold text-gray-500">{car.seats} chỗ · {car.fuel} · {car.transmission}</p>
                        </div>
                        <div className="mt-4 rounded-2xl bg-slate-50 px-3.5 py-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Giá thuê theo ngày</p>
                          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                            <span className="text-2xl font-black leading-none text-brand-700">{formatPrice(car.price)}</span>
                            <span className="text-xs font-semibold text-gray-400">/ngày</span>
                          </div>
                        </div>
                        <p className="mt-3 min-h-[48px] text-sm font-semibold leading-6 text-slate-500">
                          {index === 0
                            ? 'Ưu tiên theo số người, tuyến đi và ngân sách hiện tại.'
                            : car.seats >= Math.max(7, travelers)
                              ? 'Phù hợp khi cần thêm cốp, trẻ em hoặc nhiều hành lý.'
                              : 'Dùng để so sánh nhanh trước khi Car Match kiểm tra xe thật.'}
                        </p>
                        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
                          <button
                            type="button"
                            onClick={() => setSelectedCarId(car.id)}
                            className={`min-h-11 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black transition-colors ${
                              selectedCarId === car.id
                                ? 'bg-brand-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {selectedCarId === car.id ? 'Đang chọn' : 'Chọn xe'}
                          </button>
                          <Link
                            to={`/xe/${car.slug}`}
                            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
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
                  Chưa tìm được xe phù hợp từ dữ liệu hiện tại. Bạn gửi yêu cầu, Car Match sẽ check xe trống và báo lại nhanh.
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-stretch">
                <div>
                  <p className="text-brand-600 font-bold text-sm uppercase tracking-wide">Bước 4</p>
                  <h2 className="text-2xl font-bold text-gray-900">Timeline ngày đầu</h2>
                  <p className="text-gray-500 mt-1">Gợi ý giờ xuất phát, điểm dừng và ngân sách từng mục để bạn dễ hình dung chuyến đi.</p>
                </div>
                {tripVisualImageUrl ? (
                  <div className="relative hidden h-28 overflow-hidden rounded-2xl bg-slate-100 lg:block">
                    <img
                      src={tripVisualImageUrl}
                      alt={`Ảnh minh họa lịch trình ${tripPlan.name}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="text-xs font-black text-white">{tripPlan.duration}</p>
                    </div>
                  </div>
                ) : null}
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
                <p className="text-sm text-gray-500 mt-1">Lịch trình có thể thay đổi theo thời tiết, giờ nhận xe và nhu cầu dừng nghỉ của gia đình.</p>
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

      <section className="px-4 pb-14 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <TravelAssistant pageType="trip_finder" destinationSlug={tripPlan.slug} destinationName={tripPlan.name} />
        </div>
      </section>

      <section id="lead-form" className="scroll-mt-24 py-14 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="rounded-3xl bg-brand-50 p-6">
            <p className="text-brand-700 font-bold text-sm uppercase tracking-wide mb-2">Cách Car Match ước tính</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Chi phí chỉ là dự kiến trước khi kiểm tra xe thật</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Khoảng cách, phí đường, điểm dừng và lịch trình được dùng để bạn có khung ngân sách ban đầu. Car Match sẽ kiểm tra lại xe trống, giá thuê, phí giao nhận và điều kiện chuyến đi trước khi xác nhận.
            </p>
            <a href="https://zalo.me/0975563290" onClick={() => trackZaloClick('trip_finder_check_availability', {
              destination: tripPlan.slug,
            })} className="inline-flex rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700">
              Nhắn Zalo để kiểm tra xe trống
            </a>
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
              <h2 className="text-3xl font-bold mb-3">Muốn Car Match check xe trống cho chuyến này?</h2>
              <p className="text-slate-300 leading-relaxed">
                Để lại số điện thoại, Car Match sẽ kiểm tra lịch xe và báo phương án phù hợp qua Zalo/điện thoại.
              </p>
              <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-200">
                {[
                  'Kiểm tra xe thật trước khi báo giá',
                  'Không tự động giữ xe nếu khách chưa xác nhận',
                  'Tư vấn phí giao nhận, VETC và điều kiện thuê trước chuyến đi',
                ].map((item) => (
                  <div key={item} className="flex gap-2 rounded-2xl bg-white/10 px-3 py-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
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
                onClick={() => trackZaloClick('trip_finder_skip_form', {
                  destination: tripPlan.slug,
                  rental_days: rentalDays,
                  travelers,
                })}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Chat Zalo không cần gửi form
              </a>
              {submitState === 'done' && (
                <p className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                  Đã lưu yêu cầu. Car Match sẽ liên hệ lại để chốt xe phù hợp.
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
                className="grid grid-cols-[118px_minmax(0,1fr)] overflow-hidden rounded-3xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md md:block"
              >
                <div className="relative h-full min-h-32 bg-slate-100 md:h-28 md:min-h-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={`Ảnh tuyến ${item.name}`} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-black text-slate-900 shadow-sm md:bottom-3 md:left-3 md:px-3 md:text-xs">
                    <MapPin className="h-3.5 w-3.5 text-brand-700" />
                    {item.distanceKm} km/lượt
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-gray-500 text-sm mb-3 md:mb-4">{item.ideal}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-brand-600">
                    <span>{item.duration}</span>
                    <span>Xem kế hoạch</span>
                  </div>
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

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-16px_40px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="mx-auto flex max-w-md items-center gap-2">
          <a
            href="#trip-form"
            className="flex min-h-12 flex-1 flex-col justify-center rounded-2xl bg-slate-950 px-4 text-white"
          >
            <span className="text-[11px] font-bold uppercase tracking-wide text-white/55">Dự kiến</span>
            <span className="text-sm font-black">{formatCurrencyShort(totalEstimate)} · chỉnh chuyến</span>
          </a>
          <a
            href={`${ZALO_LINK}?text=${zaloMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackZaloClick('trip_finder_mobile_sticky', {
              destination: tripPlan.slug,
              rental_days: rentalDays,
              travelers,
            })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0068FF] px-4 text-sm font-black text-white shadow-lg shadow-blue-500/25"
          >
            <MessageCircle className="h-5 w-5" />
            Zalo
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
