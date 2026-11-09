import { useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Building2, FileText, Headphones, TrendingDown, ArrowRight, Send, Home as HomeIcon, Car, Users, ClipboardCheck, MapPin, Gauge, CalendarDays, Zap } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { submitLead } from '@/hooks/useLeads';
import { cars as fallbackCars, formatPrice, type Car as CarModel } from '@/data/cars';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';
import { useSEO } from '@/hooks/useSEO';
import { trackLeadSubmit, trackZaloClick } from '@/lib/analytics';
import { vehicleImageAlt } from '@/lib/imageAlt';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';

const ZALO_LINK = 'https://zalo.me/0971163290';

const residentBenefits = [
  { icon: TrendingDown, title: 'Không cần vốn mua xe', desc: 'Phù hợp khi cần xe trong vài tháng nhưng chưa muốn cam kết chi phí sở hữu dài hạn.' },
  { icon: HomeIcon, title: 'Giao tận sảnh tòa nhà', desc: 'Xe đến tận cổng khu đô thị, không cần ra ngoài tìm phương tiện.' },
  { icon: Car, title: 'Đổi xe khi cần', desc: 'Kỳ tiếp theo muốn 5 chỗ hay 7 chỗ, điện hay xăng — tùy bạn.' },
  { icon: Headphones, title: 'Hỗ trợ 7h–22h', desc: 'Đội ngũ Car Match luôn sẵn sàng xử lý sự cố trong suốt thời gian thuê.' },
];

const businessBenefits = [
  { icon: TrendingDown, title: 'Dễ kiểm soát chi phí', desc: 'Gói thuê dài ngày được báo theo mẫu xe, lịch dùng, giới hạn km và điểm giao nhận.' },
  { icon: Building2, title: 'Giao xe tận văn phòng', desc: 'Xe được giao đến văn phòng, công trình, hoặc địa điểm bạn chỉ định.' },
  { icon: FileText, title: 'Hợp đồng rõ điều kiện', desc: 'Chi phí thuê, cọc, phụ phí và chứng từ thanh toán được xác nhận trước khi ký.' },
  { icon: Users, title: 'Một đầu mối liên hệ', desc: 'Car Match hỗ trợ lọc phương án xe và đối soát theo nhu cầu sử dụng thực tế.' },
];

function monthlyVehicleGroup(car: CarModel) {
  if (car.fuel === 'Điện') return 'Xe điện';
  if (car.seats >= 7) return 'Xe 7 chỗ / MPV';
  return 'Xe 5 chỗ';
}

function monthlyVehicleFit(car: CarModel) {
  if (car.fuel === 'Điện') return 'Đi phố, đi làm, cần xe vận hành êm và dễ dự tính chi phí sạc.';
  if (car.seats >= 7) return 'Gia đình đông người, doanh nghiệp hoặc chuyến đi có nhiều hành lý.';
  return 'Cá nhân, gia đình nhỏ, đi làm và công tác hằng ngày.';
}

function monthlyPriceLabel(car: CarModel) {
  return car.priceMonth ? `${formatPrice(car.priceMonth)}/tháng` : 'Liên hệ báo giá';
}

const monthlyCostItems = [
  { title: 'Giá thuê xe tháng', note: 'Khoản chính trong báo giá, xác định theo mẫu xe và thời hạn thuê.' },
  { title: 'Giao nhận xe', note: 'Xác nhận theo điểm nhận/trả, thời gian bàn giao và quãng đường giao xe.' },
  { title: 'Nhiên liệu hoặc sạc', note: 'Khách tự dự tính theo số km sử dụng và loại xe đã chọn.' },
  { title: 'Cầu đường và gửi xe', note: 'Phát sinh theo hành trình thực tế, không mặc định nằm trong giá thuê.' },
  { title: 'Vượt km hoặc phát sinh', note: 'Chỉ tính khi vượt điều kiện hợp đồng hoặc có chi phí cần đối soát.' },
];

const rentVsBuyRows = [
  { criterion: 'Chi phí ban đầu', rent: 'Cọc và kỳ thuê theo thỏa thuận', buy: 'Tiền mua xe hoặc khoản trả trước' },
  { criterion: 'Thời gian phù hợp', rent: 'Nhu cầu 1-12 tháng hoặc dự án có thời hạn', buy: 'Nhu cầu sử dụng ổn định trong nhiều năm' },
  { criterion: 'Khấu hao', rent: 'Không sở hữu nên không chịu khấu hao giá bán lại', buy: 'Chủ xe chịu biến động giá trị xe theo thời gian' },
  { criterion: 'Bảo dưỡng và lịch xe', rent: 'Trách nhiệm cần ghi rõ trong hợp đồng thuê', buy: 'Chủ xe tự sắp xếp và chi trả theo thực tế' },
  { criterion: 'Đổi nhu cầu', rent: 'Có thể chọn nhóm xe khác ở kỳ tiếp theo', buy: 'Đổi xe cần bán hoặc chuyển nhượng xe hiện tại' },
];

