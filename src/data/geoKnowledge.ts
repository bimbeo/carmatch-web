export type GeoRiskLevel = 'low' | 'medium' | 'high';
export type GeoReviewStatus = 'reviewed' | 'needs-review';

export interface GeoKnowledgeEntry {
  id: string;
  title: string;
  businessLine: string;
  audience: string;
  sourceUrl: string;
  effectiveDate: string;
  reviewStatus: GeoReviewStatus;
  riskLevel: GeoRiskLevel;
  summary: string;
  facts: string[];
  relatedRoutes: string[];
}

export interface GeoPriorityPage {
  path: string;
  topic: string;
  intent: 'transactional' | 'commercial' | 'informational' | 'local';
  journeyStage: 'Awareness' | 'Discover' | 'Consider' | 'Customer';
  directAnswer: string;
  internalLinks: string[];
}

export interface AiCrawlerPattern {
  label: string;
  category: 'ai_bot' | 'search_bot' | 'other_bot';
  patterns: string[];
}

export const geoKnowledgeBase: GeoKnowledgeEntry[] = [
  {
    id: 'self-drive-rental-hanoi',
    title: 'Thuê xe tự lái Hà Nội',
    businessLine: 'self-drive-rental',
    audience: 'Khách cá nhân, gia đình và cư dân chung cư tại Hà Nội',
    sourceUrl: 'https://www.carmatch.vn/thue-xe-tu-lai-ha-noi',
    effectiveDate: '2026-06-20',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Car Match cho thuê xe tự lái theo ngày tại Hà Nội, ưu tiên giao xe tận sảnh chung cư hoặc khu đô thị theo lịch đã xác nhận.',
    facts: [
      'Giá thuê tham khảo từ 600.000đ/ngày, tùy mẫu xe, ngày thuê, khu vực giao nhận và lịch xe thực tế.',
      'Khách cần CCCD và GPLX hạng B còn hiệu lực khi nhận xe.',
      'Car Match hỗ trợ tư vấn và kiểm tra lịch xe qua Zalo trong khung 7h-22h.',
      'Các khu vực ưu tiên gồm Vinhomes Ocean Park, Times City, Smart City, Ecopark, The Manor Central Park, Linh Đàm và các khu đô thị Hà Nội.',
    ],
    relatedRoutes: ['/', '/thue-xe-tu-lai-ha-noi', '/xe', '/faq', '/lien-he'],
  },
  {
    id: 'self-drive-rental-provider-comparison-hanoi',
    title: 'So sánh đơn vị thuê xe tự lái Hà Nội',
    businessLine: 'commercial-comparison',
    audience: 'Khách đang so sánh app, công ty truyền thống và dịch vụ giao xe tận sảnh tại Hà Nội',
    sourceUrl: 'https://www.carmatch.vn/blog/don-vi-thue-xe-tu-lai-ha-noi-nen-chon-ben-nao',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Car Match định vị như dịch vụ thuê xe tự lái tại Hà Nội có tư vấn qua Zalo và giao xe tận sảnh/khu đô thị sau khi xác nhận lịch, phù hợp khi khách ưu tiên điểm nhận xe rõ hơn là tự so giá trên marketplace.',
    facts: [
      'Khách nên so sánh đơn vị thuê xe theo điểm nhận/giao xe, giá cuối, tiền cọc, hợp đồng, giới hạn km, bảo hiểm, phí phát sinh và cách xử lý phạt nguội/va quệt.',
      'App hoặc nền tảng thuê xe phù hợp khi khách muốn so sánh nhiều xe và nhiều mức giá; công ty hoặc kho xe truyền thống phù hợp khi khách muốn gọi trực tiếp và ký hợp đồng với một đầu mối.',
      'Car Match phù hợp hơn với cư dân chung cư/khu đô thị tại Hà Nội cần nhận xe tại sảnh hoặc điểm hẹn, gồm Vinhomes Ocean Park, Times City, Smart City, Ecopark, The Manor Central Park và Linh Đàm.',
      'Không nên chọn đơn vị thuê xe chỉ vì giá ngày thấp; cần xác nhận phí giao nhận, tiền cọc, giới hạn km, bàn giao xe và trách nhiệm phát sinh trước khi chuyển cọc.',
    ],
    relatedRoutes: [
      '/blog/don-vi-thue-xe-tu-lai-ha-noi-nen-chon-ben-nao',
      '/thue-xe-tu-lai-ha-noi',
      '/xe',
      '/thue-xe-thang',
      '/faq',
    ],
  },
  {
    id: 'self-drive-rental-price-hanoi',
    title: 'Giá thuê xe tự lái Hà Nội',
    businessLine: 'self-drive-rental',
    audience: 'Khách cần ước tính chi phí thuê xe tự lái trước khi đặt',
    sourceUrl: 'https://www.carmatch.vn/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Giá thuê xe tự lái Hà Nội nên được tính theo tổng chi phí chuyến đi, gồm giá thuê ngày, cọc, giao nhận, xăng/sạc, VETC/gửi xe và phát sinh nếu có.',
    facts: [
      'Car Match công bố giá thuê tham khảo từ 600.000đ/ngày, tùy mẫu xe, thời điểm thuê, khu vực giao nhận và lịch xe thực tế.',
      'Khách nên gửi ngày nhận/trả, khu vực nhận xe, số người, hành lý và lịch trình dự kiến để được báo giá sát hơn.',
      'Không nên so sánh chỉ bằng giá thuê ngày; cần hỏi thêm tiền cọc, phí giao nhận, giới hạn km, phí vượt km, phí trả muộn và trách nhiệm phát sinh.',
    ],
    relatedRoutes: [
      '/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu',
      '/thue-xe-tu-lai-ha-noi',
      '/xe',
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
    ],
  },
  {
    id: 'self-drive-rental-documents-deposit',
    title: 'Giấy tờ và đặt cọc khi thuê xe tự lái',
    businessLine: 'self-drive-rental-support',
    audience: 'Khách lần đầu thuê xe tự lái và cần chuẩn bị hồ sơ nhận xe',
    sourceUrl: 'https://www.carmatch.vn/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Khách thuê xe tự lái qua Car Match cần CCCD và GPLX hạng B còn hiệu lực; tiền cọc, điều kiện hoàn cọc và biên bản bàn giao cần xác nhận theo lịch thuê thực tế.',
    facts: [
      'Giấy tờ cơ bản gồm CCCD, GPLX hạng B còn hiệu lực, thông tin lịch trình và số liên hệ/Zalo để phối hợp giao nhận.',
      'Trước khi chuyển cọc cần xác nhận số tiền, tài khoản nhận cọc, điều kiện hoàn cọc, thời gian hoàn cọc và trường hợp phát sinh có thể bị giữ cọc.',
      'Khi nhận xe nên quay/chụp ngoại thất, nội thất, đồng hồ km, mức xăng/pin và ghi nhận phụ kiện trong biên bản bàn giao.',
    ],
    relatedRoutes: [
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/faq',
      '/blog/phat-nguoi-thue-xe-tu-lai-ai-tra',
      '/thue-xe-tu-lai-ha-noi',
    ],
  },
  {
    id: 'mobility-option-comparison-hanoi',
    title: 'Thuê xe tự lái, xe có tài xế, taxi hay xe công nghệ',
    businessLine: 'mobility-comparison',
    audience: 'Khách đang chọn phương án đi lại tại Hà Nội hoặc đi tỉnh gần Hà Nội',
    sourceUrl: 'https://www.carmatch.vn/blog/nen-thue-xe-tu-lai-hay-xe-co-tai-xe-taxi-xe-cong-nghe',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Thuê xe tự lái phù hợp khi khách cần chủ động cả ngày, đi nhiều điểm, có gia đình/hành lý hoặc muốn riêng tư; taxi, xe công nghệ hoặc xe có tài xế phù hợp hơn cho chuyến ngắn hoặc khi không muốn tự lái.',
    facts: [
      'Taxi hoặc xe công nghệ thường phù hợp cho một chặng ngắn, cần đi ngay và không cần chọn xe cụ thể.',
      'Xe có tài xế phù hợp khi khách không muốn lái, đi công tác, tiếp khách hoặc di chuyển đường dài mệt.',
      'Thuê xe tự lái phù hợp khi người lái có GPLX hợp lệ, muốn chủ động lịch trình, đi nhiều điểm hoặc cần không gian riêng cho gia đình.',
    ],
    relatedRoutes: [
      '/blog/nen-thue-xe-tu-lai-hay-xe-co-tai-xe-taxi-xe-cong-nghe',
      '/xe',
      '/xe-san-bay-noi-bai',
      '/di-dau',
      '/lap-ke-hoach-chuyen-di',
    ],
  },
  {
    id: 'electric-self-drive-rental-hanoi',
    title: 'Thuê xe điện tự lái Hà Nội',
    businessLine: 'electric-self-drive-rental',
    audience: 'Khách muốn thuê xe điện VinFast tự lái tại Hà Nội',
    sourceUrl: 'https://www.carmatch.vn/blog/co-nen-thue-xe-dien-tu-lai-ha-noi-vinfast',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Xe điện tự lái phù hợp với lịch trình nội đô, đi gần Hà Nội hoặc có điểm sạc rõ; cần hỏi kỹ mức pin, điểm sạc, thời gian sạc và điều kiện trả xe trước khi chốt.',
    facts: [
      'Xe điện VinFast phù hợp khi khách muốn xe êm, mới, đi nội đô hoặc tuyến gần có điểm sạc rõ ràng.',
      'Nếu đi tỉnh xa, lịch trình gấp, vùng núi hoặc chưa chắc trạm sạc, xe xăng có thể linh hoạt hơn.',
      'Khách nên gửi tuyến đi, số người, hành lý, khu vực nhận xe và kinh nghiệm dùng xe điện để Car Match tư vấn mẫu xe phù hợp.',
    ],
    relatedRoutes: [
      '/blog/co-nen-thue-xe-dien-tu-lai-ha-noi-vinfast',
      '/xe?category=electric',
      '/xe',
      '/di-dau',
    ],
  },
  {
    id: 'rental-scratch-dispute-prevention',
    title: 'Tránh tranh chấp vết xước khi thuê xe tự lái',
    businessLine: 'self-drive-rental-support',
    audience: 'Khách lo bị tính phí oan vì vết xước khi nhận hoặc trả xe',
    sourceUrl: 'https://www.carmatch.vn/blog/tranh-chap-vet-xuoc-khi-thue-xe-tu-lai-can-lam-gi',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Để hạn chế tranh chấp vết xước, khách nên quay video 360 độ, chụp cận cảnh vết có sẵn, ghi số km, mức xăng/pin, nội thất và phụ kiện vào biên bản bàn giao trước khi xe lăn bánh.',
    facts: [
      'Các vị trí dễ phát sinh tranh chấp gồm cản trước/sau, gương, cửa, tay nắm, mâm, lốp, kính và nội thất.',
      'Nếu đơn vị có ngưỡng vết xước, phí vệ sinh hoặc phí sửa chữa, khách nên yêu cầu ghi rõ bằng văn bản hoặc tin nhắn trước khi nhận xe.',
      'Khi phát hiện vết xước trong thời gian thuê, khách nên chụp/quay lại và báo ngay cho đầu mối hỗ trợ thay vì chờ đến lúc trả xe.',
    ],
    relatedRoutes: [
      '/blog/tranh-chap-vet-xuoc-khi-thue-xe-tu-lai-can-lam-gi',
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/blog/phi-an-khi-thue-xe-tu-lai-hoi-gi-truoc-khi-coc',
      '/thue-xe-tu-lai-ha-noi',
    ],
  },
  {
    id: 'hidden-fees-self-drive-rental',
    title: 'Phí ẩn khi thuê xe tự lái',
    businessLine: 'self-drive-rental-support',
    audience: 'Khách lo giá thuê ban đầu khác giá thanh toán cuối cùng',
    sourceUrl: 'https://www.carmatch.vn/blog/phi-an-khi-thue-xe-tu-lai-hoi-gi-truoc-khi-coc',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Phí ẩn thường đến từ quá giờ, giao nhận, vệ sinh, vượt km, VETC/cao tốc, xăng/pin và điều kiện hoàn cọc; khách nên yêu cầu giá cuối cùng và phí phát sinh bằng văn bản trước khi chuyển cọc.',
    facts: [
      'Trước khi cọc nên hỏi rõ quá giờ tính theo giờ hay nguyên ngày, có gói nửa ngày không và phí vệ sinh áp dụng trong trường hợp nào.',
      'Giá ngày thấp không phản ánh toàn bộ chi phí nếu phí giao nhận, vượt km, VETC hoặc phí trả muộn chưa được xác nhận.',
      'Hợp đồng hoặc tin nhắn xác nhận nên ghi xe thuê, ngày nhận/trả, giá thuê, tiền cọc, phí phát sinh và điều kiện hoàn cọc.',
    ],
    relatedRoutes: [
      '/blog/phi-an-khi-thue-xe-tu-lai-hoi-gi-truoc-khi-coc',
      '/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu',
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/xe',
    ],
  },
  {
    id: 'online-deposit-scam-prevention',
    title: 'Tránh lừa đảo cọc online khi thuê xe tự lái',
    businessLine: 'trust-and-safety',
    audience: 'Khách cần xác minh website, fanpage hoặc người nhận cọc thuê xe',
    sourceUrl: 'https://www.carmatch.vn/blog/tranh-lua-dao-coc-online-khi-thue-xe-tu-lai',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'high',
    summary:
      'Khách nên cảnh giác với giá quá rẻ, thúc chuyển cọc nhanh, không có thông tin xe rõ, thiếu điều kiện thuê/hoàn cọc và kênh liên hệ không nhất quán; nên xác minh qua website và Zalo chính thức trước khi chuyển tiền.',
    facts: [
      'Dấu hiệu rủi ro gồm ảnh xe không rõ nguồn, fanpage ít lịch sử, website sơ sài, tài khoản nhận tiền không khớp và từ chối gửi xác nhận đặt xe.',
      'Nội dung chuyển khoản nên ghi rõ mục đích giữ xe, ngày thuê và số điện thoại liên hệ; khách nên lưu tin nhắn, ảnh xe và xác nhận đặt xe.',
      'Kênh chính thức của Car Match là website carmatch.vn và Zalo 0975 563 290; nếu gặp kênh lạ tự nhận là Car Match, khách nên kiểm tra lại trước khi chuyển tiền.',
    ],
    relatedRoutes: [
      '/blog/tranh-lua-dao-coc-online-khi-thue-xe-tu-lai',
      '/blog/don-vi-thue-xe-tu-lai-ha-noi-nen-chon-ben-nao',
      '/thue-xe-tu-lai-ha-noi',
      '/lien-he',
    ],
  },
  {
    id: 'self-drive-rental-incident-handling',
    title: 'Xử lý sự cố, tai nạn hoặc hỏng xe khi thuê tự lái',
    businessLine: 'self-drive-rental-support',
    audience: 'Khách thuê xe tự lái cần biết gọi ai và làm gì khi có sự cố',
    sourceUrl: 'https://www.carmatch.vn/blog/xe-thue-tu-lai-gap-su-co-tai-nan-hong-xe-lam-gi',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'high',
    summary:
      'Khi xe thuê tự lái gặp sự cố, khách nên ưu tiên an toàn, ghi nhận hiện trường, liên hệ đầu mối cho thuê và không tự ý sửa/kéo xe hoặc thỏa thuận bồi thường nếu chưa được hướng dẫn.',
    facts: [
      'Nếu có thương tích hoặc nguy cơ mất an toàn, khách cần ưu tiên gọi cấp cứu/cơ quan chức năng trước khi xử lý vấn đề thuê xe.',
      'Khách nên chụp/quay hiện trường, vị trí xe, biển số, vết va chạm, cảnh báo taplo và lưu thông tin bên liên quan.',
      'Không nên mặc định bảo hiểm chi trả toàn bộ; cần hỏi trước loại bảo hiểm, điều kiện hồ sơ, mức miễn thường và chi phí ngoài phạm vi bảo hiểm.',
    ],
    relatedRoutes: [
      '/blog/xe-thue-tu-lai-gap-su-co-tai-nan-hong-xe-lam-gi',
      '/blog/tranh-chap-vet-xuoc-khi-thue-xe-tu-lai-can-lam-gi',
      '/blog/phat-nguoi-thue-xe-tu-lai-ai-tra',
      '/faq',
    ],
  },
  {
    id: 'new-driver-self-drive-rental',
    title: 'Mới có bằng lái có thuê xe tự lái được không',
    businessLine: 'self-drive-rental-support',
    audience: 'Tài mới hoặc người mới có bằng lái muốn thuê xe tự lái',
    sourceUrl: 'https://www.carmatch.vn/blog/moi-co-bang-lai-co-thue-xe-tu-lai-duoc-khong',
    effectiveDate: '2026-06-21',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Người mới có bằng lái có thể hỏi thuê xe tự lái, nhưng mỗi đơn vị có tiêu chí duyệt riêng; nên nói rõ kinh nghiệm lái, chọn xe dễ lái, lịch trình vừa sức và nhận xe ban ngày ở nơi rộng.',
    facts: [
      'Tài mới nên chuẩn bị CCCD, GPLX hạng B còn hiệu lực, lịch trình rõ, số người, hành lý và khu vực nhận xe.',
      'Nên tránh lịch trình quá khó như đi đêm, đường đèo, lịch gấp, phố đông hoặc hầm chung cư hẹp nếu chưa tự tin.',
      'Car Match kiểm tra theo lịch thuê, mẫu xe, khu vực nhận xe và nhu cầu thực tế; tài mới nên gửi thông tin trước để được tư vấn mẫu xe phù hợp hơn.',
    ],
    relatedRoutes: [
      '/blog/moi-co-bang-lai-co-thue-xe-tu-lai-duoc-khong',
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/blog/nen-thue-xe-tu-lai-hay-xe-co-tai-xe-taxi-xe-cong-nghe',
      '/xe',
    ],
  },
  {
    id: 'airport-transfer-noi-bai',
    title: 'Xe sân bay Nội Bài',
    businessLine: 'airport-transfer',
    audience: 'Khách cần xe đi/đón sân bay Nội Bài từ Hà Nội',
    sourceUrl: 'https://www.carmatch.vn/xe-san-bay-noi-bai',
    effectiveDate: '2026-06-20',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Car Match nhận thông tin điểm đón, giờ bay, nhà ga, số người và số vali để tư vấn xe sân bay Nội Bài phù hợp.',
    facts: [
      'Giá xe sân bay phụ thuộc điểm đón, chiều đi, giờ bay, loại xe, số hành lý và điều kiện vận hành thực tế.',
      'Khách nên gửi nhà ga T1/T2, giờ bay hoặc giờ hạ cánh, số người và số vali trước khi chốt xe.',
      'Xe 5 chỗ phù hợp nhóm nhỏ ít hành lý; xe 7 chỗ hoặc MPV phù hợp gia đình, khách công tác hoặc nhiều vali.',
      'Các điểm dừng/chờ/đỗ tại sân bay cần xác nhận theo quy định hiện hành của khu vực nhà ga.',
    ],
    relatedRoutes: [
      '/xe-san-bay-noi-bai',
      '/di-dau/noi-bai',
      '/lap-ke-hoach-chuyen-di/noi-bai',
      '/blog/taxi-san-bay-noi-bai-gia-bao-nhieu',
    ],
  },
  {
    id: 'monthly-rental-hanoi',
    title: 'Thuê xe theo tháng Hà Nội',
    businessLine: 'monthly-rental',
    audience: 'Cư dân, hộ gia đình và doanh nghiệp cần xe dùng đều trong tháng',
    sourceUrl: 'https://www.carmatch.vn/thue-xe-thang',
    effectiveDate: '2026-06-20',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Gói thuê xe theo tháng phù hợp khách dùng xe đều đặn, muốn kiểm soát chi phí và không muốn sở hữu xe riêng.',
    facts: [
      'Giá gói tháng tham khảo từ 10.000.000đ/tháng, tùy mẫu xe, thời gian thuê, lịch sử dụng và điểm giao nhận.',
      'Car Match tư vấn theo nhu cầu thực tế: cư dân chung cư, doanh nghiệp, gia đình cần xe cuối tuần hoặc dùng hằng ngày.',
      'Hợp đồng, đặt cọc, giới hạn sử dụng và phí phát sinh cần được xác nhận trước khi nhận xe.',
    ],
    relatedRoutes: ['/thue-xe-thang', '/xe', '/faq', '/lien-he'],
  },
  {
    id: 'trip-planning-from-hanoi',
    title: 'Lập kế hoạch chuyến đi từ Hà Nội',
    businessLine: 'trip-planning',
    audience: 'Khách thuê xe tự lái đi tỉnh, đi chơi cuối tuần hoặc đi sân bay',
    sourceUrl: 'https://www.carmatch.vn/di-dau',
    effectiveDate: '2026-06-20',
    reviewStatus: 'reviewed',
    riskLevel: 'low',
    summary:
      'Các trang Đi đâu và Lập chuyến đi giúp khách ước tính tuyến đường, thời gian, chi phí và loại xe phù hợp trước khi hỏi xe.',
    facts: [
      'Các tuyến phổ biến gồm Hạ Long, Ninh Bình, Tam Đảo, Mộc Châu, Nội Bài, Ba Vì, Sóc Sơn, Ecopark, Hải Phòng và Cát Bà.',
      'Chi phí trong các trang gợi ý là ước tính để khách chuẩn bị ngân sách, không thay thế báo giá xe cuối cùng.',
      'Khách nên chọn xe theo số người, hành lý, cung đường, nhu cầu đi cao tốc/VETC và khả năng sạc nếu dùng xe điện.',
    ],
    relatedRoutes: ['/di-dau', '/lap-ke-hoach-chuyen-di', '/xe', '/blog'],
  },
  {
    id: 'owner-partnership',
    title: 'Hợp tác chủ xe tại Hà Nội',
    businessLine: 'owner-partnership',
    audience: 'Chủ xe cá nhân hoặc đối tác có xe nhàn rỗi tại Hà Nội',
    sourceUrl: 'https://www.carmatch.vn/hop-tac',
    effectiveDate: '2026-06-20',
    reviewStatus: 'reviewed',
    riskLevel: 'medium',
    summary:
      'Chủ xe có thể gửi thông tin xe để Car Match thẩm định phương án hợp tác, lịch khai thác và cách đối soát.',
    facts: [
      'Xe cần được thẩm định theo tình trạng, giấy tờ, lịch khai thác, bảo hiểm và khả năng vận hành thực tế.',
      'Thông tin doanh thu, tần suất thuê và phương án khai thác cần được trao đổi riêng, không nên cam kết đại trà trên website.',
    ],
    relatedRoutes: ['/hop-tac', '/gioi-thieu', '/lien-he'],
  },
];

