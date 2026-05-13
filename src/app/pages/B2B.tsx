import { useState } from 'react';
import { CheckCircle2, Building2, FileText, Headphones, TrendingDown, Users, ArrowRight, Send } from 'lucide-react';
import { cars, formatPrice } from '@/data/cars';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import CarCard from '../components/CarCard';

const ZALO_LINK = 'https://zalo.me/0975563290';

const benefits = [
  {
    icon: TrendingDown,
    title: 'Tiết kiệm 30–40%',
    desc: 'So với thuê xe ngày lẻ. Hợp đồng dài hạn = giá tốt hơn đáng kể.',
  },
  {
    icon: Building2,
    title: 'Giao xe tận nơi',
    desc: 'Xe được giao đến văn phòng, công trình, hoặc địa điểm bạn chỉ định.',
  },
  {
    icon: FileText,
    title: 'Hóa đơn VAT đầy đủ',
    desc: 'Xuất hóa đơn đỏ đầy đủ, thuận tiện cho kế toán doanh nghiệp.',
  },
  {
    icon: Headphones,
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ CarMatch luôn sẵn sàng xử lý sự cố trong suốt thời gian thuê.',
  },
];

const pricingTiers = [
  {
    label: 'Xe 5 chỗ',
    examples: 'VF5, VF6, Hyundai Creta',
    price: 'Từ 18.000.000đ',
    unit: '/xe/tháng',
    note: 'Không bao gồm nhiên liệu',
    highlight: false,
  },
  {
    label: 'Xe 7 chỗ',
    examples: 'Toyota Innova',
    price: 'Từ 20.000.000đ',
    unit: '/xe/tháng',
    note: 'Không bao gồm nhiên liệu',
    highlight: true,
  },
  {
    label: 'Xe cao cấp',
    examples: 'Kia Carnival, VinFast VF8',
    price: 'Liên hệ',
    unit: 'báo giá',
    note: 'Giá theo số lượng và thời gian',
    highlight: false,
  },
];

const useCaseItems = [
  {
    icon: '🏢',
    title: 'Xe công tác',
    desc: 'Công ty cần xe cho lãnh đạo hoặc nhân viên công tác định kỳ.',
  },
  {
    icon: '🔨',
    title: 'Dự án dài hạn',
    desc: 'Xe phục vụ công trình xây dựng, dự án thi công kéo dài.',
  },
  {
    icon: '🎪',
    title: 'Sự kiện & triển lãm',
    desc: 'Hội thảo, triển lãm, hoặc sự kiện cần nhiều xe trong thời gian dài.',
  },
  {
    icon: '🚌',
    title: 'Đưa đón nhân viên',
    desc: 'Đơn vị cần xe đưa đón nhân viên ca ngày / ca đêm định kỳ.',
  },
];

interface FormData {
  companyName: string;
  quantity: string;
  duration: string;
  phone: string;
  note: string;
}