const monthlyGuides = [
  {
    to: '/blog/thue-xe-thang-cho-doanh-nghiep-nho',
    title: 'Thuê xe tháng cho doanh nghiệp nhỏ',
    description: 'Xác định số ngày dùng, km, người lái, chứng từ và tổng chi phí trước khi chọn xe.',
  },
  {
    to: '/blog/thue-xe-thang-cho-chuyen-gia-nuoc-ngoai',
    title: 'Xe tháng cho chuyên gia nước ngoài',
    description: 'Checklist người ký, người lái, giấy phép, bàn giao và đầu mối doanh nghiệp.',
  },
  {
    to: '/blog/thue-xe-thang-cho-nhan-vien-di-cong-tac',
    title: 'Xe tháng cho nhân viên công tác',
    description: 'Quản lý lịch chạy, km, VETC, người lái và đối soát theo chuyến.',
  },
  {
    to: '/blog/goi-thue-xe-22-ngay-va-30-ngay-khac-gi-nhau',
    title: 'Gói 22 ngày và 30 ngày khác gì?',
    description: 'So quyền giữ xe, tổng km, giao nhận và chi phí trên mỗi ngày dùng thực tế.',
  },
  {
    to: '/blog/thue-xe-thang-co-xuat-hoa-don-khong',
    title: 'Thuê xe tháng có xuất hóa đơn?',
    description: 'Những thông tin kế toán cần xác nhận trước khi ký và chuyển cọc.',
  },
  {
    to: '/blog/hop-dong-thue-xe-thang-can-dieu-khoan-gi',
    title: 'Điều khoản hợp đồng thuê xe tháng',
    description: 'Checklist xe, người lái, giá, cọc, km, bảo dưỡng, hư hỏng và thanh lý.',
  },
  {
    to: '/blog/thue-xe-thang-co-gioi-han-km-khong',
    title: 'Thuê xe tháng có giới hạn km?',
    description: 'Cách ước lượng nhu cầu, ghi nhận đồng hồ và tính kịch bản vượt km.',
  },
  {
    to: '/blog/xe-thay-the-khi-bao-duong-xu-ly-the-nao',
    title: 'Xe thay thế khi bảo dưỡng',
    description: 'Chốt tiêu chí tương đương, lịch đổi xe, km và chi phí để giảm gián đoạn.',
  },
  {
    to: '/blog/thue-vf5-theo-ngay-hay-theo-thang',
    title: 'Thuê VF5 theo ngày hay tháng?',
    description: 'So số ngày dùng, km, giao nhận và điều kiện hợp đồng trên cùng nhu cầu.',
  },
  {
    to: '/blog/thue-xe-thang-hay-mua-xe',
    title: 'Thuê xe tháng hay mua xe?',
    description: 'So tổng chi phí, dòng tiền, khấu hao và mức độ linh hoạt trước khi quyết định.',
  },
  {
    to: '/blog/thue-xe-thang-co-bao-gom-bao-duong-khong',
    title: 'Thuê xe tháng có gồm bảo dưỡng?',
    description: 'Phân định bảo dưỡng định kỳ, hao mòn, hư hỏng và thời gian xe nằm xưởng.',
  },
];

const businessPackageItems = [
  'Một hoặc nhiều xe theo thời hạn dự án.',
  'Báo giá theo mẫu xe, số km dự kiến và điểm giao nhận.',
  'Chứng từ thanh toán và điều kiện hợp đồng được xác nhận trước khi ký.',
  'Một đầu mối phối hợp lịch bàn giao và đối soát phát sinh.',
];

const documentItems = [
  'CCCD gắn chip của người thuê hoặc người đại diện ký hợp đồng.',
  'GPLX hạng B còn hiệu lực, đúng người trực tiếp sử dụng xe.',
  'Thông tin nơi ở, tòa nhà hoặc điểm giao nhận tại Hà Nội.',
  'Khoản đặt cọc theo mẫu xe, được xác nhận trước khi giao xe.',
];

