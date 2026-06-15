import { useState } from 'react';
import {
  CheckCircle2, ArrowRight, Send, Car, Shield, Zap,
  TrendingUp, CalendarCheck, Wrench, MapPin, BadgeCheck,
  ChevronDown,
} from 'lucide-react';
import { submitLead } from '@/hooks/useLeads';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import { useSEO } from '@/hooks/useSEO';
import { trackLeadSubmit, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0975563290';

const residentPerks = [
  {
    icon: TrendingUp,
    title: 'Xe nhàn rỗi → thêm dòng tiền',
    desc: 'Xe đỗ tầng hầm nhiều ngày? Car Match thẩm định mẫu xe, lịch rảnh và khu vực để đề xuất phương án khai thác phù hợp.',
  },
  {
    icon: MapPin,
    title: 'Xe vẫn ở trong tòa nhà',
    desc: 'Khách Car Match đến nhận xe tại sảnh tòa nhà của bạn. Không cần đưa xe ra ngoài, không mất chỗ đỗ riêng.',
  },
  {
    icon: BadgeCheck,
    title: 'Đối soát minh bạch',
    desc: 'Doanh thu, lịch xe và chi phí liên quan được đối soát theo hình thức hợp tác đã thỏa thuận.',
  },
  {
    icon: Shield,
    title: 'Kiểm tra khách và xe',
    desc: 'Car Match kiểm tra thông tin khách thuê, tình trạng xe và các điều kiện bảo hiểm/trách nhiệm trước khi vận hành.',
  },
];

const ownerPerks = [
  {
    icon: CalendarCheck,
    title: 'Hỗ trợ vận hành',
    desc: 'Car Match hỗ trợ tìm khách, kiểm tra thông tin, điều phối giao nhận, thu tiền và báo cáo theo thỏa thuận.',
  },
  {
    icon: Wrench,
    title: 'Theo dõi tình trạng xe',
    desc: 'Tình trạng xe, lịch bảo dưỡng và trách nhiệm hao mòn được thống nhất trong hợp đồng hợp tác.',
  },
  {
    icon: Zap,
    title: 'Lịch thanh toán rõ ràng',
    desc: 'Hình thức tháng hoặc theo giao dịch được đối soát theo kỳ, minh bạch từng lượt khai thác.',
  },
  {
    icon: TrendingUp,
    title: 'Hỗ trợ ước tính doanh thu',
    desc: 'Car Match tư vấn giá theo mùa vụ, loại xe và khu vực để chủ xe hiểu phương án khai thác trước khi ký.',
  },
];

const form1Steps = [
  'Cung cấp hồ sơ xe & kiểm định chất lượng',
  'Hoàn thiện thiết bị và hồ sơ vận hành cần thiết',
  'Ký hợp đồng cho thuê theo tháng',
  'Car Match đưa xe vào vận hành',
  'Theo dõi lịch sử dụng và tình trạng xe',
  'Đối soát doanh thu theo kỳ đã thỏa thuận',
];

const form2Steps = [
  'Cung cấp hồ sơ xe & kiểm định chất lượng',
  'Lắp GPS & hệ thống ETC',
  'Ký hợp đồng ủy thác theo giao dịch',
  'Đăng lịch rảnh xe hàng tuần',
  'Car Match xác nhận khách & điều phối giao nhận',
  'Đối soát theo tỷ lệ trong hợp đồng',
];

const faqs = [
  {
    q: 'Xe tôi phải đáp ứng tiêu chuẩn gì?',
    a: 'Xe đời 2019 trở lên, đăng kiểm còn hạn, hồ sơ đầy đủ (đăng ký, bảo hiểm). Car Match sẽ kiểm định trước khi ký hợp đồng.',
  },
  {
    q: 'Nếu xe bị hỏng hoặc tai nạn thì sao?',
    a: 'Car Match xác nhận điều kiện đặt cọc, bảo hiểm và trách nhiệm sử dụng trước khi đưa xe vào vận hành. Thiệt hại hoặc hao mòn được xử lý theo hợp đồng hợp tác và biên bản bàn giao thực tế.',
  },
  {
    q: 'Hình thức tháng trả bao nhiêu tiền?',
    a: 'Mức doanh thu phụ thuộc mẫu xe, đời xe, tình trạng xe, khu vực đỗ và lịch có thể khai thác. Chủ xe gửi thông tin để Car Match thẩm định và đề xuất phương án cụ thể.',
  },
  {
    q: 'Hình thức ngày tôi có dùng xe cá nhân được không?',
    a: 'Được. Bạn nộp lịch rảnh hàng tuần, những ngày không đăng ký xe vẫn thuộc quyền sử dụng của bạn. Linh hoạt hoàn toàn.',
  },
  {
    q: 'Cư dân chung cư có điều kiện đặc biệt không?',
    a: 'Car Match ưu tiên xe của cư dân các khu đô thị đang phục vụ (Vinhomes, Ecopark, The Manor...) vì tiện giao nhận. Điều này giúp việc điều phối xe và đối soát lịch khai thác rõ hơn cho hai bên.',
  },
];

interface FormData {
  name: string;
  phone: string;
  carModel: string;
  formType: 'monthly' | 'daily';
  building: string;
}

export default function Partner() {
  useSEO({
    title: 'Hợp Tác Chủ Xe Tại Hà Nội | Car Match',
    description: 'Chủ xe tại Hà Nội có thể gửi thông tin xe để Car Match thẩm định phương án hợp tác, lịch khai thác, điều kiện vận hành và đối soát doanh thu.',
    canonical: 'https://www.carmatch.vn/hop-tac',
  });

  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    carModel: '',
    formType: 'monthly',
    building: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    trackLeadSubmit('attempt', {
      lead_source: 'partner',
      form_type: form.formType,
      car_model: form.carModel,
      building: form.building,
    });

    // Lưu vào Supabase (không block UX nếu lỗi)
    const result = await submitLead({
      source: 'partner',
      name: form.name,
      phone: form.phone,
      form_type: form.formType,
      car_model: form.carModel,
      building: form.building,
    });
    trackLeadSubmit(result.ok ? 'success' : 'error', {
      lead_source: 'partner',
      form_type: form.formType,
      car_model: form.carModel,
      building: form.building,
      error_message: result.error,
    });

    const typeLabel = form.formType === 'monthly' ? 'CHO THUÊ THÁNG' : 'ỦY THÁC NGÀY';
    const message = encodeURIComponent(
      `[HỢP TÁC CHỦ XE — ${typeLabel}]\nHọ tên: ${form.name}\nSĐT: ${form.phone}\nXe: ${form.carModel}\nTòa nhà/KV: ${form.building}`
    );
    trackZaloClick('partner_form_submit', {
      lead_source: 'partner',
      form_type: form.formType,
    });
    window.open(`${ZALO_LINK}?text=${message}`, '_blank');
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 800);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-6">
            <Car className="w-4 h-4" />
            Dành cho chủ xe
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Xe nhàn rỗi?<br />
            <span className="text-brand-600">Để Car Match thẩm định phương án khai thác</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Hợp tác cho thuê xe cùng Car Match — chủ xe gửi thông tin để được thẩm định mẫu xe, lịch rảnh, khu vực đỗ và phương án khai thác phù hợp.
          </p>
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[
              { value: 'Theo xe', label: 'Ước tính doanh thu' },
              { value: 'Theo hợp đồng', label: 'Tỷ lệ đối soát' },
              { value: '0đ', label: 'Chi phí gia nhập' },
              { value: '30 phút', label: 'Phản hồi tư vấn' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-brand-600">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#dang-ky"
              className="px-8 py-4 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200">
              Đăng ký hợp tác ngay
            </a>
            <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
              onClick={() => trackZaloClick('partner_hero')}
              className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
              Hỏi qua Zalo trước
            </a>
          </div>
        </div>
      </section>

      {/* ── LỢI ÍCH CƯ DÂN CHUNG CƯ ────────────────────────────── */}
      <section className="py-20 px-4 bg-brand-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 text-white rounded-full text-sm font-semibold mb-5">
              🏠 Đặc biệt dành cho cư dân chung cư
            </span>
            <h2 className="text-3xl font-bold text-white mb-3">
              Sống ở Vinhomes, Ecopark, The Manor?<br />
              Xe bạn đang "ngủ" tốn tiền mỗi tháng
            </h2>
            <p className="text-brand-200 max-w-2xl mx-auto">
              Phí gửi xe 800K–2 triệu/tháng. Bảo hiểm. Bảo dưỡng. Trong khi xe đỗ im 20–25 ngày/tháng.<br />
              Hợp tác cùng Car Match để thẩm định khả năng khai thác xe theo lịch rảnh và khu vực đỗ.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {residentPerks.map((p) => (
              <div key={p.title} className="bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                <p className="text-brand-200 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 bg-white/10 border border-white/20 rounded-2xl p-6 max-w-3xl mx-auto">
            <p className="text-white font-semibold text-center mb-4">Ví dụ cần đối soát — Cư dân Vinhomes Ocean Park</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Xe Toyota Innova 2022', sub: '7 chỗ, số tự động', accent: false },
                { label: 'Phí cố định', sub: 'Gửi xe, bảo dưỡng, bảo hiểm', accent: false },
                { label: 'Lịch rảnh', sub: 'Số ngày có thể khai thác', accent: true },
                { label: 'Theo hợp đồng', sub: 'Doanh thu sau thẩm định', accent: true },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-4 ${item.accent ? 'bg-white' : 'bg-white/10'}`}>
                  <div className={`font-bold text-lg ${item.accent ? 'text-brand-600' : 'text-white'}`}>{item.label}</div>
                  <div className={`text-xs mt-1 ${item.accent ? 'text-gray-500' : 'text-brand-200'}`}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LỢI ÍCH CHUNG CHO CHỦ XE ───────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tại sao chọn hợp tác với Car Match?</h2>
            <p className="text-gray-500">Không chỉ dành cho cư dân — bất kỳ chủ xe nào cũng có thể hợp tác</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ownerPerks.map((p) => (
              <div key={p.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2 HÌNH THỨC HỢP TÁC ─────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">2 hình thức hợp tác</h2>
            <p className="text-gray-500">Chọn hình thức phù hợp với nhu cầu sử dụng xe của bạn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Form 1 — Monthly */}
            <div className="bg-brand-600 rounded-2xl p-8 text-white shadow-lg shadow-brand-200">
              <div className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold mb-5">
                Hình thức 1
              </div>
              <h3 className="text-2xl font-bold mb-2">Cho thuê theo tháng</h3>
              <p className="text-brand-200 text-sm mb-6 leading-relaxed">
                Bạn giao xe theo thời hạn đã thỏa thuận. Car Match hỗ trợ vận hành và đối soát doanh thu theo điều kiện hợp đồng.
              </p>
              <div className="mb-6">
                <div className="text-brand-200 text-xs font-semibold uppercase tracking-wide mb-3">Phù hợp nếu bạn</div>
                <ul className="space-y-2">
                  {['Không cần dùng xe hàng ngày', 'Muốn có kỳ đối soát rõ ràng', 'Muốn giảm việc tự tìm khách thuê'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-white">
                      <CheckCircle2 className="w-4 h-4 text-brand-300 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/15 rounded-xl p-4 mb-6">
                <div className="text-white font-bold text-lg">Ước tính sau thẩm định</div>
                <div className="text-brand-200 text-xs">Doanh thu theo mẫu xe và hợp đồng</div>
              </div>
              <div>
                <div className="text-brand-200 text-xs font-semibold uppercase tracking-wide mb-3">Quy trình</div>
                <ol className="space-y-2">
                  {form1Steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white">
                      <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Form 2 — Daily */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <div className="inline-block px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold mb-5">
                Hình thức 2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ủy thác theo ngày</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Bạn vẫn dùng xe cá nhân và đăng lịch rảnh hàng tuần. Mỗi giao dịch được đối soát theo tỷ lệ đã thống nhất.
              </p>
              <div className="mb-6">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Phù hợp nếu bạn</div>
                <ul className="space-y-2">
                  {['Dùng xe cá nhân không đều đặn', 'Muốn linh hoạt lịch cho thuê', 'Muốn đối soát theo từng giao dịch'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
                <div className="text-brand-600 font-bold text-lg">Theo hợp đồng</div>
                <div className="text-gray-500 text-xs">Tỷ lệ đối soát / chuyến thành công</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Quy trình</div>
                <ol className="space-y-2">
                  {form2Steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div className="mt-8 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="p-4">Tiêu chí</div>
              <div className="p-4 text-center text-brand-700">Cho thuê tháng</div>
              <div className="p-4 text-center text-gray-700">Ủy thác ngày</div>
            </div>
            {[
              ['Thu nhập', 'Ước tính sau thẩm định', 'Theo tỷ lệ đối soát'],
              ['Dùng xe cá nhân', '✗ Giao xe toàn thời gian', '✓ Linh hoạt theo lịch'],
              ['Tham gia vận hành', 'Không cần', 'Hỗ trợ giao nhận nhẹ'],
              ['Phù hợp xe', 'Xe dư / không dùng', 'Xe cá nhân rảnh lịch'],
              ['Thanh toán', 'Theo kỳ hợp đồng', 'Theo kỳ đối soát giao dịch'],
            ].map(([label, v1, v2]) => (
              <div key={label} className="grid grid-cols-3 border-b border-gray-50 last:border-0 text-sm">
                <div className="p-4 text-gray-500">{label}</div>
                <div className="p-4 text-center text-brand-700 font-medium">{v1}</div>
                <div className="p-4 text-center text-gray-600">{v2}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ĐĂNG KÝ ─────────────────────────────────────────────── */}
      <section id="dang-ky" className="py-20 px-4 bg-gray-50">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Đăng ký hợp tác miễn phí</h2>
            <p className="text-gray-500">Điền thông tin — Car Match sẽ liên hệ tư vấn trong 30 phút.</p>
          </div>

          {submitted ? (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-brand-500 mx-auto mb-4" />
              <h3 className="text-gray-900 font-bold text-xl mb-3">Đã nhận đăng ký!</h3>
              <p className="text-gray-600 mb-6">Zalo Car Match đã được mở. Đội ngũ sẽ liên hệ tư vấn sớm nhất.</p>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
                onClick={() => trackZaloClick('partner_submitted')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 transition-colors">
                Mở Zalo Car Match
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-5">
              {/* Form type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình thức hợp tác</label>
                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, formType: 'monthly' }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.formType === 'monthly' ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    Cho thuê tháng
                  </button>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, formType: 'daily' }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.formType === 'daily' ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    Ủy thác ngày
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required type="tel"
                  placeholder="0912 345 678"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mẫu xe *</label>
                <input name="carModel" value={form.carModel} onChange={handleChange} required
                  placeholder="VD: Toyota Innova 2022 7 chỗ"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tòa nhà / Khu vực</label>
                <select name="building" value={form.building} onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 transition-colors cursor-pointer">
                  <option value="">Chọn khu vực</option>
                  <option value="Vinhomes Ocean Park">Vinhomes Ocean Park</option>
                  <option value="Vinhomes Times City">Vinhomes Times City</option>
                  <option value="Vinhomes Smart City">Vinhomes Smart City</option>
                  <option value="Vinhomes Royal City">Vinhomes Royal City</option>
                  <option value="Ecopark">Ecopark</option>
                  <option value="The Manor Central Park">The Manor Central Park</option>
                  <option value="Linh Đàm">Linh Đàm</option>
                  <option value="Khu vực khác">Khu vực khác</option>
                </select>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-brand-200">
                {loading ? 'Đang xử lý...' : <><Send className="w-4 h-4" />Gửi đăng ký hợp tác</>}
              </button>
              <p className="text-gray-400 text-xs text-center">
                Hoặc nhắn trực tiếp:{' '}
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('partner_form_footer')} className="text-brand-600 hover:underline">
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
