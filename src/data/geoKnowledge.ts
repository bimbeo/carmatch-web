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