const monthlyFaqs = [
  {
    question: 'Thuê xe tự lái theo tháng tại Hà Nội giá bao nhiêu?',
    answer: 'Giá thuê xe tháng tại Car Match được hiển thị theo từng mẫu xe khi dữ liệu giá tháng đã được xác nhận. Mức tham khảo hiện bắt đầu từ 10.000.000đ/tháng; các mẫu chưa có giá công khai sẽ hiển thị “Liên hệ báo giá”. Giá cuối cùng phụ thuộc mẫu xe, thời hạn thuê, số km dự kiến, khu vực giao nhận và lịch xe thực tế. Trước khi đặt cọc, khách nhận báo giá gồm giá thuê, điều kiện km, khoản cọc, phí giao nhận nếu có và cách xử lý chi phí phát sinh.',
  },
  {
    question: 'Thuê xe tháng có giới hạn km không?',
    answer: 'Giới hạn km được xác nhận theo từng mẫu xe và hợp đồng, không nên mặc định một mức chung cho toàn bộ đội xe. Nếu nhu cầu đi lại cao, ví dụ chạy công trình, đi tỉnh thường xuyên hoặc dùng cho đội kinh doanh, khách nên gửi trước số km dự kiến mỗi tháng. Car Match sẽ dùng thông tin này để lọc xe, ghi rõ giới hạn km và cách tính vượt km trong báo giá, giúp khách so sánh đúng tổng chi phí trước khi đặt cọc.',
  },
  {
    question: 'Car Match có giao xe tận tòa nhà khi thuê theo tháng không?',
    answer: 'Có. Car Match tập trung phục vụ khách thuê xe tại Hà Nội, đặc biệt là cư dân chung cư và khu đô thị như Vinhomes Ocean Park, Vinhomes Smart City, Times City, Ecopark, The Manor Central Park và các điểm hẹn phù hợp. Trước khi chốt lịch, đội vận hành sẽ xác nhận khu vực giao nhận, thời gian nhận xe và phí giao nhận nếu có. Cách này giúp khách thuê tháng không phải tự đi xa lấy xe, nhất là khi cần dùng xe đều đặn cho gia đình hoặc công việc.',
  },
  {
    question: 'Cần chuẩn bị gì để thuê xe tự lái theo tháng?',
    answer: 'Thông thường anh/chị cần chuẩn bị CCCD gắn chip, GPLX hạng B còn hiệu lực, thông tin nơi ở hoặc điểm giao nhận tại Hà Nội và khoản đặt cọc theo mẫu xe. Với khách doanh nghiệp, Car Match có thể cần thêm thông tin công ty để làm hợp đồng và xác nhận nhu cầu chứng từ thanh toán. Điều kiện cụ thể được thống nhất trước khi giao xe để khách không bị bất ngờ về giấy tờ, cọc hoặc quy trình bàn giao.',
  },
  {
    question: 'Thuê 1 tháng có được không hay phải thuê dài hạn?',
    answer: 'Có thể thuê 1 tháng nếu có xe phù hợp và lịch xe trống. Tuy nhiên, nếu thuê 3 tháng, 6 tháng hoặc thuê nhiều xe cùng lúc, đơn giá thường dễ tối ưu hơn so với thuê ngắn. Với khách chưa chắc nhu cầu dài hạn, Car Match thường khuyên bắt đầu bằng nhu cầu thật: dùng xe đi làm, đưa gia đình, chạy dự án hay phục vụ doanh nghiệp. Từ đó đội tư vấn mới đề xuất gói 1-12 tháng hợp lý thay vì ép khách vào hợp đồng dài ngay từ đầu.',
  },
  {
    question: 'Có thể thuê xe điện VinFast theo tháng không?',
    answer: 'Có thể nếu mẫu xe điện phù hợp còn lịch cho thời gian khách cần. Khi so sánh xe điện theo tháng, khách nên xem đồng thời giá thuê, số km dự kiến, nơi sạc thường xuyên, hành trình đi tỉnh và thời gian có thể dừng sạc. Car Match hiển thị giá tháng theo từng mẫu khi dữ liệu đã được xác nhận; nếu chưa có giá công khai, khách có thể gửi nhu cầu để nhận báo giá và điều kiện sử dụng cụ thể.',
  },
  {
    question: 'Doanh nghiệp cần gửi gì để nhận báo giá nhiều xe?',
    answer: 'Doanh nghiệp nên gửi số lượng xe, thời hạn thuê, nhóm xe mong muốn, khu vực giao nhận, số km dự kiến mỗi tháng và người phụ trách bàn giao. Nếu cần chứng từ thanh toán hoặc điều kiện đối soát riêng, hãy ghi rõ ngay trong yêu cầu. Car Match kiểm tra lịch xe thật trước khi gửi phương án; báo giá sẽ nêu mẫu xe có thể cung cấp, giá thuê, cọc, giới hạn km, giao nhận và các điều kiện cần thống nhất trước khi ký.',
  },
];

