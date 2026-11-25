import { wave2LocalRentalAreas } from './localRentalExpansionAreas.ts';

export type LocalRentalAreaSlug =
  | 'vinhomes-ocean-park'
  | 'vinhomes-smart-city'
  | 'times-city'
  | 'ecopark'
  | 'the-manor-central-park'
  | 'cau-giay'
  | 'my-dinh'
  | 'ha-dong'
  | 'tay-ho'
  | 'long-bien'
  | 'hoan-kiem'
  | 'hai-ba-trung'
  | 'thanh-xuan'
  | 'nam-tu-liem'
  | 'bac-tu-liem'
  | 'gia-lam'
  | 'dong-anh-noi-bai';

export interface LocalRentalArea {
  slug: LocalRentalAreaSlug;
  path: string;
  name: string;
  shortName: string;
  locality: string;
  seoTitle: string;
  description: string;
  heroSubhead: string;
  heroAnswer: string;
  pickupNote: string;
  localContexts: Array<{ title: string; description: string }>;
  useCases: Array<{ title: string; description: string; filter?: 'five-seat' | 'seven-seat' }>;
  recommendedKeywords: string[];
  nearbySlugs: LocalRentalAreaSlug[];
  relatedLinks: Array<{ href: string; label: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

const confirmedLocalRentalAreas: LocalRentalArea[] = [
  {
    slug: 'vinhomes-ocean-park',
    path: '/thue-xe-tu-lai-vinhomes-ocean-park',
    name: 'Vinhomes Ocean Park',
    shortName: 'Ocean Park',
    locality: 'Cư dân Vinhomes Ocean Park và các phân khu phía Đông.',
    seoTitle: 'Thuê Xe Tự Lái Vinhomes Ocean Park | Car Match',
    description: 'Thuê xe tự lái Vinhomes Ocean Park. Cách ghi phân khu, số tòa và cổng, xem điểm tự nhận trên bản đồ và chọn xe cho chuyến đi phía Đông.',
    heroSubhead: 'Thuê xe thuận tiện cho cư dân Ocean Park',
    heroAnswer: 'Đi làm, đưa đón gia đình hay đi chơi cuối tuần? Chọn xe và gửi tên dự án, phân khu, tòa hoặc cổng nhận để hẹn bàn giao.',
    pickupNote: 'Phân biệt Ocean Park tại Gia Lâm với Ocean Park 2 và 3. Gửi tên phân khu, mã tòa hoặc dãy nhà và cổng đến từ đường lớn. Nếu khách đến cần đăng ký vào, báo trước để thống nhất chỗ dừng.',
    localContexts: [
      { title: 'Xe và giá', description: 'Gia đình mang xe đẩy, đồ dã ngoại hoặc nhiều vali nên so khoang đồ khi dùng đủ ghế.' },
      { title: 'Giao nhận', description: 'Ghi Ocean Park 1, 2 hoặc 3, kèm phân khu, số tòa hay cổng để Car Match hẹn đúng nơi nhận.' },
      { title: 'Lịch và điều kiện', description: 'Chừa thời gian qua cổng, tập kết hành lý và kiểm tra xe trước khi rời khu đô thị.' },
    ],
    useCases: [
      { title: 'Gia đình ở tòa căn hộ đi biển', description: 'Tập kết hành lý ở điểm đón cho phép, rồi tính km và phí đường bộ theo hành trình.', filter: 'seven-seat' },
      { title: 'Cư dân dãy thấp tầng về quê', description: 'Ghi dãy, số nhà và cổng thuận tuyến, chọn xe theo số người và đồ mang theo.' },
      { title: 'Nhận xe ở điểm tự nhận', description: 'Mở bản đồ để so đường đi bộ hoặc đi xe tới điểm hẹn, sau đó chốt giờ bàn giao.' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'xpander', 'carnival'],
    nearbySlugs: ['gia-lam', 'long-bien', 'ecopark', 'times-city'],
    relatedLinks: [
      { href: '/di-dau/ha-long', label: 'Lộ trình đi Hạ Long' },
      { href: '/di-dau/hai-phong', label: 'Lộ trình đi Hải Phòng' },
    ],
    faqs: [
      { question: 'Ocean Park 1, 2 và 3 có thể ghi chung địa chỉ không?', answer: 'Hãy ghi đúng dự án, phân khu và địa chỉ hoặc vị trí bản đồ. Car Match kiểm tra tuyến và phí theo địa chỉ cụ thể.' },
      { question: 'Có thể tự nhận xe tại Ocean Park ở đâu?', answer: 'Chọn Ocean Park trong mục Tự nhận xe và mở bản đồ đi kèm. Chốt giờ theo lịch mẫu xe đang chọn.' },
      { question: 'Giao tới Sapphire hoặc Pavilion cần gửi gì?', answer: 'Gửi mã tòa, cổng/sảnh có thể dừng và thông tin đăng ký vào nếu có. Ưu tiên một điểm hai bên dễ tìm và có chỗ kiểm tra xe.' },
      { question: 'Có thể trả ở cổng khác cổng nhận không?', answer: 'Điền cả hai vị trí khi chọn giao nhận hai chiều. Ghi rõ phân khu ở mỗi điểm để kiểm tra lộ trình và phí.' },
    ],
  },
  {
    slug: 'vinhomes-smart-city',
    path: '/thue-xe-tu-lai-vinhomes-smart-city',
    name: 'Vinhomes Smart City',
    shortName: 'Smart City',
    locality: 'Cư dân Smart City ở khu Tây Mỗ – Đại Mỗ.',
    seoTitle: 'Thuê Xe Tự Lái Vinhomes Smart City | Car Match',
    description: 'Thuê xe tự lái Vinhomes Smart City cho cư dân Tây Mỗ – Đại Mỗ. Xem xe, cách ghi tòa và cổng, chọn lối ra thuận chuyến đi.',
    heroSubhead: 'Xe cho cư dân, linh hoạt theo lịch của bạn',
    heroAnswer: 'Chọn xe đi làm, về quê hoặc du lịch từ Smart City. Gửi mã tòa, sảnh hoặc điểm hẹn để Car Match kiểm tra phương án giao nhận.',
    pickupNote: 'Chỉ rõ tên phân khu, mã tòa và cổng vào từ đường chính. Hỏi trước chỗ đón khách có thể dừng kiểm tra xe, nhất là khi sảnh và lối xuống hầm dùng đường khác nhau.',
    localContexts: [
      { title: 'Xe và giá', description: 'Chuyến cuối tuần theo hướng Ba Vì phù hợp xe đủ chỗ cho đồ dã ngoại; kiểm tra cốp khi dùng hết hàng ghế.' },
      { title: 'Giao nhận', description: 'Gửi tên phân khu, mã tòa và cổng hoặc sảnh thuận tiện để Car Match kiểm tra cách giao xe.' },
      { title: 'Lịch và điều kiện', description: 'Nếu chọn nhận vào buổi sáng, chừa thời gian qua cổng và chuyển hành lý từ tòa xuống điểm hẹn.' },
    ],
    useCases: [
      { title: 'Cư dân đi Ba Vì cuối tuần', description: 'Chọn sảnh hoặc cổng thuận đường ra, rồi so khoang đồ theo số người.' },
      { title: 'Đón người thân về Smart City', description: 'Xem chỗ dừng gần tòa để đưa vali lên nhà và kiểm tra giờ trả.' },
      { title: 'Dùng xe khi xe nhà bảo dưỡng', description: 'So số ngày cần dùng và hỏi chỗ gửi qua đêm ở khu căn hộ.', filter: 'five-seat' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'xpander', 'limo green'],
    nearbySlugs: ['nam-tu-liem', 'my-dinh', 'ha-dong', 'cau-giay'],
    relatedLinks: [
      { href: '/di-dau/ba-vi', label: 'Lịch trình Ba Vì' },
      { href: '/di-dau/dai-lai', label: 'Lịch trình Đại Lải' },
    ],
    faqs: [
      { question: 'Chỉ ghi tên Smart City thì đủ để hẹn nhận xe không?', answer: 'Gửi phân khu, mã tòa và cổng hoặc sảnh có thể dừng. Dùng thêm một vị trí bản đồ nếu có nhiều lối vào.' },
      { question: 'Có bắt buộc nhận xe ở sảnh không?', answer: 'Hai bên có thể hẹn ở cổng hoặc điểm đón khác được phép dừng, tùy điều kiện tại tòa.' },
      { question: 'Có điểm tự nhận cố định ở Smart City không?', answer: 'Trang mặc định giao theo địa chỉ Smart City. Nếu muốn tự nhận, xem các điểm có trong phần đặt xe và chọn điểm thuận đường.' },
      { question: 'Đi Ba Vì nên giao xe ở cổng nào để tiện xuất phát?', answer: 'Chọn cổng được phép dừng và thuận hướng bạn dự kiến đi. Gửi tên lối ra, giờ khởi hành và vị trí hẹn để Car Match kiểm tra.' },
    ],
  },
  {
    slug: 'times-city',
    path: '/thue-xe-tu-lai-times-city',
    name: 'Vinhomes Times City',
    shortName: 'Times City',
    locality: 'Cư dân Times City trên phố Minh Khai.',
    seoTitle: 'Thuê Xe Tự Lái Times City Hà Nội | Car Match',
    description: 'Thuê xe tự lái Times City, Minh Khai. Hướng dẫn chọn điểm tự nhận hoặc giao theo mã tòa, sảnh và chỗ dừng phù hợp.',
    heroSubhead: 'Thuê xe thuận tiện ngay khu vực bạn sinh sống',
    heroAnswer: 'Cần xe đi làm, đưa đón gia đình hoặc đi tỉnh? Chọn lịch thuê và hẹn nhận theo tòa, sảnh hoặc điểm tự nhận đã được xác nhận.',
    pickupNote: 'Nhập mã tòa và tên sảnh, nhất là nếu khu căn hộ có lối đón xe riêng với đường vào bãi. Nếu tự nhận, mở bản đồ ngay trong phần đặt xe để tới điểm hẹn thay vì tới cổng bất kỳ của dự án.',
    localContexts: [
      { title: 'Xe và giá', description: 'Khởi hành qua Vĩnh Tuy hoặc đón nhiều điểm nên so xe theo số người, vali và chỗ đỗ.' },
      { title: 'Giao nhận', description: 'Nếu muốn nhận gần tòa ở Times City hoặc Park Hill, gửi mã tòa và sảnh có chỗ dừng để hẹn giao.' },
      { title: 'Lịch và điều kiện', description: 'Hẹn giờ tập kết hành lý để không phải dừng lâu tại sảnh và đủ thời gian kiểm tra xe.' },
    ],
    useCases: [
      { title: 'Cư dân nhận xe để về quê', description: 'Tập kết đồ ở điểm đón, chọn xe theo số người và thể tích khoang đồ.' },
      { title: 'Tự nhận trước lịch công việc', description: 'Xem bản đồ, xác định cách tới điểm hẹn và dự trù thời gian kiểm tra xe.', filter: 'five-seat' },
      { title: 'Đón gia đình qua Vĩnh Tuy', description: 'Xếp thứ tự đón thuận tuyến và nhập riêng điểm trả nếu quay về khu khác.' },
    ],
    recommendedKeywords: ['vf 3', 'vf3', 'vf 5', 'vf5', 'xpander'],
    nearbySlugs: ['hai-ba-trung', 'long-bien', 'hoan-kiem', 'vinhomes-ocean-park'],
    relatedLinks: [
      { href: '/di-dau/ninh-binh', label: 'Lộ trình đi Ninh Bình' },
      { href: '/chinh-sach', label: 'Quy trình kiểm tra và trả xe' },
    ],
    faqs: [
      { question: 'Điểm tự nhận Times City và giao tận tòa khác nhau thế nào?', answer: 'Tự nhận dùng vị trí bản đồ của Times City trong phần đặt xe. Giao gần tòa cần ghi mã tòa, sảnh hoặc cổng và xác nhận phí theo lịch.' },
      { question: 'Ở Park Hill nên ghi địa chỉ nhận thế nào?', answer: 'Ghi tên khu, mã tòa và lối đón ô tô có thể dừng. Báo trước nếu sảnh và vị trí trên bản đồ dùng hai lối khác nhau.' },
      { question: 'Có thể hẹn giao ở khu đón khách thay vì vào hầm không?', answer: 'Có thể đề xuất khu đón khách được phép dừng. Car Match xác nhận cùng bạn trước để đủ chỗ bàn giao.' },
      { question: 'Đi tỉnh qua Vĩnh Tuy nên kiểm tra điều kiện nào?', answer: 'Xem km/ngày và phí vượt km theo xe. Dự trù thời gian từ khi bạn nhận xe ở Minh Khai đến lúc qua cầu, nhất là nếu có thêm điểm đón.' },
    ],
  },
  {
    slug: 'ecopark',
    path: '/thue-xe-tu-lai-ecopark',
    name: 'Ecopark',
    shortName: 'Ecopark',
    locality: 'Cư dân Ecopark, khu Văn Giang, Hưng Yên.',
    seoTitle: 'Thuê Xe Tự Lái Ecopark Văn Giang | Car Match',
    description: 'Thuê xe tự lái Ecopark, Hưng Yên. Xem xe và hướng dẫn ghi phân khu, tòa/cổng, xác nhận phí giao từ Hà Nội theo địa chỉ.',
    heroSubhead: 'Xe cho cư dân Ecopark đi Hà Nội và đi tỉnh',
    heroAnswer: 'Xem các mẫu xe 4–7 chỗ, chọn ngày thuê và gửi tên phân khu, tòa nhà hoặc dãy nhà tại Ecopark để kiểm tra phương án giao nhận.',
    pickupNote: 'Ghi đúng khu Ecopark, cụm căn hộ hoặc đường nội khu và cổng có thể tiếp cận. Nhập riêng nơi trả nếu kết thúc chuyến ở Hà Nội. Khoản giao nhận qua địa bàn cần được báo lại trước khi chốt.',
    localContexts: [
      { title: 'Xe và giá', description: 'So xe theo hành lý và số km đi về nếu chuyến kết hợp vào Hà Nội và ghé thêm điểm khác.' },
      { title: 'Giao nhận', description: 'Gửi phân khu và số tòa hoặc dãy nhà, kèm vị trí cổng thuận đường từ ngoài dự án.' },
      { title: 'Lịch và điều kiện', description: 'Mức trong phần đặt xe là dự toán. Chốt khoản giao nhận theo hai điểm, đặc biệt khi một đầu chuyến ở Hưng Yên.' },
    ],
    useCases: [
      { title: 'Cư dân Ecopark đi làm tại Hà Nội', description: 'Chọn giờ nhận đủ để ra cổng và chừa thời gian vào nội đô.', filter: 'five-seat' },
      { title: 'Gia đình đi chơi quanh Văn Giang', description: 'So cốp xe với xe đẩy và đồ dã ngoại, rồi kiểm tra nơi gửi ở điểm đến.' },
      { title: 'Nhận tại Ecopark, trả ở Hà Nội', description: 'Gửi riêng hai điểm, gồm cổng hoặc vị trí dừng, để kiểm tra mỗi lượt theo tuyến thực tế.' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'vf 6', 'vf6', 'xpander'],
    nearbySlugs: ['vinhomes-ocean-park', 'gia-lam', 'long-bien', 'times-city'],
    relatedLinks: [
      { href: '/di-dau/ecopark', label: 'Thông tin đi lại quanh Ecopark' },
      { href: '/chinh-sach', label: 'Điều kiện giao nhận thuê xe' },
    ],
    faqs: [
      { question: 'Ecopark thuộc khu vực nào khi điền địa chỉ?', answer: 'Ghi Ecopark, Hưng Yên, cùng phân khu, tòa hoặc đường nội khu và vị trí hẹn. Thông tin đó giúp phân biệt với địa chỉ phía Hà Nội.' },
      { question: 'Mức phí trong phần đặt xe đã là phí giao đến Ecopark chưa?', answer: 'Đó là mức tạm tính theo chế độ giao nhận. Car Match xác nhận lại phí theo vị trí cụ thể ở Ecopark và nơi trả xe.' },
      { question: 'Có điểm tự nhận của Car Match trong Ecopark không?', answer: 'Trang Ecopark tiếp nhận yêu cầu giao theo địa chỉ. Để tự nhận, chọn một điểm hiện có trong phần đặt xe và xem bản đồ trước khi quyết định.' },
      { question: 'Nhận tại cụm căn hộ nhưng trả bên Hà Nội có được không?', answer: 'Bạn có thể nhập hai địa chỉ trong lựa chọn hai chiều. Chốt giờ và phí theo cả hai điểm trước khi giữ lịch.' },
    ],
  },
  {
    slug: 'the-manor-central-park',
    path: '/thue-xe-tu-lai-the-manor',
    name: 'The Manor Central Park',
    shortName: 'The Manor',
    locality: 'The Manor Central Park trên trục Nguyễn Xiển.',
    seoTitle: 'Thuê Xe Tự Lái The Manor Central Park | Car Match',
    description: 'Thuê xe tự lái The Manor Central Park ở Nguyễn Xiển. Xem xe, cách chọn điểm nhận và hẹn đúng dãy nhà, cổng hoặc đường nội khu.',
    heroSubhead: 'Thuê xe thuận tiện từ khu đô thị Nguyễn Xiển',
    heroAnswer: 'Chọn xe cho công việc, gia đình hoặc chuyến đi cuối tuần. Gửi dãy nhà, cổng hoặc vị trí nhận thuận tiện để hẹn bàn giao.',
    pickupNote: 'Ghi The Manor Central Park, dãy/số nhà hoặc mốc đường nội khu và cổng thuận tiện trên trục Nguyễn Xiển – Nghiêm Xuân Yêm. Nếu tự nhận, dùng bản đồ đi kèm điểm trong phần đặt xe để kiểm tra vị trí.',
    localContexts: [
      { title: 'Xe và giá', description: 'Khách đi tỉnh phía Nam nên tính số người, khoang đồ và km cả lượt về trước khi chọn.' },
      { title: 'Giao nhận', description: 'Gửi dãy, số nhà và cổng thuận tiện ở The Manor Central Park trên trục Nguyễn Xiển.' },
      { title: 'Lịch và điều kiện', description: 'Nếu thuê dài ngày, kiểm tra lịch sử dụng và chỗ đỗ qua đêm rồi so gói tháng theo số km.' },
    ],
    useCases: [
      { title: 'Cư dân thấp tầng đi tỉnh cuối tuần', description: 'Ghi dãy nhà và cổng ra thuận tuyến, chọn khoang đồ theo hành lý gia đình.', filter: 'seven-seat' },
      { title: 'Đi làm nhiều ngày', description: 'So gói ngày và tháng theo ngày dùng, số km và nhu cầu chứng từ.' },
      { title: 'Đón gia đình ở phía Nam Hà Nội', description: 'Xếp điểm đón theo hướng xuất phát, nhập riêng nơi trả nếu kết thúc chuyến ở khu khác.' },
    ],
    recommendedKeywords: ['vf 5', 'vf5', 'carnival', 'xpander'],
    nearbySlugs: ['thanh-xuan', 'ha-dong', 'nam-tu-liem', 'cau-giay'],
    relatedLinks: [
      { href: '/di-dau/ninh-binh', label: 'Lộ trình đi Ninh Bình' },
      { href: '/thue-xe-thang', label: 'Xem phương án thuê xe theo tháng' },
    ],
    faqs: [
      { question: 'The Manor Central Park có phải The Manor Mỹ Đình không?', answer: 'Đây là dự án trên trục Nguyễn Xiển – Nghiêm Xuân Yêm. Nếu ở Mỹ Đình, dùng trang Mỹ Đình và gửi đúng tên tòa hoặc địa chỉ.' },
      { question: 'Tự nhận xe ở The Manor Central Park kiểm tra vị trí thế nào?', answer: 'Chọn The Manor Central Park trong phần đặt xe và mở bản đồ của điểm đó. Chốt giờ và vị trí hẹn theo lịch được xác nhận.' },
      { question: 'Nhà trong dãy thấp tầng nên ghi địa chỉ theo cổng hay số nhà?', answer: 'Ghi cả dãy, số nhà và cổng vào để nhân viên tìm đúng đường. Nếu dừng ở cổng, gửi vị trí bản đồ của cổng.' },
      { question: 'Thuê đi Ninh Bình rồi trả ở Nguyễn Xiển nên dự trù gì?', answer: 'Kiểm tra km xe, phí vượt nếu có, cầu đường và giờ về. Chọn điểm trả có thể bàn giao mà không phải dừng ở lối vào đông xe.' },
    ],
  },
];

export const localRentalAreas: LocalRentalArea[] = [
  ...confirmedLocalRentalAreas,
  ...wave2LocalRentalAreas,
].map((area) => ({
  ...area,
  faqs: [
    {
      question: `Xem giá thuê xe và phí giao nhận tại ${area.shortName} ở đâu?`,
      answer: 'Giá theo ngày nằm trên mỗi thẻ xe. Chọn xe và giờ nhận trả để xem tiền thuê dự kiến. Với giao tận nơi, nhập địa chỉ nhận hoặc trả để Car Match xác nhận phí theo từng chiều.',
    },
    {
      question: 'Cần chuẩn bị giấy tờ gì và khi nào đặt cọc?',
      answer: 'Mang giấy tờ định danh và giấy phép lái xe phù hợp. Xem yêu cầu bảo đảm trong thông tin của xe đã chọn. Car Match xác nhận lịch và chi phí trước khi hướng dẫn cọc giữ lịch. Tài sản bảo đảm được đối chiếu riêng khi nhận xe.',
    },
    ...area.faqs,
  ],
}));

export const localRentalAreaBySlug = new Map(localRentalAreas.map((area) => [area.slug, area]));

export function getLocalRentalArea(slug: LocalRentalAreaSlug) {
  return localRentalAreaBySlug.get(slug);
}
