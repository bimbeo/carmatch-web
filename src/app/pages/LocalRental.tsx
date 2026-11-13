import { Link } from 'react-router';
import {
  ArrowRight,
  Calculator,
  CalendarCheck2,
  Car,
  CheckCircle2,
  FileCheck2,
  MapPin,
  MessageCircle,
  Phone,
  Route,
  ShieldCheck,
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
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard from '../components/CarCard';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import { LocalRentalQuickAnswer, LocalRentalPlanner } from '../components/LocalRentalDecisionTools';

const SITE_URL = 'https://www.carmatch.vn';
const ZALO_LINK = 'https://zalo.me/0971163290';
const PHONE_LINK = 'tel:0971163290';

function selectRepresentativeCars(catalog: CarModel[], keywords: string[]) {
  const pricedCars = catalog.filter((car) => car.price > 0).sort((a, b) => a.price - b.price);
  const selected: CarModel[] = [];

  for (const keyword of keywords) {
    const match = pricedCars.find((car) => (
      car.name.toLocaleLowerCase('vi-VN').includes(keyword) &&
      !selected.some((item) => item.id === car.id)
    ));
    if (match) selected.push(match);
    if (selected.length === 3) break;
  }

  for (const car of pricedCars) {
    if (!selected.some((item) => item.id === car.id)) selected.push(car);
    if (selected.length === 3) break;
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
  const representativeCars = selectRepresentativeCars(catalog, area.recommendedKeywords);
  const startingPrice = representativeCars.length > 0
    ? Math.min(...representativeCars.map((car) => car.price))
    : null;
  const source = `local_${area.slug.replace(/-/g, '_')}`;
  const zaloHref = `${ZALO_LINK}?text=${encodeURIComponent(
    `Tôi muốn thuê xe tự lái tại ${area.name}. Nhờ Car Match kiểm tra xe, lịch và điểm giao nhận phù hợp.`,
  )}`;

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-950 sm:pb-0">
      <Navbar />
      <main id="main-content">
        <section className={isCauGiayPilot ? "relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-slate-50 pt-16 text-slate-950" : "relative overflow-hidden bg-slate-950 text-white"}>
          {!isCauGiayPilot && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.16),transparent_42%)]" />}
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              {isCauGiayPilot && <nav aria-label="Đường dẫn" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link to="/">Trang chủ</Link><span>/</span><Link to="/xe">Thuê xe</Link><span>/</span><span aria-current="page">{area.shortName}</span></nav>}
              <div className={isCauGiayPilot ? "mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1.5 text-sm font-bold text-brand-700" : "mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-blue-100"}>
                <MapPin className="h-4 w-4" /> {area.locality}
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Thuê xe tự lái tại {area.name}
              </h1>
              <p className={isCauGiayPilot ? "mt-6 max-w-3xl text-lg leading-8 text-slate-600" : "mt-6 max-w-3xl text-lg leading-8 text-slate-300"}>{area.heroAnswer}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#xe-goi-y"
                  onClick={() => trackCtaClick(`${source}_view_cars`, { target_path: '#xe-goi-y' })}
                  className={isCauGiayPilot ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700" : "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-400 px-6 py-3 font-black text-slate-950 transition-colors hover:bg-orange-300"}
                >
                  Xem xe và giá thực tế <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={zaloHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick(`${source}_hero`)}
                  className={isCauGiayPilot ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-100 bg-white px-6 py-3 font-bold text-brand-700 hover:bg-brand-50" : "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-black text-white hover:bg-white/15"}
                >
                  <MessageCircle className="h-4 w-4" /> Kiểm tra lịch giao xe
                </a>
              </div>
            </div>

            <div className="mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
              <div className={isCauGiayPilot ? "rounded-2xl border border-slate-200 bg-white p-4" : "rounded-2xl border border-white/10 bg-white/5 p-4"}>
                <p className={isCauGiayPilot ? "text-sm text-slate-600" : "text-sm text-slate-400"}>Xe gợi ý từ dữ liệu</p>
                <p className="mt-1 text-2xl font-black">{representativeCars.length} mẫu</p>
              </div>
              <div className={isCauGiayPilot ? "rounded-2xl border border-slate-200 bg-white p-4" : "rounded-2xl border border-white/10 bg-white/5 p-4"}>
                <p className={isCauGiayPilot ? "text-sm text-slate-600" : "text-sm text-slate-400"}>Giá ngày từ</p>
                <p className="mt-1 text-2xl font-black">{startingPrice ? `${formatPrice(startingPrice)}/ngày` : 'Kiểm tra theo lịch'}</p>
              </div>
              <div className={isCauGiayPilot ? "rounded-2xl border border-slate-200 bg-white p-4" : "rounded-2xl border border-white/10 bg-white/5 p-4"}>
                <p className={isCauGiayPilot ? "text-sm text-slate-600" : "text-sm text-slate-400"}>Điểm giao nhận</p>
                <p className="mt-1 text-xl font-black">Xác nhận theo địa chỉ</p>
              </div>
            </div>
          </div>
        </section>

        {isCauGiayPilot && <LocalRentalQuickAnswer area={area} />}

        <section className="border-b border-slate-200 bg-slate-50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {area.localContexts.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <MapPin className="h-5 w-5 text-brand-600" />
                  <h2 className="mt-3 text-lg font-black">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="xe-goi-y" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Xe và giá từ danh mục hiện tại</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Gợi ý xe cho khách tại {area.shortName}</h2>
                <p className="mt-4 text-slate-600">Giá hiển thị theo dữ liệu từng xe, chưa khẳng định xe trống. Lịch, tổng tiền và điểm giao nhận chỉ được chốt sau khi Car Match kiểm tra yêu cầu cụ thể.</p>
              </div>
              <Link
                to="/xe"
                onClick={() => trackCtaClick(`${source}_all_cars`, { target_path: '/xe' })}
                className="inline-flex items-center gap-2 font-black text-brand-700 hover:text-brand-800"
              >
                Xem toàn bộ xe <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {representativeCars.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {representativeCars.map((car) => (
                  <CarCard key={car.id} car={car} mode="listing" source={source} />
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

        {isCauGiayPilot && <LocalRentalPlanner area={area} cars={representativeCars} source={source} />}

        <section id="giao-nhan" className="scroll-mt-24 bg-blue-50 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Giao nhận tại địa phương</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Thông tin cần gửi để giao đúng điểm</h2>
              <p className="mt-4 leading-7 text-slate-700">{area.pickupNote}</p>
              <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5">
                <p className="font-black">Vị trí đã đối chiếu</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{area.locationNote}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['1. Gửi yêu cầu', 'Ngày giờ nhận trả, số người, hành lý và địa chỉ chi tiết.'],
                ['2. Kiểm tra xe', 'Car Match đối chiếu xe, giá, km, cọc và phương án giao nhận.'],
                ['3. Xác nhận lịch', 'Hai bên chốt đầy đủ điều kiện trước bước giữ lịch.'],
                ['4. Bàn giao', 'Kiểm tra xe, xăng hoặc pin, km, phụ kiện và ký biên bản.'],
              ].map(([title, description]) => (
                <article key={title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <CalendarCheck2 className="h-6 w-6 text-brand-600" />
                  <h3 className="mt-3 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <Route className="h-10 w-10 text-brand-600" />
                <h2 className="mt-4 text-3xl font-black tracking-tight">Những nhu cầu phù hợp tại {area.shortName}</h2>
                <div className="mt-6 space-y-4">
                  {area.useCases.map((item) => (
                    <article key={item.title} className="rounded-2xl border border-slate-200 p-5">
                      <h3 className="font-black">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <Calculator className="h-10 w-10 text-orange-600" />
                <h2 className="mt-4 text-3xl font-black tracking-tight">Cách tính tổng chi phí trước khi chốt</h2>
                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
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
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
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
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
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
            </div>
          </div>
        </section>

        <section id="cau-hoi" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-brand-600">Câu hỏi thường gặp</p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight sm:text-4xl">Thuê xe tại {area.shortName}</h2>
            <div className="mt-8 space-y-3">
              {area.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm">
                  <summary className="cursor-pointer list-none pr-8 text-lg font-black">{faq.question}</summary>
                  <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Khu vực giao nhận khác</p>
                <h2 className="mt-2 text-2xl font-black">Xem landing theo từng khu đô thị</h2>
              </div>
              <Link to="/" className="inline-flex items-center gap-2 font-black text-brand-700">Dịch vụ thuê xe Hà Nội <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <nav aria-label="Các khu vực giao xe" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {localRentalAreas.map((item) => (
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
      <MobileConversionBar source={source} />
    </div>
  );
}
