import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cars as fallbackCars, formatPrice, type Car as CarModel } from '@/data/cars';
import {
  getLocalHubData,
  LOCAL_HUBS_DATA,
  type LocalHubData,
  type LocalHubInfoCard,
  type LocalHubSlug,
} from '@/data/localHubsData';
import { useVehicles } from '@/hooks/useVehicles';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import Footer from '../components/Footer';
import MobileConversionBar from '../components/MobileConversionBar';
import Navbar from '../components/Navbar';
import ZaloFAB from '../components/ZaloFAB';

const SITE_URL = 'https://www.carmatch.vn';
const ZALO_LINK = 'https://zalo.me/0971163290';
const PHONE_LINK = 'tel:0971163290';
const DAY_MS = 24 * 60 * 60 * 1000;

type VehicleFilter = 'all' | 'compact' | 'seven' | 'electric' | 'family';

interface ModelDefinition {
  key: string;
  displayName: string;
  luggageCapacity: string;
  matches: RegExp;
}

const MODEL_DEFINITIONS: ModelDefinition[] = [
  { key: 'vinfast-vf3-2025', displayName: 'VinFast VF3', luggageCapacity: '2 vali 20"', matches: /\bvf\s*3\b/i },
  { key: 'vinfast-fadil-2021', displayName: 'VinFast Fadil', luggageCapacity: '2 vali 20"', matches: /\bfadil\b/i },
  { key: 'vinfast-vf5-plus', displayName: 'VinFast VF5 Plus', luggageCapacity: '3 vali vừa', matches: /\bvf\s*5\b/i },
  { key: 'mazda-3-2018', displayName: 'Mazda 3', luggageCapacity: '3 vali vừa', matches: /\bmazda\s*3\b/i },
  { key: 'toyota-raize-2022', displayName: 'Toyota Raize', luggageCapacity: '3 vali vừa', matches: /\braize\b/i },
  { key: 'vinfast-vf6-plus', displayName: 'VinFast VF6 Plus', luggageCapacity: '3–4 vali', matches: /\bvf\s*6\b/i },
  { key: 'hyundai-creta-2025', displayName: 'Hyundai Creta', luggageCapacity: '3–4 vali', matches: /\bcreta\b/i },
  { key: 'mitsubishi-xpander-2023', displayName: 'Mitsubishi Xpander', luggageCapacity: '4–5 vali lớn', matches: /\bxpander\b/i },
  { key: 'vinfast-limo-green-2025', displayName: 'VinFast Limo Green', luggageCapacity: '4–5 vali lớn', matches: /\blimo\s*green\b/i },
  { key: 'kia-carnival', displayName: 'Kia Carnival', luggageCapacity: '5–6 vali lớn', matches: /\bcarnival\b/i },
  { key: 'vinfast-vf8-plus-2024', displayName: 'VinFast VF8 Plus', luggageCapacity: '4 vali lớn', matches: /\bvf\s*8\b/i },
];

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function defaultRentalWindow() {
  const now = new Date();
  const pickup = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0, 0);
  const dropoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 20, 0, 0, 0);
  return { pickup: toDateTimeLocal(pickup), dropoff: toDateTimeLocal(dropoff) };
}

function rentalDaysBetween(pickup: string, dropoff: string) {
  const start = new Date(pickup).getTime();
  const end = new Date(dropoff).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.max(1, Math.ceil((end - start) / DAY_MS));
}

function bookingDateParam(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : value;
}

function renderInlineBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
      : part
  ));
}

function pickRepresentativeModels(catalog: CarModel[], recommendedModels: string[]) {
  const representatives = new Map<string, { car: CarModel; definition: ModelDefinition }>();
  const rankedCatalog = [...catalog]
    .filter((car) => car.price > 0 && car.available !== false)
    .sort((a, b) => Number(Boolean(b.images?.[0])) - Number(Boolean(a.images?.[0])) || a.price - b.price);

  for (const car of rankedCatalog) {
    const searchable = `${car.name} ${car.slug}`.replace(/[-_]+/g, ' ');
    const definition = MODEL_DEFINITIONS.find((item) => item.matches.test(searchable));
    if (definition && !representatives.has(definition.key)) representatives.set(definition.key, { car, definition });
  }

  const preferredOrder = [
    ...recommendedModels,
    ...MODEL_DEFINITIONS.map((item) => item.key).filter((key) => !recommendedModels.includes(key)),
  ];

  return preferredOrder
    .map((key) => representatives.get(key))
    .filter((item): item is { car: CarModel; definition: ModelDefinition } => Boolean(item))
    .slice(0, 8);
}

