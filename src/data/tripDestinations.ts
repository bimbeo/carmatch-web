export interface TripDestination {
  slug: string;
  name: string;
  region?: string;
  summary?: string;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  distanceKm: number;
  duration: string;
  ideal: string;
  route: string;
  stops: string[];
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  checklist?: string[];
  drivingNote?: string;
  parkingNote?: string;
  recommendedVehicle?: string;
  nearbyPlaces?: Array<{
    name: string;
    type: string;
    note: string;
    price?: string;
    openingHours?: string;
    familyFit?: string;
    parkingNote?: string;
    imageUrl?: string;
    sourceUrl?: string;
    latitude?: number;
    longitude?: number;
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

const commonsImage = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}?width=1600`;

export const tripDestinations: TripDestination[] = [
  {
    slug: 'ha-long',
    name: 'Hạ Long',
    region: 'Quảng Ninh',
    summary: 'Tuyến nghỉ biển cuối tuần phổ biến nhất từ Hà Nội, hợp với gia đình cần xe rộng, cốp lớn và lịch trình 2 ngày 1 đêm.',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/H%E1%BA%A1_Long_Bay_15.jpg?width=1600',
    tags: ['2 ngày 1 đêm', 'Gia đình', 'Xe 7 chỗ', 'Cao tốc'],
    distanceKm: 160,
    duration: '2 ngày 1 đêm',
    ideal: 'Gia đình 4-6 người, nhóm bạn cuối tuần',
    route: 'Hà Nội → cao tốc Hải Phòng - Hạ Long → Bãi Cháy/Tuần Châu',
    stops: ['Trạm dừng Hải Dương', 'Bãi Cháy', 'Tuần Châu'],
    latitude: 20.9101,
    longitude: 107.1839,
    mapUrl: 'https://www.google.com/maps?q=H%E1%BA%A1%20Long%20Bay%2C%20Qu%E1%BA%A3ng%20Ninh&output=embed',
    checklist: [
      'Kiểm tra tài khoản VETC và số dư trước khi lên cao tốc',
      'Xác nhận khách sạn có bãi đỗ xe qua đêm ở Bãi Cháy/Tuần Châu',
      'Chuẩn bị ghế trẻ em hoặc xe 7 chỗ nếu đi gia đình 5-6 người',
      'Dự phòng giờ về Hà Nội vì cao tốc cuối tuần dễ đông',
    ],
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
        answer: 'Có thể phù hợp nếu lịch trình không quá gấp và có kế hoạch sạc rõ ràng. Car Match sẽ tư vấn theo xe thực tế còn trống.',
      },
    ],
    tollEstimate: 450000,
  },
  {
    slug: 'ninh-binh',
    name: 'Ninh Bình',
    region: 'Ninh Bình',
    summary: 'Tuyến ngắn, dễ đi trong ngày hoặc 2 ngày 1 đêm, phù hợp khách muốn thuê xe tự lái để chủ động giờ thuyền, ăn uống và check-in.',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ninh_Binh-Tam_Coc_09.jpg?width=1600',
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Gia đình', 'Dễ lái'],
    distanceKm: 95,
    duration: '1-2 ngày',
    ideal: 'Gia đình nhỏ, cặp đôi, khách thích đi trong ngày',
    route: 'Hà Nội → Phủ Lý → Tràng An/Tam Cốc',
    stops: ['Phủ Lý', 'Tràng An', 'Tam Cốc'],
    latitude: 20.2506,
    longitude: 105.9745,
    mapUrl: 'https://www.google.com/maps?q=Tr%C3%A0ng%20An%2C%20Ninh%20B%C3%ACnh&output=embed',
    checklist: [
      'Chọn một trong hai điểm chính Tràng An hoặc Tam Cốc để lịch không quá dày',
      'Đặt giờ đi thuyền sớm nếu đi cuối tuần hoặc ngày lễ',
      'Mang mũ, nước và giày dễ đi bộ nếu ghé Hang Múa',
      'Hỏi trước bãi đỗ tại nhà hàng/khu du lịch để tránh vòng xe nhiều',
    ],
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
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ba_dinh_nui_Tam_Dao.jpg?width=1600',
    tags: ['2 ngày 1 đêm', 'Gần Hà Nội', 'Đường đèo', 'Nhóm bạn'],
    distanceKm: 80,
    duration: '2 ngày 1 đêm',
    ideal: 'Nhóm bạn, cặp đôi, chuyến nghỉ ngắn cuối tuần',
    route: 'Hà Nội → Vĩnh Phúc → Tam Đảo',
    stops: ['Vĩnh Yên', 'Quán Gió', 'Nhà thờ đá'],
    latitude: 21.4569,
    longitude: 105.6459,
    mapUrl: 'https://www.google.com/maps?q=Tam%20%C4%90%E1%BA%A3o%2C%20V%C4%A9nh%20Ph%C3%BAc&output=embed',
    checklist: [
      'Ưu tiên xe gầm cao hoặc xe số tự động nếu khách chưa quen đường dốc',
      'Nhắc khách đi ban ngày ở đoạn lên thị trấn Tam Đảo',
      'Xác nhận homestay/khách sạn có chỗ đỗ riêng',
      'Kiểm tra phanh, lốp và nhiên liệu trước khi leo dốc',
    ],
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
        answer: 'Nếu chưa quen đường đèo, nên cân nhắc người lái có kinh nghiệm hoặc trao đổi với Car Match để chọn xe dễ lái.',
      },
    ],
    tollEstimate: 80000,
  },
  {
    slug: 'moc-chau',
    name: 'Mộc Châu',
    region: 'Sơn La',
    summary: 'Cung đường dài hơn, phù hợp nhóm muốn đi 3 ngày 2 đêm, cần xe khỏe, người lái ổn và lịch trình có thời gian nghỉ.',
    imageUrl: commonsImage('Mộc Châu District, Vietnam (Unsplash).jpg'),
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
    imageUrl: commonsImage('Noi Bai International Airport Terminal 2 Night View.JPG'),
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
    notes: ['Phù hợp chuyến công tác ngắn hoặc gia đình cần chủ động giờ bay.', 'Nếu chỉ đi một chiều, nên hỏi Car Match để được tư vấn phương án tiết kiệm hơn.'],
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
    imageUrl: commonsImage('Ba Vì National Park, foggy road.jpg'),
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
    imageUrl: commonsImage('National Route 2 in Soc Son, Hanoi, Vietnam 20.jpg'),
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
    imageUrl: commonsImage('2016 Binh Than in Ecopark.jpg'),
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
    imageUrl: commonsImage('Hồ Đại Lải.jpg'),
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
    imageUrl: commonsImage('Hải Phòng 2019.png'),
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
    imageUrl: commonsImage('Cat Ba Island, Vietnam.JPG'),
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
    slug: 'sam-son',
    name: 'Sầm Sơn',
    region: 'Thanh Hóa',
    summary: 'Tuyến đi biển phổ biến từ Hà Nội, hợp gia đình hoặc nhóm bạn muốn nghỉ 2 ngày 1 đêm, cần tính cao tốc và giờ về cuối tuần.',
    imageUrl: commonsImage('Sam Son beach.jpg'),
    tags: ['2 ngày 1 đêm', 'Biển', 'Gia đình', 'Cao tốc'],
    distanceKm: 170,
    duration: '2 ngày 1 đêm',
    ideal: 'Gia đình, nhóm bạn đi biển cuối tuần',
    route: 'Hà Nội → cao tốc Pháp Vân - Cầu Giẽ → Thanh Hóa → Sầm Sơn',
    stops: ['Phủ Lý', 'Ninh Bình', 'Thanh Hóa', 'Sầm Sơn'],
    drivingNote: 'Tuyến có cao tốc dài, nên kiểm tra VETC, giữ tốc độ ổn định và tránh xuất phát/về quá muộn ngày cao điểm.',
    parkingNote: 'Khu khách sạn gần biển có bãi đỗ nhưng mùa hè rất đông; nên hỏi trước khách sạn hoặc bãi gửi xe theo ngày.',
    recommendedVehicle: 'Xe 7 chỗ hoặc SUV/crossover nếu đi gia đình 5-6 người, có trẻ em và nhiều đồ biển.',
    nearbyPlaces: [
      { name: 'Bãi biển Sầm Sơn', type: 'Biển', note: 'Điểm chính cho lịch trình nghỉ biển, nên đi sáng hoặc chiều mát.' },
      { name: 'Quảng trường biển', type: 'Check-in', note: 'Phù hợp đi dạo tối, đông vào cuối tuần và mùa cao điểm.' },
      { name: 'Trung tâm Thanh Hóa', type: 'Ăn uống', note: 'Có thể dừng ăn trên đường đi hoặc về.', price: '150-300k/người' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe sớm tại Hà Nội', 'Đi cao tốc hướng Ninh Bình - Thanh Hóa', 'Ăn trưa và check-in khách sạn', 'Chiều tắm biển, ăn hải sản'],
      },
      {
        title: 'Ngày 2',
        items: ['Ăn sáng, đi biển hoặc cafe nhẹ', 'Trả phòng trước trưa', 'Về Hà Nội, dự phòng tắc đường cuối tuần'],
      },
    ],
    notes: ['Tuyến phù hợp nhóm đi biển mùa hè, nên chọn xe có cốp rộng.', 'Cần tính thêm phí cao tốc và thời gian cao điểm khi về Hà Nội.'],
    faq: [
      {
        question: 'Đi Sầm Sơn nên thuê xe 5 chỗ hay 7 chỗ?',
        answer: 'Nếu đi 2-4 người, xe 5 chỗ vẫn phù hợp. Nếu đi gia đình 5-6 người hoặc nhiều hành lý, nên chọn xe 7 chỗ để thoải mái hơn.',
      },
      {
        question: 'Sầm Sơn đi 2 ngày 1 đêm có hợp lý không?',
        answer: 'Có. Đây là lịch trình phổ biến từ Hà Nội, nhưng nên nhận xe sớm và dự phòng thời gian về vì cuối tuần dễ đông.',
      },
    ],
    tollEstimate: 360000,
  },
  {
    slug: 'van-don',
    name: 'Vân Đồn',
    region: 'Quảng Ninh',
    summary: 'Tuyến Quảng Ninh xa hơn Hạ Long, hợp chuyến 2-3 ngày đi biển, nghỉ dưỡng hoặc nối lịch ra đảo, cần chuẩn bị cao tốc và điểm dừng.',
    imageUrl: commonsImage('Quảng Ninh, Việt Nam.jpg'),
    tags: ['2 ngày 1 đêm', '3 ngày 2 đêm', 'Biển', 'Cao tốc'],
    distanceKm: 220,
    duration: '2-3 ngày',
    ideal: 'Gia đình, nhóm bạn đi biển Quảng Ninh hoặc nối lịch ra đảo',
    route: 'Hà Nội → cao tốc Hải Phòng - Hạ Long - Vân Đồn → Vân Đồn',
    stops: ['Hải Dương', 'Hạ Long', 'Cẩm Phả', 'Vân Đồn'],
    drivingNote: 'Đường cao tốc dễ đi nhưng quãng đường dài; nên kiểm tra VETC, pin/nhiên liệu và nghỉ giữa chặng.',
    parkingNote: 'Nếu đi nghỉ dưỡng hoặc ra cảng, cần hỏi trước chỗ gửi xe theo ngày và thời gian giữ xe qua đêm.',
    recommendedVehicle: 'SUV/crossover hoặc xe 7 chỗ nếu đi nhóm đông, nhiều hành lý hoặc có kế hoạch nối lịch ra đảo.',
    nearbyPlaces: [
      { name: 'Bãi Dài Vân Đồn', type: 'Biển', note: 'Phù hợp nghỉ dưỡng nhẹ, check-in và ăn hải sản.' },
      { name: 'Cảng Ao Tiên', type: 'Di chuyển', note: 'Điểm nối lịch ra đảo, cần tính giờ tàu và gửi xe.' },
      { name: 'Cẩm Phả', type: 'Điểm dừng', note: 'Có thể dừng ăn uống hoặc nghỉ giữa chặng trước khi tới Vân Đồn.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe sớm tại Hà Nội', 'Đi cao tốc qua Hải Phòng - Hạ Long', 'Dừng nghỉ giữa chặng', 'Tới Vân Đồn chiều và check-in'],
      },
      {
        title: 'Ngày 2-3',
        items: ['Nghỉ biển hoặc nối lịch ra đảo', 'Canh giờ tàu/giờ trả phòng', 'Về Hà Nội theo cao tốc, tránh chạy quá muộn'],
      },
    ],
    notes: ['Tuyến xa hơn Hạ Long nên cần tư vấn kỹ thời gian nhận/trả xe.', 'Nếu khách ra đảo, cần hỏi rõ phương án gửi xe ở cảng.'],
    faq: [
      {
        question: 'Đi Vân Đồn tự lái có khó không?',
        answer: 'Không quá khó vì phần lớn là cao tốc, nhưng quãng đường dài nên cần chuẩn bị VETC, điểm dừng và thời gian nghỉ hợp lý.',
      },
      {
        question: 'Đi Vân Đồn nên thuê xe gì?',
        answer: 'Nếu đi nhóm hoặc có hành lý biển, nên chọn SUV/crossover hoặc xe 7 chỗ để ngồi thoải mái hơn trên cung đường dài.',
      },
    ],
    tollEstimate: 520000,
  },
  {
    slug: 'mai-chau',
    name: 'Mai Châu',
    region: 'Hòa Bình',
    summary: 'Cung đường Tây Bắc nhẹ hơn Mộc Châu, phù hợp 2 ngày 1 đêm, nhóm bạn hoặc gia đình thích nghỉ homestay.',
    imageUrl: commonsImage('Mai Chau.jpg'),
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
    imageUrl: commonsImage('Pu Luong National Reserve (15179196484).jpg'),
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
    imageUrl: commonsImage('Sa Pa mountain hills with agricultural activities.jpg'),
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
    imageUrl: commonsImage('Hồ Núi Cốc.JPG'),
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
  {
    slug: 'hoa-binh',
    name: 'Hòa Bình',
    region: 'Hòa Bình',
    summary: 'Tuyến phía Tây Hà Nội dễ ghép đi trong ngày hoặc 2 ngày 1 đêm, hợp gia đình muốn nghỉ hồ, ăn cá sông và đổi gió cuối tuần.',
    imageUrl: commonsImage('Hoa Binh Dam.JPG'),
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Gần Hà Nội', 'Phía Tây Hà Nội'],
    distanceKm: 80,
    duration: 'Trong ngày hoặc 2 ngày 1 đêm',
    ideal: 'Gia đình, nhóm nhỏ muốn nghỉ nhẹ phía Tây Hà Nội',
    route: 'Hà Nội → đại lộ Thăng Long/QL6 → Hòa Bình',
    stops: ['Xuân Mai', 'Thành phố Hòa Bình', 'Thủy điện Hòa Bình'],
    drivingNote: 'Đường không quá khó nhưng có nhiều xe tải trên QL6, nên đi ban ngày và giữ khoảng cách ổn định.',
    parkingNote: 'Các nhà hàng ven hồ, khu du lịch và điểm tham quan thường có bãi xe; cuối tuần nên hỏi trước nếu đi đoàn đông.',
    recommendedVehicle: 'Xe 5 chỗ đủ cho nhóm nhỏ; xe 7 chỗ nếu đi gia đình đông hoặc ghép thêm Mai Châu/Ba Vì.',
    nearbyPlaces: [
      { name: 'Thủy điện Hòa Bình', type: 'Tham quan', note: 'Điểm dừng dễ nhận diện, phù hợp lịch trình trong ngày.' },
      { name: 'Hồ Hòa Bình', type: 'Nghỉ dưỡng', note: 'Hợp lịch trình ăn cá sông, đi thuyền hoặc nghỉ homestay.' },
      { name: 'Cao Phong', type: 'Ăn uống', note: 'Có thể ghép mua cam, ăn trưa hoặc dừng nghỉ trên đường.' },
    ],
    schedule: [
      {
        title: 'Trong ngày',
        items: ['Nhận xe buổi sáng', 'Đi Hòa Bình qua Xuân Mai hoặc đại lộ Thăng Long', 'Ăn trưa ven hồ/ghé thủy điện', 'Về Hà Nội cuối chiều'],
      },
      {
        title: '2 ngày 1 đêm',
        items: ['Ngày 1 đi hồ Hòa Bình hoặc homestay', 'Ngày 2 ghé Cao Phong/Ba Vì rồi về Hà Nội'],
      },
    ],
    notes: ['Tuyến phù hợp khách ở phía Tây Hà Nội, Hà Đông, Cầu Giấy, Nam Từ Liêm.', 'Nếu đi tiếp Mai Châu nên chọn xe khỏe hơn và dự phòng thời gian đường đèo.'],
    faq: [
      {
        question: 'Hòa Bình có phù hợp đi trong ngày không?',
        answer: 'Có. Nếu chỉ đi thủy điện, ăn uống ven hồ hoặc nghỉ nhẹ, khách có thể đi sáng về chiều từ Hà Nội.',
      },
    ],
    tollEstimate: 80000,
  },
  {
    slug: 'duong-lam',
    name: 'Đường Lâm',
    region: 'Sơn Tây, Hà Nội',
    summary: 'Tuyến đi trong ngày rất gần Hà Nội, phù hợp gia đình, cặp đôi hoặc nhóm muốn kết hợp làng cổ Đường Lâm, Sơn Tây và Ba Vì.',
    imageUrl: commonsImage('Cổng vào làng cổ Đường Lâm.jpg'),
    tags: ['Trong ngày', 'Gần Hà Nội', 'Gia đình', 'Văn hóa'],
    distanceKm: 50,
    duration: 'Trong ngày',
    ideal: 'Cặp đôi, gia đình nhỏ, khách muốn đi nhẹ cuối tuần',
    route: 'Hà Nội → Sơn Tây → làng cổ Đường Lâm',
    stops: ['Sơn Tây', 'Làng cổ Đường Lâm', 'Ba Vì'],
    drivingNote: 'Tuyến dễ đi, phù hợp người mới lái; cần chú ý đường nhỏ trong làng và khách đi bộ cuối tuần.',
    parkingNote: 'Nên gửi xe ở bãi ngoài làng rồi đi bộ vào khu tham quan để tránh đường nhỏ và đông khách.',
    recommendedVehicle: 'Xe 5 chỗ là hợp lý nhất; xe 7 chỗ nếu đi gia đình đông hoặc ghép Ba Vì.',
    nearbyPlaces: [
      { name: 'Cổng làng Mông Phụ', type: 'Văn hóa', note: 'Điểm check-in chính, nên gửi xe và đi bộ.' },
      { name: 'Thành cổ Sơn Tây', type: 'Tham quan', note: 'Dễ ghép lịch trình nửa ngày.' },
      { name: 'Ba Vì', type: 'Thiên nhiên', note: 'Có thể nối lịch trình nếu muốn đi cả ngày.' },
    ],
    schedule: [
      {
        title: 'Trong ngày',
        items: ['Nhận xe sáng', 'Đi Sơn Tây - Đường Lâm', 'Ăn trưa quanh làng cổ', 'Ghé thành cổ hoặc Ba Vì nhẹ rồi về Hà Nội'],
      },
    ],
    notes: ['Tuyến tốt để tư vấn xe 5 chỗ, chi phí thấp.', 'Không nên chạy xe sâu vào làng nếu cuối tuần đông.'],
    faq: [
      {
        question: 'Đi Đường Lâm có cần thuê xe 7 chỗ không?',
        answer: 'Thông thường xe 5 chỗ là đủ cho 2-4 người. Xe 7 chỗ phù hợp khi đi gia đình đông hoặc mang nhiều đồ.',
      },
    ],
    tollEstimate: 40000,
    fuelCostPerKm: 1500,
  },
  {
    slug: 'co-to',
    name: 'Cô Tô',
    region: 'Quảng Ninh',
    summary: 'Tuyến đi biển cần kết hợp tự lái tới cảng Vân Đồn rồi đi tàu ra đảo, phù hợp chuyến 3 ngày 2 đêm và nhóm đã có lịch tàu rõ.',
    imageUrl: commonsImage('Bãi biển Hồng Vàn.jpg'),
    tags: ['3 ngày 2 đêm', 'Biển', 'Cao tốc', 'Đi tàu'],
    distanceKm: 230,
    duration: '3 ngày 2 đêm',
    ideal: 'Nhóm bạn, gia đình đi biển đảo Quảng Ninh',
    route: 'Hà Nội → cao tốc Hải Phòng - Hạ Long - Vân Đồn → cảng Ao Tiên/Cái Rồng → Cô Tô',
    stops: ['Hải Dương', 'Hạ Long', 'Vân Đồn', 'Cảng Ao Tiên'],
    drivingNote: 'Phần tự lái chủ yếu là cao tốc tới Vân Đồn; cần canh giờ tàu và không nên xuất phát sát giờ.',
    parkingNote: 'Cần hỏi trước bãi gửi xe tại cảng theo ngày, phí qua đêm và giờ mở cửa bãi.',
    recommendedVehicle: 'Xe 7 chỗ hoặc SUV nếu đi nhóm đông, nhiều vali; xe 5 chỗ vẫn đủ cho nhóm nhỏ vì xe gửi lại ở cảng.',
    nearbyPlaces: [
      { name: 'Cảng Ao Tiên/Cái Rồng', type: 'Di chuyển', note: 'Điểm quan trọng nhất để tính giờ tàu và gửi xe.' },
      { name: 'Bãi Hồng Vàn', type: 'Biển', note: 'Một trong các bãi tắm nổi bật tại Cô Tô.' },
      { name: 'Hải đăng Cô Tô', type: 'Check-in', note: 'Nên xếp lịch sau khi đã ổn định phương tiện trên đảo.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe rất sớm tại Hà Nội', 'Đi cao tốc tới Vân Đồn', 'Gửi xe tại cảng', 'Đi tàu ra Cô Tô và check-in'],
      },
      {
        title: 'Ngày 2',
        items: ['Đi biển, hải đăng, ăn hải sản', 'Không xếp lịch quá dày vì còn phụ thuộc thời tiết/tàu'],
      },
      {
        title: 'Ngày 3',
        items: ['Canh giờ tàu về Vân Đồn', 'Nhận xe ở cảng', 'Về Hà Nội theo cao tốc'],
      },
    ],
    notes: ['Cần hỏi khách giờ tàu trước khi chốt giờ nhận xe.', 'Tuyến này không chỉ tính chi phí xe, còn có phí gửi xe và vé tàu.'],
    faq: [
      {
        question: 'Đi Cô Tô tự lái có mang xe ra đảo không?',
        answer: 'Thông thường khách tự lái tới cảng Vân Đồn rồi gửi xe, sau đó đi tàu ra đảo. Cần tính phí gửi xe theo ngày.',
      },
    ],
    tollEstimate: 540000,
  },
  {
    slug: 'ba-be',
    name: 'Ba Bể',
    region: 'Bắc Kạn',
    summary: 'Tuyến hồ núi xa hơn, phù hợp nhóm thích thiên nhiên đi 3 ngày 2 đêm, cần xe khỏe và lịch trình có thời gian nghỉ.',
    imageUrl: commonsImage('Ba Be Lake 2014.jpg'),
    tags: ['3 ngày 2 đêm', 'Thiên nhiên', 'Đường dài', 'Xe gầm cao'],
    distanceKm: 230,
    duration: '3 ngày 2 đêm',
    ideal: 'Nhóm bạn, gia đình thích hồ núi và nghỉ homestay',
    route: 'Hà Nội → Thái Nguyên → Bắc Kạn → hồ Ba Bể',
    stops: ['Thái Nguyên', 'Bắc Kạn', 'Vườn quốc gia Ba Bể'],
    drivingNote: 'Đường dài, có nhiều đoạn quốc lộ và đèo nhẹ; nên đi sớm, chia điểm nghỉ và tránh chạy đêm nếu chưa quen.',
    parkingNote: 'Homestay/khu nghỉ quanh hồ thường có chỗ đỗ nhưng đường vào có thể nhỏ, nên hỏi trước điểm lưu trú.',
    recommendedVehicle: 'SUV/crossover hoặc xe 7 chỗ gầm cao nếu đi nhóm đông, nhiều đồ hoặc trời mưa.',
    nearbyPlaces: [
      { name: 'Hồ Ba Bể', type: 'Thiên nhiên', note: 'Điểm chính cho lịch trình đi thuyền và nghỉ ven hồ.' },
      { name: 'Bản Pác Ngòi', type: 'Lưu trú', note: 'Nhiều homestay, cần hỏi chỗ đỗ xe.' },
      { name: 'Động Puông', type: 'Tham quan', note: 'Dễ ghép với lịch trình đi thuyền trên hồ.' },
    ],
    schedule: [
      {
        title: 'Ngày 1',
        items: ['Nhận xe sớm', 'Đi Thái Nguyên - Bắc Kạn', 'Tới Ba Bể chiều/tối', 'Check-in homestay'],
      },
      {
        title: 'Ngày 2',
        items: ['Đi thuyền hồ Ba Bể, động Puông hoặc bản Pác Ngòi', 'Nghỉ lại ven hồ'],
      },
      {
        title: 'Ngày 3',
        items: ['Trả phòng', 'Về Hà Nội, dự phòng thời gian đường dài'],
      },
    ],
    notes: ['Không nên xếp lịch 2 ngày 1 đêm nếu khách muốn đi thoải mái.', 'Nên chọn xe khỏe, lốp/phanh tốt cho cung đường dài.'],
    faq: [
      {
        question: 'Đi Ba Bể nên thuê xe mấy ngày?',
        answer: 'Nên đi 3 ngày 2 đêm để không quá mệt và có đủ thời gian nghỉ, đi thuyền, ăn uống quanh hồ.',
      },
    ],
    tollEstimate: 180000,
  },
  {
    slug: 'thanh-hoa',
    name: 'Thanh Hóa',
    region: 'Thanh Hóa',
    summary: 'Tuyến tỉnh phía Nam Hà Nội phù hợp công tác, về quê, ăn uống hoặc nối lịch đi Sầm Sơn/Pù Luông, cần tính cao tốc và giờ ra vào thành phố.',
    imageUrl: commonsImage('Thanh Hoa City By Night.jpg'),
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Cao tốc', 'Công tác'],
    distanceKm: 155,
    duration: 'Trong ngày hoặc 2 ngày 1 đêm',
    ideal: 'Khách đi công tác, gia đình về quê hoặc nối lịch đi biển/nghỉ dưỡng',
    route: 'Hà Nội → cao tốc Pháp Vân - Cầu Giẽ → Ninh Bình → Thanh Hóa',
    stops: ['Phủ Lý', 'Ninh Bình', 'Thành phố Thanh Hóa'],
    drivingNote: 'Tuyến cao tốc khá dễ đi nhưng quãng đường dài, nên kiểm tra VETC và tránh giờ cao điểm khi ra/vào Hà Nội.',
    parkingNote: 'Trung tâm Thanh Hóa có nhiều điểm gửi xe theo giờ; nếu đi công tác nên hỏi trước chỗ đỗ tại cơ quan/khách sạn.',
    recommendedVehicle: 'Xe 5 chỗ cho 1-4 người đi công tác; xe 7 chỗ nếu gia đình đông hoặc nối lịch Sầm Sơn/Pù Luông.',
    nearbyPlaces: [
      { name: 'Trung tâm Thanh Hóa', type: 'Công tác', note: 'Phù hợp lịch đi trong ngày hoặc ngủ lại 1 đêm.' },
      { name: 'Sầm Sơn', type: 'Biển', note: 'Có thể nối thêm 20-30 phút nếu lịch trình đi biển.' },
      { name: 'Pù Luông', type: 'Nghỉ dưỡng', note: 'Nên tách thành chuyến 3 ngày nếu đi tiếp vùng núi.' },
    ],
    schedule: [
      {
        title: 'Đi trong ngày',
        items: ['Nhận xe sớm tại Hà Nội', 'Đi cao tốc tới Thanh Hóa', 'Làm việc/ăn trưa trong thành phố', 'Về Hà Nội cuối ngày'],
      },
      {
        title: '2 ngày 1 đêm',
        items: ['Ngày 1 đi Thanh Hóa hoặc Sầm Sơn', 'Ngày 2 xử lý lịch chính rồi về Hà Nội'],
      },
    ],
    notes: ['Tuyến này hợp nhu cầu công tác và gia đình về quê, không chỉ du lịch.', 'Nếu khách đi biển, nên điều hướng sang Sầm Sơn để tư vấn xe/hành lý kỹ hơn.'],
    faq: [
      {
        question: 'Đi Thanh Hóa trong ngày bằng xe tự lái có mệt không?',
        answer: 'Có thể đi trong ngày nếu xuất phát sớm và lịch không quá dày. Nếu đi gia đình hoặc có trẻ em, nên cân nhắc ngủ lại 1 đêm.',
      },
    ],
    tollEstimate: 330000,
  },
  {
    slug: 'trang-an-tam-coc',
    name: 'Tràng An/Tam Cốc',
    region: 'Ninh Bình',
    summary: 'Trang tách riêng cho khách tìm đúng cụm Tràng An, Tam Cốc, Hang Múa, phù hợp đi trong ngày hoặc 2 ngày 1 đêm từ Hà Nội.',
    imageUrl: commonsImage('Tam Coc from above.jpg'),
    tags: ['Trong ngày', '2 ngày 1 đêm', 'Dễ lái', 'Check-in'],
    distanceKm: 100,
    duration: 'Trong ngày hoặc 2 ngày 1 đêm',
    ideal: 'Cặp đôi, gia đình nhỏ, nhóm bạn muốn đi thuyền và check-in',
    route: 'Hà Nội → Phủ Lý → Tràng An/Tam Cốc',
    stops: ['Phủ Lý', 'Tràng An', 'Tam Cốc', 'Hang Múa'],
    drivingNote: 'Tuyến dễ đi, phù hợp cả người mới tự lái đường tỉnh; nên đi sớm để tránh đông ở bến thuyền.',
    parkingNote: 'Tràng An, Tam Cốc và Hang Múa đều có bãi đỗ, nhưng cuối tuần nên hỏi trước nhà hàng/khu lưu trú.',
    recommendedVehicle: 'Xe 5 chỗ tiết kiệm cho 2-4 người; xe 7 chỗ nếu gia đình đông hoặc có nhiều đồ.',
    nearbyPlaces: [
      { name: 'Tràng An', type: 'Thắng cảnh', note: 'Hợp lịch trình đi thuyền buổi sáng.' },
      { name: 'Tam Cốc', type: 'Thắng cảnh', note: 'Dễ ghép ăn trưa, cafe và đi thuyền.' },
      { name: 'Hang Múa', type: 'Check-in', note: 'Nên đi khi thời tiết khô, cần giày dễ đi.' },
    ],
    schedule: [
      {
        title: 'Trong ngày',
        items: ['Nhận xe sáng sớm', 'Đi Tràng An hoặc Tam Cốc', 'Ăn trưa tại Ninh Bình', 'Ghé Hang Múa nếu còn thời gian', 'Về Hà Nội tối'],
      },
      {
        title: '2 ngày 1 đêm',
        items: ['Ngày 1 đi Tràng An/Tam Cốc', 'Ngủ lại Ninh Bình', 'Ngày 2 Hang Múa hoặc Bái Đính rồi về'],
      },
    ],
    notes: ['Không nên xếp cả Tràng An, Tam Cốc và Hang Múa quá sát nếu đi trong ngày.', 'Tuyến này nên liên kết với page Ninh Bình để tránh trùng nội dung SEO.'],
    faq: [
      {
        question: 'Tràng An và Tam Cốc nên đi điểm nào nếu chỉ có một ngày?',
        answer: 'Nên chọn một điểm chính để lịch nhẹ hơn. Tràng An thường hợp gia đình, Tam Cốc hợp lịch ăn uống/check-in quanh khu trung tâm.',
      },
    ],
    tollEstimate: 220000,
  },
  {
    slug: 'hai-duong',
    name: 'Hải Dương',
    region: 'Hải Dương',
    summary: 'Tuyến gần Hà Nội trên trục cao tốc Hải Phòng, phù hợp đi ăn uống, công tác trong ngày hoặc làm điểm dừng trước khi đi Hạ Long/Hải Phòng.',
    imageUrl: commonsImage('Hải Dương2.jpg'),
    tags: ['Trong ngày', 'Cao tốc', 'Ăn uống', 'Công tác'],
    distanceKm: 60,
    duration: 'Trong ngày',
    ideal: 'Khách đi công tác ngắn, food tour nhẹ hoặc dừng nghỉ trên trục cao tốc',
    route: 'Hà Nội → cao tốc Hà Nội - Hải Phòng → Hải Dương',
    stops: ['Gia Lâm/Long Biên', 'Trạm dừng Hải Dương', 'Trung tâm Hải Dương'],
    drivingNote: 'Đường cao tốc dễ đi, phù hợp người muốn tập lái đường tỉnh ngắn; cần kiểm tra VETC trước chuyến đi.',
    parkingNote: 'Trung tâm có bãi gửi xe theo giờ; nếu đi ăn uống nên chọn điểm có chỗ đỗ hoặc gửi xe gần đó.',
    recommendedVehicle: 'Xe 5 chỗ là lựa chọn hợp lý; xe điện cũng phù hợp vì quãng đường ngắn và dễ kiểm soát pin.',
    nearbyPlaces: [
      { name: 'Trung tâm Hải Dương', type: 'Ăn uống', note: 'Dễ ghép lịch bánh đậu xanh, bún cá, cafe trong ngày.' },
      { name: 'Trạm dừng cao tốc', type: 'Điểm dừng', note: 'Có thể dùng như điểm nghỉ khi đi Hạ Long/Hải Phòng.' },
      { name: 'Côn Sơn - Kiếp Bạc', type: 'Văn hóa', note: 'Có thể tách thành lịch đi trong ngày nếu muốn tham quan.' },
    ],
    schedule: [
      {
        title: 'Trong ngày',
        items: ['Nhận xe buổi sáng', 'Đi cao tốc tới Hải Dương', 'Ăn trưa/đi công việc', 'Về Hà Nội cuối chiều'],
      },
    ],
    notes: ['Tuyến này tốt cho nhu cầu thuê xe theo ngày ngắn.', 'Có thể dùng làm điểm trung gian trong collection cao tốc/VETC.'],
    faq: [
      {
        question: 'Đi Hải Dương có cần thuê xe 7 chỗ không?',
        answer: 'Thông thường xe 5 chỗ là đủ. Xe 7 chỗ chỉ cần khi đi gia đình đông hoặc chở nhiều đồ.',
      },
    ],
    tollEstimate: 180000,
    fuelCostPerKm: 1500,
  },
  {
    slug: 'bac-ninh',
    name: 'Bắc Ninh',
    region: 'Bắc Ninh',
    summary: 'Tuyến rất gần Hà Nội, phù hợp đi công việc, lễ hội, ăn uống hoặc tham quan trong ngày với chi phí di chuyển thấp.',
    imageUrl: commonsImage('Đền Đô - 14061132515.jpg'),
    tags: ['Trong ngày', 'Gần Hà Nội', 'Văn hóa', 'Công tác'],
    distanceKm: 35,
    duration: 'Trong ngày',
    ideal: 'Khách đi công tác ngắn, gia đình đi lễ hội hoặc ăn uống gần Hà Nội',
    route: 'Hà Nội → cầu Thanh Trì/Nhật Tân → Bắc Ninh',
    stops: ['Từ Sơn', 'Trung tâm Bắc Ninh', 'Đền Đô/chùa Dâu'],
    drivingNote: 'Tuyến ngắn, dễ đi, nhưng cần chú ý giờ cao điểm và xe máy đông ở một số đoạn đô thị.',
    parkingNote: 'Các khu công nghiệp, nhà hàng và điểm tham quan thường có bãi đỗ; dịp lễ hội nên đi sớm.',
    recommendedVehicle: 'Xe 5 chỗ hoặc xe điện phù hợp nhất; xe 7 chỗ nếu đi gia đình đông hoặc có người lớn tuổi.',
    nearbyPlaces: [
      { name: 'Đền Đô', type: 'Văn hóa', note: 'Phù hợp lịch đi nửa ngày hoặc cả ngày.' },
      { name: 'Chùa Dâu', type: 'Văn hóa', note: 'Có thể ghép với tuyến Từ Sơn/Thuận Thành.' },
      { name: 'Trung tâm Bắc Ninh', type: 'Ăn uống', note: 'Dễ ghép ăn trưa, cafe, công việc.' },
    ],
    schedule: [
      {
        title: 'Trong ngày',
        items: ['Nhận xe linh hoạt trong ngày', 'Đi Bắc Ninh theo điểm hẹn', 'Ăn uống/tham quan/công tác', 'Về Hà Nội trong ngày'],
      },
    ],
    notes: ['Tuyến tốt để tư vấn xe điện hoặc xe 5 chỗ chi phí thấp.', 'Nếu đi lễ hội, cần hỏi kỹ điểm đỗ và giờ cấm đường tạm thời.'],
    faq: [
      {
        question: 'Bắc Ninh có phù hợp thuê xe tự lái theo ngày không?',
        answer: 'Có. Quãng đường ngắn, dễ đi và phù hợp khách muốn chủ động lịch công việc hoặc đi gia đình trong ngày.',
      },
    ],
    tollEstimate: 50000,
    fuelCostPerKm: 1400,
  },
];

export const defaultTripDestination = tripDestinations[0];
