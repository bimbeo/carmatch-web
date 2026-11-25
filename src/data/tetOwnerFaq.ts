import { dateSpan, tetOwnerCampaign } from './tetOwnerCampaign.ts';

export const tetOwnerFaq = [
  {
    question: 'Tôi muốn giữ mùng 1–3 cho gia đình thì có hợp tác được không?',
    answer: 'Có thể gửi lịch. Giữ xe giữa Tết làm ngắt quãng một kỳ thuê xuyên suốt. Car Match sẽ xem xét từng chặng trước và sau Tết theo điều kiện giao nhận và nhu cầu thực tế.',
  },
  {
    question: 'Xe rảnh từ mùng 3 đến mùng 10 có phù hợp không?',
    answer: `Bạn có thể đề xuất chặng du xuân liên tục từ ${dateSpan(tetOwnerCampaign.presets.duxuan.free[0])}/${tetOwnerCampaign.year}. Car Match sẽ kiểm tra nhu cầu, điều kiện nhận xe và thời điểm bạn cần lấy lại xe.`,
  },
  {
    question: 'Tôi có biết trước khoản tiền chủ xe nhận không?',
    answer: 'Công cụ tính thử doanh thu và phần chủ xe theo tỷ lệ giả định. Sau thẩm định, Car Match trao đổi giá, cách chia sẻ, các khoản chi và lịch thanh toán theo xe thực tế.',
  },
  {
    question: 'Nếu khách trả xe muộn thì xử lý thế nào?',
    answer: 'Giờ trả xe, trách nhiệm trả muộn, đầu mối liên hệ và cách đồng kiểm được thỏa thuận trước khi giao xe. Car Match phối hợp xử lý theo hợp đồng đã thống nhất.',
  },
  {
    question: 'Phạt nguội cao tốc phát hiện sau khi trả xe thì sao?',
    answer: 'Car Match và chủ xe đối chiếu biên bản, thời gian thuê và chứng từ ETC. Việc giữ hoặc hoàn cọc, nếu áp dụng, thực hiện theo điều kiện đã thống nhất trước chuyến.',
  },
  {
    question: 'Xe cần kiểm tra những gì trước và sau khi giao?',
    answer: 'Các mục chính gồm giấy tờ, ngoại thất, nội thất, km, nhiên liệu hoặc pin, lốp, phụ kiện và chìa khóa. Bạn có thể xem mẫu đồng kiểm 15 điểm để chuẩn bị.',
  },
];
