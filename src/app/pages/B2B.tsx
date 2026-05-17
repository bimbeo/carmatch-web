import { useState } from 'react';
import { CheckCircle2, Building2, FileText, Headphones, TrendingDown, ArrowRight, Send, Home as HomeIcon, Car, Users } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { submitLead } from '@/hooks/useLeads';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';
import { useSEO } from '@/hooks/useSEO';

const ZALO_LINK = 'https://zalo.me/0975563290';

const residentBenefits = [
  { icon: TrendingDown, title: 'Rẻ hơn mua xe', desc: 'Không mất tiền mua, không lo khấu hao, không tốn phí đỗ xe hàng tháng.' },
  { icon: HomeIcon, title: 'Giao tận sảnh tòa nhà', desc: 'Xe đến tận cổng khu đô thị, không cần ra ngoài tìm phương tiện.' },
  { icon: Car, title: 'Đổi xe khi cần', desc: 'Kỳ tiếp theo muốn 5 chỗ hay 7 chỗ, điện hay xăng — tùy bạn.' },
  { icon: Headphones, title: 'Hỗ trợ 7h–22h', desc: 'Đội ngũ CarMatch luôn sẵn sàng xử lý sự cố trong suốt thời gian thuê.' },
];

const businessBenefits = [
  { icon: TrendingDown, title: 'Tiết kiệm 30–40%', desc: 'So với thuê xe ngày lẻ. Hợp đồng dài hạn = giá tốt hơn đáng kể.' },
  { icon: Building2, title: 'Giao xe tận văn phòng', desc: 'Xe được giao đến văn phòng, công trình, hoặc địa điểm bạn chỉ định.' },
  { icon: FileText, title: 'Hóa đơn VAT đầy đủ', desc: 'Xuất hóa đơn đỏ đầy đủ, thuận tiện cho kế toán doanh nghiệp.' },
  { icon: Users, title: 'Quản lý đội xe dễ', desc: 'Một đầu mối liên hệ, một hóa đơn — dù thuê 1 hay 10 xe.' },
];

const pricingTiers = [
  { label: 'Xe 5 chỗ', examples: 'VF5, VF6, Hyundai Creta', price: 'Từ 18.000.000đ', unit: '/xe/tháng', note: 'Không bao gồm nhiên liệu', highlight: false },
  { label: 'Xe 7 chỗ', examples: 'Toyota Innova, Carnival', price: 'Từ 20.000.000đ', unit: '/xe/tháng', note: 'Không bao gồm nhiên liệu', highlight: true },
  { label: 'Xe cao cấp', examples: 'Kia Carnival, VinFast VF8', price: 'Liên hệ', unit: 'báo giá', note: 'Giá theo số lượng và thời gian', highlight: false },
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
  note: string;
  customerType: CustomerType;
}

export default function B2B() {
  useSEO({
    title: 'Thuê Xe Theo Tháng Hà Nội — Cư Dân & Doanh Nghiệp | CarMatch',
    description: 'Gói thuê xe theo tháng tại Hà Nội: tiết kiệm 30–40% so với thuê ngày lẻ. Giao xe tận tòa nhà, hóa đơn VAT, linh hoạt 1–12 tháng. Báo giá miễn phí.',
    canonical: 'https://carmatch.vn/thue-xe-thang',
  });

  const [form, setForm] = useState<FormData>({
    name: '',
    quantity: '',
    duration: '',
    phone: '',
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

    // Lưu vào Supabase (không block UX nếu lỗi)
    await submitLead({
      source: 'b2b',
      name: form.name,
      phone: form.phone,
      customer_type: form.customerType,
      quantity: form.quantity,
      duration: form.duration,
      building: form.customerType === 'resident' ? form.note : undefined,
      note: form.note,
    });

    const typeLabel = form.customerType === 'resident' ? 'CƯ DÂN' : 'DOANH NGHIỆP';
    const nameLabel = form.customerType === 'resident' ? 'Họ tên' : 'Tên công ty';
    const message = encodeURIComponent(
      `[THUÊ XE THÁNG — ${typeLabel}]\n${nameLabel}: ${form.name}\nSố xe: ${form.quantity}\nThời gian: ${form.duration}\nSĐT: ${form.phone}\nGhi chú: ${form.note}`
    );
    window.open(`${ZALO_LINK}?text=${message}`, '_blank');
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 800);
  };

  const isResident = form.customerType === 'resident';

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-6">
            <Car className="w-4 h-4" />
            Xe theo tháng · Cư dân &amp; Doanh nghiệp
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Thuê Xe Theo Tháng<br />
            <span className="text-brand-600">Tại Hà Nội</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Xe giao tận tòa nhà · Tiết kiệm 30–40% so với thuê ngày lẻ · Linh hoạt 1–12 tháng · Hóa đơn VAT đầy đủ
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#form"
              className="px-8 py-4 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200">
              Nhận báo giá miễn phí
            </a>
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
              Chat Zalo ngay
            </a>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Lợi ích khi thuê xe tháng CarMatch</h2>
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Bảng giá thuê xe tháng</h2>
            <p className="text-gray-500">Giá đã bao gồm bảo hiểm. Liên hệ để nhận báo giá theo số lượng.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <div key={tier.label}
                className={`rounded-2xl p-6 border transition-all ${tier.highlight ? 'bg-brand-600 border-brand-600 shadow-lg shadow-brand-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                {tier.highlight && (
                  <div className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold mb-3">
                    Phổ biến nhất
                  </div>
                )}
                <h3 className={`font-bold text-lg mb-1 ${tier.highlight ? 'text-white' : 'text-gray-900'}`}>{tier.label}</h3>
                <p className={`text-sm mb-4 ${tier.highlight ? 'text-brand-100' : 'text-gray-500'}`}>{tier.examples}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-2xl font-bold ${tier.highlight ? 'text-white' : 'text-brand-600'}`}>{tier.price}</span>
                  <span className={`text-sm ${tier.highlight ? 'text-brand-100' : 'text-gray-400'}`}>{tier.unit}</span>
                </div>
                <p className={`text-xs mb-6 ${tier.highlight ? 'text-brand-100' : 'text-gray-400'}`}>{tier.note}</p>
                <a href="#form"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${tier.highlight ? 'bg-white text-brand-700 hover:bg-brand-50' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  Yêu cầu báo giá
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">
            * Giảm thêm khi thuê ≥3 tháng hoặc ≥3 xe.
          </p>
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
                <CarCard key={car.id} car={car} />
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
            <p className="text-gray-500">Điền thông tin — đội ngũ CarMatch sẽ liên hệ trong 30 phút.</p>
          </div>

          {submitted ? (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-brand-500 mx-auto mb-4" />
              <h3 className="text-gray-900 font-bold text-xl mb-3">Yêu cầu đã được gửi!</h3>
              <p className="text-gray-600 mb-6">Zalo CarMatch đã được mở. Chúng tôi sẽ phản hồi sớm nhất.</p>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 transition-colors">
                Mở Zalo CarMatch
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Yêu cầu thêm</label>
                <textarea name="note" value={form.note} onChange={handleChange} rows={3}
                  placeholder={form.customerType === 'resident' ? 'Tên tòa nhà, loại xe cần, thời gian bắt đầu...' : 'Loại xe cần, địa điểm giao xe, thời gian bắt đầu...'}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-brand-200">
                {loading ? 'Đang xử lý...' : <><Send className="w-4 h-4" />Gửi yêu cầu báo giá</>}
              </button>
              <p className="text-gray-400 text-xs text-center">
                Hoặc liên hệ trực tiếp:{' '}
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  Zalo 0975 563 290
                </a>
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
