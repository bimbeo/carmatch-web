import { useState } from 'react';
import { CheckCircle2, Building2, FileText, Headphones, TrendingDown, ArrowRight, Send, Home as HomeIcon, Car, Users, ClipboardCheck, MapPin, Gauge } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { submitLead } from '@/hooks/useLeads';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';
import { useSEO } from '@/hooks/useSEO';
import { trackLeadSubmit, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0975563290';

const residentBenefits = [
  { icon: TrendingDown, title: 'Rẻ hơn mua xe', desc: 'Không mất tiền mua, không lo khấu hao, không tốn phí đỗ xe hàng tháng.' },
  { icon: HomeIcon, title: 'Giao tận sảnh tòa nhà', desc: 'Xe đến tận cổng khu đô thị, không cần ra ngoài tìm phương tiện.' },
  { icon: Car, title: 'Đổi xe khi cần', desc: 'Kỳ tiếp theo muốn 5 chỗ hay 7 chỗ, điện hay xăng — tùy bạn.' },
  { icon: Headphones, title: 'Hỗ trợ 7h–22h', desc: 'Đội ngũ Car Match luôn sẵn sàng xử lý sự cố trong suốt thời gian thuê.' },
];

const businessBenefits = [
  { icon: TrendingDown, title: 'Tiết kiệm 30–40%', desc: 'So với thuê xe ngày lẻ. Hợp đồng dài hạn = giá tốt hơn đáng kể.' },
  { icon: Building2, title: 'Giao xe tận văn phòng', desc: 'Xe được giao đến văn phòng, công trình, hoặc địa điểm bạn chỉ định.' },
  { icon: FileText, title: 'Hóa đơn VAT đầy đủ', desc: 'Xuất hóa đơn đỏ đầy đủ, thuận tiện cho kế toán doanh nghiệp.' },
  { icon: Users, title: 'Quản lý đội xe dễ', desc: 'Một đầu mối liên hệ, một hóa đơn — dù thuê 1 hay 10 xe.' },
];

const pricingRows = [
  {
    group: 'Xe nhỏ / xe điện đô thị',
    examples: 'VinFast VF5, Fadil',
    price: 'Từ 10-12 triệu/tháng',
    km: '2.500-3.000 km/tháng',
    deposit: 'Từ 15-30 triệu',
    fit: 'Đi làm hằng ngày, gia đình trẻ, cư dân chung cư',
  },
  {
    group: 'Sedan / Crossover 5 chỗ',
    examples: 'VinFast VF6, Hyundai Creta, Kia Seltos',
    price: 'Từ 14-18 triệu/tháng',
    km: '2.500-3.000 km/tháng',
    deposit: 'Từ 20-40 triệu',
    fit: 'Gia đình 3-5 người, đi phố và cuối tuần',
  },
  {
    group: 'Xe 7 chỗ / MPV',
    examples: 'Toyota Innova, Kia Carnival',
    price: 'Từ 20 triệu/tháng',
    km: 'Theo hợp đồng',
    deposit: 'Báo theo mẫu xe',
    fit: 'Gia đình đông người, doanh nghiệp, đi tỉnh nhiều',
  },
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
    answer: 'Giá thuê xe tự lái theo tháng tại Hà Nội thường bắt đầu từ khoảng 10-12 triệu/tháng với xe nhỏ hoặc xe điện đô thị. Nhóm sedan, crossover 5 chỗ thường nằm khoảng 14-18 triệu/tháng, còn xe 7 chỗ hoặc MPV thường từ 20 triệu/tháng tùy mẫu xe, thời gian thuê và giới hạn km. Car Match báo giá sau khi kiểm tra lịch xe thật, khu vực giao nhận và nhu cầu sử dụng để tránh báo giá chung chung rồi phát sinh khi chốt hợp đồng.',
  },
  {
    question: 'Thuê xe tháng có giới hạn km không?',
    answer: 'Có. Gói thuê xe tháng thường có giới hạn km theo hợp đồng, phổ biến khoảng 2.500-3.000 km/tháng với nhiều nhóm xe. Nếu nhu cầu đi lại cao hơn, ví dụ chạy công trình, đi tỉnh thường xuyên hoặc dùng cho đội kinh doanh, Car Match sẽ tư vấn gói phù hợp hơn thay vì để khách vượt km rồi phát sinh chi phí bị động. Khi nhận báo giá, anh/chị nên nói rõ dự kiến đi bao nhiêu km mỗi tháng để đội vận hành tính đúng phương án.',
  },
  {
    question: 'Car Match có giao xe tận tòa nhà khi thuê theo tháng không?',
    answer: 'Có. Car Match tập trung phục vụ khách thuê xe tại Hà Nội, đặc biệt là cư dân chung cư và khu đô thị như Vinhomes Ocean Park, Vinhomes Smart City, Times City, Ecopark, The Manor Central Park và các điểm hẹn phù hợp. Trước khi chốt lịch, đội vận hành sẽ xác nhận khu vực giao nhận, thời gian nhận xe và phí giao nhận nếu có. Cách này giúp khách thuê tháng không phải tự đi xa lấy xe, nhất là khi cần dùng xe đều đặn cho gia đình hoặc công việc.',
  },
  {
    question: 'Cần chuẩn bị gì để thuê xe tự lái theo tháng?',
    answer: 'Thông thường anh/chị cần chuẩn bị CCCD gắn chip, GPLX hạng B còn hiệu lực, thông tin nơi ở hoặc điểm giao nhận tại Hà Nội và khoản đặt cọc theo mẫu xe. Với khách doanh nghiệp, Car Match có thể cần thêm thông tin công ty để xuất hóa đơn hoặc làm hợp đồng rõ ràng. Điều kiện cụ thể được xác nhận trước khi giao xe, để khách không bị bất ngờ về giấy tờ, cọc hoặc quy trình bàn giao tại sảnh tòa nhà.',
  },
  {
    question: 'Thuê 1 tháng có được không hay phải thuê dài hạn?',
    answer: 'Có thể thuê 1 tháng nếu có xe phù hợp và lịch xe trống. Tuy nhiên, nếu thuê 3 tháng, 6 tháng hoặc thuê nhiều xe cùng lúc, đơn giá thường dễ tối ưu hơn so với thuê ngắn. Với khách chưa chắc nhu cầu dài hạn, Car Match thường khuyên bắt đầu bằng nhu cầu thật: dùng xe đi làm, đưa gia đình, chạy dự án hay phục vụ doanh nghiệp. Từ đó đội tư vấn mới đề xuất gói 1-12 tháng hợp lý thay vì ép khách vào hợp đồng dài ngay từ đầu.',
  },
];

