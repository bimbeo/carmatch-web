import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSEO } from '@/hooks/useSEO';

const faqGroups = [
  {
    title: 'Đặt xe & thanh toán',
    items: [
      {
        q: 'Quy trình đặt xe online như thế nào?',
        a: 'Chọn xe → Chọn ngày giờ → Điền thông tin → Car Match kiểm tra lịch xe thật → Chuyển khoản đặt cọc theo hướng dẫn → Nhận xác nhận qua Zalo/hotline.',
      },
      {
        q: 'Tôi có thể hủy và hoàn cọc không?',
        a: 'Có thể hủy, nhưng điều kiện hoàn cọc phụ thuộc thời điểm hủy, mẫu xe và lịch đã giữ. Khách nên liên hệ hotline/Zalo 0971 163 290 để Car Match xác nhận điều kiện cụ thể trước khi hủy.',
      },
      {
        q: 'Có thể đặt xe vào buổi tối không?',
        a: 'Khách có thể gửi yêu cầu buổi tối qua website hoặc Zalo. Lịch giao nhận ngoài khung hỗ trợ thông thường cần được đội vận hành xác nhận trước theo xe và khu vực nhận.',
      },
      {
        q: 'Có mã giảm giá không?',
        a: 'Nếu có mã đang áp dụng, khách có thể nhập trong bước đặt xe. Điều kiện và thời hạn của từng mã cần được kiểm tra trực tiếp trên website hoặc xác nhận với Car Match trước khi thanh toán.',
      },
    ],
  },
  {
    title: 'Nhận xe & sử dụng',
    items: [
      {
        q: 'Cần mang những giấy tờ gì khi nhận xe?',
        a: 'Khách cần CCCD/Căn cước bản gốc, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo mẫu xe. Điều kiện cụ thể được xác nhận trước khi giao xe.',
      },
      {
        q: 'Giới hạn km mỗi ngày là bao nhiêu?',
        a: 'Tùy xe, thường 200-300 km/ngày (hiển thị trên trang xe). Vượt km: 3.000đ/km. Trả xe trễ giờ: 100.000đ/giờ.',
      },
      {
        q: 'Tôi có thể đi ra ngoài tỉnh không?',
        a: 'Cần thông báo trước với Car Match. Một số tuyến phổ biến (Hà Nội - Ninh Bình, Hà Nội - Hạ Long) được chấp thuận. Phí bổ sung theo thỏa thuận.',
      },
      {
        q: 'Xe bị hỏng giữa đường thì làm sao?',
        a: 'Liên hệ ngay hotline/Zalo 0971 163 290, mô tả tình trạng xe và vị trí hiện tại. Car Match sẽ hướng dẫn bước xử lý tiếp theo và phương án hỗ trợ phù hợp với tình huống thực tế.',
      },
    ],
  },
];

const tetGuides = [
  {
    to: '/thue-xe-tu-lai-tet-ha-noi',
    title: 'Thuê xe tự lái Tết 2027',
    description: 'Chọn xe theo ngày, số người, hành lý, tuyến đi và tổng chi phí cần xác nhận.',
  },
  {
    to: '/hop-tac-chu-xe-cho-thue-tet',
    title: 'Hợp tác xe nhàn rỗi dịp Tết',
    description: 'Checklist hồ sơ, lịch rảnh, hợp đồng, bàn giao và đối soát cho chủ xe.',
  },
];

const supportGuides = [
  {
    to: '/blog/thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay',
    title: 'Giới hạn km và phí vượt km',
    description: 'Cách kiểm tra định mức của từng xe, ghi đồng hồ và tính phần vượt.',
  },
  {
    to: '/blog/tra-xe-thue-muon-tinh-phi-the-nao',
    title: 'Phí trả xe muộn',
    description: 'Cách xác định giờ trả, báo sớm và đối chiếu khoản quá giờ.',
  },
  {
    to: '/blog/huy-lich-thue-xe-co-duoc-hoan-coc-khong',
    title: 'Hủy lịch và hoàn cọc',
    description: 'Những điều cần xác nhận trước khi chuyển cọc hoặc thay đổi lịch.',
  },
];