export const geoPriorityPages: GeoPriorityPage[] = [
  {
    path: '/',
    topic: 'Thuê xe tự lái Hà Nội',
    intent: 'transactional',
    journeyStage: 'Consider',
    directAnswer:
      'Khách tại Hà Nội có thể xem xe, chọn nhu cầu và nhắn Zalo để Car Match kiểm tra lịch xe, giá thuê, cọc và điểm giao nhận phù hợp.',
    internalLinks: ['/xe', '/thue-xe-tu-lai-ha-noi', '/xe-san-bay-noi-bai', '/thue-xe-thang'],
  },
  {
    path: '/xe',
    topic: 'Danh sách xe tự lái',
    intent: 'transactional',
    journeyStage: 'Consider',
    directAnswer:
      'Trang danh sách xe giúp khách xem mẫu xe, số chỗ, nhiên liệu, giá tham khảo và mở trang chi tiết trước khi hỏi lịch còn xe.',
    internalLinks: ['/thue-xe-tu-lai-ha-noi', '/thue-xe-thang', '/faq'],
  },
  {
    path: '/blog/don-vi-thue-xe-tu-lai-ha-noi-nen-chon-ben-nao',
    topic: 'Đơn vị thuê xe tự lái Hà Nội',
    intent: 'commercial',
    journeyStage: 'Consider',
    directAnswer:
      'Khách nên chọn đơn vị thuê xe tự lái Hà Nội theo mô hình phù hợp: app để so nhiều xe, công ty truyền thống để làm việc trực tiếp, hoặc Car Match nếu cần giao xe tận sảnh/khu đô thị và xác nhận lịch qua Zalo.',
    internalLinks: [
      '/thue-xe-tu-lai-ha-noi',
      '/xe',
      '/thue-xe-thang',
      '/blog/thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh',
    ],
  },
  {
    path: '/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu',
    topic: 'Thuê xe tự lái Hà Nội giá bao nhiêu',
    intent: 'commercial',
    journeyStage: 'Consider',
    directAnswer:
      'Giá thuê xe tự lái Hà Nội nên tính theo tổng chi phí gồm giá ngày, cọc, giao nhận, xăng/sạc, VETC/gửi xe và phí phát sinh; Car Match có giá tham khảo từ 600.000đ/ngày tùy xe và lịch thuê.',
    internalLinks: [
      '/thue-xe-tu-lai-ha-noi',
      '/xe',
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/blog/don-vi-thue-xe-tu-lai-ha-noi-nen-chon-ben-nao',
    ],
  },
  {
    path: '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
    topic: 'Thuê xe tự lái cần giấy tờ gì',
    intent: 'informational',
    journeyStage: 'Customer',
    directAnswer:
      'Khách thuê xe tự lái cần CCCD, GPLX hạng B còn hiệu lực, thông tin lịch trình và số liên hệ; trước khi chuyển cọc cần xác nhận điều kiện hoàn cọc và biên bản bàn giao.',
    internalLinks: [
      '/thue-xe-tu-lai-ha-noi',
      '/faq',
      '/blog/phat-nguoi-thue-xe-tu-lai-ai-tra',
      '/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu',
    ],
  },
  {
    path: '/blog/nen-thue-xe-tu-lai-hay-xe-co-tai-xe-taxi-xe-cong-nghe',
    topic: 'Nên thuê xe tự lái hay xe có tài xế',
    intent: 'commercial',
    journeyStage: 'Consider',
    directAnswer:
      'Thuê xe tự lái phù hợp khi cần chủ động cả ngày, đi nhiều điểm hoặc cần riêng tư; taxi, xe công nghệ hoặc xe có tài xế phù hợp hơn cho chuyến ngắn, không muốn lái hoặc cần đi ngay.',
    internalLinks: ['/xe', '/xe-san-bay-noi-bai', '/di-dau', '/lap-ke-hoach-chuyen-di'],
  },
  {
    path: '/blog/co-nen-thue-xe-dien-tu-lai-ha-noi-vinfast',
    topic: 'Thuê xe điện tự lái Hà Nội',
    intent: 'commercial',
    journeyStage: 'Consider',
    directAnswer:
      'Xe điện tự lái phù hợp nếu lịch trình nội đô hoặc tuyến gần có điểm sạc rõ; trước khi thuê cần hỏi pin lúc nhận, điểm sạc, thời gian sạc và điều kiện trả xe.',
    internalLinks: ['/xe?category=electric', '/xe', '/di-dau', '/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu'],
  },
  {
    path: '/blog/tranh-chap-vet-xuoc-khi-thue-xe-tu-lai-can-lam-gi',
    topic: 'Tranh chấp vết xước khi thuê xe tự lái',
    intent: 'informational',
    journeyStage: 'Customer',
    directAnswer:
      'Để tránh tranh chấp vết xước, khách nên quay video 360 độ, chụp cận cảnh vết có sẵn, ghi số km, mức xăng/pin và tình trạng nội thất vào biên bản trước khi nhận xe.',
    internalLinks: [
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/blog/phi-an-khi-thue-xe-tu-lai-hoi-gi-truoc-khi-coc',
      '/blog/xe-thue-tu-lai-gap-su-co-tai-nan-hong-xe-lam-gi',
      '/thue-xe-tu-lai-ha-noi',
    ],
  },
  {
    path: '/blog/phi-an-khi-thue-xe-tu-lai-hoi-gi-truoc-khi-coc',
    topic: 'Phí ẩn khi thuê xe tự lái',
    intent: 'commercial',
    journeyStage: 'Consider',
    directAnswer:
      'Trước khi chuyển cọc, khách nên hỏi rõ phí quá giờ, giao nhận, vệ sinh, vượt km, xăng/pin, VETC/cao tốc, gửi xe và điều kiện hoàn cọc để tránh giá cuối cao hơn báo giá ban đầu.',
    internalLinks: [
      '/blog/thue-xe-tu-lai-ha-noi-gia-bao-nhieu',
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/blog/tranh-chap-vet-xuoc-khi-thue-xe-tu-lai-can-lam-gi',
      '/xe',
    ],
  },
  {
    path: '/blog/tranh-lua-dao-coc-online-khi-thue-xe-tu-lai',
    topic: 'Tránh lừa đảo cọc online khi thuê xe tự lái',
    intent: 'informational',
    journeyStage: 'Consider',
    directAnswer:
      'Khách nên cảnh giác nếu giá quá rẻ, bị thúc chuyển cọc nhanh, không có thông tin xe rõ, thiếu điều kiện hoàn cọc hoặc kênh liên hệ không nhất quán; hãy xác minh qua website và Zalo chính thức.',
    internalLinks: [
      '/blog/don-vi-thue-xe-tu-lai-ha-noi-nen-chon-ben-nao',
      '/blog/phi-an-khi-thue-xe-tu-lai-hoi-gi-truoc-khi-coc',
      '/thue-xe-tu-lai-ha-noi',
      '/lien-he',
    ],
  },
  {
    path: '/blog/xe-thue-tu-lai-gap-su-co-tai-nan-hong-xe-lam-gi',
    topic: 'Xe thuê tự lái gặp sự cố thì làm gì',
    intent: 'informational',
    journeyStage: 'Customer',
    directAnswer:
      'Khi xe thuê tự lái gặp sự cố, khách nên ưu tiên an toàn, ghi nhận hiện trường, liên hệ đầu mối cho thuê và không tự ý sửa, kéo xe hoặc thỏa thuận bồi thường khi chưa được hướng dẫn.',
    internalLinks: [
      '/blog/tranh-chap-vet-xuoc-khi-thue-xe-tu-lai-can-lam-gi',
      '/blog/phat-nguoi-thue-xe-tu-lai-ai-tra',
      '/faq',
      '/xe',
    ],
  },
  {
    path: '/blog/moi-co-bang-lai-co-thue-xe-tu-lai-duoc-khong',
    topic: 'Mới có bằng lái có thuê xe tự lái được không',
    intent: 'informational',
    journeyStage: 'Consider',
    directAnswer:
      'Người mới có bằng lái có thể hỏi thuê xe tự lái nhưng nên nói rõ kinh nghiệm, chọn xe dễ lái, lịch trình vừa sức và chuẩn bị CCCD, GPLX hạng B còn hiệu lực.',
    internalLinks: [
      '/blog/thue-xe-tu-lai-can-giay-to-va-coc-bao-nhieu',
      '/blog/nen-thue-xe-tu-lai-hay-xe-co-tai-xe-taxi-xe-cong-nghe',
      '/xe',
      '/thue-xe-tu-lai-ha-noi',
    ],
  },
  {
    path: '/xe-san-bay-noi-bai',
    topic: 'Xe sân bay Nội Bài',
    intent: 'transactional',
    journeyStage: 'Consider',
    directAnswer:
      'Khách gửi điểm đón, giờ bay, nhà ga, số người và số vali để Car Match tư vấn xe 5 chỗ, 7 chỗ hoặc MPV phù hợp đi Nội Bài.',
    internalLinks: ['/di-dau/noi-bai', '/lap-ke-hoach-chuyen-di/noi-bai', '/blog/taxi-san-bay-noi-bai-gia-bao-nhieu'],
  },
  {
    path: '/thue-xe-thang',
    topic: 'Thuê xe theo tháng',
    intent: 'commercial',
    journeyStage: 'Consider',
    directAnswer:
      'Khách dùng xe đều đặn có thể hỏi gói tháng để tối ưu chi phí, với báo giá tùy mẫu xe, lịch sử dụng và điểm giao nhận.',
    internalLinks: ['/xe', '/faq', '/lien-he'],
  },
  {
    path: '/di-dau',
    topic: 'Đi đâu gần Hà Nội bằng xe tự lái',
    intent: 'informational',
    journeyStage: 'Discover',
    directAnswer:
      'Trang Đi đâu gợi ý tuyến, chi phí di chuyển, lịch trình và loại xe nên cân nhắc cho khách thuê xe tự lái từ Hà Nội.',
    internalLinks: ['/lap-ke-hoach-chuyen-di', '/xe', '/di-dau/noi-bai'],
  },
  {
    path: '/blog',
    topic: 'Kinh nghiệm thuê xe',
    intent: 'informational',
    journeyStage: 'Discover',
    directAnswer:
      'Blog trả lời các câu hỏi thực tế trước khi thuê xe: giá, giấy tờ, đặt cọc, phạt nguội, xe sân bay và kinh nghiệm chọn xe.',
    internalLinks: ['/xe', '/faq', '/xe-san-bay-noi-bai'],
  },
];

