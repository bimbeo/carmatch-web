import { ArrowRight, CalendarDays, Car, CheckCircle2, Luggage, MapPinned, ReceiptText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0971163290';
const customerArticles = [
  ['Nên đặt xe Tết trước bao lâu?', '/blog/thue-xe-tu-lai-tet-2027-nen-dat-truoc-bao-lau'],
  ['Gói thuê Tết 7 ngày hay 10 ngày?', '/blog/goi-thue-xe-tet-7-ngay-hay-10-ngay'],
  ['Về quê ăn Tết nên chọn xe nào?', '/blog/thue-xe-ve-que-an-tet-nen-chon-xe-nao'],
  ['Gia đình 5–7 người nên chọn xe nào?', '/blog/thue-xe-tet-cho-gia-dinh-5-7-nguoi'],
  ['Nhiều hành lý nên chọn xe nào?', '/blog/thue-xe-tet-co-nhieu-hanh-ly-chon-xe-nao'],
  ['Thuê xe điện đi Tết có phù hợp?', '/blog/thue-xe-dien-di-tet-co-phu-hop-khong'],
  ['Nhận trả xe dịp Tết cần lưu ý gì?', '/blog/nhan-tra-xe-tu-lai-dip-tet-can-luu-y-gi'],
  ['Đi tỉnh cần báo trước thông tin gì?', '/blog/thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi'],
];

export default function TetRental() {
  useSEO({
    title: 'Thuê Xe Tự Lái Tết 2027 Tại Hà Nội | Car Match',
    description: 'Lập kế hoạch thuê xe tự lái Tết 2027 tại Hà Nội: chọn xe theo người và hành lý, gửi ngày thuê, tuyến đi, điểm nhận để Car Match kiểm tra.',
    canonical: 'https://www.carmatch.vn/thue-xe-tu-lai-tet-ha-noi',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <main>
        <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-red-50 via-white to-amber-50">
          <div className="max-w-5xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700 mb-6"><CalendarDays className="w-4 h-4" /> Thuê xe Tết 2027 tại Hà Nội</span>
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">Chọn xe theo chuyến Tết, không chỉ theo số ghế</h1>
            <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed mb-8">Câu trả lời ngắn: hãy gửi ngày nhận–trả, số người, số vali, tuyến đi và khu vực nhận xe. Car Match kiểm tra xe phù hợp và báo điều kiện cho đúng thời điểm; website không cam kết xe trống hoặc một mức giá chung trước khi lịch được xác nhận.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a href="/xe" onClick={() => trackCtaClick('tet_rental_view_fleet')} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-4 font-bold text-white hover:bg-brand-700">Xem các mẫu xe <ArrowRight className="w-4 h-4" /></a>
              <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('tet_rental_hero')} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-4 font-semibold hover:bg-gray-50">Gửi lịch qua Zalo</a>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-5">
              {[
                [CalendarDays, 'Ngày nhận – trả', 'Ghi cả giờ dự kiến và mức linh hoạt nếu có.'],
                [Luggage, 'Người và hành lý', 'Đếm vali lớn, xe đẩy, ghế trẻ em thay vì chỉ số người.'],
                [MapPinned, 'Tuyến di chuyển', 'Nêu điểm đến, quãng đường và đoạn đèo/phà nếu có.'],
                [Car, 'Thói quen sử dụng', 'Chọn xăng hay điện theo khả năng dừng nạp/sạc trên tuyến.'],
              ].map(([Icon, title, description]) => (
                <article key={String(title)} className="rounded-2xl border border-gray-100 p-6 shadow-sm"><Icon className="w-9 h-9 text-brand-600 mb-4" /><h2 className="font-bold mb-2">{String(title)}</h2><p className="text-sm text-gray-600 leading-relaxed">{String(description)}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600 mb-3">Chọn xe</p>
              <h2 className="text-3xl font-bold mb-6">Bảng quyết định nhanh</h2>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                {[
                  ['2–4 người, hành lý gọn', 'Xe 5 chỗ; ưu tiên dễ lái và đủ cốp cho hành trình thực tế.'],
                  ['4–5 người, nhiều vali', 'So sánh cốp và hàng ghế; không mặc định xe 5 chỗ nào cũng đủ.'],
                  ['5–7 người', 'Xe 7 chỗ; kiểm tra không gian khi dùng đủ ghế và số vali lớn.'],
                  ['Đi đường dài hoặc đèo', 'Ưu tiên xe người lái quen, lốp/phanh tốt và kế hoạch dừng nghỉ.'],
                  ['Chọn xe điện', 'Kiểm tra quãng đường, điểm sạc và phương án dự phòng trước khi chốt.'],
                ].map(([need, guidance]) => <div key={need} className="grid sm:grid-cols-[.8fr_1.2fr] gap-2 border-b last:border-0 border-gray-100 p-5"><strong className="text-sm">{need}</strong><span className="text-sm text-gray-600 leading-relaxed">{guidance}</span></div>)}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600 mb-3">Tổng chi phí</p>
              <h2 className="text-3xl font-bold mb-6">Các khoản phải hỏi trước</h2>
              <ul className="space-y-4">
                {['Giá thuê cho đúng khoảng ngày và cách tính ngày/giờ', 'Tiền đặt cọc, thời điểm hoàn và hồ sơ cần đối chiếu', 'Giới hạn km, phí vượt km và phạm vi được phép di chuyển', 'Nhiên liệu hoặc sạc, VETC, gửi xe và chi phí phát sinh trên tuyến', 'Điều kiện đổi lịch, hủy, trả muộn và thay đổi điểm giao nhận'].map((item) => <li key={item} className="flex gap-3 rounded-xl bg-white p-4 border border-gray-100"><CheckCircle2 className="w-5 h-5 shrink-0 text-brand-600" /><span className="text-sm leading-relaxed">{item}</span></li>)}
              </ul>
              <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"><ReceiptText className="w-6 h-6 shrink-0 text-amber-700" /><p className="text-sm leading-relaxed text-amber-950">Giá và điều kiện dịp cao điểm có thể khác ngày thường. Chỉ dùng báo giá và xác nhận cho đúng xe, đúng khoảng ngày làm căn cứ đặt xe.</p></div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Checklist nhận và trả xe</h2>
              <ol className="space-y-4">
                {['Đối chiếu người lái, giấy tờ và điều kiện booking.', 'Chụp toàn bộ thân xe, kính, mâm/lốp, nội thất và đồng hồ km.', 'Ghi nhiên liệu hoặc pin, VETC, phụ kiện và cảnh báo trên xe.', 'Lái thử ngắn, hỏi ngay nếu có âm thanh hoặc đèn báo bất thường.', 'Khi trả, chụp lại cùng các góc và giữ xác nhận đã bàn giao.'].map((step, index) => <li key={step} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold">{index + 1}</span><p className="text-sm text-gray-700 leading-relaxed pt-1">{step}</p></li>)}
              </ol>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Hướng dẫn thuê xe Tết</h2>
              <div className="grid gap-3 sm:grid-cols-2">{customerArticles.map(([title, href]) => <a key={href} href={href} className="rounded-xl border border-gray-100 p-4 font-semibold text-brand-700 hover:border-brand-200 hover:bg-brand-50">{title} →</a>)}</div>
              <a href="/lap-ke-hoach-chuyen-di" onClick={() => trackCtaClick('tet_rental_trip_planner')} className="mt-6 inline-flex items-center gap-2 font-bold text-brand-700">Lập kế hoạch theo điểm đến <ArrowRight className="w-4 h-4" /></a>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-brand-600 text-white">
          <div className="max-w-4xl mx-auto text-center"><h2 className="text-3xl font-bold mb-4">Gửi đủ lịch trình để kiểm tra xe nhanh hơn</h2><p className="text-brand-100 mb-8">Ngày nhận–trả, số người, hành lý, tuyến đi và khu vực nhận xe là 5 thông tin quan trọng nhất.</p><a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('tet_rental_bottom')} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-brand-700">Nhắn Zalo Car Match <ArrowRight className="w-4 h-4" /></a></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