const aeoGuides = [
  { to: '/blog/co-duoc-cho-nguoi-khac-lai-xe-thue-khong', title: 'Cho người khác lái xe thuê?' },
  { to: '/blog/nguoi-nuoc-ngoai-thue-xe-tu-lai-can-giay-to-gi', title: 'Giấy tờ cho người nước ngoài' },
  { to: '/blog/co-duoc-di-xe-thue-ra-ngoai-ha-noi-khong', title: 'Đi xe thuê ra ngoài Hà Nội' },
  { to: '/blog/phi-vetc-xe-thue-thanh-toan-the-nao', title: 'Thanh toán phí VETC' },
  { to: '/blog/xe-thue-bi-thung-lop-xu-ly-the-nao', title: 'Xe thuê bị thủng lốp' },
  { to: '/blog/xe-thue-khong-khoi-dong-can-lam-gi', title: 'Xe không khởi động' },
  { to: '/blog/mat-chia-khoa-xe-thue-xu-ly-the-nao', title: 'Mất chìa khóa xe thuê' },
  { to: '/blog/co-duoc-mang-thu-cung-len-xe-thue-khong', title: 'Mang thú cưng lên xe' },
  { to: '/blog/co-duoc-hut-thuoc-tren-xe-thue-khong', title: 'Hút thuốc trên xe thuê' },
  { to: '/blog/tra-xe-thue-khac-dia-diem-co-duoc-khong', title: 'Trả xe khác địa điểm' },
  { to: '/blog/co-the-nhan-xe-thue-dem-muon-khong', title: 'Nhận xe đêm muộn' },
  { to: '/blog/can-chup-nhung-gi-khi-nhan-xe-tu-lai', title: 'Ảnh cần chụp khi nhận xe' },
  { to: '/blog/bien-ban-ban-giao-xe-thue-can-co-gi', title: 'Biên bản bàn giao xe' },
  { to: '/blog/bao-lau-sau-khi-tra-xe-duoc-hoan-coc', title: 'Thời điểm hoàn cọc' },
  { to: '/blog/bao-hiem-xe-thue-chi-tra-nhung-gi', title: 'Bảo hiểm xe thuê' },
  { to: '/blog/gia-thue-xe-le-tet-tinh-the-nao', title: 'Giá thuê xe lễ Tết' },
];

export default function FAQ() {
  useSEO({
    title: 'Câu hỏi thường gặp — Car Match',
    description: 'Giải đáp câu hỏi thường gặp về đặt xe online, thanh toán, nhận xe, giấy tờ và phụ phí tại Car Match.',
    canonical: 'https://www.carmatch.vn/faq',
  });

  const [openKey, setOpenKey] = useState('0-0');

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-600">FAQ</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Câu hỏi thường gặp</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Thông tin cần biết trước khi đặt xe, nhận xe và sử dụng xe Car Match.
            </p>
          </div>

          <div className="space-y-6">
            {faqGroups.map((group, groupIndex) => (
              <section key={group.title}>
                <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{group.title}</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  {group.items.map((item, itemIndex) => {
                    const key = `${groupIndex}-${itemIndex}`;
                    const isOpen = openKey === key;
                    return (
                      <div key={item.q} className="border-b border-slate-100 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setOpenKey(isOpen ? '' : key)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className="text-sm font-bold text-slate-900">{item.q}</span>
                          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 text-sm leading-6 text-slate-600">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-8" aria-labelledby="tet-guides-title">
            <h2 id="tet-guides-title" className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Chuyên đề Tết 2027
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {tetGuides.map(guide => (
                <Link
                  key={guide.to}
                  to={guide.to}
                  className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                >
                  <h3 className="text-sm font-black text-slate-900">{guide.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{guide.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="support-guides-title">
            <h2 id="support-guides-title" className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Hướng dẫn chi tiết
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {supportGuides.map(guide => (
                <Link
                  key={guide.to}
                  to={guide.to}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                >
                  <h3 className="text-sm font-black text-slate-900">{guide.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{guide.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="aeo-guides-title">
            <h2 id="aeo-guides-title" className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Xử lý tình huống thường gặp
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {aeoGuides.map(guide => (
                <Link
                  key={guide.to}
                  to={guide.to}
                  className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700 hover:shadow-md"
                >
                  {guide.title}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