function matchesVehicleFilter(car: CarModel, filter: VehicleFilter) {
  if (filter === 'electric') return car.fuel === 'Điện';
  if (filter === 'compact') return car.seats <= 5;
  if (filter === 'seven') return car.seats >= 7;
  if (filter === 'family') return car.seats >= 5;
  return true;
}

function cardBadge(car: CarModel) {
  if (car.fuel === 'Điện') return { label: '⚡ Miễn phí sạc V-Green', className: 'bg-emerald-100 text-emerald-800' };
  if (car.popular) return { label: '★ Đặt nhiều nhất', className: 'bg-orange-100 text-orange-800' };
  if (car.seats >= 7) return { label: '✓ 7 chỗ cốp rộng', className: 'bg-violet-100 text-violet-800' };
  return { label: '✓ Chuẩn gia đình', className: 'bg-blue-100 text-blue-800' };
}

function UtilityCard({ card, tone, title }: { card: LocalHubInfoCard; tone: 'blue' | 'emerald' | 'amber'; title: string }) {
  const badgeTone = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
  }[tone];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeTone}`}>{card.badge}</span>
      <h3 className="mb-2 mt-3 text-base font-bold text-slate-900">{title}</h3>
      <ul className="space-y-1.5 text-sm leading-5 text-slate-600">
        {card.bullets.map((bullet) => <li key={bullet}>• {bullet}</li>)}
      </ul>
    </article>
  );
}

function VehicleCard({ area, car, definition, pickup, dropoff, rentalDays, source }: {
  area: LocalHubData;
  car: CarModel;
  definition: ModelDefinition;
  pickup: string;
  dropoff: string;
  rentalDays: number;
  source: string;
}) {
  const badge = cardBadge(car);
  const bookingHref = `/xe/${car.slug}?pickup=${encodeURIComponent(bookingDateParam(pickup))}&return=${encodeURIComponent(bookingDateParam(dropoff))}&hub=${encodeURIComponent(area.hubSlug)}#booking`;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 overflow-hidden bg-slate-200">
        {car.images?.[0] ? (
          <img src={car.images[0]} alt={`${definition.displayName} giao tại ${area.locationShortName}`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">Ảnh xe đang cập nhật</div>
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${badge.className}`}>{badge.label}</span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-black text-slate-900">{definition.displayName}</h3>
        <p className="mt-1 text-sm text-slate-600">{car.seats} chỗ · {car.transmission || 'Tự động'} · {definition.luggageCapacity}</p>
        <p className="mt-2 text-sm font-semibold text-emerald-700">✓ Giao tận sảnh {area.locationShortName} · {car.kmPerDay} km/ngày</p>
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <p className="text-base font-black text-slate-950">{formatPrice(car.price)}<span className="text-xs">/ngày</span></p>
            <p className="text-xs text-slate-500">Tạm tính {rentalDays} ngày: {formatPrice(car.price * rentalDays)}</p>
          </div>
          <Link
            to={bookingHref}
            onClick={() => trackCtaClick(`${source}_hold_${definition.key}`, { target_path: bookingHref })}
            className="inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Giữ xe (0đ)
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function LocalRental({ areaSlug }: { areaSlug: LocalHubSlug }) {
  const area = getLocalHubData(areaSlug);
  const initialWindow = useMemo(defaultRentalWindow, []);
  const [pickup, setPickup] = useState(initialWindow.pickup);
  const [dropoff, setDropoff] = useState(initialWindow.dropoff);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');

  useSEO({
    title: `${area.h1Title} | Car Match`,
    description: area.heroSubtitle,
    canonical: `${SITE_URL}${area.path}`,
  });

  const { cars } = useVehicles();
  const catalog = cars.length > 0 ? cars : fallbackCars;
  const representativeModels = useMemo(
    () => pickRepresentativeModels(catalog, area.recommendedModels),
    [catalog, area.recommendedModels],
  );
  const visibleModels = representativeModels.filter(({ car }) => matchesVehicleFilter(car, vehicleFilter));
  const rentalDays = rentalDaysBetween(pickup, dropoff);
  const source = `local_${area.slug.replace(/-/g, '_')}`;
  const zaloHref = `${ZALO_LINK}?text=${encodeURIComponent(
    `Tôi muốn thuê xe tự lái tại ${area.locationShortName} từ ${pickup} đến ${dropoff}. Nhờ Car Match kiểm tra xe trống.`,
  )}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: area.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer.replace(/\*\*/g, '') },
    })),
  };

  const applyHeroFilter = () => {
    trackCtaClick(`${source}_filter_vehicles`, { target_path: '#danh-sach-xe', filter: vehicleFilter });
    document.getElementById('danh-sach-xe')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950 sm:pb-0">
      <Navbar />
      <main id="main-content" className="pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <section className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-lg md:p-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-900/80 px-3.5 py-1.5 text-xs font-bold text-emerald-300">{area.heroBadge}</div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-white md:text-4xl">{area.h1Title}</h1>
            <p className="mb-6 max-w-4xl text-sm leading-6 text-slate-300 md:text-base">{area.heroSubtitle}</p>

            <div className="grid grid-cols-1 items-stretch gap-3 rounded-xl border-2 border-blue-500 bg-white p-3 text-slate-900 shadow-md md:grid-cols-12 md:p-4">
              <div className="md:col-span-3 md:border-r md:border-slate-200 md:pr-3">
                <p className="text-[11px] font-bold uppercase text-slate-500">Khu vực nhận xe (đã chọn)</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{area.locationName}</p>
              </div>
              <label className="md:col-span-3 md:border-r md:border-slate-200 md:pr-3">
                <span className="block text-[11px] font-bold uppercase text-slate-500">Thời gian nhận xe</span>
                <input type="datetime-local" value={pickup} min={toDateTimeLocal(new Date())} onChange={(event) => setPickup(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none" />
              </label>
              <label className="md:col-span-3 md:border-r md:border-slate-200 md:pr-3">
                <span className="block text-[11px] font-bold uppercase text-slate-500">Thời gian trả xe · {rentalDays} ngày</span>
                <input type="datetime-local" value={dropoff} min={pickup} onChange={(event) => setDropoff(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none" />
              </label>
              <label className="md:col-span-2">
                <span className="block text-[11px] font-bold uppercase text-slate-500">Loại xe</span>
                <select value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value as VehicleFilter)} className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none">
                  <option value="all">Tất cả 4–7 chỗ</option>
                  <option value="compact">Xe 4–5 chỗ</option>
                  <option value="seven">Xe 7 chỗ</option>
                  <option value="electric">Xe điện</option>
                </select>
              </label>
              <button type="button" onClick={applyHeroFilter} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 md:col-span-1">Lọc xe</button>
            </div>
          </section>

          <section aria-labelledby="local-utility-title">
            <h2 id="local-utility-title" className="mb-4 text-lg font-bold text-slate-900 md:text-xl">Thông tin giao nhận & vận hành xe thực tế tại {area.locationShortName}</h2>
            <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              <UtilityCard card={area.pickupCard} tone="blue" title="Điểm hẹn sảnh & tòa nhà phổ biến" />
              <UtilityCard card={area.deliveryCard} tone="emerald" title="Khoảng cách từ Hub & Phí giao nhận" />
              <UtilityCard card={area.infraCard} tone="amber" title="Trạm sạc, cây xăng & hướng xuất phát" />
            </div>
          </section>

          <section id="danh-sach-xe" className="scroll-mt-24">
            <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <h2 className="text-lg font-bold text-slate-900 md:text-xl">Đội xe tự lái sẵn sàng giao tại {area.locationShortName}</h2>
              <div className="flex flex-wrap gap-2" aria-label="Lọc nhanh đội xe">
                {[
                  ['all', `Tất cả (${representativeModels.length})`],
                  ['electric', `⚡ Xe điện VinFast (${representativeModels.filter(({ car }) => car.fuel === 'Điện').length})`],
                  ['family', `👨‍👩‍👧‍👦 Xe 5–7 chỗ gia đình (${representativeModels.filter(({ car }) => car.seats >= 5).length})`],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setVehicleFilter(value as VehicleFilter)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${vehicleFilter === value ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{label}</button>
                ))}
              </div>
            </div>

            {visibleModels.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visibleModels.map(({ car, definition }) => (
                  <VehicleCard key={definition.key} area={area} car={car} definition={definition} pickup={pickup} dropoff={dropoff} rentalDays={rentalDays} source={source} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="font-bold text-slate-700">Chưa có mẫu xe phù hợp bộ lọc này trong dữ liệu hiện tại.</p>
                <button type="button" onClick={() => setVehicleFilter('all')} className="mt-3 font-bold text-blue-700">Xem tất cả mẫu xe</button>
              </div>
            )}
          </section>

          <section className="my-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <article className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
              <h2 className="text-lg font-black text-slate-900">Quy trình nhận xe 3 bước & Điều kiện minh bạch</h2>
              <div className="mt-5 space-y-5 text-sm leading-6 text-slate-600">
                <div><h3 className="font-black text-blue-700">Bước 1: Chọn xe & Giữ lịch 15 phút (0đ)</h3><p>Chọn ngày giờ trực tiếp trên web kèm tên tòa nhà hoặc điểm nhận tại {area.locationShortName}. Chưa cần thanh toán ngay.</p></div>
                <div><h3 className="font-black text-blue-700">Bước 2: Xác nhận lịch & Cọc giữ chỗ</h3><p>Đội vận hành Car Match kiểm tra lịch trống trong 5 phút, báo rõ tổng chi phí, cọc giữ lịch 200.000đ – 500.000đ và tài sản thế chấp khi nhận xe 10–15 triệu hoặc xe máy kèm đăng ký gốc.</p></div>
                <div><h3 className="font-black text-blue-700">Bước 3: Bàn giao đối chiếu 2 chiều tận sảnh</h3><p>Mang CCCD gắn chip + GPLX hạng B bản gốc, cùng nhân viên quay video/chụp ảnh hiện trạng ngoại thất, mức pin/xăng và số km trong 5 phút trước khi lăn bánh.</p></div>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3.5 text-xs leading-5 text-slate-600">🛡️ <strong>Bảo mật thông tin:</strong> Ảnh chụp CCCD & GPLX của quý khách chỉ dùng duy nhất để lập Hợp đồng thuê xe tự lái hợp pháp và được bảo mật tuyệt đối.</div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
              <h2 className="text-lg font-black text-slate-900">Câu hỏi thường gặp khi thuê xe tại {area.locationShortName}</h2>
              <div className="mt-5">
                {area.faqs.map((faq, index) => (
                  <details key={faq.question} open={index === 0} className="group mb-3 rounded-lg border border-slate-200 bg-slate-50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-900">{faq.question}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" /></summary>
                    <p className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600">{renderInlineBold(faq.answer)}</p>
                  </details>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 rounded-xl bg-slate-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-black">Cần kiểm tra lịch xe ngay?</p><p className="text-sm text-slate-300">Zalo/Hotline: 0971 163 290 · 07:00–22:00</p></div>
                <div className="flex gap-2">
                  <a href={PHONE_LINK} onClick={() => trackPhoneClick(`${source}_faq`)} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-900"><Phone className="h-4 w-4" /> Gọi ngay</a>
                  <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick(`${source}_faq`)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> Zalo</a>
                </div>
              </div>
            </article>
          </section>

          <section className="mb-12 rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="area-navigation-title">
            <div className="flex items-center gap-3">
              <Navigation className="h-6 w-6 text-blue-600" />
              <div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Mạng lưới giao nhận Hà Nội</p><h2 id="area-navigation-title" className="text-lg font-black text-slate-900">17 khu đô thị & quận đang phục vụ</h2></div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-black uppercase text-slate-500">5 khu đô thị trọng điểm</p>
              <nav className="flex flex-wrap gap-2" aria-label="Khu đô thị trọng điểm">
                {LOCAL_HUBS_DATA.slice(0, 5).map((item) => <Link key={item.path} to={item.path} className={`rounded-full border px-3 py-2 text-sm font-bold transition ${item.path === area.path ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:text-blue-700'}`}>{item.locationShortName}</Link>)}
              </nav>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-black uppercase text-slate-500">12 quận & khu vực Hà Nội</p>
              <nav className="flex flex-wrap gap-2" aria-label="Quận và khu vực Hà Nội">
                {LOCAL_HUBS_DATA.slice(5).map((item) => <Link key={item.path} to={item.path} className={`rounded-full border px-3 py-2 text-sm font-bold transition ${item.path === area.path ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:text-blue-700'}`}>{item.locationShortName}</Link>)}
              </nav>
            </div>
            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
              {[
                [Zap, 'Xe điện & xe xăng', 'Nhiều phân khúc 4–7 chỗ'],
                [MapPin, 'Giao nhận tận sảnh', 'Theo khu vực và lịch xác nhận'],
                [ShieldCheck, 'Đối chiếu minh bạch', 'Ảnh, video, pin/xăng và km'],
              ].map(([Icon, title, note]) => {
                const ItemIcon = Icon as typeof CheckCircle2;
                return <div key={String(title)} className="flex gap-3 rounded-xl bg-slate-50 p-3"><ItemIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="text-sm font-bold">{String(title)}</p><p className="text-xs text-slate-500">{String(note)}</p></div></div>;
              })}
            </div>
          </section>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </main>
      <Footer />
      <ZaloFAB />
      <MobileConversionBar source={source} />
    </div>
  );
}
