import { Link } from 'react-router';
import {
  ArrowRight,
  BriefcaseBusiness,
  Calculator,
  CalendarCheck2,
  Car,
  CheckCircle2,
  FileCheck2,
  Fuel,
  Luggage,
  MapPin,
  MessageCircle,
  Phone,
  Route,
  Users,
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
const SEVEN_SEAT_FAMILIES = ['Carnival', 'Xpander', 'Limo Green'] as const;

const serviceAreas = [
  'Vinhomes Ocean Park',
  'Vinhomes Smart City',
  'Times City',
  'Ecopark',
  'The Manor Central Park',
];

const costItems = [
  ['Giá thuê xe', 'Tính theo mẫu xe, ngày và giờ nhận trả thực tế.'],
  ['Giao nhận xe', 'Xác nhận theo địa điểm, thời gian bàn giao và điểm trả.'],
  ['Nhiên liệu hoặc sạc', 'Khách dự tính theo quãng đường và loại xe đã chọn.'],
  ['Cầu đường, gửi xe', 'Phát sinh theo hành trình, không mặc định nằm trong giá thuê.'],
  ['Vượt km hoặc phát sinh', 'Chỉ tính theo điều kiện đã xác nhận trước khi đặt cọc.'],
];

const sevenSeatGuides = [
  {
    to: '/blog/carnival-xpander-hay-limo-green',
    title: 'So sánh Carnival, Xpander và Limo Green',
    description: 'Chọn theo hành lý, giá thuê, nhiên liệu và kiểu chuyến đi.',
  },
  {
    to: '/blog/chi-phi-thue-xe-tu-lai-3-ngay-2-dem',
    title: 'Chi phí thuê xe 3 ngày 2 đêm',
    description: 'Dự toán giá xe, nhiên liệu/sạc, VETC, gửi xe và phát sinh.',
  },
];

const sevenSeatFaqs = [
  {
    question: 'Thuê xe 7 chỗ tự lái tại Hà Nội giá bao nhiêu?',
    answer: 'Giá ngày được hiển thị trực tiếp theo từng xe trên Car Match. Tổng tiền cuối cùng phụ thuộc mẫu xe, ngày giờ nhận trả, lịch xe và điểm giao nhận. Giá tháng chỉ hiển thị khi dữ liệu đã được xác nhận; nếu chưa có, trang sẽ ghi “Liên hệ báo giá” thay vì dùng một mức ước tính chung.',
  },
  {
    question: 'Nên chọn Carnival, Xpander hay Limo Green?',
    answer: 'Xpander phù hợp gia đình cần xe 7 chỗ gọn và dễ sử dụng; Limo Green phù hợp nhóm muốn xe điện và đã có kế hoạch sạc; Carnival phù hợp khi ưu tiên không gian, sự thoải mái và hành lý. Lựa chọn cuối cùng nên dựa trên số người, số vali, quãng đường và điểm sạc nếu chọn xe điện.',
  },
  {
    question: 'Xe 7 chỗ có đủ chỗ cho 7 người và hành lý không?',
    answer: 'Khi sử dụng đủ 7 ghế, khoang hành lý còn lại phụ thuộc từng mẫu xe, kích thước vali và cách bố trí ghế. Khách nên gửi số người, số vali lớn/nhỏ và đồ cồng kềnh trước khi đặt cọc để Car Match đối chiếu đúng mẫu xe, thay vì chỉ dựa vào tên gọi “7 chỗ”.',
  },
  {
    question: 'Thuê xe 7 chỗ đi tỉnh cần tính thêm chi phí gì?',
    answer: 'Ngoài giá thuê, khách nên dự tính giao nhận, nhiên liệu hoặc sạc, phí cầu đường, gửi xe và khoản vượt km nếu hành trình vượt điều kiện đã xác nhận. Với Limo Green, cần kiểm tra trạm sạc trên tuyến; với xe xăng hoặc dầu, nên ước lượng quãng đường để dự tính nhiên liệu.',
  },
  {
    question: 'Cần giấy tờ gì để thuê xe 7 chỗ tự lái?',
    answer: 'Người thuê cần chuẩn bị CCCD gắn chip, giấy phép lái xe hạng B còn hiệu lực, thông tin điểm giao nhận và khoản đặt cọc theo mẫu xe. Điều kiện cọc, giới hạn km và quy trình bàn giao được xác nhận trước khi khách chuyển cọc giữ xe.',
  },
];

function sevenSeatFamily(car: CarModel) {
  const normalized = car.name.toLocaleLowerCase('vi-VN').replace(/\s+/g, ' ');
  if (normalized.includes('carnival')) return 'Carnival';
  if (normalized.includes('xpander')) return 'Xpander';
  if (normalized.includes('limo green')) return 'Limo Green';
  return car.name;
}

function familyFit(family: string) {
  if (family === 'Carnival') return 'Ưu tiên không gian, sự thoải mái, gia đình hoặc doanh nghiệp.';
  if (family === 'Xpander') return 'Gia đình cần xe 7 chỗ gọn, đi phố và đi tỉnh cuối tuần.';
  if (family === 'Limo Green') return 'Nhóm cần 7 chỗ, muốn dùng xe điện và chủ động kế hoạch sạc.';
  return 'Gia đình hoặc nhóm đông người cần xe 7 chỗ.';
}

function monthlyPriceLabel(car: CarModel) {
  return car.priceMonth ? `${formatPrice(car.priceMonth)}/tháng` : 'Liên hệ báo giá';
}

export default function SevenSeatRental() {
  useSEO({
    title: 'Thuê Xe 7 Chỗ Tự Lái Hà Nội | Car Match',
    description: 'Thuê xe 7 chỗ tự lái tại Hà Nội. So sánh Carnival, Xpander và Limo Green theo giá ngày, hành lý, hành trình và tổng chi phí.',
    canonical: 'https://www.carmatch.vn/thue-xe-7-cho-tu-lai-ha-noi',
  });

  const { cars } = useVehicles();
  const catalog = cars.length > 0 ? cars : fallbackCars;
  const sevenSeatCars = catalog
    .filter((car) => car.seats === 7 && car.price > 0)
    .sort((a, b) => a.price - b.price);
  const representativeCars = SEVEN_SEAT_FAMILIES
    .map((family) => sevenSeatCars.find((car) => sevenSeatFamily(car) === family))
    .filter((car): car is CarModel => Boolean(car));
  const startingPrice = sevenSeatCars.length > 0 ? Math.min(...sevenSeatCars.map((car) => car.price)) : null;
  const zaloHref = `${ZALO_LINK}?text=${encodeURIComponent('Tôi muốn thuê xe 7 chỗ tự lái tại Hà Nội. Nhờ Car Match kiểm tra mẫu xe và lịch phù hợp.')}`;

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-950 sm:pb-0">
      <Navbar />
      <main id="main-content">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.28),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_42%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-sm font-bold text-orange-100">
                <Users className="h-4 w-4" /> Xe 7 chỗ cho gia đình và nhóm
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Thuê xe 7 chỗ tự lái tại Hà Nội
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                So sánh Kia Carnival, Mitsubishi Xpander và VinFast Limo Green theo giá thuê, hành lý và hành trình. Chọn xe từ dữ liệu thực tế, sau đó xác nhận lịch và điểm giao nhận trước khi đặt cọc.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#seven-seat-fleet"
                  onClick={() => trackCtaClick('seven_seat_hub_view_cars', { target_path: '#seven-seat-fleet' })}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-400 px-6 py-3 font-black text-slate-950 transition-colors hover:bg-orange-300"
                >
                  Xem các mẫu xe 7 chỗ <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={zaloHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('seven_seat_hub_hero')}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-black text-white transition-colors hover:bg-white/15"
                >
                  <MessageCircle className="h-4 w-4" /> Nhờ kiểm tra lịch xe
                </a>
              </div>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-sm text-slate-400">Mẫu xe mục tiêu</p>
                <p className="mt-1 text-2xl font-black">{representativeCars.length} mẫu 7 chỗ</p>
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

        <section id="seven-seat-fleet" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Chọn xe từ dữ liệu thực tế</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Carnival, Xpander và Limo Green</h2>
                <p className="mt-4 text-slate-600">Mỗi thẻ dẫn tới trang xe cụ thể. Lịch xe chỉ được xác nhận sau khi khách chọn ngày nhận, ngày trả và gửi yêu cầu.</p>
              </div>
              <Link
                to="/xe?seatFilter=7"
                onClick={() => trackCtaClick('seven_seat_hub_all_cars', { target_path: '/xe?seatFilter=7' })}
                className="inline-flex items-center gap-2 font-black text-brand-700 hover:text-brand-800"
              >
                Xem toàn bộ xe 7 chỗ <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {representativeCars.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {representativeCars.map((car) => <CarCard key={car.id} car={car} mode="listing" source="seven_seat_hub" />)}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="font-bold text-slate-700">Danh sách xe đang được cập nhật.</p>
                <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-black text-brand-700">Nhắn Car Match kiểm tra xe 7 chỗ</a>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Bảng chọn nhanh</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Nên chọn Carnival, Xpander hay Limo Green?</h2>
              <p className="mt-4 text-slate-600">Giá lấy từ xe đang có trong dữ liệu. Giá tháng chỉ hiển thị khi đã được xác nhận.</p>
            </div>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-5 py-4 font-black">Mẫu xe</th>
                    <th className="px-5 py-4 font-black">Nhiên liệu</th>
                    <th className="px-5 py-4 font-black">Giá ngày</th>
                    <th className="px-5 py-4 font-black">Giá tháng</th>
                    <th className="px-5 py-4 font-black">Phù hợp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {representativeCars.map((car) => {
                    const family = sevenSeatFamily(car);
                    return (
                      <tr key={`compare-${car.id}`}>
                        <td className="px-5 py-4 font-black"><Link to={`/xe/${car.slug}`} className="text-brand-700 hover:underline">{family}</Link></td>
                        <td className="px-5 py-4 text-slate-600">{car.fuel}</td>
                        <td className="px-5 py-4 font-bold">{formatPrice(car.price)}/ngày</td>
                        <td className="px-5 py-4 text-slate-600">{monthlyPriceLabel(car)}</td>
                        <td className="px-5 py-4 text-slate-600">{familyFit(family)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-orange-50 py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <Luggage className="h-11 w-11 text-orange-600" />
              <h2 className="mt-5 text-3xl font-black tracking-tight">Xe 7 chỗ có đủ chỗ cho người và hành lý không?</h2>
              <p className="mt-4 leading-7 text-slate-700">Khi dùng đủ 7 ghế, khoang hành lý phụ thuộc mẫu xe, số vali và cách bố trí ghế. Trước khi đặt cọc, khách nên gửi số người, số vali lớn/nhỏ, xe đẩy trẻ em hoặc đồ cồng kềnh để Car Match đối chiếu phương án phù hợp.</p>
              <div className="mt-6 rounded-2xl border border-orange-200 bg-white p-5">
                <p className="font-black">Thông tin nên gửi khi hỏi xe</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {['Số người lớn và trẻ em.', 'Số vali lớn, vali cabin và đồ cồng kềnh.', 'Điểm đến, số ngày thuê và quãng đường dự kiến.', 'Khu vực, ngày và giờ muốn nhận xe.'].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-orange-600" />{item}</li>)}
                </ul>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [Users, 'Gia đình đông người', 'So sánh số người, ghế trẻ em và hành lý trước khi chọn mẫu.'],
                [Route, 'Đi tỉnh cuối tuần', 'Ước tính quãng đường, cầu đường, nhiên liệu hoặc sạc.'],
                [BriefcaseBusiness, 'Doanh nghiệp', 'Ưu tiên không gian, lịch giao nhận và điều kiện chứng từ.'],
                [Car, 'Đón người thân', 'Kiểm tra số vali để tránh dùng đủ ghế nhưng thiếu khoang đồ.'],
              ].map(([Icon, title, description]) => (
                <article key={String(title)} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <Icon className="h-6 w-6 text-orange-600" />
                  <h3 className="mt-3 font-black">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{String(description)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <Calculator className="h-11 w-11 text-brand-600" />
              <h2 className="mt-5 text-3xl font-black tracking-tight">Thuê xe 7 chỗ cần tính những chi phí gì?</h2>
              <p className="mt-4 text-slate-700">Công thức nên dùng: <strong>giá thuê + giao nhận + nhiên liệu/sạc + cầu đường/gửi xe + phát sinh theo hợp đồng</strong>. Tổng chi phí giúp so sánh đúng hơn chỉ nhìn giá ngày.</p>
              <div className="mt-6 flex flex-col items-start gap-3 text-sm font-black">
                <Link to="/thue-xe-thang" className="text-brand-700 hover:underline">Xem phương án thuê xe theo tháng</Link>
                <Link to="/thue-xe-dien-ha-noi" className="text-brand-700 hover:underline">Xem hướng dẫn thuê xe điện tại Hà Nội</Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {costItems.map(([title, note]) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  {title === 'Nhiên liệu hoặc sạc' ? <Fuel className="h-5 w-5 text-brand-600" /> : <CheckCircle2 className="h-5 w-5 text-brand-600" />}
                  <h3 className="mt-3 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-300">Giao nhận tại Hà Nội</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Các khu vực giao xe đã xác nhận</h2>
              <p className="mt-4 text-slate-300">Thời gian và phí giao nhận, nếu có, được xác nhận theo từng lịch thuê. Với địa điểm khác, Car Match sẽ kiểm tra phương án trước khi chốt.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {serviceAreas.map((area) => <div key={area} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 font-bold"><MapPin className="h-5 w-5 flex-none text-orange-300" />{area}</div>)}
              </div>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-300">Quy trình thuê</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Bốn bước trước khi nhận xe</h2>
              <ol className="mt-7 space-y-4">
                {[
                  [Car, 'Chọn mẫu xe, ngày thuê và số người/hành lý'],
                  [CalendarCheck2, 'Kiểm tra lịch, giá và điểm giao nhận'],
                  [FileCheck2, 'Chốt CCCD, GPLX, cọc và điều kiện thuê'],
                  [Fuel, 'Bàn giao tình trạng xe, nhiên liệu/pin và phụ kiện'],
                ].map(([Icon, label], index) => (
                  <li key={String(label)} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange-400 font-black text-slate-950">{index + 1}</span>
                    <span className="font-bold"><Icon className="mr-2 inline h-4 w-4 text-orange-300" />{String(label)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 grid gap-3 sm:grid-cols-2">
              {sevenSeatGuides.map((guide) => (
                <Link
                  key={guide.to}
                  to={guide.to}
                  onClick={() => trackCtaClick('seven_seat_hub_guide', { target_path: guide.to })}
                  className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <h2 className="font-black text-slate-900">{guide.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>
                </Link>
              ))}
            </div>
            <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-brand-600">Câu hỏi thường gặp</p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight sm:text-4xl">Trước khi thuê xe 7 chỗ tự lái</h2>
            <div className="mt-8 space-y-3">
              {sevenSeatFaqs.map((item) => (
                <details key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm">
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
              <h2 className="mt-2 text-3xl font-black">Gửi số người, hành lý và ngày thuê</h2>
              <p className="mt-2 text-brand-100">Car Match sẽ đối chiếu Carnival, Xpander và Limo Green trước khi báo phương án.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href={PHONE_LINK} onClick={() => trackPhoneClick('seven_seat_hub_footer')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-5 font-black hover:bg-white/10"><Phone className="h-4 w-4" /> Gọi 0971 163 290</a>
              <a href={zaloHref} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('seven_seat_hub_footer')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-brand-700 hover:bg-brand-50"><MessageCircle className="h-4 w-4" /> Nhắn Zalo</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ZaloFAB />
      <MobileConversionBar source="seven_seat_hub" zaloHref={zaloHref} note="Xác nhận lịch xe trước khi đặt cọc" />
    </div>
  );
}
