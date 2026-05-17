import { Shield, Clock, Smile, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import { useSEO } from '@/hooks/useSEO';

const ZALO_LINK = 'https://zalo.me/0975563290';

const stats = [
  { value: '20+', label: 'Mẫu xe đa dạng' },
  { value: '500+', label: 'Chuyến thành công' },
  { value: '2 năm', label: 'Kinh nghiệm' },
  { value: '4.8★', label: 'Đánh giá trung bình' },
];

const commitments = [
  { icon: Shield, title: 'Xe an toàn, bảo hiểm đầy đủ', desc: 'Tất cả xe được kiểm tra định kỳ. Bảo hiểm thân xe và tai nạn đầy đủ.' },
  { icon: Clock, title: 'Phản hồi trong 30 phút', desc: 'Đội ngũ trực Zalo từ 7h–22h. Xử lý sự cố nhanh trong ngày.' },
  { icon: Smile, title: 'Trải nghiệm không phiền não', desc: 'Quy trình thuê đơn giản 3 bước. Không phí ẩn. Hoàn cọc ngay khi trả xe.' },
  { icon: Wrench, title: 'Hỗ trợ kỹ thuật 24/7', desc: 'Nếu có sự cố trong chuyến, đội kỹ thuật CarMatch sẵn sàng hỗ trợ.' },
];

const processSteps = [
  { step: '01', title: 'Chọn xe & liên hệ Zalo', desc: 'Xem fleet trên website, chọn xe phù hợp và nhắn Zalo để đặt lịch. Xác nhận trong 30 phút.' },
  { step: '02', title: 'Ký hợp đồng & đặt cọc', desc: 'Xuất trình CCCD + GPLX. Đặt cọc 30M hoặc xe máy tương đương. Ký hợp đồng đơn giản.' },
  { step: '03', title: 'Nhận xe & lên đường', desc: 'Xe được giao tận nơi hoặc nhận tại địa điểm hẹn. Kiểm tra xe cùng nhân viên, rồi tự do khởi hành.' },
  { step: '04', title: 'Trả xe & hoàn cọc', desc: 'Trả xe đúng giờ hẹn. Kiểm tra xe, thanh lý hợp đồng, hoàn tiền cọc ngay trong ngày.' },
];

const conditions = [
  'Chứng minh nhân dân / CCCD (bản gốc)',
  'Giấy phép lái xe hạng B2 còn hiệu lực',
  'Đặt cọc 30.000.000đ (tiền mặt hoặc chuyển khoản)',
  'Hoặc thế chấp xe máy có giá trị tương đương',
  'Tuổi: 21–65 tuổi',
  'Không yêu cầu hộ khẩu Hà Nội',
];

export default function About() {
  useSEO({
    title: 'Về CarMatch — Dịch Vụ Thuê Xe Tự Lái Hà Nội',
    description: 'CarMatch là dịch vụ thuê xe tự lái tại Hà Nội, chuyên phục vụ cư dân chung cư cao cấp. Xe an toàn, bảo hiểm đầy đủ, giao xe tận sảnh tòa nhà.',
    canonical: 'https://carmatch.vn/ve-chung-toi',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Về <span className="text-brand-600">CarMatch</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            CarMatch ra đời từ niềm tin đơn giản: thuê xe tự lái phải dễ dàng, minh bạch và đáng tin cậy.
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
            <p>CarMatch được thành lập tại Hà Nội với mong muốn mang lại trải nghiệm thuê xe tự lái đơn giản, minh bạch và đáng tin cậy.</p>
            <p>Chúng tôi hoạt động theo mô hình đối tác — kết nối người sở hữu xe chất lượng với khách hàng có nhu cầu, tạo ra giá trị cho cả hai phía trong khi đảm bảo tiêu chuẩn dịch vụ cao nhất.</p>
            <p>Sau 2 năm hoạt động, CarMatch tự hào đã phục vụ hàng trăm khách hàng cá nhân lẫn doanh nghiệp, với đội xe ngày càng đa dạng từ xe điện VinFast đến các dòng xe 7 chỗ cao cấp.</p>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">Cam kết của CarMatch</h2>
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
          <p className="text-gray-600 mb-8">Đặt xe ngay hôm nay qua Zalo — xác nhận trong 30 phút.</p>
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