export default function B2B() {
  const [form, setForm] = useState<FormData>({
    companyName: '',
    quantity: '',
    duration: '',
    phone: '',
    note: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const b2bCars = cars.filter((c) => c.useCases?.includes('Doanh nghiệp'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Build Zalo message
    const message = encodeURIComponent(
      `[YÊU CẦU THUÊ XE THÁNG]\nCông ty: ${form.companyName}\nSố xe: ${form.quantity}\nThời gian: ${form.duration}\nSĐT: ${form.phone}\nGhi chú: ${form.note}`
    );

    // Open Zalo with pre-filled message
    window.open(`${ZALO_LINK}?text=${message}`, '_blank');

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-full text-[#4ade80] text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Dành cho doanh nghiệp
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Giải Pháp Xe Tháng<br />
            <span className="text-[#4ade80]">Cho Doanh Nghiệp Hà Nội</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Tiết kiệm 30–40% so với thuê ngày lẻ. Xe giao tận nơi. Hóa đơn VAT đầy đủ. Hỗ trợ 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#form"
              className="px-8 py-4 bg-[#4ade80] text-black font-bold rounded-full hover:bg-[#22c55e] transition-colors"
            >
              Nhận báo giá miễn phí
            </a>
            <a
              href={ZALO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white/10 text-white font-semibold rounded-full hover:bg-white/5 transition-colors"
            >
              Chat Zalo ngay
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            Tại sao doanh nghiệp chọn CarMatch?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="w-11 h-11 bg-[#4ade80]/10 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-[#4ade80]" />
                </div>
                <h3 className="text-white font-semibold mb-2">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Bảng giá thuê xe tháng</h2>
            <p className="text-gray-500">Giá đã bao gồm bảo hiểm. Liên hệ để nhận báo giá theo số lượng.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.label}
                className={`rounded-2xl p-6 border transition-all ${
                  tier.highlight
                    ? 'bg-[#4ade80]/5 border-[#4ade80]/30'
                    : 'bg-[#111111] border-white/5'
                }`}
              >
                {tier.highlight && (
                  <div className="inline-block px-3 py-1 bg-[#4ade80] text-black rounded-full text-xs font-bold mb-3">
                    Phổ biến nhất
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{tier.label}</h3>
                <p className="text-gray-500 text-sm mb-4">{tier.examples}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-2xl font-bold ${tier.highlight ? 'text-[#4ade80]' : 'text-white'}`}>
                    {tier.price}
                  </span>
                  <span className="text-gray-500 text-sm">{tier.unit}</span>
                </div>
                <p className="text-gray-600 text-xs mb-6">{tier.note}</p>
                <a
                  href="#form"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? 'bg-[#4ade80] text-black hover:bg-[#22c55e]'
                      : 'border border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  Yêu cầu báo giá
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-sm mt-6">
            * Giá có thể thay đổi theo số lượng xe và thời gian hợp đồng. Giảm thêm khi thuê ≥3 tháng hoặc ≥3 xe.
          </p>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 px-4 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            Ai nên dùng gói thuê xe tháng?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {useCaseItems.map((item) => (
              <div key={item.title} className="bg-[#111111] border border-white/5 rounded-2xl p-5">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet B2B */}
      {b2bCars.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              Xe phù hợp cho doanh nghiệp
            </h2>
            <p className="text-gray-500 text-center mb-10">Các mẫu xe được doanh nghiệp ưa chuộng nhất</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {b2bCars.map((car) => (
                <CarCard key={car.slug} car={car} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Form */}
      <section id="form" className="py-16 px-4 bg-[#050505]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Nhận báo giá miễn phí</h2>
            <p className="text-gray-500">
              Điền thông tin bên dưới — đội ngũ CarMatch sẽ liên hệ trong vòng 30 phút.
            </p>
          </div>

          {submitted ? (
            <div className="bg-[#111111] border border-[#4ade80]/30 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-[#4ade80] mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-3">Yêu cầu đã được gửi!</h3>
              <p className="text-gray-400 mb-6">
                Zalo CarMatch đã được mở với nội dung yêu cầu của bạn. Chúng tôi sẽ phản hồi sớm nhất.
              </p>
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0068FF] text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
              >
                Mở Zalo CarMatch
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-[#111111] border border-white/5 rounded-2xl p-8 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tên công ty *</label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  placeholder="VD: Công ty TNHH ABC"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80]/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Số lượng xe *</label>
                  <select
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80]/50 transition-colors cursor-pointer"
                  >
                    <option value="">Chọn số xe</option>
                    <option value="1 xe">1 xe</option>
                    <option value="2–3 xe">2–3 xe</option>
                    <option value="4–6 xe">4–6 xe</option>
                    <option value="6+ xe">6+ xe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Thời gian thuê *</label>
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80]/50 transition-colors cursor-pointer"
                  >
                    <option value="">Chọn thời gian</option>
                    <option value="1 tháng">1 tháng</option>
                    <option value="2–3 tháng">2–3 tháng</option>
                    <option value="3–6 tháng">3–6 tháng</option>
                    <option value="6+ tháng">6+ tháng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Số điện thoại *</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  type="tel"
                  placeholder="VD: 0912 345 678"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80]/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yêu cầu thêm</label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Loại xe cần, địa điểm giao xe, thời gian bắt đầu..."
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80]/50 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>Đang xử lý...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gửi yêu cầu báo giá
                  </>
                )}
              </button>

              <p className="text-gray-600 text-xs text-center">
                Hoặc liên hệ trực tiếp:{' '}
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="text-[#0068FF] hover:underline">
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
