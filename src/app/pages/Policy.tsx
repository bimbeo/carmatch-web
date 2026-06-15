import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSEO } from '@/hooks/useSEO';

const sections = [
  {
    title: 'Chính sách hủy',
    items: [
      'Điều kiện hoàn cọc phụ thuộc thời điểm hủy, mẫu xe và lịch đã giữ',
      'Khách cần báo hủy qua hotline/Zalo 0975 563 290 để Car Match xác nhận phương án xử lý',
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
    title: 'Bảo hiểm',
    items: [
      'Điều kiện bảo hiểm và trách nhiệm sử dụng xe được ghi nhận trong hợp đồng/bàn giao',
      'Khách nên xác nhận phạm vi bảo hiểm, mức khấu trừ nếu có và quy trình xử lý sự cố trước khi nhận xe',
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
];

export default function Policy() {
  useSEO({
    title: 'Chính sách thuê xe — Car Match',
    description: 'Chính sách hủy, phụ phí, giấy tờ, bảo hiểm và quy trình giao nhận xe tại Car Match.',
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
        </div>
      </main>
      <Footer />
    </>
  );
}
