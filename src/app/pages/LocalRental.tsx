import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Building2,
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
  Sparkles,
} from 'lucide-react';
import { formatPrice } from '@/data/cars';
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
import { getLocalHubData, LOCAL_RENTAL_HERO_POINTS } from '@/data/localHubsData';
import { localRentalModelKey, selectLocalRentalCars } from '@/data/localRentalFleet.ts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import { LocalRentalQuickAnswer, LocalRentalPlanner } from '../components/LocalRentalDecisionTools';

const SITE_URL = 'https://www.carmatch.vn';
const ZALO_LINK = 'https://zalo.me/0971163290';
const PHONE_LINK = 'tel:0971163290';

export default function LocalRental({ areaSlug }: { areaSlug: LocalRentalAreaSlug }) {
  return <LocalRentalPage key={areaSlug} areaSlug={areaSlug} />;
}

function LocalRentalPage({ areaSlug }: { areaSlug: LocalRentalAreaSlug }) {
  const area = getLocalRentalArea(areaSlug);
  if (!area) throw new Error(`Unknown local rental area: ${areaSlug}`);

  useSEO({
    title: area.seoTitle,
    description: area.description,
    canonical: `${SITE_URL}${area.path}`,
  });

  const hub = getLocalHubData(area.slug);
  const { cars: catalog, loading } = useVehicles();
  const representativeCars = useMemo(() => selectLocalRentalCars(catalog, hub.recommendedModels), [catalog, hub]);
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
    catalog.filter((car) => car.available && car.price > 0 && car.seats >= 4 && car.seats <= 7).map(localRentalModelKey),
  ).size;
  const startingPrice = representativeCars.length > 0
    ? Math.min(...representativeCars.map((car) => car.price))
    : null;
  const heroCar = representativeCars.find((car) => car.images[0]);
  const nearbyAreas = localRentalAreas.filter((item) => item.slug !== area.slug);
  const source = `local_${area.slug.replace(/-/g, '_')}`;
  const zaloHref = `${ZALO_LINK}?text=${encodeURIComponent(
    `Tôi muốn thuê xe tự lái tại ${area.name}. Nhờ Car Match kiểm tra xe, lịch và điểm giao nhận phù hợp.`,
  )}`;
  const handleSelectCar = (carId: string) => {
    setSelectedCarId(carId);
    trackCtaClick(`${source}_vehicle_select`, { vehicle_id: carId });
    window.requestAnimationFrame(() => document.getElementById('booking-tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-950 sm:pb-0">
      <Navbar collapseAtLg />
      <main id="main-content">
        <section className="relative overflow-hidden bg-[#f4f5f9] pt-16 text-slate-950">
          <>
            <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-white blur-3xl" />
            <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-brand-100/70 blur-3xl" />
          </>
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <nav aria-label="Đường dẫn" className="mb-8 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
              <Link to="/" className="hover:text-brand-700">Trang chủ</Link><span aria-hidden="true">/</span>
              <Link to="/xe" className="hover:text-brand-700">Thuê xe Hà Nội</Link><span aria-hidden="true">/</span>
              <span aria-current="page" className="text-slate-800">{area.shortName}</span>
            </nav>
            <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/90 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-700 shadow-sm">
                  <MapPin className="h-4 w-4" /> {area.locality}
                </div>
                <h1 className="max-w-3xl text-[2.65rem] font-black leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-[4.15rem]">
                  Thuê xe tự lái {area.name}{area.slug === 'ecopark' ? ', Hưng Yên' : ', Hà Nội'}
                </h1>
                <p className="mt-4 text-2xl font-black tracking-[-0.03em] text-brand-700 sm:text-3xl">Chọn xe dễ dàng. Giao nhận thuận tiện.</p>
                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{area.heroAnswer}</p>
                <div className="mt-6 flex flex-wrap gap-2.5 text-sm font-semibold text-slate-700">
                  {LOCAL_RENTAL_HERO_POINTS.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#xe-goi-y"
                    onClick={() => trackCtaClick(`${source}_view_cars`, { target_path: '#xe-goi-y' })}
                    className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-bold text-white shadow-[0_12px_30px_rgba(30,64,175,0.2)] transition hover:-translate-y-0.5 hover:bg-brand-700"
                  >
                    Xem xe &amp; chọn lịch thuê <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href={zaloHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackZaloClick(`${source}_hero`)}
                    className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    <MessageCircle className="h-4 w-4" /> Tư vấn xe phù hợp
                  </a>
                </div>
              </div>

              {heroCar && (
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
                      <p className="text-sm font-semibold text-blue-100">Xe gợi ý tại {area.shortName}</p>
                      <div className="mt-1 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-2xl font-black">{heroCar.name}</p>
                          <p className="mt-1 text-sm text-slate-200">{heroCar.seats} chỗ · {heroCar.fuel} · {heroCar.transmission}</p>
                        </div>
                        <p className="shrink-0 text-right text-sm text-slate-200"><strong className="block text-xl text-white">{formatPrice(heroCar.price)}</strong>/ngày</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-3 lg:mt-16">
              <div className="bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Car className="h-4 w-4 text-brand-600" /> Danh mục xe 4–7 chỗ</p>
                <p className="mt-1 text-2xl font-black">{fleetModelCount} mẫu trong danh mục Car Match</p>
              </div>
              <div className="bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Gauge className="h-4 w-4 text-brand-600" /> Giá niêm yết từ</p>
                <p className="mt-1 text-2xl font-black">{startingPrice ? `${formatPrice(startingPrice)}/ngày` : 'Kiểm tra theo lịch'}</p>
                <p className="mt-1 text-xs text-slate-500">Chưa gồm phụ phí hoặc giá cao điểm nếu có</p>
              </div>
              <div className="bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Clock3 className="h-4 w-4 text-brand-600" /> Điểm giao nhận</p>
                <p className="mt-1 text-xl font-black">Chọn điểm nhận hoặc yêu cầu giao tận nơi</p>
              </div>
            </div>
          </div>
        </section>

        <LocalRentalQuickAnswer area={area} />

        <section id="xe-goi-y" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Xe phù hợp cho khách khu vực</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Chọn xe tự lái tại {area.shortName}</h2>
                <p className="mt-4 text-slate-600">{`So sánh ${representativeCars.length} mẫu xe gợi ý theo số ghế, nhiên liệu và giá niêm yết. Lịch xe và tổng tiền được kiểm tra theo ngày giờ bạn chọn. Giá tham khảo, có thể thay đổi theo thời điểm thuê và điều kiện áp dụng.`}</p>
              </div>
              <Link
                to="/xe"
                onClick={() => trackCtaClick(`${source}_all_cars`, { target_path: '/xe' })}
                className="inline-flex items-center gap-2 font-black text-brand-700 hover:text-brand-800"
              >
                Xem toàn bộ xe <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label="Lọc đội xe">
              {[
                ['all', 'Tất cả'],
                ['electric', 'Xe điện'],
                ['five-seat', '4–5 chỗ'],
                ['seven-seat', '7 chỗ'],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setFleetFilter(value as typeof fleetFilter); trackCtaClick(`${source}_vehicle_filter`, { filter: value }); }} aria-pressed={fleetFilter === value} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${fleetFilter === value ? 'bg-[#10163f] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-brand-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            {filteredRepresentativeCars.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRepresentativeCars.map((car) => (
                  <div key={car.id} className={`rounded-2xl ${selectedCar?.id === car.id ? 'ring-2 ring-brand-500 ring-offset-4' : ''}`}>
                    <CarCard
                      car={car}
                      mode="listing"
                      source={source}
                      selectionAction={{
                        selected: selectedCar?.id === car.id,
                        onSelect: () => handleSelectCar(car.id),
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="font-bold text-slate-700">{loading ? 'Đang tải danh mục xe…' : representativeCars.length > 0 ? 'Chưa có xe phù hợp với bộ lọc này.' : 'Danh sách xe đang được cập nhật.'}</p>
                {representativeCars.length > 0 && <button type="button" onClick={() => setFleetFilter('all')} className="mt-3 font-black text-brand-700">Xem tất cả xe</button>}
                <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="ml-3 mt-3 inline-flex font-black text-brand-700">Nhờ Car Match tư vấn</a>
              </div>
            )}
            {representativeCars.length > 1 && (
              <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <summary className="cursor-pointer font-black text-brand-800">So sánh các mẫu xe gợi ý</summary>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[30rem] text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-600">
                      <tr>
                        {['Mẫu xe', 'Số chỗ', 'Nhiên liệu', 'Giá niêm yết/ngày', 'Chọn xe'].map((label) => (
                          <th key={label} scope="col" className="p-3">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {representativeCars.map((car) => (
                        <tr key={car.id} className="border-b border-slate-100 last:border-0">
                          <th scope="row" className="p-3">{car.name}</th>
                          <td className="p-3">{car.seats}</td>
                          <td className="p-3">{car.fuel}</td>
                          <td className="p-3">{formatPrice(car.price)}</td>
                          <td className="p-3">
                            <button type="button" className="min-h-11 font-bold text-brand-700" onClick={() => handleSelectCar(car.id)} aria-label={`Chọn ${car.name}`}>Chọn xe</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        </section>

        {selectedCar && (
          <LocalRentalPlanner
            area={area}
            preferredPickupId={hub.selfPickupId}
            cars={representativeCars}
            source={source}
            selectedCarId={selectedCar.id}
            onSelectCar={handleSelectCar}
          />
        )}

        <section id="giao-nhan" className="scroll-mt-24 bg-[#10163f] py-16 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">Giao nhận xe tại {area.shortName}</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">Hẹn đúng điểm, nhận xe thuận tiện</h2>
              <p className="mt-5 leading-7 text-slate-300">{area.pickupNote}</p>
              <div className="mt-7 rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="flex items-center gap-2 font-black"><MapPin className="h-5 w-5 text-blue-200" /> Vị trí cần đối chiếu</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{area.locationNote}</p>
              </div>
              <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-300">
                {area.localContexts.map(({ title, description }) => (
                  <li key={title} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-blue-200" />
                    <span><strong className="text-white">{title}.</strong> {description}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['1. Chọn xe & lịch', 'Chọn mẫu xe, ngày giờ và địa chỉ nhận trả phù hợp.'],
                ['2. Kiểm tra yêu cầu', 'Car Match đối chiếu lịch, giá và điểm hẹn.'],
                ['3. Xác nhận điều kiện', 'Hai bên thống nhất yêu cầu, cọc và điều kiện thuê.'],
                ['4. Bàn giao', 'Kiểm tra xe, mức nhiên liệu hoặc pin và ký biên bản.'],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <CalendarCheck2 className="h-6 w-6 text-blue-200" />
                  <h3 className="mt-3 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8fb] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12">
              <div>
                <Route className="h-10 w-10 text-brand-600" />
                <h2 className="mt-4 text-3xl font-black tracking-[-0.03em]">Chọn xe phù hợp với chuyến đi của bạn</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
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
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div>
              <FileCheck2 className="h-10 w-10 text-orange-400" />
              <h2 className="mt-4 text-3xl font-black tracking-tight">Giấy tờ và điều kiện cần kiểm tra trước khi thuê</h2>
              <p className="mt-4 max-w-3xl leading-7 text-slate-300">Điều kiện thuê, cọc và phụ phí có thể khác nhau theo từng xe. Kiểm tra thông tin được báo trước khi xác nhận.</p>
              <ul className="mt-6 space-y-3 text-slate-300">
                {[
                  'Giấy tờ định danh và giấy phép lái xe phù hợp theo chính sách của từng xe.',
                  'Cọc giữ lịch, khoản bảo đảm và điều kiện hoàn trả được thông báo riêng.',
                  'Ghi nhận ngoại thất, nội thất, km, mức xăng hoặc pin và phụ kiện.',
                  'Đọc rõ giờ trả, giới hạn km, phí vượt km và cách xử lý phát sinh.',
                ].map((item) => (
                  <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-orange-400" />{item}</li>
                ))}
              </ul>
              <Link to="/chinh-sach" className="mt-6 inline-flex items-center gap-2 font-bold text-blue-200 hover:text-white">Xem chính sách thuê xe <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section id="cau-hoi" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Câu hỏi thường gặp</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.035em] sm:text-5xl">Câu hỏi thường gặp khi thuê xe tại {area.shortName}</h2>
            <div className="mt-9 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-3">
                {area.faqs.map((faq) => (
                  <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white p-5 transition open:border-brand-200 open:bg-brand-50/40 open:shadow-sm">
                    <summary className="cursor-pointer list-none pr-8 text-lg font-black marker:hidden">{faq.question}</summary>
                    <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
              <aside className="h-fit rounded-[1.75rem] border border-slate-200 bg-[#f4f5f9] p-6 sm:p-8">
                <span className="inline-flex rounded-xl bg-white p-2.5 text-brand-700 shadow-sm"><MessageCircle className="h-6 w-6" /></span>
                <h3 className="mt-5 text-2xl font-black">Chưa biết chọn xe nào?</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">Gửi số người, hành lý, tuyến đi, ngày giờ và địa chỉ nhận. Car Match sẽ kiểm tra các phương án để bạn đối chiếu.</p>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick(`${source}_faq`)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white hover:bg-brand-700">
                  Tư vấn trên Zalo <ArrowRight className="h-4 w-4" />
                </a>
                <a href={PHONE_LINK} onClick={() => trackPhoneClick(`${source}_faq`)} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-brand-700"><Phone className="h-4 w-4" /> 0971 163 290</a>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-white pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-[#10163f] p-7 text-white shadow-[0_28px_75px_rgba(15,23,42,0.2)] sm:p-10 lg:grid-cols-[1fr_auto] lg:p-12">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">Bước tiếp theo</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Đã chọn được xe? Gửi lịch thuê để Car Match kiểm tra.</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">Gửi ngày giờ, địa chỉ tại {area.shortName}, số người và hành lý. Car Match kiểm tra lịch xe, tổng chi phí, cọc và điều kiện giao nhận trước khi xác nhận.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a href="#booking-tool" onClick={() => trackCtaClick(`${source}_final_booking`, { target_path: '#booking-tool' })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-brand-900 hover:bg-blue-50"><CalendarCheck2 className="h-4 w-4" /> Gửi yêu cầu thuê xe</a>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick(`${source}_final`)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/10"><MessageCircle className="h-4 w-4" /> Nhắn Zalo để được tư vấn</a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Khu vực giao nhận khác</p>
                <h2 className="mt-2 text-2xl font-black">Thuê xe tại các khu vực lân cận</h2>
              </div>
              <Link to="/" className="inline-flex items-center gap-2 font-black text-brand-700">Dịch vụ thuê xe Hà Nội <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <nav aria-label="Các khu vực giao xe" className="mt-6 flex flex-wrap gap-2">
              {nearbyAreas.map((item) => (
                <Link key={item.path} to={item.path} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:border-brand-300">
                  <MapPin className="h-4 w-4" />
                  {item.shortName}
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
    </div>
  );
}
