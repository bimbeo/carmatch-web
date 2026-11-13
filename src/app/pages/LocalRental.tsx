import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Building2,
  Calculator,
  CalendarCheck2,
  Car,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Gauge,
  Luggage,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cars as fallbackCars, formatPrice, type Car as CarModel } from '@/data/cars';
import {
  getLocalRentalArea,
  localRentalAreas,
  type LocalRentalAreaSlug,
} from '@/data/localRentalAreas';
import { useVehicles } from '@/hooks/useVehicles';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';
import { vehicleImageAlt } from '@/lib/imageAlt';
import { cauGiayHubData } from '@/data/localHubsData';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import { LocalRentalQuickAnswer, LocalRentalPlanner } from '../components/LocalRentalDecisionTools';

const SITE_URL = 'https://www.carmatch.vn';
const ZALO_LINK = 'https://zalo.me/0971163290';
const PHONE_LINK = 'tel:0971163290';

function representativeModelKey(car: CarModel) {
  return `${car.brand} ${car.name}`
    .toLocaleLowerCase('vi-VN')
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/[^a-z0-9à-ỹ]+/gi, ' ')
    .trim();
}

function normalizedVehicleSearchText(value: string) {
  return value.toLocaleLowerCase('vi-VN').replace(/[^a-z0-9à-ỹ]+/gi, '');
}

function selectRepresentativeCars(catalog: CarModel[], keywords: string[], limit = 3) {
  const pricedCars = catalog.filter((car) => car.price > 0).sort((a, b) => a.price - b.price);
  const selected: CarModel[] = [];
  const selectedModels = new Set<string>();

  const addCar = (car: CarModel) => {
    const modelKey = representativeModelKey(car);
    if (selectedModels.has(modelKey)) return;
    selectedModels.add(modelKey);
    selected.push(car);
  };

  for (const keyword of keywords) {
    const match = pricedCars.find((car) => (
      normalizedVehicleSearchText(car.name).includes(normalizedVehicleSearchText(keyword)) &&
      !selectedModels.has(representativeModelKey(car))
    ));
    if (match) addCar(match);
    if (selected.length === limit) break;
  }

  for (const car of pricedCars) {
    addCar(car);
    if (selected.length === limit) break;
  }

  return selected;
}