const useCaseItems = [
  { icon: HomeIcon, label: 'Cư dân', title: 'Đi làm, đón con hằng ngày', desc: 'Có xe ổn định 1-3 tháng mà chưa phải mua xe hoặc lo bãi đỗ dài hạn.' },
  { icon: Users, label: 'Gia đình', title: 'Cuối tuần và về quê', desc: 'Chủ động xe 5-7 chỗ cho lịch gia đình, không cần thuê ngày lẻ nhiều lần.' },
  { icon: Building2, label: 'Doanh nghiệp', title: 'Xe công tác theo dự án', desc: 'Một đầu mối báo giá, hợp đồng và chứng từ thanh toán cho đội nhóm dùng xe thường xuyên.' },
  { icon: ClipboardCheck, label: 'Dài hạn', title: 'Chạy công trình, khảo sát', desc: 'Gói thuê rõ km/tháng, điểm giao nhận và trách nhiệm vận hành trước khi nhận xe.' },
];

const monthlyProcess = [
  { icon: MapPin, title: 'Gửi khu vực nhận xe', desc: 'Tòa nhà, văn phòng hoặc điểm hẹn tại Hà Nội.' },
  { icon: Car, title: 'Chọn nhóm xe', desc: '5 chỗ, 7 chỗ, xe điện hoặc cần tư vấn.' },
  { icon: Gauge, title: 'Ước lượng km/tháng', desc: 'Giúp chọn gói km và tránh phát sinh bị động.' },
  { icon: CalendarDays, title: 'Chốt thời gian thuê', desc: '1, 3, 6 hoặc 12 tháng tùy lịch xe thật.' },
];

const handoffSteps = [
  { icon: Send, title: 'Gửi nhu cầu', desc: 'Khu vực nhận xe, thời gian thuê, số xe và nhóm xe mong muốn.' },
  { icon: ClipboardCheck, title: 'Kiểm tra lịch xe thật', desc: 'Đội vận hành lọc xe còn lịch, giới hạn km, cọc và điều kiện giao nhận.' },
  { icon: FileText, title: 'Chốt báo giá rõ ràng', desc: 'Gửi giá thuê, cọc, km/tháng, phụ phí nếu có và thông tin hợp đồng.' },
  { icon: Car, title: 'Giao xe theo hẹn', desc: 'Bàn giao tại tòa nhà, văn phòng hoặc điểm hẹn đã xác nhận trước.' },
];

const serviceAreas = [
  'Vinhomes Ocean Park',
  'Times City',
  'Vinhomes Smart City',
  'Ecopark',
  'The Manor Central Park',
];

type CustomerType = 'resident' | 'business';

interface FormData {
  name: string;
  quantity: string;
  duration: string;
  phone: string;
  area: string;
  carModel: string;
  note: string;
  customerType: CustomerType;
}

