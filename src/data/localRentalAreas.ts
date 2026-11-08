export type LocalRentalAreaSlug =
  | 'vinhomes-ocean-park'
  | 'vinhomes-smart-city'
  | 'times-city'
  | 'ecopark'
  | 'the-manor-central-park';

export interface LocalRentalArea {
  slug: LocalRentalAreaSlug;
  path: string;
  name: string;
  shortName: string;
  locality: string;
  seoTitle: string;
  description: string;
  heroAnswer: string;
  pickupNote: string;
  locationNote: string;
  localContexts: Array<{ title: string; description: string }>;
  useCases: Array<{ title: string; description: string }>;
  recommendedKeywords: string[];
  relatedLinks: Array<{ href: string; label: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

export const localRentalAreas: LocalRentalArea[] = [
  {
    slug: 'vinhomes-ocean-park',
    path: '/thue-xe-tu-lai-vinhomes-ocean-park',
    name: 'Vinhomes Ocean Park',
    shortName: 'Ocean Park',
    locality: 'Gia Lâm, Hà Nội',
    seoTitle: 'Thuê Xe Tự Lái Vinhomes Ocean Park | Car Match',
    description: 'Thuê xe tự lái tại Vinhomes Ocean Park, Gia Lâm. Xem xe và giá thực tế, hẹn giao nhận theo tòa, phân khu hoặc cổng đã xác nhận.',
    heroAnswer: 'Car Match hỗ trợ giao nhận xe tự lái tại Vinhomes Ocean Park theo lịch đã xác nhận. Khách gửi ngày thuê, số người và đúng tòa, phân khu hoặc cổng hẹn để được kiểm tra xe, giá và phương án bàn giao.',
    pickupNote: 'Gửi tên phân khu, tòa hoặc khu thấp tầng, cổng thuận tiện và số điện thoại người nhận. Điểm dừng thực tế được hai bên thống nhất trước khi giao xe.',
    locationNote: 'Vinhomes Ocean Park nằm tại Gia Lâm, phù hợp nhu cầu đi nội thành, về quê hoặc khởi hành theo hướng Đông Hà Nội.',
    localContexts: [
      { title: 'Điểm hẹn cần cụ thể', description: 'Tên tòa, phân khu và cổng giúp tránh nhầm giữa khu cao tầng, thấp tầng và các lối vào.' },
      { title: 'Khởi hành hướng Đông', description: 'Thuận tiện để lên kế hoạch đi Hải Phòng, Hạ Long hoặc các điểm phía Đông sau khi nhận xe.' },
      { title: 'Chung cư và nhà thấp tầng', description: 'Cách bàn giao có thể khác nhau; Car Match xác nhận điểm dừng phù hợp theo từng địa chỉ.' },
    ],
    useCases: [
      { title: 'Cuối tuần đi tỉnh', description: 'Chọn xe theo số người, hành lý và quãng đường thay vì chỉ theo mức giá ngày.' },
      { title: 'Đi lại gia đình', description: 'Xe 5 chỗ cho nhóm nhỏ; xe 7 chỗ khi có trẻ em, người lớn tuổi hoặc nhiều đồ.' },
      { title: 'Trải nghiệm xe điện', description: 'Phù hợp khi đã có kế hoạch quãng đường, điểm sạc và mức pin bàn giao.' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'xpander', 'carnival'],
    relatedLinks: [
      { href: '/di-dau/hai-phong', label: 'Lịch trình đi Hải Phòng' },
      { href: '/di-dau/ha-long', label: 'Lịch trình đi Hạ Long' },
      { href: '/thue-xe-dien-ha-noi', label: 'Thuê xe điện Hà Nội' },
    ],
    faqs: [
      { question: 'Car Match giao xe ở đâu trong Vinhomes Ocean Park?', answer: 'Điểm giao có thể là tòa, phân khu, khu thấp tầng hoặc cổng hẹn phù hợp. Khách cần gửi địa chỉ cụ thể để Car Match xác nhận điểm dừng và thời gian trước khi đặt cọc.' },
      { question: 'Thuê xe tại Ocean Park giá bao nhiêu?', answer: 'Giá ngày lấy theo từng xe đang hiển thị trên website. Tổng tiền còn phụ thuộc số ngày, giờ nhận trả, điểm giao nhận và lịch xe thực tế; Car Match xác nhận trước khi khách chốt.' },
      { question: 'Có thể thuê xe đi Hải Phòng hoặc Hạ Long không?', answer: 'Có thể nếu mẫu xe và lịch thuê phù hợp. Khách nên gửi điểm đến, số người, hành lý và quãng đường dự kiến để kiểm tra nhóm xe, giới hạn km và kế hoạch sạc nếu dùng xe điện.' },
      { question: 'Cần chuẩn bị giấy tờ gì?', answer: 'Khách cần CCCD bản gốc, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo mẫu xe. Điều kiện cụ thể được xác nhận trước khi giao.' },
    ],
  },
  {
    slug: 'vinhomes-smart-city',
    path: '/thue-xe-tu-lai-vinhomes-smart-city',
    name: 'Vinhomes Smart City',
    shortName: 'Smart City',
    locality: 'Tây Mỗ – Đại Mỗ, Nam Từ Liêm, Hà Nội',
    seoTitle: 'Thuê Xe Tự Lái Vinhomes Smart City | Car Match',
    description: 'Thuê xe tự lái tại Vinhomes Smart City, Nam Từ Liêm. Chọn xe theo giá thực tế và hẹn giao nhận đúng phân khu, tòa hoặc cổng.',
    heroAnswer: 'Cư dân Vinhomes Smart City có thể chọn xe trên Car Match và hẹn giao nhận theo lịch đã xác nhận. Hãy gửi đúng phân khu, tòa, cổng và ngày giờ để được kiểm tra mẫu xe, giá thuê và phí giao nhận nếu có.',
    pickupNote: 'Gửi tên phân khu, tòa, sảnh hoặc cổng thuận tiện tại Smart City. Nếu khu vực dừng xe có hạn chế, hai bên thống nhất điểm hẹn gần nhất trước giờ giao.',
    locationNote: 'Vinhomes Smart City thuộc khu vực Tây Mỗ – Đại Mỗ, Nam Từ Liêm, thuận tiện cho các hành trình phía Tây Hà Nội.',
    localContexts: [
      { title: 'Nhiều phân khu và tòa', description: 'Tên dự án chưa đủ để giao xe; cần có phân khu, tòa và cổng cụ thể.' },
      { title: 'Khởi hành phía Tây', description: 'Phù hợp lên kế hoạch đi Ba Vì, Đại Lải hoặc các chuyến cuối tuần phía Tây và Tây Bắc.' },
      { title: 'Hẹn sảnh hoặc cổng', description: 'Điểm bàn giao được chọn theo khả năng dừng xe và lịch vận hành tại thời điểm nhận.' },
    ],
    useCases: [
      { title: 'Gia đình đi cuối tuần', description: 'Ưu tiên xe đủ ghế và khoang hành lý, đặc biệt khi có trẻ nhỏ hoặc xe đẩy.' },
      { title: 'Công việc ngắn ngày', description: 'Xe 5 chỗ gọn giúp chủ động lịch gặp đối tác và di chuyển nhiều điểm.' },
      { title: 'Nhóm 6–7 người', description: 'Gửi trước số vali để kiểm tra xe 7 chỗ phù hợp, tránh đủ ghế nhưng thiếu khoang đồ.' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'xpander', 'limo green'],
    relatedLinks: [
      { href: '/di-dau/ba-vi', label: 'Lịch trình đi Ba Vì' },
      { href: '/di-dau/dai-lai', label: 'Lịch trình đi Đại Lải' },
      { href: '/thue-xe-7-cho-tu-lai-ha-noi', label: 'Thuê xe 7 chỗ' },
    ],
    faqs: [
      { question: 'Car Match giao xe tại tòa nào ở Smart City?', answer: 'Car Match kiểm tra phương án theo từng lịch và địa chỉ. Khách gửi tên phân khu, tòa, sảnh hoặc cổng để hai bên thống nhất điểm giao phù hợp trước khi chốt.' },
      { question: 'Giá thuê đã gồm phí giao nhận chưa?', answer: 'Không nên mặc định. Giá trên thẻ xe là giá thuê tham khảo theo ngày; phí giao nhận nếu có được báo theo địa điểm, khung giờ và lịch xe thực tế.' },
      { question: 'Nên thuê xe gì cho gia đình đi Ba Vì?', answer: 'Nhóm nhỏ có thể chọn xe 5 chỗ; nhóm đông hoặc nhiều hành lý nên so sánh xe 7 chỗ. Quyết định cuối cùng dựa trên số người, đồ mang theo và điều kiện đường đi.' },
      { question: 'Có thể nhận xe sớm hoặc trả muộn không?', answer: 'Khung giờ cần được xác nhận theo lịch xe và đội giao nhận. Khách nên gửi giờ mong muốn ngay khi hỏi xe để được báo phương án và phụ phí nếu có.' },
    ],
  },
  {
    slug: 'times-city',
    path: '/thue-xe-tu-lai-times-city',
    name: 'Vinhomes Times City',
    shortName: 'Times City',
    locality: '458 Minh Khai, Hai Bà Trưng, Hà Nội',
    seoTitle: 'Thuê Xe Tự Lái Times City Hà Nội | Car Match',
    description: 'Thuê xe tự lái tại Times City, Minh Khai. Xem xe và giá theo dữ liệu thực tế, hẹn giao nhận đúng tòa, sảnh hoặc điểm dừng đã xác nhận.',
    heroAnswer: 'Car Match hỗ trợ giao nhận xe tự lái tại Times City theo lịch đã xác nhận. Khách gửi tòa, sảnh hoặc điểm hẹn trên Minh Khai cùng ngày giờ thuê để kiểm tra xe và thống nhất cách bàn giao.',
    pickupNote: 'Gửi tên tòa, sảnh và số điện thoại người nhận. Do khu vực nội đô đông xe, Car Match sẽ xác nhận điểm dừng và khung giờ phù hợp thay vì mặc định giao tại mọi sảnh.',
    locationNote: 'Times City nằm trên phố Minh Khai, thuận tiện cho khách ở khu vực Hai Bà Trưng và các quận nội thành.',
    localContexts: [
      { title: 'Điểm dừng nội đô', description: 'Tòa và sảnh cụ thể giúp hai bên chọn điểm bàn giao ngắn gọn, hạn chế chờ ở khu vực đông xe.' },
      { title: 'Lịch nhận trả rõ ràng', description: 'Nên chốt giờ từ đầu để sắp xếp giao nhận và tính đúng số ngày thuê.' },
      { title: 'Đi nhiều điểm trong thành phố', description: 'Xe gọn phù hợp công việc; xe rộng hơn phù hợp gia đình và hành lý.' },
    ],
    useCases: [
      { title: 'Đi công việc', description: 'Chủ động nhiều điểm hẹn trong ngày với xe 5 chỗ gọn.' },
      { title: 'Về quê hoặc đi tỉnh', description: 'So sánh giá thuê cùng nhiên liệu, cầu đường, km và chỗ đỗ.' },
      { title: 'Đón người thân', description: 'Gửi số người và vali để chọn xe đủ chỗ thực tế.' },
    ],
    recommendedKeywords: ['vf 3', 'vf3', 'vf 5', 'vf5', 'xpander'],
    relatedLinks: [
      { href: '/di-dau/ninh-binh', label: 'Lịch trình đi Ninh Bình' },
      { href: '/xe-san-bay-noi-bai', label: 'Xe sân bay Nội Bài' },
      { href: '/thue-xe-thang', label: 'Thuê xe theo tháng' },
    ],
    faqs: [
      { question: 'Có giao xe tận sảnh Times City không?', answer: 'Có thể hẹn tại sảnh hoặc điểm dừng phù hợp sau khi xác nhận. Khách cần gửi tòa, sảnh, ngày giờ và số liên hệ để Car Match kiểm tra phương án thực tế.' },
      { question: 'Thuê xe ở Times City được tính giá thế nào?', answer: 'Giá thuê lấy theo mẫu xe và thời lượng thực tế. Phí giao nhận, nhiên liệu hoặc sạc, cầu đường, gửi xe và vượt km nếu có được tách rõ trước khi chốt.' },
      { question: 'Xe nào phù hợp đi trong nội thành?', answer: 'Xe 4–5 chỗ gọn thường dễ sử dụng hơn khi đi phố. Nếu đi đông người hoặc có nhiều hành lý, nên chuyển sang xe 7 chỗ sau khi đối chiếu khoang đồ.' },
      { question: 'Cần kiểm tra gì lúc nhận xe?', answer: 'Hai bên nên ghi nhận ngoại thất, nội thất, mức xăng hoặc pin, số km, phụ kiện, giấy tờ xe và điều kiện trả xe trong biên bản bàn giao.' },
    ],
  },
  {
    slug: 'ecopark',
    path: '/thue-xe-tu-lai-ecopark',
    name: 'Ecopark',
    shortName: 'Ecopark',
    locality: 'Văn Giang, Hưng Yên',
    seoTitle: 'Thuê Xe Tự Lái Ecopark Văn Giang | Car Match',
    description: 'Thuê xe tự lái tại Ecopark, Văn Giang. Chọn xe theo giá thực tế và xác nhận lịch, phân khu, tòa hoặc điểm hẹn trước khi giao.',
    heroAnswer: 'Car Match tiếp nhận yêu cầu giao nhận xe tự lái tại Ecopark theo lịch đã xác nhận. Vì Ecopark thuộc Văn Giang, Hưng Yên, khách cần gửi phân khu, tòa hoặc địa chỉ cụ thể để kiểm tra xe, thời gian và phí giao nhận nếu có.',
    pickupNote: 'Gửi phân khu, tòa, dãy nhà hoặc điểm hẹn cụ thể tại Ecopark. Phương án giao từ Hà Nội được xác nhận theo mẫu xe, lịch thuê và khung giờ thực tế.',
    locationNote: 'Ecopark thuộc Văn Giang, Hưng Yên; đây là khu vực lân cận Hà Nội nên điều kiện giao nhận cần được kiểm tra riêng.',
    localContexts: [
      { title: 'Ngoài địa giới Hà Nội', description: 'Thời gian và phí giao nhận nếu có phải được xác nhận theo lịch, không áp dụng mặc định như điểm nội thành.' },
      { title: 'Nhiều phân khu', description: 'Tên tòa, dãy nhà hoặc khu biệt thự giúp đội giao xe tới đúng điểm.' },
      { title: 'Kết hợp đi phía Đông', description: 'Có thể lên kế hoạch tiếp tục đi Hải Phòng hoặc các điểm phía Đông nếu quãng đường và xe phù hợp.' },
    ],
    useCases: [
      { title: 'Gia đình cuối tuần', description: 'Chọn xe theo số người, trẻ em và lượng hành lý.' },
      { title: 'Di chuyển vào Hà Nội', description: 'Xe tự lái giúp chủ động nhiều điểm đến và giờ quay về.' },
      { title: 'Hành trình xe điện', description: 'Cần thống nhất mức pin bàn giao và kiểm tra điểm sạc trên lịch trình.' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'vf 6', 'vf6', 'xpander'],
    relatedLinks: [
      { href: '/di-dau/ecopark', label: 'Kinh nghiệm đi Ecopark' },
      { href: '/thue-xe-dien-ha-noi', label: 'Thuê xe điện' },
      { href: '/di-dau/hai-phong', label: 'Lịch trình đi Hải Phòng' },
    ],
    faqs: [
      { question: 'Car Match có giao xe tới Ecopark không?', answer: 'Car Match tiếp nhận yêu cầu và kiểm tra theo lịch xe, địa chỉ cùng khung giờ cụ thể. Vì Ecopark thuộc Văn Giang, Hưng Yên, phương án và phí giao nhận nếu có phải được xác nhận trước.' },
      { question: 'Cần gửi địa chỉ thế nào để nhận xe?', answer: 'Khách nên gửi phân khu, tên tòa, dãy nhà hoặc khu biệt thự, cổng thuận tiện và số điện thoại người nhận. Tên “Ecopark” riêng lẻ chưa đủ để chốt điểm giao.' },
      { question: 'Có thể thuê xe điện tại Ecopark không?', answer: 'Có thể nếu mẫu xe và lịch phù hợp. Khách cần kiểm tra điểm sạc theo hành trình và ghi nhận mức pin, phụ kiện sạc khi bàn giao.' },
      { question: 'Giá trên website có phải tổng cuối cùng không?', answer: 'Chưa. Giá thẻ xe là giá thuê theo ngày; tổng cuối cùng còn phụ thuộc thời lượng, giao nhận, giới hạn km và các chi phí sử dụng thực tế.' },
    ],
  },
  {
    slug: 'the-manor-central-park',
    path: '/thue-xe-tu-lai-the-manor',
    name: 'The Manor Central Park',
    shortName: 'The Manor',
    locality: 'Nguyễn Xiển – Nghiêm Xuân Yêm, Hoàng Mai, Hà Nội',
    seoTitle: 'Thuê Xe Tự Lái The Manor Central Park | Car Match',
    description: 'Thuê xe tự lái tại The Manor Central Park, Nguyễn Xiển. Xem xe và giá thực tế, hẹn giao nhận tại địa chỉ hoặc cổng đã xác nhận.',
    heroAnswer: 'Car Match hỗ trợ giao nhận xe tự lái tại The Manor Central Park theo lịch đã xác nhận. Khách gửi dãy nhà, số nhà hoặc cổng hẹn cùng ngày giờ để kiểm tra xe, báo chi phí và chốt điểm bàn giao.',
    pickupNote: 'Gửi dãy nhà, số nhà, khu căn hộ hoặc cổng thuận tiện trên trục Nguyễn Xiển – Nghiêm Xuân Yêm. Điểm dừng được thống nhất trước để bàn giao gọn và an toàn.',
    locationNote: 'The Manor Central Park nằm trên trục Nguyễn Xiển – Nghiêm Xuân Yêm, khu vực Hoàng Mai, thuận tiện cho hành trình phía Nam và Tây Nam Hà Nội.',
    localContexts: [
      { title: 'Khu thấp tầng và căn hộ', description: 'Địa chỉ chi tiết giúp xác định đúng cổng, dãy nhà hoặc điểm hẹn.' },
      { title: 'Kết nối phía Nam', description: 'Phù hợp lên kế hoạch đi Ninh Bình hoặc các chuyến theo hướng Nam Hà Nội.' },
      { title: 'Thuê dài ngày', description: 'Khách dùng đều có thể so sánh giá ngày với gói tháng và điều kiện km.' },
    ],
    useCases: [
      { title: 'Công tác và doanh nghiệp', description: 'Chủ động lịch gặp nhiều điểm, có thể yêu cầu báo giá dài ngày hoặc theo tháng.' },
      { title: 'Gia đình đi tỉnh', description: 'So sánh xe 5 chỗ và 7 chỗ theo số người, hành lý và quãng đường.' },
      { title: 'Sử dụng định kỳ', description: 'Nên gửi số km dự kiến mỗi tháng để kiểm tra đúng gói và phụ phí.' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'carnival', 'xpander'],
    relatedLinks: [
      { href: '/thue-xe-thang', label: 'Thuê xe theo tháng' },
      { href: '/thue-xe-7-cho-tu-lai-ha-noi', label: 'Thuê xe 7 chỗ' },
      { href: '/di-dau/ninh-binh', label: 'Lịch trình đi Ninh Bình' },
    ],
    faqs: [
      { question: 'Car Match giao xe ở đâu tại The Manor Central Park?', answer: 'Khách có thể đề xuất dãy nhà, số nhà, khu căn hộ hoặc cổng thuận tiện. Car Match sẽ kiểm tra khả năng dừng xe và xác nhận điểm hẹn trước giờ giao.' },
      { question: 'Có gói thuê xe theo tháng tại The Manor không?', answer: 'Có thể đăng ký thuê theo tháng nếu có mẫu xe và lịch phù hợp. Khách nên gửi thời hạn thuê, số km dự kiến, loại xe và nhu cầu chứng từ để nhận báo giá đúng.' },
      { question: 'Nên chọn xe nào để đi Ninh Bình?', answer: 'Nhóm ít người có thể chọn xe 5 chỗ; gia đình đông hoặc nhiều hành lý nên cân nhắc xe 7 chỗ. Cần tính thêm cầu đường, nhiên liệu hoặc sạc và chỗ đỗ.' },
      { question: 'Khi nào lịch xe được coi là đã xác nhận?', answer: 'Lịch chỉ được xác nhận sau khi Car Match kiểm tra mẫu xe, ngày giờ, điểm giao nhận, báo đầy đủ điều kiện và hoàn tất bước giữ lịch theo hướng dẫn.' },
    ],
  },
];

export const localRentalAreaBySlug = new Map(localRentalAreas.map((area) => [area.slug, area]));

export function getLocalRentalArea(slug: LocalRentalAreaSlug) {
  return localRentalAreaBySlug.get(slug);
}
