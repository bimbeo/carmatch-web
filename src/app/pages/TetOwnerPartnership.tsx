import { ArrowRight, CalendarCheck, Car, CheckCircle2, ClipboardCheck, FileText, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0971163290';

const ownerArticles = [
  ['Xe nhàn rỗi dịp Tết có nên cho thuê?', '/blog/xe-nhan-roi-dip-tet-co-nen-cho-thue-khong'],
  ['Hợp tác chủ xe cho thuê Tết cần gì?', '/blog/hop-tac-chu-xe-cho-thue-tet-can-gi'],
  ['Cho thuê xe cá nhân ngày Tết có an toàn?', '/blog/cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong'],
  ['Hợp đồng hợp tác cần điều khoản gì?', '/blog/hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi'],
  ['Doanh thu xe nhàn rỗi dịp Tết tính thế nào?', '/blog/doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao'],
  ['Ủy thác theo ngày hay cho thuê theo tháng?', '/blog/uy-thac-xe-theo-ngay-hay-cho-thue-theo-thang'],
  ['Xe nào phù hợp khai thác dịp Tết?', '/blog/xe-nao-phu-hop-khai-thac-dip-tet'],
  ['Chuẩn bị xe trước khi cho thuê Tết', '/blog/chuan-bi-xe-truoc-khi-cho-thue-tet'],
  ['Phạt nguội, VETC và hư hỏng xử lý thế nào?', '/blog/phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao'],
  ['Chủ xe cần chuẩn bị gì khi bàn giao?', '/blog/chu-xe-can-chuan-bi-gi-khi-ban-giao-xe-tet'],
];

const faqs = [
  ['Xe nào có thể gửi hợp tác dịp Tết?', 'Car Match cần kiểm tra đời xe, tình trạng, hồ sơ, khu vực đỗ và khoảng thời gian xe thực sự rảnh. Không phải mọi xe gửi thông tin đều tự động được nhận khai thác.'],
  ['Có thể giữ lại một số ngày để gia đình sử dụng không?', 'Có thể đề xuất lịch rảnh cụ thể. Phương án theo ngày phù hợp hơn khi chủ xe vẫn cần sử dụng; lịch chỉ được chốt sau khi hai bên xác nhận bằng văn bản.'],
  ['Thu nhập dịp Tết được tính thế nào?', 'Doanh thu phụ thuộc mẫu xe, số ngày được xác nhận, giá áp dụng cho từng booking và các chi phí đã thỏa thuận. Car Match chỉ đưa ước tính sau khi thẩm định, không cam kết một mức thu nhập chung.'],
  ['Nếu có VETC, phạt nguội hoặc hư hỏng thì xử lý ra sao?', 'Cách ghi nhận và phân bổ trách nhiệm phải nằm trong hợp đồng, biên bản giao nhận và bằng chứng của từng chuyến. Chủ xe nên đọc kỹ quy trình đối soát trước khi bàn giao.'],
];

export default function TetOwnerPartnership() {
  useSEO({
    title: 'Hợp Tác Chủ Xe Cho Thuê Dịp Tết 2027 | Car Match',
    description: 'Chủ xe tại Hà Nội có xe nhàn rỗi dịp Tết 2027 có thể gửi lịch rảnh, thông tin xe và khu vực đỗ để Car Match thẩm định phương án hợp tác.',
    canonical: 'https://www.carmatch.vn/hop-tac-chu-xe-cho-thue-tet',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />

      <main>
        <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-amber-50 via-white to-brand-50">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.2fr_.8fr] gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800 mb-6">
                <CalendarCheck className="w-4 h-4" /> Tuyến hợp tác Tết 2027
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">Có xe nhàn rỗi dịp Tết? Gửi lịch để Car Match thẩm định</h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Chủ xe tại Hà Nội có thể gửi mẫu xe, tình trạng, khu vực đỗ và những ngày xe rảnh. Car Match kiểm tra hồ sơ, nhu cầu phù hợp và điều kiện vận hành trước khi đề xuất phương án; việc gửi thông tin không đồng nghĩa xe chắc chắn được nhận hoặc có mức doanh thu cố định.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/hop-tac#dang-ky" onClick={() => trackCtaClick('tet_owner_apply')} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-4 font-bold text-white hover:bg-brand-700">
                  Gửi thông tin xe <ArrowRight className="w-4 h-4" />
                </a>
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackZaloClick('tet_owner_hero')} className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-7 py-4 font-semibold text-gray-800 hover:bg-gray-50">
                  Hỏi trước qua Zalo
                </a>
              </div>
            </div>
            <aside className="rounded-3xl bg-brand-600 p-8 text-white shadow-xl shadow-brand-100">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-200 mb-4">Thông tin nên gửi một lần</p>
              <ul className="space-y-4">
                {['Mẫu xe, năm sản xuất và tình trạng hiện tại', 'Khoảng ngày xe rảnh và ngày phải lấy lại', 'Khu vực đỗ, cách giao nhận và đầu mối liên hệ', 'Hồ sơ xe, đăng kiểm và điều kiện đang áp dụng', 'Mong muốn hợp tác theo ngày hoặc theo thời hạn'].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed"><CheckCircle2 className="w-5 h-5 shrink-0 text-brand-200" />{item}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mb-12">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600 mb-3">Quyết định trước khi hợp tác</p>
              <h2 className="text-3xl font-bold mb-4">Phù hợp khi lịch xe rõ, hồ sơ đủ và trách nhiệm được ghi bằng văn bản</h2>
              <p className="text-gray-600 leading-relaxed">Dịp Tết có nhu cầu di chuyển cao nhưng cũng đòi hỏi quy trình giao nhận, hỗ trợ và đối soát chặt chẽ. Chủ xe nên xem hợp tác là một quyết định vận hành, không chỉ là đăng xe rồi chờ khách.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                [Car, 'Xe và lịch rảnh', 'Xác định chính xác ngày có thể bàn giao, ngày cần nhận lại và giới hạn sử dụng muốn đề xuất.'],
                [FileText, 'Hợp đồng và bằng chứng', 'Thống nhất giá, chi phí, VETC, phạt nguội, hư hỏng, chậm trả và cách đối soát bằng văn bản.'],
                [ShieldCheck, 'Kiểm tra trước vận hành', 'Ghi nhận ảnh, video, km, nhiên liệu/pin, phụ kiện và cảnh báo hiện có trước mỗi lần bàn giao.'],
              ].map(([Icon, title, description]) => (
                <article key={String(title)} className="rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <Icon className="w-10 h-10 text-brand-600 mb-5" />
                  <h3 className="font-bold text-xl mb-3">{String(title)}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{String(description)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Quy trình 5 bước</h2>
            <ol className="grid md:grid-cols-5 gap-4">
              {['Gửi thông tin xe', 'Kiểm tra hồ sơ', 'Thẩm định lịch và nhu cầu', 'Thống nhất hợp đồng', 'Bàn giao và đối soát'].map((step, index) => (
                <li key={step} className="rounded-2xl bg-white border border-gray-100 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold mb-4">{index + 1}</span>
                  <p className="font-semibold text-sm leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 flex gap-4">
              <ClipboardCheck className="w-6 h-6 shrink-0 text-amber-700" />
              <p className="text-sm leading-relaxed text-amber-950"><strong>Nguyên tắc quan trọng:</strong> chỉ bàn giao xe khi các điều kiện về người nhận, thời gian, phạm vi sử dụng, chi phí và trách nhiệm đã được xác nhận cho đúng chuyến. Không dùng ước tính trên bài viết thay cho hợp đồng thực tế.</p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Đọc trước khi gửi xe</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ownerArticles.map(([title, href]) => <a key={href} href={href} className="rounded-xl border border-gray-100 p-4 font-semibold text-brand-700 hover:border-brand-200 hover:bg-brand-50">{title} →</a>)}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Câu hỏi thường gặp</h2>
              <div className="space-y-5">
                {faqs.map(([question, answer]) => <article key={question}><h3 className="font-bold mb-2">{question}</h3><p className="text-sm text-gray-600 leading-relaxed">{answer}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-brand-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Gửi lịch xe để được thẩm định</h2>
            <p className="text-brand-100 mb-8">Chuẩn bị mẫu xe, năm sản xuất, khu vực đỗ và những ngày rảnh. Car Match sẽ phản hồi sau khi tiếp nhận và kiểm tra thông tin.</p>
            <a href="/hop-tac#dang-ky" onClick={() => trackCtaClick('tet_owner_bottom_apply')} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-brand-700">Mở form hợp tác <ArrowRight className="w-4 h-4" /></a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