export default function B2B() {
  useSEO({
    title: 'Thuê xe theo tháng Hà Nội từ 10 triệu | Car Match',
    description: 'Thuê xe tự lái theo tháng tại Hà Nội. Xem giá theo từng mẫu xe, tổng chi phí cần tính, gói doanh nghiệp và xe điện theo tháng.',
    canonical: 'https://www.carmatch.vn/thue-xe-thang',
  });

  const [form, setForm] = useState<FormData>({
    name: '',
    quantity: '',
    duration: '',
    phone: '',
    area: '',
    carModel: '',
    note: '',
    customerType: 'resident',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { cars } = useVehicles();

  const displayCars = cars.length > 0 ? cars : fallbackCars;
  const monthlyCars = displayCars.filter((car) => car.price > 0);
  const monthlyOfferCars = [...monthlyCars]
    .sort((a, b) => {
      if (a.priceMonth && b.priceMonth) return a.priceMonth - b.priceMonth;
      if (a.priceMonth) return -1;
      if (b.priceMonth) return 1;
      return a.price - b.price;
    })
    .slice(0, 8);
  const featuredCars = monthlyOfferCars.slice(0, 3);
  const electricMonthlyCars = monthlyOfferCars.filter((car) => car.fuel === 'Điện').slice(0, 3);
  const verifiedMonthlyPrices = monthlyCars
    .map((car) => car.priceMonth)
    .filter((price): price is number => typeof price === 'number' && price > 0);
  const monthlyStartingPrice = verifiedMonthlyPrices.length > 0 ? Math.min(...verifiedMonthlyPrices) : 10_000_000;
  const heroCar = monthlyOfferCars.find((car) => car.priceMonth && car.images[0]) || monthlyOfferCars.find((car) => car.images[0]);
  const heroMonthlyPrice = heroCar ? monthlyPriceLabel(heroCar) : `${formatPrice(monthlyStartingPrice)}/tháng`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    trackLeadSubmit('attempt', {
      lead_source: 'b2b',
      form_type: 'monthly',
      customer_type: form.customerType,
      quantity: form.quantity,
      duration: form.duration,
      car_model: form.carModel,
      building: form.area,
    });

    // Lưu vào Supabase (không block UX nếu lỗi)
    const result = await submitLead({
      source: 'b2b',
      name: form.name,
      phone: form.phone,
      customer_type: form.customerType,
      quantity: form.quantity,
      duration: form.duration,
      car_model: form.carModel,
      building: form.area,
      note: form.note,
    });
    trackLeadSubmit(result.ok ? 'success' : 'error', {
      lead_source: 'b2b',
      form_type: 'monthly',
      customer_type: form.customerType,
      quantity: form.quantity,
      duration: form.duration,
      car_model: form.carModel,
      building: form.area,
      error_message: result.error,
    });

    const typeLabel = form.customerType === 'resident' ? 'CƯ DÂN' : 'DOANH NGHIỆP';
    const nameLabel = form.customerType === 'resident' ? 'Họ tên' : 'Tên công ty';
    const message = encodeURIComponent(
      `[THUÊ XE THÁNG — ${typeLabel}]\n${nameLabel}: ${form.name}\nSĐT: ${form.phone}\nKhu vực nhận xe: ${form.area}\nLoại xe mong muốn: ${form.carModel}\nSố xe: ${form.quantity}\nThời gian: ${form.duration}\nGhi chú: ${form.note}`
    );
    trackZaloClick('b2b_form_submit', {
      lead_source: 'b2b',
      form_type: 'monthly',
      customer_type: form.customerType,
      car_model: form.carModel,
      building: form.area,
    });
    window.open(`${ZALO_LINK}?text=${message}`, '_blank');
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 800);
  };

  const isResident = form.customerType === 'resident';

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 lg:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-brand-50 via-white to-slate-50 sm:pt-28 sm:pb-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.98fr_1.02fr] gap-8 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-6">
              <Car className="w-4 h-4" />
              Xe tự lái theo tháng · Hà Nội
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Thuê xe tự lái theo tháng<br />
              <span className="text-brand-600">tại Hà Nội</span>
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mb-7 leading-relaxed">
              Giá tham khảo từ {formatPrice(monthlyStartingPrice)}/tháng, giao xe tận tòa nhà và linh hoạt 1-12 tháng. Xem giá theo từng mẫu xe, các khoản cần tính và điều kiện thuê trước khi gửi yêu cầu.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#form"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-black text-white shadow-md shadow-brand-200 transition-colors hover:bg-brand-700">
                Nhận báo giá xe tháng trong 30 phút
              </a>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                onClick={() => trackZaloClick('b2b_hero')}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-center text-sm font-black text-gray-800 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50">
                Chat Zalo ngay
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-2xl">
              {[
                { value: `Từ ${formatPrice(monthlyStartingPrice)}`, label: 'giá tham khảo/tháng' },
                { value: '1-12 tháng', label: 'thời hạn theo nhu cầu' },
                { value: '30 phút', label: 'phản hồi báo giá' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/80 border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="text-brand-600 font-bold text-lg">{item.value}</div>
                  <div className="text-gray-500 text-xs leading-snug">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-xl shadow-slate-200/60">
            {heroCar?.images[0] ? (
              <div className="relative h-52 bg-slate-100 sm:h-64">
                <img
                  src={optimizedImageUrl(heroCar.images[0], 960, 68)}
                  srcSet={optimizedImageSrcSet(heroCar.images[0], [640, 960, 1280], 68)}
                  sizes="(min-width: 1024px) 420px, 100vw"
                  alt={vehicleImageAlt(heroCar, 'cho thuê theo tháng tại Hà Nội')}
                  className="h-full w-full object-cover"
                  width={1280}
                  height={720}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Gói mẫu</p>
                    <h2 className="mt-1 text-2xl font-black">{heroCar.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-white/75">{heroCar.seats} chỗ · {heroCar.fuel} · {heroCar.transmission}</p>
                  </div>
                  <div className="rounded-2xl bg-white/95 px-4 py-3 text-right text-slate-950 shadow-sm">
                    <p className="text-xs font-bold text-slate-500">{heroCar.priceMonth ? 'Giá tháng' : 'Tham khảo'}</p>
                    <p className="text-lg font-black">{heroMonthlyPrice}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="p-5 sm:p-6 lg:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide">Báo giá nhanh</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">4 thông tin để lọc xe phù hợp</h2>
                </div>
                <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-700">30 phút</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {monthlyProcess.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <item.icon className="mb-3 h-5 w-5 text-brand-600" />
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
              <a href="#form" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-brand-700">
                Điền form báo giá
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-gray-400 text-xs text-center mt-3">Hoặc nhắn Zalo 0971 163 290 nếu cần xe gấp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            Ai nên thuê xe theo tháng?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {useCaseItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                      {item.label}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits — tabbed by customer type */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Lợi ích khi thuê xe tháng Car Match</h2>
            {/* Tab switcher */}
            <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
              <button
                onClick={() => setForm(f => ({ ...f, customerType: 'resident' }))}
                aria-pressed={isResident}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${isResident ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <HomeIcon className="h-4 w-4" />
                Cư dân
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, customerType: 'business' }))}
                aria-pressed={!isResident}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${!isResident ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Building2 className="h-4 w-4" />
                Doanh nghiệp
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(isResident ? residentBenefits : businessBenefits).map((b) => (
              <div key={b.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Giá theo mẫu xe</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Bảng giá thuê xe tự lái theo tháng tại Hà Nội</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Giá tháng lấy từ dữ liệu đang công khai của từng mẫu xe. Mẫu chưa có giá xác nhận sẽ hiển thị “Liên hệ báo giá” thay vì dùng một khoảng giá ước đoán.
            </p>
          </div>
          <div className="grid gap-4 lg:hidden">
            {monthlyOfferCars.map((car) => (
              <article key={car.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{monthlyVehicleGroup(car)}</p>
                    <h3 className="mt-1 text-lg font-bold text-gray-900">{car.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">{car.seats} chỗ · {car.fuel} · {car.transmission}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between gap-4 rounded-2xl bg-gray-50 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Giá tháng</p>
                    <p className="mt-1 text-lg font-black text-brand-700">{monthlyPriceLabel(car)}</p>
                  </div>
                  <p className="text-right text-xs text-gray-500">Giá ngày: {formatPrice(car.price)}/ngày</p>
                </div>
                <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold leading-6 text-gray-700">
                  {monthlyVehicleFit(car)}
                </p>
                <Link to={`/xe/${car.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline">
                  Xem xe và lịch thuê
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-sm lg:block">
            <table className="w-full min-w-[880px] text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-4">Mẫu xe</th>
                  <th className="px-5 py-4">Nhóm</th>
                  <th className="px-5 py-4">Giá tháng</th>
                  <th className="px-5 py-4">Giá ngày tham khảo</th>
                  <th className="px-5 py-4">Phù hợp</th>
                  <th className="px-5 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyOfferCars.map((car) => (
                  <tr key={car.id} className="align-top">
                    <td className="px-5 py-5 font-bold text-gray-900">{car.name}</td>
                    <td className="px-5 py-5 text-gray-600">{monthlyVehicleGroup(car)}</td>
                    <td className="px-5 py-5 font-bold text-brand-600">{monthlyPriceLabel(car)}</td>
                    <td className="px-5 py-5 text-gray-600">{formatPrice(car.price)}/ngày</td>
                    <td className="px-5 py-5 text-gray-600 max-w-xs">{monthlyVehicleFit(car)}</td>
                    <td className="px-5 py-5 text-right">
                      <Link to={`/xe/${car.slug}`} className="font-bold text-brand-600 hover:underline">Xem xe</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">
            * Giá cuối cùng phụ thuộc lịch xe, thời hạn thuê, giới hạn km, khu vực giao nhận và điều kiện cọc được xác nhận trong báo giá.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Chứng từ thanh toán được xác nhận trước khi ký hợp đồng.', 'Linh hoạt 1-12 tháng theo nhu cầu sử dụng.', 'Báo giá sau khi kiểm tra xe thật và lịch trống.'].map((note) => (
              <div key={note} className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm font-medium text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200/70 sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-200">Chưa chắc chọn gói nào?</p>
                <h3 className="mt-2 text-2xl font-black">Gửi khu vực nhận xe và lịch dùng, Car Match lọc xe tháng phù hợp.</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">Phù hợp khi anh/chị cần biết trước giá, cọc, km/tháng và mẫu xe còn lịch trống.</p>
              </div>
              <a href="#form" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-brand-50">
                Nhận báo giá
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Total monthly cost */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">Tổng ngân sách cần tính</p>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Thuê xe tháng gồm những chi phí nào?</h2>
              <p className="mt-4 leading-7 text-gray-600">
                Tổng ngân sách tháng không chỉ có tiền thuê xe. Trước khi chốt, hãy cộng các khoản sử dụng thực tế và yêu cầu ghi rõ khoản nào đã nằm trong hợp đồng.
              </p>
              <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-200">Công thức dự tính</p>
                <p className="mt-3 text-lg font-black leading-8">
                  Tổng chi phí = giá thuê + giao nhận + xăng/sạc + cầu đường/gửi xe + phát sinh theo hợp đồng
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {monthlyCostItems.map((item, index) => (
                <article key={item.title} className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${index === 0 ? 'sm:col-span-2' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-black text-brand-700">{index + 1}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.note}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rent versus buy */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">So sánh để ra quyết định</p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Khi nào nên thuê xe tháng thay vì mua xe?</h2>
            <p className="mt-4 leading-7 text-gray-600">
              Thuê không mặc định rẻ hơn mua trong mọi trường hợp. Gói tháng phù hợp hơn khi nhu cầu có thời hạn, cần giữ vốn hoặc muốn thử loại xe trước khi cam kết sở hữu dài hạn.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-5 py-4 font-bold">Tiêu chí</th>
                  <th className="px-5 py-4 font-bold">Thuê xe theo tháng</th>
                  <th className="px-5 py-4 font-bold">Mua xe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rentVsBuyRows.map((row) => (
                  <tr key={row.criterion} className="align-top">
                    <th scope="row" className="px-5 py-4 font-bold text-gray-900">{row.criterion}</th>
                    <td className="px-5 py-4 leading-6 text-gray-600">{row.rent}</td>
                    <td className="px-5 py-4 leading-6 text-gray-600">{row.buy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Electric monthly and business package */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900">Thuê xe điện VinFast theo tháng</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              Xe điện phù hợp người có điểm sạc thuận tiện và hành trình có thể dự tính trước. Hãy gửi số km, nơi sạc thường xuyên và nhu cầu đi tỉnh để được tư vấn đúng mẫu.
            </p>
            <div className="mt-6 space-y-3">
              {electricMonthlyCars.length > 0 ? electricMonthlyCars.map((car) => (
                <Link key={car.id} to={`/xe/${car.slug}`} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 hover:border-emerald-200">
                  <div>
                    <h3 className="font-bold text-gray-900">{car.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{car.seats} chỗ · giá ngày {formatPrice(car.price)}</p>
                  </div>
                  <span className="text-right text-sm font-black text-emerald-700">{monthlyPriceLabel(car)}</span>
                </Link>
              )) : (
                <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">Gửi nhu cầu để kiểm tra mẫu xe điện còn lịch và giá tháng tương ứng.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-brand-200">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Gói thuê xe tháng cho doanh nghiệp</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Dành cho đội sales, công tác dự án, tiếp khách hoặc vận hành cần xe trong một giai đoạn xác định.
            </p>
            <ul className="mt-6 space-y-3">
              {businessPackageItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/85">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#form"
              onClick={() => setForm((current) => ({ ...current, customerType: 'business' }))}
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 hover:bg-brand-50"
            >
              Nhận báo giá doanh nghiệp
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Process and service areas */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7 max-w-2xl">
              <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-brand-600">Sau khi gửi yêu cầu</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Quy trình thuê xe tháng diễn ra thế nào?</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
                Khách không cần chọn chính xác mẫu xe ngay từ đầu. Car Match dùng nhu cầu thực tế để lọc xe, báo giá và hẹn bàn giao.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {handoffSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl bg-gray-50 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Bước {index + 1}</span>
                    </div>
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-100 bg-brand-50 p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
              <MapPin className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900">Khu vực giao xe phổ biến</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Ưu tiên các khu đô thị, chung cư và văn phòng tại Hà Nội để việc nhận xe tháng ổn định hơn.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {serviceAreas.map((area) => (
                <span key={area} className="rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm">
                  {area}
                </span>
              ))}
            </div>
            <a href="#form" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-brand-700">
              Kiểm tra xe theo khu vực
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div>
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Điều kiện thuê xe tháng</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Cần chuẩn bị gì trước khi nhận xe?</h2>
            <p className="text-gray-500 leading-relaxed">
              Car Match xác nhận giấy tờ, cọc, điểm giao nhận và quy định km trước khi bàn giao để khách thuê tháng không bị phát sinh bất ngờ.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {documentItems.map((item, index) => (
              <div key={item} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold mb-4">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured fleet */}
      {featuredCars.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
              Gợi ý xe có thể thuê dài ngày
            </h2>
            <p className="text-gray-500 text-center mb-10">Xem toàn bộ đội xe để chọn mẫu phù hợp</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredCars.map((car) => (
                <CarCard key={car.id} car={car} source="b2b_featured" />
              ))}
            </div>
            <div className="text-center mt-8">
              <a href="/xe"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors">
                Xem tất cả xe <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Contact Form */}
      <section id="form" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Nhận báo giá miễn phí</h2>
            <p className="text-gray-500">Điền thông tin — đội ngũ Car Match sẽ liên hệ trong 30 phút.</p>
          </div>

          {submitted ? (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-brand-500 mx-auto mb-4" />
              <h3 className="text-gray-900 font-bold text-xl mb-3">Yêu cầu đã được gửi!</h3>
              <p className="text-gray-600 mb-6">Zalo Car Match đã được mở. Chúng tôi sẽ phản hồi sớm nhất.</p>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                onClick={() => trackZaloClick('b2b_submitted')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 transition-colors">
                Mở Zalo Car Match
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-5">
              {/* Customer type toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bạn là</label>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, customerType: 'resident' }))}
                    aria-pressed={form.customerType === 'resident'}
                    className={`flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.customerType === 'resident' ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <HomeIcon className="h-4 w-4" />
                    Cư dân
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, customerType: 'business' }))}
                    aria-pressed={form.customerType === 'business'}
                    className={`flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.customerType === 'business' ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <Building2 className="h-4 w-4" />
                    Doanh nghiệp
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {form.customerType === 'resident' ? 'Họ tên *' : 'Tên công ty *'}
                </label>
                <input name="name" value={form.name} onChange={handleChange} required
                  placeholder={form.customerType === 'resident' ? 'VD: Nguyễn Văn A' : 'VD: Công ty TNHH ABC'}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng xe *</label>
                  <select name="quantity" value={form.quantity} onChange={handleChange} required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors cursor-pointer">
                    <option value="">Chọn số xe</option>
                    <option value="1 xe">1 xe</option>
                    <option value="2–3 xe">2–3 xe</option>
                    <option value="4–6 xe">4–6 xe</option>
                    <option value="6+ xe">6+ xe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian thuê *</label>
                  <select name="duration" value={form.duration} onChange={handleChange} required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors cursor-pointer">
                    <option value="">Chọn thời gian</option>
                    <option value="1 tháng">1 tháng</option>
                    <option value="2–3 tháng">2–3 tháng</option>
                    <option value="3–6 tháng">3–6 tháng</option>
                    <option value="6+ tháng">6+ tháng</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required type="tel"
                  placeholder="VD: 0912 345 678"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực nhận xe / tên tòa nhà *</label>
                <input name="area" value={form.area} onChange={handleChange} required
                  placeholder="VD: Vinhomes Ocean Park, Times City, Ecopark..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại xe mong muốn *</label>
                <select name="carModel" value={form.carModel} onChange={handleChange} required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors cursor-pointer">
                  <option value="">Chọn loại xe</option>
                  <option value="Xe nhỏ / xe điện đô thị">Xe nhỏ / xe điện đô thị</option>
                  <option value="Sedan / Crossover 5 chỗ">Sedan / Crossover 5 chỗ</option>
                  <option value="Xe 7 chỗ / MPV">Xe 7 chỗ / MPV</option>
                  <option value="Chưa chắc, cần tư vấn">Chưa chắc, cần tư vấn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dự kiến số km/tháng hoặc yêu cầu thêm</label>
                <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                  placeholder="VD: đi làm hằng ngày khoảng 2.000 km/tháng, bắt đầu từ đầu tháng sau..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-brand-200">
                {loading ? 'Đang xử lý...' : <><Send className="w-4 h-4" />Gửi yêu cầu báo giá</>}
              </button>
              <p className="text-gray-400 text-xs text-center">
                Hoặc liên hệ trực tiếp:{' '}
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('b2b_form_footer')} className="text-brand-600 hover:underline">
                  Zalo 0971 163 290
                </a>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            {monthlyGuides.map((guide) => (
              <Link
                key={guide.to}
                to={guide.to}
                className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <h2 className="font-bold text-gray-900">{guide.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{guide.description}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mb-10">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Câu hỏi thường gặp</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Thông tin cần biết khi thuê xe tự lái theo tháng</h2>
          </div>
          <div className="space-y-4">
            {monthlyFaqs.map((faq) => (
              <details key={faq.question} className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-bold text-gray-900">
                  <span>{faq.question}</span>
                  <span className="text-brand-600 group-open:rotate-90 transition-transform">→</span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed text-sm">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-2 gap-3">
          <a href="#form" className="py-3 rounded-xl bg-brand-600 text-white font-bold text-center text-sm">
            Nhận báo giá
          </a>
          <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('b2b_sticky_mobile')} className="py-3 rounded-xl border border-gray-200 text-gray-800 font-bold text-center text-sm">
            Chat Zalo
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
