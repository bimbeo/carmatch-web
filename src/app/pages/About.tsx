import { Shield, Clock, Smile, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import { useSEO } from '@/hooks/useSEO';

const ZALO_LINK = 'https://zalo.me/0975563290';

const stats = [
  { value: '20+', label: 'Mẫu xe đa dạng' },
  { value: '7h-22h', label: 'Hỗ trợ mỗi ngày' },
  { value: 'CCCD + GPLX', label: 'Giấy tờ chính' },
  { value: 'Zalo', label: 'Kiểm tra lịch xe' },
];

const commitments = [
  { icon: Shield, title: 'Kiểm tra xe khi bàn giao', desc: 'Hai bên ghi nhận tình trạng xe, nhiên liệu/pin, km và phụ kiện trước khi khởi hành.' },
  { icon: Clock, title: 'Phản hồi trong giờ hỗ trợ', desc: 'Đội ngũ trực Zalo từ 7h–22h và kiểm tra lịch xe thật trước khi báo phương án.' },
  { icon: Smile, title: 'Điều kiện thuê rõ ràng', desc: 'Giá thuê, cọc, phí giao nhận và điều kiện hoàn/hủy được xác nhận trước khi chốt.' },
  { icon: Wrench, title: 'Hỗ trợ khi phát sinh', desc: 'Khi có sự cố trong chuyến, khách liên hệ Car Match để được hướng dẫn bước xử lý tiếp theo.' },
];

const processSteps = [
  { step: '01', title: 'Chọn xe & liên hệ Zalo', desc: 'Xem fleet trên website, chọn xe phù hợp và nhắn Zalo để Car Match kiểm tra lịch xe.' },
  { step: '02', title: 'Xác nhận giấy tờ & đặt cọc', desc: 'Xuất trình CCCD + GPLX hạng B. Khoản cọc và điều kiện thuê được báo theo mẫu xe trước khi giao.' },
  { step: '03', title: 'Nhận xe & lên đường', desc: 'Xe được giao tận nơi hoặc nhận tại địa điểm hẹn. Kiểm tra xe cùng nhân viên, rồi tự do khởi hành.' },
  { step: '04', title: 'Trả xe & đối soát', desc: 'Trả xe đúng giờ hẹn. Hai bên kiểm tra lại xe, đối soát chi phí phát sinh và xử lý cọc theo hợp đồng.' },
];

const conditions = [
  'Chứng minh nhân dân / CCCD (bản gốc)',
  'Giấy phép lái xe hạng B còn hiệu lực',
  'Khoản đặt cọc theo mẫu xe, được xác nhận trước khi giao xe',
  'Thông tin nơi ở hoặc điểm giao nhận tại Hà Nội',
  'Tuổi: 21–65 tuổi',
  'Không yêu cầu hộ khẩu Hà Nội',
];

export default function About() {
  useSEO({
    title: 'Về Car Match — Dịch Vụ Thuê Xe Tự Lái Hà Nội',
    description: 'Car Match là dịch vụ thuê xe tự lái tại Hà Nội, giao xe tận sảnh tòa nhà, kiểm tra lịch xe qua Zalo và xác nhận điều kiện thuê trước khi chốt.',
    canonical: 'https://www.carmatch.vn/gioi-thieu',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Về <span className="text-brand-600">Car Match</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Car Match ra đời từ niềm tin đơn giản: thuê xe tự lái phải dễ dàng, minh bạch và đáng tin cậy.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-brand-600 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Câu chuyện của chúng tôi</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>Car Match được thành lập tại Hà Nội với mong muốn mang lại trải nghiệm thuê xe tự lái đơn giản, minh bạch và đáng tin cậy.</p>
            <p>Chúng tôi hoạt động theo mô hình đối tác — kết nối người sở hữu xe chất lượng với khách hàng có nhu cầu, tạo ra giá trị cho cả hai phía trong khi đảm bảo tiêu chuẩn dịch vụ cao nhất.</p>
            <p>Car Match tập trung xây dựng đội xe đa dạng từ xe điện VinFast đến các dòng xe 7 chỗ, đồng thời chuẩn hóa quy trình xác nhận lịch, đặt cọc, bàn giao và hỗ trợ khách trong chuyến đi.</p>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">Cam kết của Car Match</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {commitments.map((item) => (
              <div key={item.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="quy-trinh" className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">Quy trình thuê xe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {processSteps.map((step) => (
              <div key={step.step} className="flex gap-5">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm shadow-brand-200">
                    <span className="text-white font-bold text-sm">{step.step}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section id="dieu-kien" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">Điều kiện thuê xe</h2>
          <p className="text-gray-500 text-center mb-10">Yêu cầu đơn giản, minh bạch — không có điều kiện ẩn.</p>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8">
            <ul className="space-y-4">
              {conditions.map((cond) => (
                <li key={cond} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-50 to-brand-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sẵn sàng khởi hành?</h2>
          <p className="text-gray-600 mb-8">Đặt xe qua Zalo để Car Match kiểm tra lịch xe, báo giá và điều kiện thuê trước khi chốt.</p>
          <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-200">
            Đặt xe qua Zalo
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
