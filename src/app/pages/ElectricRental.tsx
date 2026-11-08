import { Link } from 'react-router';
import {
  ArrowRight,
  BatteryCharging,
  Calculator,
  CalendarCheck2,
  Car,
  CheckCircle2,
  FileCheck2,
  MapPin,
  MessageCircle,
  Phone,
  PlugZap,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { cars as fallbackCars, formatPrice, type Car as CarModel } from '@/data/cars';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import CarCard from '../components/CarCard';

const ZALO_LINK = 'https://zalo.me/0971163290';
const PHONE_LINK = 'tel:0971163290';
const ELECTRIC_FAMILIES = ['VF3', 'VF5', 'VF6', 'VF7', 'VF8', 'Limo Green'] as const;

const serviceAreas = [
  'Vinhomes Ocean Park',
  'Vinhomes Smart City',
  'Times City',
  'Ecopark',
  'The Manor Central Park',
];

const costItems = [
  ['Giá thuê xe', 'Tính theo mẫu xe, thời gian thuê và lịch sử dụng thực tế.'],
  ['Giao nhận xe', 'Xác nhận theo điểm nhận, điểm trả và thời gian bàn giao.'],
  ['Chi phí sạc', 'Khách dự tính theo quãng đường và kế hoạch sạc trong chuyến đi.'],
  ['Cầu đường, gửi xe', 'Phát sinh theo hành trình, không mặc định nằm trong giá thuê.'],
  ['Vượt km hoặc phát sinh', 'Chỉ áp dụng theo điều kiện đã ghi trong xác nhận hoặc hợp đồng.'],
];

const electricFaqs = [
  {
    question: 'Thuê xe điện tự lái tại Hà Nội giá bao nhiêu?',
    answer: 'Giá ngày được hiển thị theo từng xe trên Car Match. Giá cuối cùng phụ thuộc mẫu xe, thời gian thuê, lịch xe thực tế và điểm giao nhận. Với giá tháng, mẫu xe chưa có dữ liệu công khai sẽ hiển thị “Liên hệ báo giá” thay vì dùng một mức ước tính chung.',
  },
  {
    question: 'Nên chọn VF3, VF5, VF6, VF7, VF8 hay Limo Green?',
    answer: 'VF3 và VF5 phù hợp nhu cầu gọn, chủ yếu đi phố; VF6 và VF7 cân bằng hơn cho gia đình; VF8 phù hợp khi ưu tiên không gian và tiện nghi; Limo Green là phương án 7 chỗ cho nhóm đông người. Khách vẫn nên đối chiếu số người, hành lý và hành trình trước khi chọn.',
  },
  {
    question: 'Chi phí sạc có nằm trong giá thuê xe không?',
    answer: 'Không nên mặc định chi phí sạc đã nằm trong giá thuê. Car Match sẽ xác nhận mức pin khi giao và trả xe, phụ kiện sạc theo xe và cách đối soát nếu có. Khách nên cộng chi phí sạc vào tổng ngân sách chuyến đi.',
  },
  {
    question: 'Thuê xe điện đi tỉnh cần lưu ý gì?',
    answer: 'Hãy ước tính tổng quãng đường, kiểm tra trạm sạc trên tuyến và dành khoảng dự phòng cho thay đổi lịch trình. Khi nhận xe, hai bên cần ghi nhận mức pin, dây sạc hoặc phụ kiện đi kèm và mức pin cần có khi hoàn trả.',
  },
  {
    question: 'Car Match giao xe điện ở khu vực nào?',
    answer: 'Car Match hỗ trợ giao nhận theo lịch đã xác nhận tại Vinhomes Ocean Park, Vinhomes Smart City, Times City, Ecopark và The Manor Central Park. Với địa điểm khác tại Hà Nội, khách gửi vị trí để đội vận hành kiểm tra phương án và phí giao nhận nếu có.',
  },
];

function electricFamily(car: CarModel) {
  const normalized = car.name.toLocaleLowerCase('vi-VN').replace(/\s+/g, ' ');
  if (/\bvf\s*3\b/.test(normalized)) return 'VF3';
  if (/\bvf\s*5\b/.test(normalized)) return 'VF5';
  if (/\bvf\s*6\b/.test(normalized)) return 'VF6';
  if (/\bvf\s*7\b/.test(normalized)) return 'VF7';
  if (/\bvf\s*8\b/.test(normalized)) return 'VF8';
  if (normalized.includes('limo green')) return 'Limo Green';
  return car.name;
}

function familyFit(family: string, car: CarModel) {
  if (family === 'VF3') return 'Đi phố, 1-4 người, ưu tiên xe nhỏ gọn.';
  if (family === 'VF5') return 'Đi làm hằng ngày, gia đình nhỏ, dễ di chuyển nội đô.';
  if (family === 'VF6') return 'Gia đình 5 người, cần cân bằng không gian và chi phí.';
  if (family === 'VF7') return 'Gia đình, đi tỉnh ngắn ngày, cần crossover rộng hơn.';
  if (family === 'VF8') return 'Ưu tiên không gian, tiện nghi và hành trình dài hơn.';
  if (family === 'Limo Green') return 'Nhóm đông người hoặc gia đình cần xe 7 chỗ.';
  return `${car.seats} chỗ, phù hợp nhu cầu cần xe điện tự lái.`;
}

function monthlyPriceLabel(car: CarModel) {
  return car.priceMonth ? `${formatPrice(car.priceMonth)}/tháng` : 'Liên hệ báo giá';
}

export default function ElectricRental() {
  useSEO({
    title: 'Thuê Xe Điện Tự Lái Hà Nội | Car Match',
    description: 'Thuê xe điện VinFast tự lái tại Hà Nội. So sánh VF3, VF5, VF6, VF7, VF8 và Limo Green, xem giá ngày, chi phí sạc và cách chọn xe.',
    canonical: 'https://www.carmatch.vn/thue-xe-dien-ha-noi',
  });

  const { cars } = useVehicles();
  const availableCatalog = cars.length > 0 ? cars : fallbackCars;
  const electricCars = availableCatalog
    .filter((car) => car.fuel === 'Điện' && car.price > 0)
    .sort((a, b) => a.price - b.price);
  const familyCars = ELECTRIC_FAMILIES
    .map((family) => electricCars.find((car) => electricFamily(car) === family))
    .filter((car): car is CarModel => Boolean(car));
  const otherElectricCars = electricCars.filter((car) => !ELECTRIC_FAMILIES.includes(electricFamily(car) as typeof ELECTRIC_FAMILIES[number]));
  const representativeCars = [...familyCars, ...otherElectricCars];
  const startingPrice = electricCars.length > 0 ? Math.min(...electricCars.map((car) => car.price)) : null;
  const zaloHref = `${ZALO_LINK}?text=${encodeURIComponent('Tôi muốn thuê xe điện tự lái tại Hà Nội. Nhờ Car Match kiểm tra mẫu xe và lịch phù hợp.')}`;

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-950 sm:pb-0">
      <Navbar />
      <main id="main-content">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.24),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_42%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-200">
                <Zap className="h-4 w-4" />
                Xe điện tự lái tại Hà Nội
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Thuê xe điện tự lái tại Hà Nội
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                So sánh VF3, VF5, VF6, VF7, VF8 và Limo Green theo số chỗ, giá thuê và nhu cầu sử dụng. Chọn xe từ dữ liệu thực tế, sau đó xác nhận lịch và điểm giao nhận trước khi đặt cọc.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#electric-fleet"
                  onClick={() => trackCtaClick('electric_hub_view_cars', { target_path: '#electric-fleet' })}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition-colors hover:bg-emerald-300"
                >
                  Xem các mẫu xe điện <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={zaloHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('electric_hub_hero')}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-black text-white transition-colors hover:bg-white/15"
                >
                  <MessageCircle className="h-4 w-4" /> Nhờ kiểm tra lịch xe
                </a>
              </div>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Danh mục đang hiển thị</p>
                <p className="mt-1 text-2xl font-black">{electricCars.length} xe điện</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Giá ngày thấp nhất</p>
                <p className="mt-1 text-2xl font-black">{startingPrice ? `${formatPrice(startingPrice)}/ngày` : 'Kiểm tra theo lịch'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Khu vực đã xác nhận</p>
                <p className="mt-1 text-2xl font-black">5 khu đô thị</p>
              </div>
            </div>
          </div>
        </section>

        <section id="electric-fleet" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Chọn theo nhu cầu thật</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Các mẫu xe điện đang có trên Car Match</h2>
                <p className="mt-4 text-slate-600">Mỗi thẻ dẫn tới trang xe cụ thể. Lịch xe chỉ được xác nhận sau khi khách chọn ngày nhận, ngày trả và gửi yêu cầu.</p>
              </div>
              <Link
                to="/xe?fuelFilter=%C4%90i%E1%BB%87n"
                onClick={() => trackCtaClick('electric_hub_all_electric', { target_path: '/xe?fuelFilter=Điện' })}
                className="inline-flex items-center gap-2 font-black text-brand-700 hover:text-brand-800"
              >
                Xem toàn bộ xe điện <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {representativeCars.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {representativeCars.map((car) => (
                  <CarCard key={car.id} car={car} mode="listing" source="electric_hub" />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="font-bold text-slate-700">Danh sách xe đang được cập nhật.</p>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-black text-brand-700">Nhắn Car Match kiểm tra xe điện</a>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Bảng chọn nhanh</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Nên chọn VF3, VF5, VF6, VF7, VF8 hay Limo Green?</h2>
              <p className="mt-4 text-slate-600">Giá dưới đây lấy từ xe đại diện trong dữ liệu hiện tại. Giá tháng chỉ hiển thị khi đã có dữ liệu xác nhận.</p>
            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-5 py-4 font-black">Mẫu xe</th>
                    <th className="px-5 py-4 font-black">Số chỗ</th>
                    <th className="px-5 py-4 font-black">Giá ngày</th>
                    <th className="px-5 py-4 font-black">Giá tháng</th>
                    <th className="px-5 py-4 font-black">Phù hợp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {representativeCars.map((car) => {
                    const family = electricFamily(car);
                    return (
                      <tr key={`compare-${car.id}`}>
                        <td className="px-5 py-4 font-black">
                          <Link to={`/xe/${car.slug}`} className="text-brand-700 hover:underline">{family}</Link>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{car.seats} chỗ</td>
                        <td className="px-5 py-4 font-bold">{formatPrice(car.price)}/ngày</td>
                        <td className="px-5 py-4 text-slate-600">{monthlyPriceLabel(car)}</td>
                        <td className="px-5 py-4 text-slate-600">{familyFit(family, car)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-emerald-50 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white"><Calculator className="h-6 w-6" /></div>
              <h2 className="mt-5 text-3xl font-black tracking-tight">Thuê xe điện cần tính những chi phí gì?</h2>
              <p className="mt-4 text-slate-700">Công thức nên dùng: <strong>giá thuê + giao nhận + sạc + cầu đường/gửi xe + phát sinh theo hợp đồng</strong>. Nhìn tổng chi phí giúp so sánh đúng hơn chỉ nhìn giá ngày.</p>
              <Link to="/thue-xe-thang" className="mt-6 inline-flex items-center gap-2 font-black text-brand-700 hover:underline">
                Xem phương án thuê xe theo tháng <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {costItems.map(([title, note]) => (
                <article key={title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="mt-3 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Sạc và bàn giao</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Kiểm tra pin trước khi bắt đầu chuyến đi</h2>
              <div className="mt-7 space-y-4">
                {[
                  [BatteryCharging, 'Ghi nhận mức pin', 'Chụp lại mức pin và số km tại thời điểm nhận xe.'],
                  [PlugZap, 'Kiểm tra phụ kiện sạc', 'Đối chiếu dây sạc hoặc phụ kiện đi kèm theo biên bản bàn giao.'],
                  [MapPin, 'Lập kế hoạch trạm sạc', 'Nếu đi tỉnh, kiểm tra trạm trên tuyến và có khoảng dự phòng cho thay đổi lịch trình.'],
                  [ShieldCheck, 'Xác nhận mức pin khi trả', 'Thống nhất trước cách hoàn trả pin và đối soát chi phí nếu phát sinh.'],
                ].map(([Icon, title, desc]) => (
                  <div key={String(title)} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                    <Icon className="mt-0.5 h-6 w-6 flex-none text-emerald-600" />
                    <div><h3 className="font-black">{String(title)}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{String(desc)}</p></div>
                  </div>
                ))}
              </div>
              <Link
                to="/blog/thue-xe-dien-ai-tra-phi-sac"
                onClick={() => trackCtaClick('electric_hub_charging_cost_guide', {
                  target_path: '/blog/thue-xe-dien-ai-tra-phi-sac',
                })}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                Ai trả phí sạc khi thuê xe điện? <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Giao nhận tại Hà Nội</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Các khu vực giao xe đã xác nhận</h2>
              <p className="mt-4 text-slate-600">Thời gian và phí giao nhận, nếu có, được xác nhận theo từng lịch thuê. Với địa điểm khác, Car Match sẽ kiểm tra phương án trước khi chốt.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {serviceAreas.map((area) => (
                  <div key={area} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-bold text-slate-800">
                    <MapPin className="h-5 w-5 flex-none text-brand-600" /> {area}
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
                <h3 className="text-xl font-black">Quy trình 4 bước</h3>
                <ol className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    [Car, 'Chọn mẫu xe và ngày thuê'],
                    [CalendarCheck2, 'Kiểm tra lịch, giá và giao nhận'],
                    [FileCheck2, 'Chốt giấy tờ, cọc và hợp đồng'],
                    [BatteryCharging, 'Bàn giao pin, km và phụ kiện'],
                  ].map(([Icon, label], index) => (
                    <li key={String(label)} className="flex gap-3 text-sm text-slate-300">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-400 font-black text-slate-950">{index + 1}</span>
                      <span className="pt-1.5"><Icon className="mr-1.5 inline h-4 w-4 text-emerald-300" />{String(label)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-brand-600">Câu hỏi thường gặp</p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight sm:text-4xl">Trước khi thuê xe điện tự lái</h2>
            <div className="mt-8 space-y-3">
              {electricFaqs.map((item) => (
                <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm">
                  <summary className="cursor-pointer list-none pr-8 font-black marker:hidden">{item.question}</summary>
                  <p className="mt-3 leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-700 py-14 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-100">Cần kiểm tra lịch xe?</p>
              <h2 className="mt-2 text-3xl font-black">Gửi ngày thuê và khu vực nhận xe</h2>
              <p className="mt-2 text-brand-100">Car Match sẽ đối chiếu mẫu xe, lịch thực tế và điều kiện giao nhận trước khi báo phương án.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href={PHONE_LINK} onClick={() => trackPhoneClick('electric_hub_footer')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-5 font-black hover:bg-white/10"><Phone className="h-4 w-4" /> Gọi 0971 163 290</a>
              <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('electric_hub_footer')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-brand-700 hover:bg-brand-50"><MessageCircle className="h-4 w-4" /> Nhắn Zalo</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ZaloFAB />
      <MobileConversionBar source="electric_hub" zaloHref={zaloHref} note="Xác nhận lịch xe trước khi đặt cọc" />
    </div>
  );
}