export default function LocalRental({ areaSlug }: { areaSlug: LocalRentalAreaSlug }) {
  const area = getLocalRentalArea(areaSlug);
  if (!area) throw new Error(`Unknown local rental area: ${areaSlug}`);

  useSEO({
    title: area.seoTitle,
    description: area.description,
    canonical: `${SITE_URL}${area.path}`,
  });

  const isCauGiayPilot = area.slug === 'cau-giay';
  const { cars } = useVehicles();
  const catalog = cars.length > 0 ? cars : fallbackCars;
  const representativeCars = selectRepresentativeCars(catalog, area.recommendedKeywords, isCauGiayPilot ? 6 : 3);
  const [fleetFilter, setFleetFilter] = useState<'all' | 'electric' | 'five-seat' | 'seven-seat'>('all');
  const [selectedCarId, setSelectedCarId] = useState('');
  const selectedCar = representativeCars.find((car) => car.id === selectedCarId) || representativeCars[0];
  const filteredRepresentativeCars = representativeCars.filter((car) => {
    if (fleetFilter === 'electric') return car.fuel === 'Điện';
    if (fleetFilter === 'five-seat') return car.seats <= 5;
    if (fleetFilter === 'seven-seat') return car.seats >= 7;
    return true;
  });
  const fleetModelCount = new Set(
    catalog.filter((car) => car.price > 0 && car.seats >= 4 && car.seats <= 7).map(representativeModelKey),
  ).size;
  const startingPrice = representativeCars.length > 0
    ? Math.min(...representativeCars.map((car) => car.price))
    : null;
  const heroCar = representativeCars[0];
  const nearbyAreaSlugs = new Set(['my-dinh', 'tay-ho', 'nam-tu-liem', 'bac-tu-liem']);
  const displayedLocalAreas = isCauGiayPilot
    ? localRentalAreas.filter((item) => nearbyAreaSlugs.has(item.slug))
    : localRentalAreas;
  const source = `local_${area.slug.replace(/-/g, '_')}`;
  const zaloHref = `${ZALO_LINK}?text=${encodeURIComponent(
    `Tôi muốn thuê xe tự lái tại ${area.name}. Nhờ Car Match kiểm tra xe, lịch và điểm giao nhận phù hợp.`,
  )}`;
  const handleSelectCar = (carId: string) => {
    setSelectedCarId(carId);
    window.requestAnimationFrame(() => document.getElementById('booking-tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-950 sm:pb-0">
      <Navbar collapseAtLg={isCauGiayPilot} />
      <main id="main-content">
        <section className={isCauGiayPilot ? "relative overflow-hidden bg-[#f4f5f9] pt-16 text-slate-950" : "relative overflow-hidden bg-slate-950 text-white"}>
          {!isCauGiayPilot && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.16),transparent_42%)]" />}
          {isCauGiayPilot && (
            <>
              <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-white blur-3xl" />
              <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-brand-100/70 blur-3xl" />
            </>
          )}
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            {isCauGiayPilot && (
              <nav aria-label="Đường dẫn" className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                <Link to="/" className="hover:text-brand-700">Trang chủ</Link><span aria-hidden="true">/</span>
                <Link to="/xe" className="hover:text-brand-700">Thuê xe Hà Nội</Link><span aria-hidden="true">/</span>
                <span aria-current="page" className="text-slate-800">{area.shortName}</span>
              </nav>
            )}
            <div className={isCauGiayPilot ? "grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14" : "max-w-3xl"}>
              <div>
                <div className={isCauGiayPilot ? "mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/90 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-700 shadow-sm" : "mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-blue-100"}>
                  <MapPin className="h-4 w-4" /> {isCauGiayPilot ? 'Thuê xe tự lái · Cầu Giấy' : area.locality}
                </div>
                <h1 className={isCauGiayPilot ? "max-w-3xl text-[2.65rem] font-black leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-[4.15rem]" : "text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"}>
                  Thuê xe tự lái tại {area.name}{isCauGiayPilot && <span className="text-brand-600">.</span>}
                  {isCauGiayPilot && <span className="mt-1 block text-slate-500">Giao nhận theo lịch đã chốt.</span>}
                </h1>
                <p className={isCauGiayPilot ? "mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8" : "mt-6 max-w-3xl text-lg leading-8 text-slate-300"}>{isCauGiayPilot ? cauGiayHubData.heroLead : area.heroAnswer}</p>
                {isCauGiayPilot && (
                  <div className="mt-6 flex flex-wrap gap-2.5 text-sm font-semibold text-slate-700">
                    {cauGiayHubData.heroPills.map((item) => (
                      <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#xe-goi-y"
                    onClick={() => trackCtaClick(`${source}_view_cars`, { target_path: '#xe-goi-y' })}
                    className={isCauGiayPilot ? "inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-white shadow-[0_12px_30px_rgba(30,64,175,0.2)] transition hover:-translate-y-0.5 hover:bg-brand-700" : "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-400 px-6 py-3 font-black text-slate-950 transition-colors hover:bg-orange-300"}
                  >
                    Xem xe và giá thực tế <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href={zaloHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackZaloClick(`${source}_hero`)}
                    className={isCauGiayPilot ? "inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50" : "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-black text-white hover:bg-white/15"}
                  >
                    <MessageCircle className="h-4 w-4" /> Kiểm tra lịch giao xe
                  </a>
                </div>
              </div>

              {isCauGiayPilot && heroCar && (
                <div className="relative mx-auto w-full max-w-xl lg:mx-0">
                  <div className="relative overflow-hidden rounded-[2rem] border-8 border-white bg-slate-200 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
                    <img
                      src={optimizedImageUrl(heroCar.images[0], 960, 72)}
                      srcSet={optimizedImageSrcSet(heroCar.images[0], [640, 960, 1280], 72)}
                      sizes="(min-width: 1024px) 48vw, 100vw"
                      alt={vehicleImageAlt(heroCar)}
                      width={960}
                      height={720}
                      loading="eager"
                      decoding="async"
                      className="aspect-[4/3] h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent p-6 pt-20 text-white sm:p-8">
                      <p className="text-sm font-semibold text-blue-100">{heroCar.popular ? 'Mẫu xe được chọn nhiều' : 'Mẫu xe gợi ý tại Cầu Giấy'}</p>
                      <div className="mt-1 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-2xl font-black">{heroCar.name}</p>
                          <p className="mt-1 text-sm text-slate-200">{heroCar.seats} chỗ · {heroCar.fuel} · {heroCar.transmission}</p>
                        </div>
                        <p className="shrink-0 text-right text-sm text-slate-200"><strong className="block text-xl text-white">{formatPrice(heroCar.price)}</strong>/ngày</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:block lg:-left-8">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-brand-600" /> Giữ lịch online 0đ</p>
                    <p className="mt-1 text-xs text-slate-500">Đối chiếu xe · địa chỉ · tổng chi phí</p>
                  </div>
                </div>
              )}
            </div>

            <div className={isCauGiayPilot ? "mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-3 lg:mt-16" : "mt-10 grid max-w-4xl gap-3 sm:grid-cols-3"}>
              <div className={isCauGiayPilot ? "bg-white p-5" : "rounded-2xl border border-white/10 bg-white/5 p-4"}>
                <p className={isCauGiayPilot ? "flex items-center gap-2 text-sm font-semibold text-slate-500" : "text-sm text-slate-400"}><Car className="h-4 w-4 text-brand-600" /> Đội xe 4–7 chỗ</p>
                <p className="mt-1 text-2xl font-black">{fleetModelCount} mẫu xe</p>
              </div>
              <div className={isCauGiayPilot ? "bg-white p-5" : "rounded-2xl border border-white/10 bg-white/5 p-4"}>
                <p className={isCauGiayPilot ? "flex items-center gap-2 text-sm font-semibold text-slate-500" : "text-sm text-slate-400"}><Gauge className="h-4 w-4 text-brand-600" /> Giá ngày từ</p>
                <p className="mt-1 text-2xl font-black">{startingPrice ? `${formatPrice(startingPrice)}/ngày` : 'Kiểm tra theo lịch'}</p>
              </div>
              <div className={isCauGiayPilot ? "bg-white p-5" : "rounded-2xl border border-white/10 bg-white/5 p-4"}>
                <p className={isCauGiayPilot ? "flex items-center gap-2 text-sm font-semibold text-slate-500" : "text-sm text-slate-400"}><Clock3 className="h-4 w-4 text-brand-600" /> Điểm giao nhận</p>
                <p className="mt-1 text-xl font-black">Điểm hẹn hoặc giao tận nơi</p>
              </div>
            </div>
          </div>
        </section>

        {isCauGiayPilot && <LocalRentalQuickAnswer area={area} />}

        {!isCauGiayPilot && <section className="border-b border-slate-200 bg-slate-50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {area.localContexts.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="text-brand-600"><MapPin className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>}

        <section id="xe-goi-y" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">{isCauGiayPilot ? 'Đội xe phục vụ tại khu vực' : 'Xe và giá từ danh mục hiện tại'}</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Gợi ý xe cho khách tại {area.shortName}</h2>
                <p className="mt-4 text-slate-600">{isCauGiayPilot ? 'Chọn mẫu xe theo số người, hành lý và hành trình. Mỗi thẻ hiển thị đơn giá cùng định mức km thực tế; đội vận hành sẽ đối chiếu lịch ngay khi nhận yêu cầu.' : 'Giá hiển thị theo dữ liệu từng xe, chưa khẳng định xe trống. Lịch, tổng tiền và điểm giao nhận chỉ được chốt sau khi Car Match kiểm tra yêu cầu cụ thể.'}</p>
              </div>
              <Link
                to="/xe"
                onClick={() => trackCtaClick(`${source}_all_cars`, { target_path: '/xe' })}
                className="inline-flex items-center gap-2 font-black text-brand-700 hover:text-brand-800"
              >
                Xem toàn bộ xe <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {isCauGiayPilot && (
              <div className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label="Lọc đội xe">
                {[
                  ['all', 'Tất cả'],
                  ['electric', 'Xe điện'],
                  ['five-seat', '4–5 chỗ'],
                  ['seven-seat', '7 chỗ'],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFleetFilter(value as typeof fleetFilter)} aria-pressed={fleetFilter === value} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${fleetFilter === value ? 'bg-[#10163f] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-brand-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {representativeCars.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRepresentativeCars.map((car) => (
                  <div key={car.id} className={`rounded-2xl ${selectedCar?.id === car.id ? 'ring-2 ring-brand-500 ring-offset-4' : ''}`}>
                    <CarCard car={car} mode="listing" source={source} />
                    {isCauGiayPilot && (
                      <button type="button" onClick={() => handleSelectCar(car.id)} className={`mt-3 min-h-12 w-full rounded-xl px-4 text-sm font-black transition ${selectedCar?.id === car.id ? 'bg-brand-600 text-white' : 'border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100'}`}>
                        {selectedCar?.id === car.id ? 'Đang chọn để đặt xe' : 'Chọn xe này & xem lịch'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="font-bold text-slate-700">Danh sách xe đang được cập nhật.</p>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-black text-brand-700">Nhắn Car Match kiểm tra xe</a>
              </div>
            )}
          </div>
        </section>

        {isCauGiayPilot && selectedCar && (
          <LocalRentalPlanner
            area={area}
            cars={representativeCars}
            source={source}
            selectedCarId={selectedCar.id}
            onSelectCar={handleSelectCar}
          />
        )}

        <section id="giao-nhan" className={isCauGiayPilot ? "scroll-mt-24 bg-[#10163f] py-16 text-white sm:py-24" : "scroll-mt-24 bg-blue-50 py-16 sm:py-20"}>
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className={isCauGiayPilot ? "text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200" : "text-sm font-black uppercase tracking-[0.18em] text-brand-600"}>Giao nhận tại địa phương</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">Hẹn đúng điểm, nhận xe bớt chờ.</h2>
              <p className={isCauGiayPilot ? "mt-5 leading-7 text-slate-300" : "mt-4 leading-7 text-slate-700"}>{area.pickupNote}</p>
              <div className={isCauGiayPilot ? "mt-7 rounded-2xl border border-white/10 bg-white/10 p-5" : "mt-6 rounded-2xl border border-blue-200 bg-white p-5"}>
                <p className="flex items-center gap-2 font-black"><MapPin className={isCauGiayPilot ? "h-5 w-5 text-blue-200" : "h-5 w-5 text-brand-600"} /> Vị trí cần đối chiếu</p>
                <p className={isCauGiayPilot ? "mt-2 text-sm leading-6 text-slate-300" : "mt-2 text-sm leading-6 text-slate-600"}>{area.locationNote}</p>
              </div>
              {isCauGiayPilot && (
                <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-300">
                  {cauGiayHubData.pickupAreas.map((pickupArea) => <li key={pickupArea} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 flex-none text-blue-200" />{pickupArea}</li>)}
                </ul>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['1. Gửi yêu cầu', 'Ngày giờ nhận trả, số người, hành lý và địa chỉ chi tiết.'],
                ['2. Kiểm tra xe', 'Car Match đối chiếu xe, giá, km, cọc và phương án giao nhận.'],
                ['3. Xác nhận lịch', 'Hai bên chốt đầy đủ điều kiện trước bước giữ lịch.'],
                ['4. Bàn giao', 'Kiểm tra xe, xăng hoặc pin, km, phụ kiện và ký biên bản.'],
              ].map(([title, description]) => (
                <article key={title} className={isCauGiayPilot ? "rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur" : "rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"}>
                  <CalendarCheck2 className={isCauGiayPilot ? "h-6 w-6 text-blue-200" : "h-6 w-6 text-brand-600"} />
                  <h3 className="mt-3 font-black">{title}</h3>
                  <p className={isCauGiayPilot ? "mt-2 text-sm leading-6 text-slate-300" : "mt-2 text-sm leading-6 text-slate-600"}>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={isCauGiayPilot ? "bg-[#f7f8fb] py-16 sm:py-24" : "py-16 sm:py-20"}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={isCauGiayPilot ? "grid gap-12" : "grid gap-12 lg:grid-cols-2"}>
              <div>
                <Route className="h-10 w-10 text-brand-600" />
                <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">Chọn xe theo chuyến đi, không chỉ theo số ghế</h2>
                <div className={isCauGiayPilot ? "mt-6 grid gap-4 md:grid-cols-3" : "mt-6 space-y-4"}>
                  {area.useCases.map((item, index) => {
                    const IntentIcon = [Building2, Plane, Luggage][index] || Sparkles;
                    return (
                    <article key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.04)]">
                      <span className="h-fit rounded-xl bg-brand-50 p-2.5 text-brand-700"><IntentIcon className="h-5 w-5" /></span>
                      <div><h3 className="font-black">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></div>
                    </article>
                    );
                  })}
                </div>
              </div>
              {!isCauGiayPilot && <div>
                <Calculator className="h-10 w-10 text-orange-600" />
                <h2 className="mt-4 text-3xl font-black tracking-tight">Cách tính tổng chi phí trước khi chốt</h2>
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_25px_rgba(15,23,42,0.04)]">
                  {[
                    ['Giá thuê xe', 'Theo mẫu xe và thời lượng nhận trả thực tế.'],
                    ['Giao nhận', 'Xác nhận theo địa chỉ, lịch và khung giờ.'],
                    ['Nhiên liệu hoặc sạc', 'Tính theo hành trình và mức bàn giao.'],
                    ['Cầu đường, gửi xe', 'Khách dự tính theo tuyến đi thực tế.'],
                    ['Vượt km hoặc phát sinh', 'Chỉ áp dụng theo điều kiện đã xác nhận.'],
                  ].map(([label, note]) => (
                    <div key={label} className="grid gap-1 border-b border-slate-200 p-4 last:border-b-0 sm:grid-cols-[170px_1fr]">
                      <p className="font-black">{label}</p>
                      <p className="text-sm leading-6 text-slate-600">{note}</p>
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className={`mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:px-8 ${isCauGiayPilot ? '' : 'lg:grid-cols-2'}`}>
            <div>
              <FileCheck2 className="h-10 w-10 text-orange-400" />
              <h2 className="mt-4 text-3xl font-black tracking-tight">Giấy tờ và bước kiểm tra khi nhận xe</h2>
              <ul className="mt-6 space-y-3 text-slate-300">
                {[
                  'CCCD bản gốc và giấy phép lái xe hạng B còn hiệu lực.',
                  'Khoản đặt cọc và điều kiện hoàn cọc theo mẫu xe đã xác nhận.',
                  'Ghi nhận ngoại thất, nội thất, km, mức xăng hoặc pin và phụ kiện.',
                  'Đọc rõ giờ trả, giới hạn km, phí vượt km và cách xử lý phát sinh.',
                ].map((item) => (
                  <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-orange-400" />{item}</li>
                ))}
              </ul>
            </div>
            {!isCauGiayPilot && <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <ShieldCheck className="h-9 w-9 text-blue-300" />
              <h2 className="mt-4 text-2xl font-black">Lịch xe chỉ chốt sau khi kiểm tra</h2>
              <p className="mt-3 leading-7 text-slate-300">Website giúp so sánh mẫu xe và giá. Car Match vẫn cần đối chiếu ngày giờ, địa chỉ, tình trạng xe và điều kiện thuê trước khi xác nhận giữ lịch.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick(`${source}_requirements`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-400 px-5 py-3 font-black text-slate-950">
                  <MessageCircle className="h-4 w-4" /> Nhắn Zalo
                </a>
                <a href={PHONE_LINK} onClick={() => trackPhoneClick(`${source}_requirements`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-black text-white">
                  <Phone className="h-4 w-4" /> 0971 163 290
                </a>
              </div>
            </div>}
          </div>
        </section>

        <section id="cau-hoi" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className={isCauGiayPilot ? "text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700" : "text-center text-sm font-black uppercase tracking-[0.18em] text-brand-600"}>Câu hỏi thường gặp</p>
            <h2 className={isCauGiayPilot ? "mt-3 max-w-2xl text-3xl font-black tracking-[-0.035em] sm:text-5xl" : "mt-3 text-center text-3xl font-black tracking-tight sm:text-4xl"}>Giải đáp trước khi đặt xe tại {area.shortName}</h2>
            <div className={isCauGiayPilot ? "mt-9 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]" : "mt-8 space-y-3"}>
              <div className="space-y-3">
                {area.faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white p-5 transition open:border-brand-200 open:bg-brand-50/40 open:shadow-sm">
                    <summary className="cursor-pointer list-none pr-8 text-lg font-black marker:hidden">{faq.question}</summary>
                    <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
              {isCauGiayPilot && (
                <aside className="h-fit rounded-[1.75rem] border border-slate-200 bg-[#f4f5f9] p-6 sm:p-8">
                  <span className="inline-flex rounded-xl bg-white p-2.5 text-brand-700 shadow-sm"><MessageCircle className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-2xl font-black">Chưa biết chọn xe nào?</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Gửi số người, hành lý, tuyến đi, ngày giờ và địa chỉ nhận. Car Match sẽ kiểm tra các phương án để bạn đối chiếu.</p>
                  <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick(`${source}_faq`)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white hover:bg-brand-700">
                    Tư vấn trên Zalo <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="mt-3 text-xs leading-5 text-slate-500">Không cần nhập lại nếu bạn đã gửi thông tin từ công cụ tính chi phí.</p>
                </aside>
              )}
            </div>
          </div>
        </section>

        {isCauGiayPilot && (
          <section className="bg-white pb-16 sm:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-[#10163f] p-7 text-white shadow-[0_28px_75px_rgba(15,23,42,0.2)] sm:p-10 lg:grid-cols-[1fr_auto] lg:p-12">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">Bước tiếp theo</p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Chốt lịch, xe và điểm nhận trước khi đặt.</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-slate-300">Gửi ngày giờ, địa chỉ tại Cầu Giấy, số người và hành lý. Car Match kiểm tra xe, tổng giá, cọc và điều kiện giao nhận.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick(`${source}_final`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-brand-900 hover:bg-blue-50"><MessageCircle className="h-4 w-4" /> Gửi lịch thuê xe</a>
                  <a href={PHONE_LINK} onClick={() => trackPhoneClick(`${source}_final`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/10"><Phone className="h-4 w-4" /> 0971 163 290</a>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Khu vực giao nhận khác</p>
                <h2 className="mt-2 text-2xl font-black">{isCauGiayPilot ? 'Khu vực lân cận có thể hữu ích' : 'Xem landing theo từng khu đô thị'}</h2>
              </div>
              <Link to="/" className="inline-flex items-center gap-2 font-black text-brand-700">Dịch vụ thuê xe Hà Nội <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <nav aria-label="Các khu vực giao xe" className={isCauGiayPilot ? "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"}>
              {displayedLocalAreas.map((item) => (
                <Link key={item.path} to={item.path} className={`rounded-2xl border p-4 transition-colors ${item.path === area.path ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
                  <MapPin className="h-4 w-4" />
                  <span className="mt-2 block font-black">{item.shortName}</span>
                  <span className="mt-1 block text-xs text-slate-500">{item.locality}</span>
                </Link>
              ))}
            </nav>
            <nav aria-label="Nội dung liên quan" className="mt-6 flex flex-wrap gap-3">
              {area.relatedLinks.map((item) => (
                <Link key={item.href} to={item.href} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:border-brand-300 hover:text-brand-700">
                  {item.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
              <Link to="/xe" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:border-brand-300 hover:text-brand-700">
                <Car className="h-3.5 w-3.5" /> Danh sách xe
              </Link>
            </nav>
          </div>
        </section>
      </main>
      <Footer />
      <ZaloFAB />
      {!isCauGiayPilot && <MobileConversionBar source={source} />}
    </div>
  );
}
