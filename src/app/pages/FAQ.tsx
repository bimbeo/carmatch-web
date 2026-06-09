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
        a: 'Chọn xe → Chọn ngày giờ → Điền thông tin → Chuyển khoản cọc 30% qua QR → Nhận mã booking. Car Match sẽ liên hệ xác nhận trong 30 phút.',
      },
      {
        q: 'Tôi có thể hủy và hoàn cọc không?',
        a: 'Hủy trước 48h: hoàn 100%. Hủy từ 24-48h: hoàn 50%. Hủy trong 24h: mất cọc. Liên hệ hotline 0971 593 290 để hủy.',
      },
      {
        q: 'Có thể đặt xe vào buổi tối không?',
        a: 'Có. Car Match giao xe theo ca từ sau 20:00 đến trước 23:00. Đặt xe buổi tối hoàn toàn bình thường.',
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
        a: 'CCCD/Căn cước (bản gốc) + Giấy phép lái xe hạng B2 (bản gốc) + Tài sản thế chấp (tiền mặt hoặc xe máy, thỏa thuận khi ký hợp đồng).',
      },
      {
        q: 'Giới hạn km mỗi ngày là bao nhiêu?',
        a: 'Tùy xe, thường 200-300 km/ngày (hiển thị trên trang xe). Vượt km: 3.000đ/km. Trả xe trễ giờ: 100.000đ/giờ.',
      },
      {
        q: 'Xe có bảo hiểm không?',
        a: 'Có. Tất cả xe đều có bảo hiểm trách nhiệm dân sự và bảo hiểm thân xe (khấu trừ 2 triệu/sự cố nếu có tai nạn do lỗi tài xế).',
      },
      {
        q: 'Tôi có thể đi ra ngoài tỉnh không?',
        a: 'Cần thông báo trước với Car Match. Một số tuyến phổ biến (Hà Nội - Ninh Bình, Hà Nội - Hạ Long) được chấp thuận. Phí bổ sung theo thỏa thuận.',
      },
      {
        q: 'Xe bị hỏng giữa đường thì làm sao?',
        a: 'Gọi ngay hotline 0971 593 290. Car Match hỗ trợ 24/7 xử lý sự cố, bao gồm cứu hộ và xe thay thế nếu cần.',
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
