import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
        a: 'Có thể hủy, nhưng điều kiện hoàn cọc phụ thuộc thời điểm hủy, mẫu xe và lịch đã giữ. Khách nên liên hệ hotline/Zalo 0975 563 290 để Car Match xác nhận điều kiện cụ thể trước khi hủy.',
      },
      {
        q: 'Có thể đặt xe vào buổi tối không?',
        a: 'Khách có thể gửi yêu cầu buổi tối qua website hoặc Zalo. Lịch giao nhận ngoài khung hỗ trợ thông thường cần được đội vận hành xác nhận trước theo xe và khu vực nhận.',
      },
      {
        q: 'Có mã giảm giá không?',
        a: 'Có. Nhập mã khuyến mãi trong bước đặt xe để áp dụng giảm giá. Theo dõi fanpage Car Match để nhận mã mới nhất.',
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
        q: 'Xe có bảo hiểm không?',
        a: 'Xe có điều kiện bảo hiểm và trách nhiệm sử dụng được ghi nhận trong hợp đồng/bàn giao. Trước khi nhận xe, khách nên xác nhận rõ phạm vi bảo hiểm, mức khấu trừ nếu có và trách nhiệm khi phát sinh sự cố.',
      },
      {
        q: 'Tôi có thể đi ra ngoài tỉnh không?',
        a: 'Cần thông báo trước với Car Match. Một số tuyến phổ biến (Hà Nội - Ninh Bình, Hà Nội - Hạ Long) được chấp thuận. Phí bổ sung theo thỏa thuận.',
      },
      {
        q: 'Xe bị hỏng giữa đường thì làm sao?',
        a: 'Liên hệ ngay hotline/Zalo 0975 563 290, mô tả tình trạng xe và vị trí hiện tại. Car Match sẽ hướng dẫn bước xử lý tiếp theo và phương án hỗ trợ phù hợp với tình huống thực tế.',
      },
    ],
  },
];

export default function FAQ() {
  useSEO({
    title: 'Câu hỏi thường gặp — Car Match',
    description: 'Giải đáp câu hỏi thường gặp về đặt xe online, thanh toán, nhận xe, giấy tờ, bảo hiểm và phụ phí tại Car Match.',
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
        </div>
      </main>
      <Footer />
    </>
  );
}
