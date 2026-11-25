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
    answer: 'Báo cho đầu mối Car Match đã thống nhất để cập nhật giờ nhận lại xe. Trách nhiệm và chi phí phát sinh do trả muộn được xử lý theo hợp đồng của chuyến thuê.',
  },
  {
    question: 'Phạt nguội phát hiện sau khi trả xe được xử lý thế nào?',
    answer: 'Car Match và chủ xe đối chiếu biên bản, thời gian thuê và chứng từ ETC. Việc giữ hoặc hoàn cọc, nếu áp dụng, thực hiện theo điều kiện đã thống nhất trước chuyến.',
  },
  {
    question: 'Xe cần kiểm tra những gì trước và sau khi giao?',
    answer: 'Hai bên đối chiếu giấy tờ, ngoại thất, nội thất, vệ sinh, km, nhiên liệu hoặc pin, lốp, phụ kiện và chìa khóa. Ghi nhận hiện trạng hoặc nhu cầu vệ sinh khi trả xe để xử lý theo biên bản và thỏa thuận.',
  },
];

export const tetOwnerMoreFaq = [
  {
    question: 'Chưa biết lịch Tết có đăng ký được không?',
    answer: 'Có. Chọn “Chưa có lịch, cần tư vấn” và gửi họ tên, SĐT hoặc Zalo cùng mẫu xe. Bạn có thể bổ sung lịch sau khi được tư vấn.',
  },
  {
    question: 'Xe đang trả góp có thể hợp tác không?',
    answer: 'Bạn có thể gửi thông tin để được xem xét. Khi thẩm định, hai bên cần kiểm tra giấy tờ, quyền cho thuê và các hạn chế trong hợp đồng vay hoặc thế chấp nếu có.',
  },
  {
    question: 'Xe điện tính chi phí sạc thế nào?',
    answer: 'Khi bàn giao, hai bên ghi nhận mức pin và phụ kiện sạc. Bên chịu chi phí sạc, cách đối chiếu và mức pin lúc trả xe được thống nhất riêng theo xe và chuyến thuê.',
  },
  {
    question: 'Có thể thay đổi lịch xe không?',
    answer: 'Có thể đề xuất thay đổi trước khi xác nhận chuyến. Nếu chuyến đã chốt, hãy liên hệ đầu mối Car Match để xem phương án theo hợp đồng và thời gian báo trước đã thỏa thuận.',
  },
  {
    question: 'Có nhiều xe với lịch khác nhau thì đăng ký thế nào?',
    answer: 'Chọn số lượng xe, chọn “Mỗi xe có lịch riêng” rồi ghi mẫu xe và khoảng rảnh của từng xe. Car Match sẽ xem xét lịch cho từng xe.',
  },
  {
    question: 'Khi nào chủ xe nhận được tiền hợp tác?',
    answer: 'Thời điểm thanh toán theo kỳ đối soát và điều khoản hai bên thống nhất trong hợp đồng. Hãy hỏi Car Match về kỳ hạn, chứng từ và cách xử lý các khoản phát sinh trước khi ký.',
  },
];