const useCaseItems = [
  { icon: '🏠', title: 'Cư dân chung cư', desc: 'Đi làm hàng ngày, đón con, về quê dịp lễ — thuê tháng rẻ hơn mua xe.' },
  { icon: '👪', title: 'Gia đình đô thị', desc: 'Có xe dùng khi cần mà không phải lo phí đỗ xe, bảo dưỡng, khấu hao.' },
  { icon: '🏢', title: 'Doanh nghiệp vừa & nhỏ', desc: 'Xe công tác, đón đối tác, hỗ trợ lãnh đạo — không cần mua xe công ty.' },
  { icon: '🔨', title: 'Dự án dài hạn', desc: 'Công trình xây dựng, dự án thi công kéo dài cần xe ổn định.' },
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
    title: 'Thuê xe tự lái theo tháng Hà Nội từ 10tr | Car Match',
    description: 'Thuê xe tự lái theo tháng tại Hà Nội từ 10-20tr/tháng. Giao xe tận tòa nhà, hợp đồng rõ ràng, tư vấn báo giá trong 30 phút.',
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

  const featuredCars = cars.slice(0, 3);

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
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-brand-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-6">
              <Car className="w-4 h-4" />
              Xe tự lái theo tháng · Hà Nội
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Thuê xe tự lái theo tháng<br />
              <span className="text-brand-600">tại Hà Nội</span>
            </h1>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed">
              Từ 10tr/tháng, giao xe tận tòa nhà, linh hoạt 1-12 tháng cho cư dân chung cư và doanh nghiệp nhỏ. Car Match kiểm tra lịch xe thật rồi báo giá trong 30 phút.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#form"
                className="px-8 py-4 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200 text-center">
                Nhận báo giá xe tháng trong 30 phút
              </a>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                onClick={() => trackZaloClick('b2b_hero')}
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm text-center">
                Chat Zalo ngay
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-2xl">
              {[
                { value: '10-20tr', label: 'giá tham khảo/tháng' },
                { value: '2.500+', label: 'km/tháng theo gói' },
                { value: '30 phút', label: 'phản hồi báo giá' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/80 border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="text-brand-600 font-bold text-lg">{item.value}</div>
                  <div className="text-gray-500 text-xs leading-snug">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-slate-200/60 p-6 lg:p-8">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Báo giá nhanh</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Gửi 4 thông tin để Car Match lọc xe phù hợp</h2>
            <div className="space-y-3 mb-6">
              {[
                { icon: MapPin, text: 'Khu vực nhận xe hoặc tên tòa nhà' },
                { icon: Car, text: 'Loại xe mong muốn: 5 chỗ, 7 chỗ, xe điện' },
                { icon: Gauge, text: 'Dự kiến số km đi mỗi tháng' },
                { icon: ClipboardCheck, text: 'Thời gian thuê: 1, 3, 6 hoặc 12 tháng' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <item.icon className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
            <a href="#form" className="block w-full py-3.5 bg-brand-600 text-white text-center font-bold rounded-xl hover:bg-brand-700 transition-colors">
              Điền form báo giá
            </a>
            <p className="text-gray-400 text-xs text-center mt-3">Hoặc nhắn Zalo 0975 563 290 nếu cần xe gấp.</p>
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
            {useCaseItems.map((item) => (
              <div key={item.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-gray-900 font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${isResident ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                🏠 Cư dân
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, customerType: 'business' }))}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${!isResident ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                🏢 Doanh nghiệp
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
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wide mb-2">Bảng giá tham khảo</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Bảng giá thuê xe tự lái theo tháng tại Hà Nội</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Mức dưới đây dùng để dự tính ngân sách. Giá chính xác phụ thuộc mẫu xe, lịch trống, thời gian thuê, giới hạn km và khu vực giao nhận.
            </p>
          </div>
          <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-sm">
            <table className="w-full min-w-[880px] text-left">
              <thead className="bg-gray-50">
                <tr className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-4">Nhóm xe</th>
                  <th className="px-5 py-4">Mẫu xe tham khảo</th>
                  <th className="px-5 py-4">Giá thuê</th>
                  <th className="px-5 py-4">Km/tháng</th>
                  <th className="px-5 py-4">Cọc dự kiến</th>
                  <th className="px-5 py-4">Phù hợp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pricingRows.map((row) => (
                  <tr key={row.group} className="align-top">
                    <td className="px-5 py-5 font-bold text-gray-900">{row.group}</td>
                    <td className="px-5 py-5 text-gray-600">{row.examples}</td>
                    <td className="px-5 py-5 font-bold text-brand-600">{row.price}</td>
                    <td className="px-5 py-5 text-gray-600">{row.km}</td>
                    <td className="px-5 py-5 text-gray-600">{row.deposit}</td>
                    <td className="px-5 py-5 text-gray-600 max-w-xs">{row.fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Có thể xuất hóa đơn VAT cho doanh nghiệp.', 'Linh hoạt 1-12 tháng, tối ưu hơn khi thuê dài.', 'Báo giá sau khi kiểm tra xe thật và lịch trống.'].map((note) => (
              <div key={note} className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm font-medium text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-16 px-4 bg-gray-50">
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
              Xe được thuê tháng nhiều nhất
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
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.customerType === 'resident' ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    🏠 Cư dân
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, customerType: 'business' }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.customerType === 'business' ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    🏢 Doanh nghiệp
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
              <div className="grid grid-cols-2 gap-4">
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
                  Zalo 0975 563 290
                </a>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
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
