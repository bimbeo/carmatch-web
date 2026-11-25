import { dateSpan, tetOwnerCampaign } from './tetOwnerCampaign.ts';

export const tetOwnerFaq = [
  {
    question: 'Chưa biết lịch Tết có đăng ký được không?',
    answer: 'Có. Chọn “Chưa có lịch, cần tư vấn” rồi gửi họ tên, số điện thoại hoặc Zalo và mẫu xe. Bạn có thể trao đổi về thu nhập và điều kiện hợp tác trước khi bổ sung lịch.',
  },
  {
    question: 'Tôi có biết trước khoản tiền chủ xe nhận không?',
    answer: 'Công cụ tính thử doanh thu và phần chủ xe theo tỷ lệ giả định. Sau thẩm định, Car Match trao đổi giá, cách chia sẻ, các khoản chi và lịch thanh toán theo xe thực tế.',
  },
  {
    question: 'Tôi muốn giữ mùng 1–3 cho gia đình thì có hợp tác được không?',
    answer: 'Có. Nếu giữ trọn mùng 1–3 (06–08/02), chặng sau Tết bắt đầu từ mùng 4 (09/02). Nếu chỉ cần xe một phần ngày mùng 3, ghi giờ có thể bàn giao để Car Match xem xét cùng bạn trước khi chốt lịch.',
  },
  {
    question: 'Nếu khách trả xe muộn thì xử lý thế nào?',
    answer: 'Báo cho đầu mối đã thống nhất để cập nhật giờ nhận lại xe. Cách xử lý, trách nhiệm và chi phí do trả muộn thực hiện theo hợp đồng của chuyến thuê.',
  },
  {
    question: 'Nếu xe gặp tai nạn hoặc hư hỏng trong chuyến thuê thì sao?',
    answer: 'Liên hệ đầu mối đã ghi trong thỏa thuận và lưu lại hiện trạng khi an toàn. Hai bên đối chiếu biên bản, hồ sơ sự cố và điều kiện bảo hiểm áp dụng cho xe để xác định cách xử lý và trách nhiệm.',
  },
  {
    question: 'Khi nào chủ xe nhận được tiền hợp tác?',
    answer: 'Thời điểm thanh toán theo kỳ đối soát đã ghi trong hợp đồng. Trước khi giao xe, hãy thống nhất kỳ hạn, chứng từ và cách xử lý các khoản phát sinh.',
  },
];

export const tetOwnerMoreFaq = [
  {
    question: 'Xe rảnh từ mùng 3 đến mùng 10 có phù hợp không?',
    answer: `Có thể đề xuất chặng du xuân ${dateSpan(tetOwnerCampaign.presets.duxuan.free[0])}/${tetOwnerCampaign.year} nếu xe có thể bàn giao từ mùng 3. Nếu bạn giữ trọn mùng 3, hãy chọn chặng từ mùng 4 hoặc ghi rõ giờ bàn giao để trao đổi nếu chỉ dùng xe một phần ngày.`,
  },
  {
    question: 'Phạt nguội phát hiện sau khi trả xe được xử lý thế nào?',
    answer: 'Car Match và chủ xe đối chiếu biên bản, thời gian thuê và chứng từ ETC. Việc giữ hoặc hoàn cọc, nếu áp dụng, thực hiện theo điều kiện đã thống nhất trước chuyến.',
  },
  {
    question: 'Xe cần kiểm tra những gì trước và sau khi giao?',
    answer: 'Hai bên đối chiếu giấy tờ, ngoại thất, nội thất, vệ sinh, km, nhiên liệu hoặc pin, lốp, phụ kiện và chìa khóa. Ghi nhận hiện trạng hoặc nhu cầu vệ sinh khi trả xe để xử lý theo biên bản và thỏa thuận.',
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
    answer: 'Chọn số lượng xe, chọn “Mỗi xe có lịch riêng” rồi ghi mẫu xe, khoảng rảnh và giờ giao nhận của từng xe nếu đã biết. Mốc giờ nhập cạnh lịch chỉ áp dụng cho xe tham khảo.',
  },
];
