export interface TripDestination {
  slug: string;
  name: string;
  region?: string;
  summary?: string;
  tags?: string[];
  distanceKm: number;
  duration: string;
  ideal: string;
  route: string;
  stops: string[];
  drivingNote?: string;
  parkingNote?: string;
  recommendedVehicle?: string;
  nearbyPlaces?: Array<{
    name: string;
    type: string;
    note: string;
    price?: string;
  }>;
  schedule: Array<{
    title: string;
    items: string[];
  }>;
  notes: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  tollEstimate: number;
  fuelCostPerKm?: number;
}

export const tripDestinations: TripDestination[] = [
  {
    slug: 'ha-long',
    name: 'Hạ Long',
    region: 'Quảng Ninh',
    summary: 'Tuyến nghỉ biển cuối tuần phổ biến nhất từ Hà Nội, hợp với gia đình cần xe rộng, cốp lớn và lịch trình 2 ngày 1 đêm.',
    tags: ['2 ngày 1 đêm', 'Gia đình', 'Xe 7 chỗ', 'Cao tốc'],
    distanceKm: 160,
    duration: '2 ngày 1 đêm',
    ideal: 'Gia đình 4-6 người, nhóm bạn cuối tuần',
    route: 'Hà Nội → cao tốc Hải Phòng - Hạ Long → Bãi Cháy/Tuần Châu',
    stops: ['Trạm dừng Hải Dương', 'Bãi Cháy', 'Tuần Châu'],
    drivingNote: 'Đường cao tốc dễ đi, nên kiểm tra tài khoản VETC và giữ tốc độ ổn định vì tuyến dài.',
    parkingNote: 'Khu Bãi Cháy, Tuần Châu có nhiều bãi gửi xe theo giờ/ngày; cuối tuần nên hỏi trước khách sạn.',
    recommendedVehicle: 'Xe 7 chỗ hoặc SUV/crossover nếu đi 5-6 người, có trẻ em hoặc nhiều hành lý.',
    nearbyPlaces: [
      { name: 'Bãi Cháy', type: 'Vui chơi', note: 'Phù hợp gia đình, dễ kết hợp ăn tối và đi dạo biển.' },
      { name: 'Tuần Châu', type: 'Check-in', note: 'Hợp lịch trình có trẻ em hoặc nhóm muốn đi vịnh.' },
      { name: 'Hòn Gai', type: 'Ăn uống', note: 'Nhiều lựa chọn hải sản, nên đặt bàn trước cuối tuần.', price: '200-400k/người' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe tại Hà Nội buổi sáng', 'Đi cao tốc Hải Phòng - Hạ Long', 'Ăn trưa và check-in khách sạn', 'Chiều đi Bãi Cháy hoặc Tuần Châu'],
      },
      {
        title: 'Ngày 2',
        items: ['Ăn sáng, đi cafe hoặc tham quan nhẹ', 'Trả phòng trước trưa', 'Về Hà Nội theo cao tốc, trả xe buổi tối'],
      },
    ],
    notes: ['Nên ưu tiên xe 5-7 chỗ có cốp rộng nếu đi gia đình.', 'Cao tốc tuyến này nhiều, nên dự phòng phí VETC/cao tốc.'],
    faq: [
      {
        question: 'Đi Hạ Long nên thuê xe 5 chỗ hay 7 chỗ?',
        answer: 'Nếu 2-4 người và ít hành lý, xe 5 chỗ đủ dùng. Nếu 5-6 người hoặc có trẻ em, nên chọn xe 7 chỗ để ngồi thoải mái hơn.',
      },
      {
        question: 'Xe điện có phù hợp đi Hạ Long không?',
        answer: 'Có thể phù hợp nếu lịch trình không quá gấp và có kế hoạch sạc rõ ràng. CarMatch sẽ tư vấn theo xe thực tế còn trống.',
      },
    ],
    tollEstimate: 450000,
  },
  {
    slug: 'ninh-binh',
    name: 'Ninh Bình',
    region: 'Ninh Bình',
    summary: 'Tuyến ngắn, dễ đi trong ngày hoặc 2 ngày 1 đêm, phù hợp khách muốn thuê xe tự lái để chủ động giờ thuyền, ăn uống và check-in.',
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Gia đình', 'Dễ lái'],
    distanceKm: 95,
    duration: '1-2 ngày',
    ideal: 'Gia đình nhỏ, cặp đôi, khách thích đi trong ngày',
    route: 'Hà Nội → Phủ Lý → Tràng An/Tam Cốc',
    stops: ['Phủ Lý', 'Tràng An', 'Tam Cốc'],
    drivingNote: 'Tuyến ngắn, nhiều đoạn quốc lộ/cao tốc dễ đi, phù hợp cả khách mới quen tự lái đường tỉnh.',
    parkingNote: 'Các khu du lịch lớn như Tràng An, Tam Cốc, Hang Múa đều có bãi xe riêng.',
    recommendedVehicle: 'Xe 5 chỗ tiết kiệm cho 2-4 người; xe 7 chỗ nếu đi gia đình đông hoặc có nhiều đồ.',
    nearbyPlaces: [
      { name: 'Tràng An', type: 'Thắng cảnh', note: 'Nên đi buổi sáng để đỡ nắng và tránh đông.' },
      { name: 'Hang Múa', type: 'Check-in', note: 'Hợp lịch trình 2 ngày hoặc về muộn trong ngày.' },
      { name: 'Tam Cốc', type: 'Ăn uống', note: 'Nhiều nhà hàng dê núi, cơm cháy.', price: '150-300k/người' },
    ],
    schedule: [
      {
        title: 'Đi trong ngày',
        items: ['Nhận xe sớm tại Hà Nội', 'Đi Tràng An hoặc Tam Cốc', 'Ăn trưa tại Ninh Bình', 'Về Hà Nội cuối ngày'],
      },
      {
        title: '2 ngày 1 đêm',
        items: ['Ngày 1 đi Tràng An/Tam Cốc', 'Ngủ lại Ninh Bình', 'Ngày 2 đi Hang Múa hoặc Bái Đính rồi về Hà Nội'],
      },
    ],
    notes: ['Tuyến ngắn, xe 5 chỗ thường là lựa chọn kinh tế.', 'Nếu đi nhóm 5-7 người, chọn xe 7 chỗ để thoải mái hơn.'],
    faq: [
      {
        question: 'Đi Ninh Bình trong ngày thuê xe có hợp lý không?',
        answer: 'Có. Đây là tuyến phù hợp cho chuyến đi trong ngày từ Hà Nội nếu nhận xe sớm và trả buổi tối.',
      },
      {
        question: 'Chi phí cao tốc đi Ninh Bình khoảng bao nhiêu?',
        answer: 'Tùy tuyến và điểm vào/ra, Trip Finder đang dùng mức ước tính để khách hình dung tổng chi phí trước khi đặt.',
      },
    ],
    tollEstimate: 220000,
  },
  {
    slug: 'tam-dao',
    name: 'Tam Đảo',
    region: 'Vĩnh Phúc',
    summary: 'Chuyến nghỉ ngắn cuối tuần gần Hà Nội, nhiều cafe và homestay, nhưng cần lưu ý đường đèo dốc khi chọn xe và người lái.',
    tags: ['2 ngày 1 đêm', 'Gần Hà Nội', 'Đường đèo', 'Nhóm bạn'],
    distanceKm: 80,
    duration: '2 ngày 1 đêm',
    ideal: 'Nhóm bạn, cặp đôi, chuyến nghỉ ngắn cuối tuần',
    route: 'Hà Nội → Vĩnh Phúc → Tam Đảo',
    stops: ['Vĩnh Yên', 'Quán Gió', 'Nhà thờ đá'],
    drivingNote: 'Đoạn cuối lên thị trấn có cua dốc, nên đi ban ngày và ưu tiên tài xế đã quen đường đèo.',
    parkingNote: 'Khu trung tâm cuối tuần đông, nên chọn homestay/khách sạn có chỗ đỗ riêng.',
    recommendedVehicle: 'Xe gầm cao, xe số tự động dễ kiểm soát; tránh chở quá tải nếu chưa quen đường dốc.',
    nearbyPlaces: [
      { name: 'Nhà thờ đá', type: 'Check-in', note: 'Đi bộ quanh trung tâm thuận tiện sau khi gửi xe.' },
      { name: 'Quán Gió', type: 'Cafe', note: 'Nên đi sớm hoặc ngày thường để dễ có chỗ ngồi.' },
      { name: 'Cầu Mây', type: 'Vui chơi', note: 'Phù hợp nhóm bạn, cần kiểm tra thời tiết trước khi đi.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe tại Hà Nội', 'Đi Vĩnh Phúc rồi lên Tam Đảo', 'Check-in khách sạn/homestay', 'Đi cafe, nhà thờ đá, quảng trường'],
      },
      {
        title: 'Ngày 2',
        items: ['Ăn sáng, đi điểm check-in gần trung tâm', 'Xuống núi trước chiều muộn', 'Trả xe tại Hà Nội'],
      },
    ],
    notes: ['Đường lên Tam Đảo có đèo dốc, nên chọn xe quen lái và kiểm tra phanh/lốp kỹ.', 'Nếu chở nhiều hành lý, xe gầm cao hoặc 7 chỗ sẽ dễ chịu hơn.'],
    faq: [
      {
        question: 'Người mới lái có nên tự lái lên Tam Đảo không?',
        answer: 'Nếu chưa quen đường đèo, nên cân nhắc người lái có kinh nghiệm hoặc trao đổi với CarMatch để chọn xe dễ lái.',
      },
    ],
    tollEstimate: 80000,
  },
  {
    slug: 'moc-chau',
    name: 'Mộc Châu',
    region: 'Sơn La',
    summary: 'Cung đường dài hơn, phù hợp nhóm muốn đi 3 ngày 2 đêm, cần xe khỏe, người lái ổn và lịch trình có thời gian nghỉ.',
    tags: ['3 ngày 2 đêm', 'Đường dài', 'Xe gầm cao', 'Nhóm bạn'],
    distanceKm: 200,
    duration: '3 ngày 2 đêm',
    ideal: 'Gia đình hoặc nhóm bạn muốn đi đường dài',
    route: 'Hà Nội → Hòa Bình → Mai Châu → Mộc Châu',
    stops: ['Hòa Bình', 'Mai Châu', 'Đèo Đá Trắng'],
    drivingNote: 'Cung đường có đèo, xe tải và thời tiết thay đổi nhanh; nên đi sớm và chia chặng nghỉ rõ.',
    parkingNote: 'Nhiều homestay có sân đỗ, nhưng các điểm check-in theo mùa có thể đông xe cuối tuần.',
    recommendedVehicle: 'SUV/crossover hoặc 7 chỗ máy khỏe, cốp rộng, ưu tiên xe đã kiểm tra lốp và phanh trước chuyến đi.',
    nearbyPlaces: [
      { name: 'Đồi chè', type: 'Check-in', note: 'Đẹp nhất khi thời tiết khô, hợp đi sáng sớm.' },
      { name: 'Rừng thông Bản Áng', type: 'Vui chơi', note: 'Dễ đi cùng gia đình, có nhiều dịch vụ quanh khu.' },
      { name: 'Thác Dải Yếm', type: 'Thắng cảnh', note: 'Nên kiểm tra mùa nước trước khi xếp lịch.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe sớm', 'Đi Hòa Bình - Mai Châu', 'Nghỉ ăn trưa trên đường', 'Tới Mộc Châu chiều/tối'],
      },
      {
        title: 'Ngày 2',
        items: ['Đi đồi chè, thác, rừng thông hoặc các điểm theo mùa', 'Dành thời gian nghỉ giữa ngày vì cung đường dài'],
      },
      {
        title: 'Ngày 3',
        items: ['Trả phòng, về Hà Nội', 'Dự phòng thời gian vì đường đèo và thời tiết có thể ảnh hưởng tốc độ'],
      },
    ],
    notes: ['Nên chọn xe gầm cao hoặc xe 7 chỗ nếu đi đông/ngày dài.', 'Cần kiểm tra kỹ lốp, phanh, giấy tờ và điều kiện thuê trước khi đi đường dài.'],
    faq: [
      {
        question: 'Đi Mộc Châu nên thuê xe mấy ngày?',
        answer: 'Tối thiểu nên đi 3 ngày 2 đêm để không quá mệt và có thời gian nghỉ trên cung đường dài.',
      },
    ],
    tollEstimate: 180000,
  },
  {
    slug: 'noi-bai',
    name: 'Sân bay Nội Bài',
    region: 'Hà Nội',
    summary: 'Tuyến ngắn để khách chủ động đón tiễn sân bay, đi công tác trong ngày hoặc kết hợp lấy xe cho chuyến đi tỉnh.',
    tags: ['Trong ngày', 'Sân bay', 'Công tác', 'Gia đình'],
    distanceKm: 30,
    duration: 'Trong ngày',
    ideal: 'Đón tiễn sân bay, công tác ngắn',
    route: 'Nội thành Hà Nội → Võ Nguyên Giáp → Nội Bài',
    stops: ['Cầu Nhật Tân', 'Nhà ga T1/T2'],
    drivingNote: 'Cần dự phòng giờ cao điểm, kiểm tra làn vào nhà ga và thời gian chờ đón khách.',
    parkingNote: 'Nhà ga có bãi gửi xe theo lượt/giờ, nên thống nhất điểm đón trước để tránh vòng lại nhiều lần.',
    recommendedVehicle: 'Xe 5 chỗ cho 1-3 người; xe 7 chỗ nếu có nhiều vali hoặc gia đình đi đông.',
    nearbyPlaces: [
      { name: 'Nhà ga T1/T2', type: 'Di chuyển', note: 'Chọn đúng nhà ga nội địa/quốc tế trước khi xuất phát.' },
      { name: 'Cầu Nhật Tân', type: 'Tuyến đường', note: 'Đường nhanh từ nhiều khu nội thành phía Tây/Bắc.' },
      { name: 'Võ Nguyên Giáp', type: 'Tuyến đường', note: 'Cần để ý tốc độ và biển báo theo từng đoạn.' },
    ],
    schedule: [
      {
        title: 'Gợi ý',
        items: ['Nhận xe trước giờ bay/giờ đón ít nhất 2-3 tiếng', 'Dự phòng thời gian vào nhà ga', 'Trả xe sau khi hoàn tất chuyến đi'],
      },
    ],
    notes: ['Phù hợp chuyến công tác ngắn hoặc gia đình cần chủ động giờ bay.', 'Nếu chỉ đi một chiều, nên hỏi CarMatch để được tư vấn phương án tiết kiệm hơn.'],
    faq: [
      {
        question: 'Chỉ đi sân bay có nên thuê xe tự lái không?',
        answer: 'Nếu bạn cần dùng xe thêm trong ngày hoặc chủ động lịch trình, thuê xe tự lái có thể hợp lý. Nếu chỉ đưa đón một chiều, nên so sánh thêm phương án xe dịch vụ.',
      },
    ],
    tollEstimate: 80000,
  },
  {
    slug: 'ba-vi',
    name: 'Ba Vì',
    region: 'Hà Nội',
    summary: 'Tuyến đi trong ngày hoặc 2 ngày 1 đêm gần Hà Nội, hợp gia đình muốn đổi gió, picnic và nghỉ resort ngắn.',
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Gia đình', 'Gần Hà Nội'],
    distanceKm: 60,
    duration: 'Trong ngày hoặc 2 ngày 1 đêm',
    ideal: 'Gia đình có trẻ em, nhóm bạn muốn picnic gần Hà Nội',
    route: 'Hà Nội → Đại lộ Thăng Long → Sơn Tây → Ba Vì',
    stops: ['Sơn Tây', 'Vườn quốc gia Ba Vì', 'Ao Vua/Tản Đà'],
    drivingNote: 'Tuyến dễ đi, riêng đoạn lên vườn quốc gia có dốc và cua, nên đi ban ngày nếu chưa quen.',
    parkingNote: 'Các khu du lịch/resort thường có bãi xe; cuối tuần nên hỏi trước nếu đi đoàn đông.',
    recommendedVehicle: 'Xe 5 chỗ đủ cho 2-4 người; xe 7 chỗ nếu đi gia đình đông, có xe đẩy hoặc đồ picnic.',
    nearbyPlaces: [
      { name: 'Vườn quốc gia Ba Vì', type: 'Thiên nhiên', note: 'Hợp đi sáng, thời tiết mát, có nhiều điểm dừng chụp ảnh.' },
      { name: 'Làng cổ Đường Lâm', type: 'Văn hóa', note: 'Có thể ghép lịch trình ăn trưa và tham quan nhẹ.' },
      { name: 'Tản Đà Resort', type: 'Nghỉ dưỡng', note: 'Phù hợp gia đình muốn đi 2 ngày 1 đêm.', price: 'Tùy gói lưu trú' },
    ],
    schedule: [
      {
        title: 'Đi trong ngày',
        items: ['Nhận xe buổi sáng', 'Đi Sơn Tây - Ba Vì', 'Picnic hoặc vào khu du lịch', 'Về Hà Nội trước tối'],
      },
      {
        title: '2 ngày 1 đêm',
        items: ['Ngày 1 đi resort/khu nghỉ', 'Ngày 2 ghé Đường Lâm hoặc vườn quốc gia rồi về'],
      },
    ],
    notes: ['Nên chọn xe có khoang hành lý đủ rộng nếu mang đồ picnic.', 'Kiểm tra thời tiết vì mưa làm đường dốc khó đi hơn.'],
    faq: [
      {
        question: 'Ba Vì có phù hợp đi trong ngày không?',
        answer: 'Có. Đây là tuyến gần Hà Nội, phù hợp sáng đi tối về hoặc nghỉ 1 đêm nếu muốn lịch trình nhẹ hơn.',
      },
    ],
    tollEstimate: 60000,
  },
  {
    slug: 'soc-son',
    name: 'Sóc Sơn',
    region: 'Hà Nội',
    summary: 'Điểm nghỉ ngắn gần Hà Nội với nhiều homestay, cafe rừng và villa nhóm, phù hợp tự lái cuối tuần.',
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Gần Hà Nội', 'Nhóm bạn'],
    distanceKm: 40,
    duration: 'Trong ngày hoặc 2 ngày 1 đêm',
    ideal: 'Nhóm bạn, cặp đôi, gia đình muốn nghỉ villa gần Hà Nội',
    route: 'Nội thành Hà Nội → Võ Nguyên Giáp/QL3 → Sóc Sơn',
    stops: ['Phủ Thành Chương', 'Việt Phủ', 'Hồ Đồng Đò'],
    drivingNote: 'Đường ngắn, dễ đi; cần chú ý đường nhỏ vào một số homestay/villa.',
    parkingNote: 'Nên hỏi trước homestay có sân đỗ xe riêng hay phải gửi ngoài.',
    recommendedVehicle: 'Xe 5 chỗ hoặc 7 chỗ tùy số người; xe gầm cao sẽ dễ vào các đường nhỏ hơn.',
    nearbyPlaces: [
      { name: 'Hồ Đồng Đò', type: 'Dã ngoại', note: 'Hợp chèo SUP, cafe và nghỉ cuối tuần.' },
      { name: 'Việt Phủ Thành Chương', type: 'Văn hóa', note: 'Phù hợp gia đình, lịch trình nhẹ.' },
      { name: 'Các villa Sóc Sơn', type: 'Lưu trú', note: 'Cần hỏi chỗ đỗ và đường vào trước khi đặt.' },
    ],
    schedule: [
      {
        title: 'Gợi ý',
        items: ['Nhận xe tại Hà Nội', 'Đi cafe/hồ Đồng Đò', 'Check-in villa hoặc ăn trưa', 'Về trong ngày hoặc ngủ lại 1 đêm'],
      },
    ],
    notes: ['Tuyến tốt để tạo lead nhóm bạn cuối tuần.', 'Nên hỏi nhu cầu chở đồ ăn/uống để chọn cốp xe.'],
    faq: [
      {
        question: 'Sóc Sơn nên thuê xe tự lái hay taxi?',
        answer: 'Nếu đi nhiều điểm, ở villa hoặc cần chở đồ, thuê xe tự lái sẽ chủ động hơn taxi một chiều.',
      },
    ],
    tollEstimate: 50000,
  },
  {
    slug: 'ecopark',
    name: 'Ecopark',
    region: 'Hưng Yên',
    summary: 'Tuyến rất gần Hà Nội, hợp đi trong ngày, cafe, picnic, ăn uống cuối tuần và gia đình có trẻ em.',
    tags: ['Trong ngày', 'Gia đình', 'Dễ lái', 'Xe điện'],
    distanceKm: 18,
    duration: 'Trong ngày',
    ideal: 'Gia đình có trẻ em, cặp đôi, khách muốn đi cafe/picnic ngắn',
    route: 'Hà Nội → cầu Vĩnh Tuy/Thanh Trì → Ecopark',
    stops: ['Công viên Ecopark', 'Phố Trúc', 'Hồ Thiên Nga'],
    drivingNote: 'Tuyến ngắn, dễ đi, phù hợp cả người mới lái.',
    parkingNote: 'Có nhiều bãi đỗ trong khu đô thị, cuối tuần nên đi sớm để dễ tìm chỗ.',
    recommendedVehicle: 'Xe 5 chỗ hoặc xe điện đều phù hợp vì quãng đường ngắn.',
    nearbyPlaces: [
      { name: 'Hồ Thiên Nga', type: 'Dã ngoại', note: 'Phù hợp đi bộ, chụp ảnh, picnic nhẹ.' },
      { name: 'Phố Trúc', type: 'Ăn uống', note: 'Nhiều nhà hàng/cafe, dễ đi với trẻ em.' },
      { name: 'Công viên Ecopark', type: 'Gia đình', note: 'Không cần lịch trình quá dày.' },
    ],
    schedule: [
      {
        title: 'Trong ngày',
        items: ['Nhận xe buổi sáng hoặc đầu chiều', 'Đi cafe/ăn trưa tại Ecopark', 'Picnic hoặc đi dạo công viên', 'Về Hà Nội trong ngày'],
      },
    ],
    notes: ['Tuyến tốt để bán xe theo ngày ngắn hoặc khách thử xe điện.', 'Nên gợi ý khách chọn giờ tránh cao điểm cầu Vĩnh Tuy.'],
    faq: [
      {
        question: 'Đi Ecopark thuê xe tự lái có hợp lý không?',
        answer: 'Hợp lý nếu khách muốn chủ động đưa gia đình, trẻ em hoặc mang nhiều đồ picnic.',
      },
    ],
    tollEstimate: 0,
    fuelCostPerKm: 1200,
  },
  {
    slug: 'dai-lai',
    name: 'Đại Lải',
    region: 'Vĩnh Phúc',
    summary: 'Tuyến nghỉ dưỡng ngắn, phù hợp gia đình hoặc nhóm bạn muốn đi resort, villa và vui chơi cuối tuần.',
    tags: ['2 ngày 1 đêm', 'Gia đình', 'Gần Hà Nội', 'Xe điện'],
    distanceKm: 55,
    duration: '2 ngày 1 đêm',
    ideal: 'Gia đình, nhóm bạn đi resort/villa cuối tuần',
    route: 'Hà Nội → Võ Nguyên Giáp → Phúc Yên → Đại Lải',
    stops: ['Phúc Yên', 'Hồ Đại Lải', 'Flamingo Đại Lải'],
    drivingNote: 'Đường khá dễ đi, một số đoạn gần khu nghỉ có đường nhỏ và đông xe cuối tuần.',
    parkingNote: 'Resort/villa thường có chỗ đỗ, nhưng cần khai báo biển số trước nếu vào khu quản lý riêng.',
    recommendedVehicle: 'Xe 5 chỗ cho cặp đôi/gia đình nhỏ; xe 7 chỗ cho nhóm ở villa.',
    nearbyPlaces: [
      { name: 'Hồ Đại Lải', type: 'Nghỉ dưỡng', note: 'Điểm chính cho lịch trình thư giãn cuối tuần.' },
      { name: 'Flamingo Đại Lải', type: 'Resort', note: 'Cần kiểm tra điều kiện vào cổng/chỗ đỗ trước.' },
      { name: 'Cafe ven hồ', type: 'Ăn uống', note: 'Phù hợp dừng nhẹ trước khi về Hà Nội.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe tại Hà Nội', 'Đi Đại Lải trước trưa', 'Check-in resort/villa', 'Ăn tối và nghỉ tại khu lưu trú'],
      },
      {
        title: 'Ngày 2',
        items: ['Ăn sáng, đi dạo hồ', 'Trả phòng', 'Về Hà Nội đầu giờ chiều'],
      },
    ],
    notes: ['Phù hợp bán xe 7 chỗ cuối tuần.', 'Nếu khách đi resort, cần xác nhận giờ check-in/check-out.'],
    faq: [
      {
        question: 'Đi Đại Lải bằng xe điện có được không?',
        answer: 'Có thể phù hợp vì quãng đường ngắn, nhưng vẫn nên kiểm tra pin và điểm sạc nếu khách đi nhiều nơi quanh Vĩnh Phúc.',
      },
    ],
    tollEstimate: 70000,
    fuelCostPerKm: 1400,
  },
  {
    slug: 'hai-phong',
    name: 'Hải Phòng',
    region: 'Hải Phòng',
    summary: 'Tuyến cao tốc dễ đi từ Hà Nội, hợp lịch trình ăn uống trong ngày hoặc 2 ngày 1 đêm kết hợp Đồ Sơn/Cát Bà.',
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Cao tốc', 'Xe điện'],
    distanceKm: 120,
    duration: 'Trong ngày hoặc 2 ngày 1 đêm',
    ideal: 'Nhóm bạn đi ăn uống, gia đình đi cuối tuần',
    route: 'Hà Nội → cao tốc Hà Nội - Hải Phòng → trung tâm Hải Phòng',
    stops: ['Trạm dừng Hải Dương', 'Trung tâm Hải Phòng', 'Đồ Sơn'],
    drivingNote: 'Cao tốc dễ đi, cần chuẩn bị VETC và giữ tốc độ đúng quy định.',
    parkingNote: 'Trung tâm có nhiều điểm đỗ theo giờ; nếu đi ăn uống nên chọn điểm gần bãi gửi xe.',
    recommendedVehicle: 'Xe 5 chỗ cho nhóm nhỏ; xe 7 chỗ nếu đi gia đình hoặc kết hợp nhiều điểm.',
    nearbyPlaces: [
      { name: 'Trung tâm Hải Phòng', type: 'Ăn uống', note: 'Hợp food tour bánh đa cua, nem cua bể, cafe.', price: '150-300k/người' },
      { name: 'Đồ Sơn', type: 'Biển', note: 'Có thể ghép nếu đi cả ngày hoặc ngủ lại.' },
      { name: 'Nhà hát lớn Hải Phòng', type: 'Check-in', note: 'Dễ ghép lịch trình trong trung tâm.' },
    ],
    schedule: [
      {
        title: 'Food tour trong ngày',
        items: ['Nhận xe sáng', 'Đi cao tốc tới Hải Phòng', 'Ăn trưa/food tour', 'Cafe chiều', 'Về Hà Nội tối'],
      },
      {
        title: '2 ngày 1 đêm',
        items: ['Ngày 1 ăn chơi trung tâm', 'Ngày 2 ghé Đồ Sơn hoặc đi tiếp Cát Bà'],
      },
    ],
    notes: ['Tuyến cao tốc phù hợp SEO thuê xe tự lái đi Hải Phòng.', 'Cần tính cao tốc cao hơn tuyến ngắn.'],
    faq: [
      {
        question: 'Đi Hải Phòng trong ngày có mệt không?',
        answer: 'Nếu đi cao tốc và xuất phát sớm, lịch trình food tour trong ngày khá hợp lý.',
      },
    ],
    tollEstimate: 360000,
    fuelCostPerKm: 1700,
  },
  {
    slug: 'cat-ba',
    name: 'Cát Bà',
    region: 'Hải Phòng',
    summary: 'Tuyến biển cần tính thêm phà/cáp treo và thời gian chờ, phù hợp nhóm đi 2-3 ngày bằng xe 7 chỗ.',
    tags: ['3 ngày 2 đêm', 'Biển', 'Xe 7 chỗ', 'Đường dài'],
    distanceKm: 160,
    duration: '2-3 ngày',
    ideal: 'Nhóm bạn, gia đình đi biển, cần xe rộng và lịch trình linh hoạt',
    route: 'Hà Nội → Hải Phòng → bến Gót/phà/cáp treo → Cát Bà',
    stops: ['Hải Phòng', 'Bến Gót', 'Trung tâm Cát Bà'],
    drivingNote: 'Cần tính thời gian chờ phà/cáp treo, nên đi sớm và tránh giờ cao điểm cuối tuần.',
    parkingNote: 'Nếu mang xe sang đảo cần hỏi chỗ đỗ khách sạn; nếu gửi xe ngoài bến cần tính thêm phí gửi.',
    recommendedVehicle: 'Xe 7 chỗ hoặc SUV nếu đi nhóm, nhiều hành lý biển.',
    nearbyPlaces: [
      { name: 'Vịnh Lan Hạ', type: 'Biển', note: 'Nên đặt tour trước nếu đi mùa cao điểm.' },
      { name: 'Trung tâm Cát Bà', type: 'Ăn uống', note: 'Dễ đi bộ buổi tối sau khi gửi xe.' },
      { name: 'Bãi Cát Cò', type: 'Tắm biển', note: 'Cuối tuần đông, nên đi sớm.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe sớm', 'Đi Hải Phòng', 'Qua phà/cáp treo', 'Check-in Cát Bà'],
      },
      {
        title: 'Ngày 2',
        items: ['Đi vịnh Lan Hạ hoặc tắm biển', 'Ăn hải sản, nghỉ lại Cát Bà'],
      },
      {
        title: 'Ngày 3',
        items: ['Trả phòng', 'Canh giờ phà/cáp treo', 'Về Hà Nội'],
      },
    ],
    notes: ['Cần tư vấn kỹ lịch di chuyển vì phà/cáp treo ảnh hưởng thời gian.', 'Phù hợp lead nhóm bạn thuê xe 7 chỗ.'],
    faq: [
      {
        question: 'Đi Cát Bà tự lái cần lưu ý gì?',
        answer: 'Cần tính thêm thời gian qua phà/cáp treo và hỏi trước chỗ đỗ tại khách sạn hoặc bến gửi xe.',
      },
    ],
    tollEstimate: 420000,
  },
  {
    slug: 'mai-chau',
    name: 'Mai Châu',
    region: 'Hòa Bình',
    summary: 'Cung đường Tây Bắc nhẹ hơn Mộc Châu, phù hợp 2 ngày 1 đêm, nhóm bạn hoặc gia đình thích nghỉ homestay.',
    tags: ['2 ngày 1 đêm', 'Xe 7 chỗ', 'Đường đèo', 'Gia đình'],
    distanceKm: 140,
    duration: '2 ngày 1 đêm',
    ideal: 'Gia đình, nhóm bạn thích núi và homestay',
    route: 'Hà Nội → Hòa Bình → đèo Thung Khe → Mai Châu',
    stops: ['Hòa Bình', 'Đèo Thung Khe', 'Bản Lác'],
    drivingNote: 'Có đèo và xe tải, nên đi ban ngày, giữ khoảng cách và kiểm tra phanh/lốp.',
    parkingNote: 'Homestay ở Bản Lác thường có chỗ đỗ nhưng đường vào có thể hẹp.',
    recommendedVehicle: 'Xe gầm cao hoặc 7 chỗ nếu đi gia đình/nhóm đông.',
    nearbyPlaces: [
      { name: 'Bản Lác', type: 'Lưu trú', note: 'Phù hợp homestay, ăn tối và đi bộ quanh bản.' },
      { name: 'Đèo Thung Khe', type: 'Check-in', note: 'Dừng ngắn, cần đỗ xe cẩn thận.' },
      { name: 'Hang Chiều', type: 'Trải nghiệm', note: 'Hợp nhóm khỏe, cần giày dễ đi.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe sớm', 'Đi Hòa Bình - Thung Khe', 'Tới Mai Châu ăn trưa', 'Nghỉ homestay'],
      },
      {
        title: 'Ngày 2',
        items: ['Đi quanh bản, cafe nhẹ', 'Về Hà Nội sau bữa trưa'],
      },
    ],
    notes: ['Nên chọn xe dễ lái đường đèo.', 'Không nên xếp lịch quá dày vì cung đường có đoạn đèo.'],
    faq: [
      {
        question: 'Mai Châu nên đi mấy ngày?',
        answer: '2 ngày 1 đêm là hợp lý để không quá mệt và vẫn có thời gian nghỉ tại bản.',
      },
    ],
    tollEstimate: 120000,
  },
  {
    slug: 'pu-luong',
    name: 'Pù Luông',
    region: 'Thanh Hóa',
    summary: 'Cung nghỉ dưỡng thiên nhiên xa hơn, phù hợp 3 ngày 2 đêm và nên chọn xe gầm cao hoặc 7 chỗ.',
    tags: ['3 ngày 2 đêm', 'Đường dài', 'Xe 7 chỗ', 'Xe gầm cao'],
    distanceKm: 180,
    duration: '3 ngày 2 đêm',
    ideal: 'Nhóm bạn, gia đình thích nghỉ dưỡng thiên nhiên',
    route: 'Hà Nội → Hòa Bình → Mai Châu → Pù Luông',
    stops: ['Hòa Bình', 'Mai Châu', 'Bá Thước'],
    drivingNote: 'Có nhiều đoạn đèo, đường nhỏ và phụ thuộc thời tiết, nên đi xe khỏe và xuất phát sớm.',
    parkingNote: 'Nhiều retreat/homestay ở sườn núi có bãi riêng nhưng đường vào hẹp, cần hỏi trước.',
    recommendedVehicle: 'SUV/crossover hoặc xe 7 chỗ gầm cao, ưu tiên xe khỏe và phanh/lốp tốt.',
    nearbyPlaces: [
      { name: 'Bản Đôn', type: 'Lưu trú', note: 'Nhiều khu nghỉ có view ruộng bậc thang.' },
      { name: 'Kho Mường', type: 'Trải nghiệm', note: 'Đường vào cần kiểm tra trước nếu trời mưa.' },
      { name: 'Guồng nước Pù Luông', type: 'Check-in', note: 'Hợp đi sáng hoặc chiều mát.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe sớm', 'Đi Hòa Bình - Mai Châu', 'Tới Pù Luông chiều', 'Check-in khu nghỉ'],
      },
      {
        title: 'Ngày 2',
        items: ['Đi bản, ruộng bậc thang, nghỉ tại retreat', 'Không xếp lịch quá dày'],
      },
      {
        title: 'Ngày 3',
        items: ['Trả phòng', 'Về Hà Nội, dự phòng thời gian đường đèo'],
      },
    ],
    notes: ['Không nên tư vấn xe nhỏ nếu khách đi đông hoặc nhiều đồ.', 'Cần hỏi kỹ điểm lưu trú để xác định đường vào.'],
    faq: [
      {
        question: 'Pù Luông có nên đi xe gầm cao không?',
        answer: 'Nên, nhất là khi đi nhóm đông, nhiều hành lý hoặc vào các khu nghỉ đường nhỏ/dốc.',
      },
    ],
    tollEstimate: 160000,
  },
  {
    slug: 'sapa',
    name: 'Sapa',
    region: 'Lào Cai',
    summary: 'Tuyến đường dài cần chuẩn bị kỹ, phù hợp 3-4 ngày, xe khỏe và người lái có kinh nghiệm đường núi.',
    tags: ['3 ngày 2 đêm', 'Đường dài', 'Xe 7 chỗ', 'Đường đèo'],
    distanceKm: 320,
    duration: '3-4 ngày',
    ideal: 'Gia đình hoặc nhóm bạn đi dài ngày',
    route: 'Hà Nội → cao tốc Nội Bài - Lào Cai → Sapa',
    stops: ['Phú Thọ', 'Yên Bái', 'Lào Cai', 'Sapa'],
    drivingNote: 'Cao tốc dài và đoạn lên Sapa có đèo dốc, nên chia lái và không đi quá muộn.',
    parkingNote: 'Trung tâm Sapa đông, nên chọn khách sạn có chỗ đỗ hoặc gửi xe theo ngày.',
    recommendedVehicle: 'Xe 7 chỗ/SUV máy khỏe, cốp rộng, phù hợp đường dài và hành lý nhiều.',
    nearbyPlaces: [
      { name: 'Trung tâm Sapa', type: 'Lưu trú', note: 'Nên chọn khách sạn có chỗ đỗ rõ ràng.' },
      { name: 'Fansipan', type: 'Trải nghiệm', note: 'Cần đặt vé/cáp treo và dự phòng thời tiết.' },
      { name: 'Bản Cát Cát', type: 'Check-in', note: 'Đường đông, nên đi sớm.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe rất sớm', 'Đi cao tốc Nội Bài - Lào Cai', 'Tới Sapa chiều/tối'],
      },
      {
        title: 'Ngày 2-3',
        items: ['Đi Fansipan, bản làng, cafe', 'Dành thời gian nghỉ vì lịch đường dài'],
      },
      {
        title: 'Ngày cuối',
        items: ['Trả phòng', 'Về Hà Nội, tránh chạy đêm nếu không quen'],
      },
    ],
    notes: ['Cần tư vấn kỹ về người lái, lịch nghỉ và tình trạng xe.', 'Không nên tối ưu lịch quá gấp cho tuyến này.'],
    faq: [
      {
        question: 'Đi Sapa tự lái cần xe gì?',
        answer: 'Nên chọn xe khỏe, gầm cao hoặc 7 chỗ nếu đi đông, và người lái cần quen đường dài/đường núi.',
      },
    ],
    tollEstimate: 520000,
  },
  {
    slug: 'ho-nui-coc',
    name: 'Hồ Núi Cốc',
    region: 'Thái Nguyên',
    summary: 'Tuyến đi trong ngày hoặc 2 ngày nhẹ nhàng, phù hợp gia đình muốn đổi gió gần Hà Nội.',
    tags: ['Trong ngày', 'Gia đình', 'Dễ lái', 'Gần Hà Nội'],
    distanceKm: 95,
    duration: 'Trong ngày hoặc 2 ngày 1 đêm',
    ideal: 'Gia đình, nhóm nhỏ muốn đi chơi nhẹ',
    route: 'Hà Nội → cao tốc Hà Nội - Thái Nguyên → Hồ Núi Cốc',
    stops: ['Thái Nguyên', 'Hồ Núi Cốc'],
    drivingNote: 'Đường khá dễ đi, có thể đi trong ngày nếu xuất phát sớm.',
    parkingNote: 'Khu du lịch có bãi xe, cuối tuần nên đi sớm.',
    recommendedVehicle: 'Xe 5 chỗ đủ cho nhóm nhỏ; xe 7 chỗ nếu đi gia đình đông.',
    nearbyPlaces: [
      { name: 'Khu du lịch Hồ Núi Cốc', type: 'Gia đình', note: 'Phù hợp trẻ em và lịch trình nhẹ.' },
      { name: 'Thái Nguyên', type: 'Ăn uống', note: 'Có thể ghép ăn trưa/cafe trên đường.' },
      { name: 'Không gian hồ', type: 'Check-in', note: 'Nên đi khi thời tiết khô ráo.' },
    ],
    schedule: [
      {
        title: 'Trong ngày',
        items: ['Nhận xe sáng', 'Đi cao tốc lên Thái Nguyên', 'Chơi Hồ Núi Cốc', 'Về Hà Nội cuối ngày'],
      },
    ],
    notes: ['Tuyến phù hợp gia đình cần xe chủ động.', 'Có thể tạo collection đi trong ngày gần Hà Nội.'],
    faq: [
      {
        question: 'Hồ Núi Cốc đi trong ngày được không?',
        answer: 'Có, nếu xuất phát sớm từ Hà Nội và không xếp quá nhiều điểm phụ.',
      },
    ],
    tollEstimate: 120000,
  },
];

export const defaultTripDestination = tripDestinations[0];