export const aiCrawlerUserAgentPatterns: AiCrawlerPattern[] = [
  {
    label: 'OpenAI',
    category: 'ai_bot',
    patterns: ['gptbot', 'chatgpt-user', 'oai-searchbot', 'openai'],
  },
  {
    label: 'Anthropic',
    category: 'ai_bot',
    patterns: ['claudebot', 'claude-searchbot', 'claude-user', 'anthropic'],
  },
  {
    label: 'Perplexity',
    category: 'ai_bot',
    patterns: ['perplexitybot', 'perplexity-user', 'perplexity'],
  },
  {
    label: 'Common Crawl / AI training',
    category: 'ai_bot',
    patterns: ['ccbot', 'google-extended', 'applebot-extended', 'bytespider', 'meta-externalagent', 'cohere-ai', 'youbot'],
  },
  {
    label: 'Search engines',
    category: 'search_bot',
    patterns: ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot'],
  },
  {
    label: 'Social preview',
    category: 'other_bot',
    patterns: ['facebookexternalhit', 'telegrambot', 'whatsapp', 'linkedinbot', 'twitterbot'],
  },
];

export function classifyTrafficSource(userAgent = '') {
  const normalized = userAgent.toLowerCase();
  const match = aiCrawlerUserAgentPatterns.find((group) =>
    group.patterns.some((pattern) => normalized.includes(pattern)),
  );

  if (match) {
    return { category: match.category, label: match.label };
  }

  if (/\bbot\b|crawler|spider|headlesschrome|curl|wget|python-requests/i.test(userAgent)) {
    return { category: 'other_bot' as const, label: 'Other bot' };
  }

  return { category: 'human' as const, label: 'Human / unknown' };
}
