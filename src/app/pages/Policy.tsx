import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router';
import { useSEO } from '@/hooks/useSEO';

const sections = [
  {
    title: 'Chính sách hủy',
    items: [
      'Điều kiện hoàn cọc phụ thuộc thời điểm hủy, mẫu xe và lịch đã giữ',
      'Khách cần báo hủy qua hotline/Zalo 0971 163 290 để Car Match xác nhận phương án xử lý',
      'Trường hợp hủy sát giờ nhận xe hoặc không đến nhận xe sẽ áp dụng theo thỏa thuận trong hợp đồng',
      'Sự cố bất khả kháng được hai bên đối soát và thỏa thuận theo tình huống thực tế',
    ],
  },
  {
    title: 'Phụ phí & chi phí phát sinh',
    items: [
      'Vượt km giới hạn: 3.000đ/km',
      'Trả xe trễ giờ: 100.000đ/giờ (tối đa 1 ngày thuê)',
      'Xe bẩn cần vệ sinh: 200.000-500.000đ tùy mức độ',
      'Hết xăng/điện: khách tự chịu chi phí đổ thêm',
    ],
  },
  {
    title: 'Giấy tờ cần thiết',
    items: [
      'Căn cước công dân / CCCD (bản gốc, xác minh tại chỗ, không giữ lại)',
      'Giấy phép lái xe hạng B còn hiệu lực (bản gốc)',
      'Khoản đặt cọc theo mẫu xe, được xác nhận trước khi giao xe',
    ],
  },
  {
    title: 'Trách nhiệm & xử lý sự cố',
    items: [
      'Trách nhiệm sử dụng xe và quy trình bàn giao được ghi nhận trước khi nhận xe',
      'Khi có sự cố, khách cần ưu tiên an toàn và liên hệ ngay Car Match để được hướng dẫn',
      'Thiệt hại phát sinh trong thời gian thuê được đối soát theo biên bản bàn giao và thỏa thuận thuê xe',
    ],
  },
  {
    title: 'Quy định sử dụng xe',
    items: [
      'Không sử dụng xe cho mục đích vận tải thương mại, Grab, Be...',
      'Không mang xe ra khỏi tỉnh thành mà không thông báo trước',
      'Không để người không có tên trong hợp đồng lái xe',
      'Không sử dụng xe khi say rượu/bia',
    ],
  },
  {
    title: 'Quy trình giao nhận xe',
    items: [
      'Nhận xe: ký biên bản bàn giao, chụp ảnh hiện trạng xe',
      'Trả xe: kiểm tra xe cùng nhân viên, thanh lý hợp đồng tại chỗ',
      'Thời gian giao nhận được xác nhận trước theo lịch xe, khu vực nhận và giờ hỗ trợ thực tế',
    ],
  },
  {
    title: 'Bảo mật thông tin & giấy tờ khách thuê',
    items: [
      'Thông tin định danh, CCCD và giấy phép lái xe chỉ được dùng để xác minh hồ sơ, lập hợp đồng và đối chiếu bàn giao xe',
      'Quyền truy cập hồ sơ được giới hạn cho bộ phận vận hành có trách nhiệm xử lý đơn thuê',
      'Car Match không chia sẻ thông tin cho bên thứ ba, trừ trường hợp khách đồng ý hoặc cơ quan có thẩm quyền yêu cầu theo quy định pháp luật',
      'Dữ liệu liên quan chuyến thuê có thể được dùng để đối soát VETC, phạt nguội và xử lý phát sinh sau khi trả xe',
    ],
  },
];

const policyGuides = [
  {
    to: '/blog/thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay',
    label: 'Cách tính giới hạn km và phí vượt km',
  },
  {
    to: '/blog/tra-xe-thue-muon-tinh-phi-the-nao',
    label: 'Cách tính phí khi trả xe muộn',
  },
  {
    to: '/blog/huy-lich-thue-xe-co-duoc-hoan-coc-khong',
    label: 'Điều kiện hủy lịch và hoàn cọc',
  },
];

export default function Policy() {
  useSEO({
    title: 'Chính sách thuê xe — Car Match',
    description: 'Chính sách hủy, phụ phí, giấy tờ và quy trình giao nhận xe tại Car Match.',
    canonical: 'https://www.carmatch.vn/chinh-sach',
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-600">Car Match</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Chính sách thuê xe</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Các điều kiện áp dụng cho đặt cọc, hủy chuyến, phụ phí phát sinh, giấy tờ và quy trình giao nhận xe.
            </p>
          </div>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <section key={section.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-sm font-black text-cyan-700">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-base font-black uppercase tracking-wide text-slate-900">{section.title}</h2>
                </div>
                <ul className="space-y-2.5">
                  {section.items.map(item => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Chính sách có thể được điều chỉnh theo từng mẫu xe, thời điểm thuê và thỏa thuận trên hợp đồng. Khi có khác biệt,
            nội dung trong hợp đồng thuê xe là căn cứ áp dụng cuối cùng.
          </div>

          <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" aria-labelledby="policy-guides-title">
            <h2 id="policy-guides-title" className="text-base font-black uppercase tracking-wide text-slate-900">
              Hướng dẫn áp dụng
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Đọc phần giải thích và ví dụ trước khi xác nhận lịch thuê:
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {policyGuides.map(guide => (
                <li key={guide.to}>
                  <Link
                    to={guide.to}
                    className="block rounded-xl border border-slate-100 px-4 py-3 text-sm font-bold leading-5 text-cyan-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                  >
                    {guide.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
