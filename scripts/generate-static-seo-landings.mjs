import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.join(projectRoot, 'dist')
const siteUrl = 'https://www.carmatch.vn'
const brandImage = `${siteUrl}/brand/carmatch-logo-stacked-navy.png`
const contentUpdated = '2026-06-02'

const baseFaq = [
  {
    question: 'Thuê xe tự lái Hà Nội tại CarMatch cần giấy tờ gì?',
    answer: 'Khách thuê cần CCCD và GPLX hạng B hợp lệ. Tùy lịch thuê và mẫu xe, CarMatch sẽ xác nhận thêm thông tin đặt cọc khi tư vấn qua Zalo.',
  },
  {
    question: 'CarMatch có giao xe tận sảnh chung cư không?',
    answer: 'Có. CarMatch tập trung phục vụ cư dân chung cư/khu đô thị tại Hà Nội và hỗ trợ giao xe tận sảnh hoặc điểm hẹn phù hợp trong khu vực phục vụ.',
  },
  {
    question: 'Giá thuê xe tự lái Hà Nội bắt đầu từ bao nhiêu?',
    answer: 'Giá thuê xe tự lái tại CarMatch tham khảo từ 800.000 VND/ngày. Gói thuê theo tháng tham khảo từ 18.000.000 VND/tháng cho 22 ngày.',
  },
  {
    question: 'Đặt xe qua CarMatch mất bao lâu để xác nhận?',
    answer: 'Khách nhắn Zalo 0975 563 290, CarMatch kiểm tra lịch xe và phản hồi xác nhận trong khoảng 30 phút khi có xe phù hợp.',
  },
]

const pages = [
  {
    slug: 'thue-xe-tu-lai-ha-noi',
    area: 'Hà Nội',
    district: 'nội thành và các khu đô thị lớn',
    title: 'Thuê xe tự lái Hà Nội - giao xe tận sảnh chung cư | CarMatch',
    description: 'Thuê xe tự lái Hà Nội qua CarMatch, giao xe tận sảnh chung cư/khu đô thị, xe 5 chỗ, 7 chỗ, xe điện VinFast, đặt Zalo xác nhận 30 phút.',
    intro: 'Thuê xe tự lái Hà Nội phù hợp khi bạn cần xe cho cuối tuần, đi tỉnh, công việc gia đình hoặc dùng xe định kỳ nhưng chưa muốn sở hữu xe riêng.',
    localContext: 'Ở Hà Nội, chi phí gửi xe, bảo dưỡng và khấu hao khiến nhiều gia đình không muốn sở hữu xe quanh năm. CarMatch tập trung vào nhóm cư dân đô thị cần xe đúng lúc: cuối tuần, về quê, đi tỉnh, đưa đón gia đình hoặc dùng xe theo tháng.',
    areas: ['Vinhomes Ocean Park', 'Times City', 'Vinhomes Smart City', 'Ecopark', 'The Manor Central Park', 'Linh Đàm'],
    bestFor: ['Gia đình sống tại chung cư chưa muốn mua xe riêng', 'Khách cần xe 5 chỗ/7 chỗ cho cuối tuần hoặc đi tỉnh', 'Cư dân muốn nhận xe tại sảnh thay vì đi xa lấy xe', 'Doanh nghiệp nhỏ cần xe theo tháng, hợp đồng rõ ràng'],
    vehicleRows: [
      ['VinFast VF5 / VF6', 'Đi phố, đi làm, gia đình trẻ, ưu tiên xe điện', 'từ 800.000đ/ngày'],
      ['Mazda CX-5 / Kia Seltos', 'Đi tỉnh ngắn ngày, cốp rộng hơn sedan', 'tùy lịch xe'],
      ['Toyota Innova / Fortuner / Carnival', 'Gia đình đông người, nhiều hành lý, đi xa', 'tùy dòng xe'],
    ],
    faq: [
      ['Thuê xe tự lái Hà Nội nên đặt trước bao lâu?', 'Với ngày thường, bạn nên nhắn trước ít nhất vài giờ để CarMatch kiểm tra lịch xe. Cuối tuần, lễ Tết hoặc chuyến đi tỉnh nên đặt sớm hơn để có nhiều lựa chọn xe.'],
      ['CarMatch có phù hợp nếu tôi chỉ cần xe trong 1-2 ngày không?', 'Có. CarMatch phục vụ cả nhu cầu thuê ngày lẻ, cuối tuần và thuê theo tháng. Nếu tần suất dùng xe cao, đội tư vấn sẽ so sánh giúp chi phí thuê ngày và thuê tháng.'],
    ],
  },
  {
    slug: 'thue-xe-tu-lai-vinhomes-ocean-park',
    area: 'Vinhomes Ocean Park',
    district: 'Gia Lâm',
    title: 'Thuê xe tự lái Vinhomes Ocean Park - giao xe tận sảnh | CarMatch',
    description: 'CarMatch hỗ trợ thuê xe tự lái Vinhomes Ocean Park, giao xe tận sảnh tòa nhà, phù hợp đi nội thành, về quê, cuối tuần hoặc thuê tháng.',
    intro: 'Thuê xe tự lái Vinhomes Ocean Park giúp cư dân chủ động đi lại mà không cần gửi xe dài hạn hoặc duy trì một chiếc xe riêng.',
    localContext: 'Ocean Park ở phía Đông Hà Nội, nhiều lịch di chuyển vào nội thành hoặc đi tỉnh thường cần xe riêng trong 1-3 ngày. Thuê xe tự lái giao tận sảnh giúp cư dân không phải duy trì chỗ đỗ và chi phí xe quanh năm.',
    areas: ['Ocean Park 1', 'Ocean Park 2', 'Ocean Park 3', 'Gia Lâm', 'Văn Giang', 'Long Biên'],
    bestFor: ['Cư dân Ocean Park đi nội thành nhiều điểm trong ngày', 'Gia đình về quê cuối tuần ở Hải Phòng, Hải Dương, Hưng Yên', 'Khách cần xe điện VinFast để đi gần và tiết kiệm nhiên liệu', 'Người cần thuê tháng nhưng vẫn muốn giao nhận tại khu đô thị'],
    vehicleRows: [
      ['VinFast VF5', 'Đi nội thành, đi gần, chi phí hợp lý', 'từ 800.000đ/ngày'],
      ['VinFast VF6 / Mazda CX-5', 'Gia đình trẻ, đi cuối tuần, cốp vừa đủ', 'tùy lịch xe'],
      ['Toyota Innova / Fortuner', 'Đi tỉnh, nhiều người hoặc nhiều hành lý', 'tùy dòng xe'],
    ],
    faq: [
      ['CarMatch có giao xe tận sảnh Ocean Park không?', 'Có. CarMatch hỗ trợ giao xe đến sảnh tòa hoặc điểm hẹn phù hợp trong khu vực Ocean Park theo lịch đã xác nhận.'],
      ['Ở Ocean Park thuê xe đi nội thành trong ngày có phù hợp không?', 'Phù hợp nếu bạn cần chủ động nhiều điểm đến, đi cùng gia đình hoặc mang theo đồ. Nếu chỉ đi một chiều ngắn, taxi/xe công nghệ có thể tiết kiệm hơn.'],
    ],
  },
  {
    slug: 'thue-xe-tu-lai-times-city',
    area: 'Times City',
    district: 'Hai Bà Trưng',
    title: 'Thuê xe tự lái Times City - giao xe tận sảnh tòa nhà | CarMatch',
    description: 'Thuê xe tự lái Times City qua CarMatch, nhận xe tận sảnh, đặt qua Zalo, phù hợp gia đình cần xe cuối tuần hoặc công việc trong ngày.',
    intro: 'Thuê xe tự lái Times City phù hợp với cư dân cần xe nhanh cho công việc, đưa gia đình đi chơi hoặc đi tỉnh trong ngày.',
    localContext: 'Times City nằm gần trung tâm, nhu cầu thường là xe dùng trong ngày, cuối tuần hoặc đi tỉnh ngắn. Lợi thế của CarMatch là quy trình đặt qua Zalo, kiểm tra lịch nhanh và giao xe tại điểm hẹn thuận tiện.',
    areas: ['Times City', 'Minh Khai', 'Hai Bà Trưng', 'Vĩnh Tuy', 'Thanh Nhàn', 'Hoàng Mai'],
    bestFor: ['Cư dân Times City cần xe cuối tuần', 'Gia đình đi chơi ngoại thành hoặc về quê trong ngày', 'Khách cần xe 5 chỗ dễ lái trong phố', 'Người muốn nhận xe tại sảnh thay vì đi xa lấy xe'],
    vehicleRows: [
      ['VinFast VF5 / Kia Seltos', 'Đi phố, công việc trong ngày, dễ lái', 'từ 800.000đ/ngày'],
      ['VinFast VF6 / Mazda CX-5', 'Gia đình nhỏ đi cuối tuần', 'tùy lịch xe'],
      ['Toyota Innova', 'Gia đình đông người hoặc cần cốp rộng', 'tùy dòng xe'],
    ],
    faq: [
      ['Thuê xe tự lái Times City có nên đặt trước không?', 'Nên đặt trước, nhất là thứ Sáu, cuối tuần và ngày lễ. CarMatch cần kiểm tra xe trống, lịch giao nhận và giấy tờ trước khi xác nhận.'],
      ['CarMatch có giao xe ở Minh Khai hoặc Vĩnh Tuy không?', 'CarMatch có thể hỗ trợ khu Times City, Minh Khai, Vĩnh Tuy và lân cận tùy lịch xe. Bạn nên gửi vị trí cụ thể qua Zalo để được kiểm tra nhanh.'],
    ],
  },
  {
    slug: 'thue-xe-tu-lai-vinhomes-smart-city',
    area: 'Vinhomes Smart City',
    district: 'Nam Từ Liêm',
    title: 'Thuê xe tự lái Vinhomes Smart City - đặt Zalo, giao tận nơi | CarMatch',
    description: 'CarMatch hỗ trợ thuê xe tự lái Vinhomes Smart City, xe theo ngày hoặc theo tháng, giao xe tận sảnh cho cư dân khu Tây Hà Nội.',
    intro: 'Thuê xe tự lái Vinhomes Smart City giúp cư dân khu Tây có xe dùng linh hoạt cho công việc, gia đình và các chuyến đi cuối tuần.',
    localContext: 'Smart City nằm ở khu Tây Hà Nội, thuận tiện đi Đại lộ Thăng Long, Hòa Bình, Ba Vì, Sơn Tây hoặc các tỉnh phía Tây Bắc. Nhu cầu thuê xe thường tập trung vào cuối tuần, đi gia đình và công tác ngắn ngày.',
    areas: ['Vinhomes Smart City', 'Tây Mỗ', 'Đại Mỗ', 'Mỹ Đình', 'Nam Từ Liêm', 'Cầu Giấy'],
    bestFor: ['Cư dân Smart City đi cuối tuần theo hướng Đại lộ Thăng Long', 'Khách cần xe giao tận khu Tây Hà Nội', 'Gia đình trẻ cần SUV/crossover dễ đi xa', 'Doanh nghiệp nhỏ cần thuê xe định kỳ theo tháng'],
    vehicleRows: [
      ['VinFast VF5 / VF6', 'Đi làm, đi phố, di chuyển quanh Hà Nội', 'từ 800.000đ/ngày'],
      ['Mazda CX-5 / Kia Seltos', 'Đi Ba Vì, Hòa Bình, Tam Đảo, cuối tuần', 'tùy lịch xe'],
      ['Fortuner / Carnival', 'Đi xa, gia đình đông người', 'tùy dòng xe'],
    ],
    faq: [
      ['Smart City thuê xe đi Ba Vì hoặc Hòa Bình nên chọn xe gì?', 'Nếu đi gia đình 3-5 người, SUV/crossover như VF6, CX-5 hoặc Seltos thường phù hợp hơn xe nhỏ vì ngồi thoải mái và cốp rộng hơn.'],
      ['CarMatch có gói thuê xe theo tháng ở Smart City không?', 'Có thể tư vấn gói tháng từ 18.000.000đ/tháng cho 22 ngày, tùy dòng xe và lịch sử dụng thực tế.'],
    ],
  },
  {
    slug: 'thue-xe-tu-lai-ecopark',
    area: 'Ecopark',
    district: 'Văn Giang',
    title: 'Thuê xe tự lái Ecopark - giao xe tận sảnh cư dân | CarMatch',
    description: 'Thuê xe tự lái Ecopark qua CarMatch, hỗ trợ giao xe tận sảnh, phù hợp cư dân cần xe đi Hà Nội, đi tỉnh hoặc thuê theo tháng.',
    intro: 'Thuê xe tự lái Ecopark là lựa chọn thực tế nếu bạn sống trong khu đô thị xanh nhưng không muốn duy trì xe riêng quanh năm.',
    localContext: 'Ecopark có nhiều gia đình dùng xe theo dịp: vào nội thành, đi sân bay, về quê hoặc đi nghỉ cuối tuần. Với nhóm không dùng xe mỗi ngày, thuê xe tự lái theo lịch giúp giảm áp lực chỗ đỗ và chi phí sở hữu.',
    areas: ['Ecopark', 'Văn Giang', 'Gia Lâm', 'Long Biên', 'Ocean Park', 'Hưng Yên'],
    bestFor: ['Cư dân Ecopark vào Hà Nội nhiều điểm trong ngày', 'Gia đình đi nghỉ cuối tuần hoặc về quê', 'Khách cần xe 7 chỗ cho nhiều người', 'Người dùng xe không thường xuyên nhưng muốn tự lái'],
    vehicleRows: [
      ['VinFast VF5 / VF6', 'Đi Hà Nội, đi gần, tiết kiệm chi phí vận hành', 'từ 800.000đ/ngày'],
      ['Mazda CX-5 / Kia Seltos', 'Gia đình nhỏ, đi cuối tuần', 'tùy lịch xe'],
      ['Toyota Innova / Fortuner', 'Đi tỉnh, nhiều hành lý hoặc nhiều người', 'tùy dòng xe'],
    ],
    faq: [
      ['Ecopark thuê xe tự lái có tính phí giao nhận không?', 'Phí giao nhận phụ thuộc vị trí và lịch xe. Mức tham khảo thường từ 100.000đ/lượt, đội tư vấn sẽ báo rõ trước khi xác nhận.'],
      ['Ở Ecopark có nên thuê xe tự lái thay vì mua xe?', 'Nếu bạn chỉ dùng xe theo dịp, thuê xe giúp tránh chi phí gửi xe, bảo dưỡng và khấu hao. Nếu dùng xe hàng ngày, nên so sánh thêm gói thuê tháng.'],
    ],
  },
  {
    slug: 'thue-xe-tu-lai-the-manor',
    area: 'The Manor Central Park',
    district: 'Hoàng Mai',
    title: 'Thuê xe tự lái The Manor Central Park - giao xe tận sảnh | CarMatch',
    description: 'CarMatch hỗ trợ thuê xe tự lái The Manor Central Park và khu Linh Đàm, giao xe tận sảnh, đặt qua Zalo xác nhận trong 30 phút.',
    intro: 'Thuê xe tự lái The Manor Central Park phù hợp với cư dân khu Nam Hà Nội cần xe đi nội thành, đi tỉnh hoặc dùng định kỳ.',
    localContext: 'Khu Nam Hà Nội có nhu cầu thuê xe cho các lịch đi Ninh Bình, Nam Định, Thái Bình, Thanh Hóa hoặc công việc nội thành. CarMatch phù hợp khi bạn cần xe rõ lịch, giao nhận thuận tiện và hỗ trợ qua Zalo.',
    areas: ['The Manor Central Park', 'Linh Đàm', 'Hoàng Mai', 'Thanh Trì', 'Giải Phóng', 'Định Công'],
    bestFor: ['Cư dân The Manor hoặc Linh Đàm đi tỉnh cuối tuần', 'Gia đình cần xe 7 chỗ nhiều hành lý', 'Khách cần nhận xe tại khu Nam Hà Nội', 'Người muốn thuê theo tháng nhưng chưa muốn mua xe riêng'],
    vehicleRows: [
      ['VinFast VF5 / Kia Seltos', 'Đi phố, đi làm, lịch ngắn trong ngày', 'từ 800.000đ/ngày'],
      ['Mazda CX-5 / VF6', 'Gia đình 3-5 người đi cuối tuần', 'tùy lịch xe'],
      ['Innova / Fortuner / Carnival', 'Gia đình đông người, đi tỉnh xa', 'tùy dòng xe'],
    ],
    faq: [
      ['The Manor Central Park thuê xe đi Ninh Bình nên chọn xe gì?', 'Nếu đi 3-5 người, SUV/crossover là lựa chọn cân bằng. Nếu đi đông người hoặc nhiều hành lý, nên hỏi xe 7 chỗ như Innova, Fortuner hoặc Carnival.'],
      ['CarMatch có hỗ trợ khu Linh Đàm không?', 'Có thể hỗ trợ khu Linh Đàm và Hoàng Mai tùy lịch xe. Bạn gửi vị trí nhận xe và lịch trình qua Zalo để được kiểm tra cụ thể.'],
    ],
  },
  {
    slug: 'thue-xe-thang',
    area: 'Hà Nội',
    district: 'gói thuê theo tháng',
    title: 'Thuê xe theo tháng Hà Nội - giao xe tận nơi | CarMatch',
    description: 'Gói thuê xe theo tháng tại Hà Nội cho cư dân chung cư và doanh nghiệp nhỏ, từ 18.000.000đ/tháng cho 22 ngày, giao xe tận nơi.',
    intro: 'Thuê xe theo tháng Hà Nội phù hợp khi bạn dùng xe thường xuyên nhưng chưa muốn mua xe, chưa muốn lo gửi xe, bảo dưỡng và khấu hao.',
    localContext: 'Nếu mỗi tháng bạn dùng xe nhiều ngày, thuê ngày lẻ có thể đội chi phí. Gói tháng giúp cố định ngân sách, chủ động lịch dùng xe hơn, vẫn không phải sở hữu xe riêng.',
    areas: ['Hà Nội', 'Vinhomes Ocean Park', 'Times City', 'Smart City', 'Ecopark', 'The Manor Central Park'],
    bestFor: ['Gia đình dùng xe nhiều ngày mỗi tháng', 'Người đi công việc cố định nhưng chưa muốn mua xe', 'Doanh nghiệp nhỏ cần xe phục vụ nhân sự hoặc khách hàng', 'Cư dân chung cư muốn tránh chi phí gửi xe dài hạn'],
    vehicleRows: [
      ['Xe 5 chỗ đô thị', 'Đi làm, đi nội thành, chi phí gọn', 'từ 18.000.000đ/tháng'],
      ['SUV/crossover', 'Gia đình trẻ, đi tỉnh cuối tuần', 'tùy dòng xe'],
      ['Xe 7 chỗ', 'Gia đình đông người hoặc doanh nghiệp nhỏ', 'tùy lịch xe'],
    ],
    faq: [
      ['Gói thuê xe theo tháng CarMatch tính như thế nào?', 'Mức tham khảo từ 18.000.000đ/tháng cho 22 ngày. Giá thực tế phụ thuộc dòng xe, số ngày dùng, lịch giao nhận và nhu cầu xuất hóa đơn.'],
      ['Thuê xe theo tháng có rẻ hơn thuê ngày không?', 'Nếu bạn dùng xe thường xuyên, gói tháng thường tiết kiệm hơn thuê ngày lẻ. Nếu chỉ dùng 1-2 ngày mỗi tháng, thuê theo ngày vẫn linh hoạt hơn.'],
    ],
  },
]

const faqPage = {
  slug: 'faq-thue-xe-tu-lai-ha-noi',
  title: 'FAQ thuê xe tự lái Hà Nội - giấy tờ, đặt cọc, giao xe | CarMatch',
  description: 'Câu hỏi thường gặp khi thuê xe tự lái Hà Nội: giấy tờ, đặt cọc, giao xe tận sảnh, giá thuê ngày/tháng và cách đặt qua Zalo CarMatch.',
  faq: [
    ...baseFaq,
    {
      question: 'Thuê xe tự lái theo tháng tại Hà Nội có phù hợp với doanh nghiệp không?',
      answer: 'Có. Gói tháng phù hợp với doanh nghiệp nhỏ cần xe định kỳ nhưng chưa muốn mua xe riêng. CarMatch có thể tư vấn theo số ngày dùng, dòng xe và nhu cầu hóa đơn.',
    },
    {
      question: 'Nên chọn thuê xe ngày hay thuê xe tháng?',
      answer: 'Nếu chỉ dùng xe vài ngày mỗi tháng, thuê ngày linh hoạt hơn. Nếu dùng xe nhiều ngày hoặc cần xe định kỳ, thuê tháng giúp kiểm soát chi phí tốt hơn.',
    },
  ],
}

const seoLandingPages = pages.filter(({ slug }) => slug !== 'thue-xe-thang')
const relatedPages = [
  ...seoLandingPages.map(({ slug, area }) => ({ slug, label: `Thuê xe tự lái ${area}` })),
  { slug: faqPage.slug, label: 'FAQ thuê xe tự lái Hà Nội' },
]

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function jsonLd(value) {
  return JSON.stringify(value).replaceAll('</script', '<\\/script')
}

function serviceSchema(page) {
  const url = `${siteUrl}/${page.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: `Thuê xe tự lái ${page.area}`,
    serviceType: 'Thuê xe tự lái',
    provider: { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'CarMatch' },
    areaServed: page.areas,
    url,
    description: page.description,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: '800000',
      availability: 'https://schema.org/InStock',
      url,
    },
  }
}

function faqSchema(slug, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteUrl}/${slug}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question ?? item[0],
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer ?? item[1],
      },
    })),
  }
}

function breadcrumbSchema(slug, label) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: label, item: `${siteUrl}/${slug}` },
    ],
  }
}

function webPageSchema({ slug, title, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/${slug}#webpage`,
    name: title,
    description,
    url: `${siteUrl}/${slug}`,
    inLanguage: 'vi-VN',
    isPartOf: { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'CarMatch', url: siteUrl },
    primaryImageOfPage: { '@type': 'ImageObject', url: brandImage },
  }
}

function shell({ title, description, slug, structuredData, body }) {
  const canonical = `${siteUrl}/${slug}`
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="CarMatch" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(brandImage)}" />
    <meta property="og:image:alt" content="CarMatch - Thuê xe tự lái Hà Nội" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(brandImage)}" />
    <link rel="icon" type="image/png" href="/favicon-32x32.png" />
    <script type="application/ld+json">${jsonLd(structuredData)}</script>
    <style>
      :root { color-scheme: light; font-family: Arial, sans-serif; color: #172033; background: #f7f4ef; }
      body { margin: 0; }
      .topbar { background: #fffdf8; border-bottom: 1px solid #e5ded2; position: sticky; top: 0; z-index: 2; }
      .nav { align-items: center; display: flex; justify-content: space-between; margin: 0 auto; max-width: 1120px; padding: 16px 20px; }
      .brand img { height: 32px; width: auto; }
      .nav-links { display: flex; gap: 18px; }
      .breadcrumbs { color: #64748b; font-size: 14px; margin: 0 0 20px; }
      .breadcrumbs a { font-size: 14px; }
      a { color: #0f766e; font-weight: 800; text-decoration: none; }
      main { margin: 0 auto; max-width: 1120px; padding: 48px 20px 72px; }
      .eyebrow { color: #0f766e; font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      h1 { color: #0f172a; font-size: clamp(36px, 6vw, 64px); line-height: 1.02; margin: 14px 0 20px; max-width: 900px; }
      h2 { color: #172033; font-size: clamp(26px, 4vw, 38px); line-height: 1.16; margin: 44px 0 16px; }
      h3 { color: #172033; font-size: 21px; line-height: 1.25; margin: 0 0 10px; }
      p, li { color: #394256; font-size: 17px; line-height: 1.76; }
      .lead { font-size: 20px; font-weight: 700; max-width: 820px; }
      .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
      .card { background: #fffdf8; border: 1px solid #e3dacd; border-radius: 10px; padding: 22px; }
      .summary { background: #0f172a; border-radius: 12px; color: white; margin-top: 30px; padding: 24px; }
      .summary p, .summary li { color: rgba(255,255,255,.78); }
      .table-wrap { border: 1px solid #e3dacd; border-radius: 10px; margin-top: 20px; overflow-x: auto; }
      table { border-collapse: collapse; min-width: 720px; width: 100%; }
      th, td { border-bottom: 1px solid #e3dacd; font-size: 15px; line-height: 1.55; padding: 15px 16px; text-align: left; vertical-align: top; }
      th { background: #efe7db; color: #111827; font-weight: 800; }
      tr:last-child td { border-bottom: 0; }
      details { background: #fffdf8; border: 1px solid #e3dacd; border-radius: 10px; margin: 12px 0; padding: 18px 20px; }
      summary { color: #111827; cursor: pointer; font-size: 18px; font-weight: 800; }
      .related { display: flex; flex-wrap: wrap; gap: 10px 18px; list-style: none; padding: 0; }
      .cta { background: #0f766e; border-radius: 999px; color: white; display: inline-flex; margin-top: 18px; padding: 13px 20px; }
      @media (max-width: 680px) {
        .nav-links a:first-child { display: none; }
        main { padding: 34px 16px 56px; }
        p, li { font-size: 16px; }
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <nav class="nav" aria-label="Điều hướng chính">
        <a class="brand" href="/"><img src="/brand/carmatch-lockup-navy.png" alt="CarMatch" /></a>
        <div class="nav-links">
          <a href="/xe">Danh sách xe</a>
          <a href="/blog">Blog</a>
          <a href="https://zalo.me/0975563290">Zalo 0975.563.290</a>
        </div>
      </nav>
    </header>
    ${body}
  </body>
</html>`
}

function renderLanding(page) {
  const faq = [...baseFaq, ...page.faq.map(([question, answer]) => ({ question, answer }))]
  const body = `<main>
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Trang chủ</a> / ${escapeHtml(page.area)}</nav>
    <p class="eyebrow">CarMatch · ${escapeHtml(page.district)}</p>
    <h1>${escapeHtml(page.title.replace(' | CarMatch', ''))}</h1>
    <p class="lead">${escapeHtml(page.intro)}</p>
    <a class="cta" href="https://zalo.me/0975563290">Nhắn Zalo đặt xe</a>

    <section class="summary" aria-label="Tóm tắt cho AI Search">
      <h2 id="tom-tat-nhanh">Tóm tắt nhanh</h2>
      <ul>
        <li>CarMatch là dịch vụ thuê xe tự lái tại Hà Nội, tập trung giao xe tận sảnh cho cư dân chung cư/khu đô thị.</li>
        <li>Khu vực phục vụ gồm ${escapeHtml(page.areas.join(', '))}.</li>
        <li>Dịch vụ gồm thuê xe theo ngày, thuê xe theo tháng, xe điện VinFast, xe 5 chỗ và 7 chỗ.</li>
        <li>Quy trình gồm chọn xe qua Zalo, xác nhận lịch, ký hợp đồng và nhận xe tận nơi.</li>
      </ul>
    </section>

    <section>
      <h2 id="vi-sao-thue-xe">Vì sao nên thuê xe tự lái ${escapeHtml(page.area)} qua CarMatch?</h2>
      <p>${escapeHtml(page.localContext)}</p>
      <div class="grid">
        ${page.bestFor.map((item) => `<div class="card">${escapeHtml(item)}</div>`).join('')}
      </div>
    </section>

    <section>
      <h2 id="mau-xe-phu-hop">Các mẫu xe phù hợp khi thuê xe tự lái ${escapeHtml(page.area)}</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Dòng xe</th><th>Phù hợp với</th><th>Giá tham khảo</th></tr></thead>
          <tbody>
            ${page.vehicleRows.map(([vehicle, fit, price]) => `<tr><td><strong>${escapeHtml(vehicle)}</strong></td><td>${escapeHtml(fit)}</td><td>${escapeHtml(price)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 id="bang-thong-tin">Bảng thông tin nhanh</h2>
      <div class="table-wrap">
        <table>
          <tbody>
            <tr><th>Khu vực</th><td>${escapeHtml(page.area)}, ${escapeHtml(page.district)}</td></tr>
            <tr><th>Dịch vụ</th><td>Thuê xe tự lái theo ngày, theo tháng, xe 5 chỗ, 7 chỗ, xe điện VinFast</td></tr>
            <tr><th>Giá tham khảo</th><td>Từ 800.000đ/ngày; gói tháng từ 18.000.000đ/tháng cho 22 ngày</td></tr>
            <tr><th>Giấy tờ</th><td>CCCD và GPLX hạng B hợp lệ</td></tr>
            <tr><th>Đặt xe</th><td>Nhắn Zalo 0975 563 290, xác nhận lịch trong khoảng 30 phút khi có xe phù hợp</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 id="quy-trinh-dat-xe">Quy trình đặt xe</h2>
      <div class="grid">
        <div class="card"><h3>01. Gửi nhu cầu</h3><p>Gửi khu vực nhận xe, ngày đi, ngày về, số người và loại xe mong muốn.</p></div>
        <div class="card"><h3>02. Kiểm tra lịch</h3><p>CarMatch kiểm tra xe trống, chi phí thuê, phí giao nhận và giấy tờ cần chuẩn bị.</p></div>
        <div class="card"><h3>03. Xác nhận</h3><p>Hai bên xác nhận lịch, đặt cọc/giữ xe và thống nhất điểm giao nhận.</p></div>
        <div class="card"><h3>04. Nhận xe</h3><p>Nhận xe tại sảnh hoặc điểm hẹn, kiểm tra xe, ký hợp đồng và bắt đầu chuyến đi.</p></div>
      </div>
    </section>

    <section>
      <h2 id="cau-hoi-thuong-gap">Câu hỏi thường gặp</h2>
      ${faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}
    </section>

    <section>
      <h2 id="khu-vuc-phuc-vu">Khu vực CarMatch đang phục vụ</h2>
      <ul class="related">
        ${relatedPages.filter(({ slug }) => slug !== page.slug).map(({ slug, label }) => `<li><a href="/${escapeHtml(slug)}">${escapeHtml(label)}</a></li>`).join('')}
      </ul>
    </section>
  </main>`

  return shell({
    title: page.title,
    description: page.description,
    slug: page.slug,
    structuredData: [
      webPageSchema(page),
      serviceSchema(page),
      faqSchema(page.slug, faq),
      breadcrumbSchema(page.slug, page.area),
    ],
    body,
  })
}

function renderFaqPage() {
  const body = `<main>
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Trang chủ</a> / FAQ thuê xe tự lái Hà Nội</nav>
    <p class="eyebrow">CarMatch FAQ</p>
    <h1>FAQ thuê xe tự lái Hà Nội</h1>
    <p class="lead">Các câu hỏi thường gặp khi thuê xe tự lái Hà Nội qua CarMatch: giấy tờ, đặt cọc, giao xe tận sảnh và cách xác nhận lịch.</p>
    <section>
      ${faqPage.faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}
    </section>
    <section>
      <h2 id="khu-vuc-phuc-vu">Khu vực CarMatch đang phục vụ</h2>
      <ul class="related">
        ${relatedPages.filter(({ slug }) => slug !== faqPage.slug).map(({ slug, label }) => `<li><a href="/${escapeHtml(slug)}">${escapeHtml(label)}</a></li>`).join('')}
      </ul>
    </section>
    <a class="cta" href="https://zalo.me/0975563290">Nhắn Zalo CarMatch</a>
  </main>`

  return shell({
    title: faqPage.title,
    description: faqPage.description,
    slug: faqPage.slug,
    structuredData: [
      webPageSchema(faqPage),
      faqSchema(faqPage.slug, faqPage.faq),
      breadcrumbSchema(faqPage.slug, 'FAQ thuê xe tự lái Hà Nội'),
    ],
    body,
  })
}

async function writeRoute(slug, html) {
  const outputDir = path.join(distRoot, slug)
  await mkdir(outputDir, { recursive: true })
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8')
}

async function appendSitemapRoutes() {
  const sitemapPath = path.join(distRoot, 'sitemap.xml')
  let sitemap = await readFile(sitemapPath, 'utf8')
  const routes = [
    ...seoLandingPages.map(({ slug }) => ({ slug, priority: slug === 'thue-xe-tu-lai-ha-noi' ? '0.95' : '0.85' })),
    { slug: faqPage.slug, priority: '0.80' },
  ]

  for (const route of routes) {
    const loc = `${siteUrl}/${route.slug}`
    if (sitemap.includes(`<loc>${loc}</loc>`)) continue
    sitemap = sitemap.replace(
      '</urlset>',
      `  <url>
    <loc>${loc}</loc>
    <lastmod>${contentUpdated}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${route.priority}</priority>
  </url>
</urlset>`,
    )
  }

  await writeFile(sitemapPath, sitemap, 'utf8')
}

async function main() {
  for (const page of seoLandingPages) {
    await writeRoute(page.slug, renderLanding(page))
  }
  await writeRoute(faqPage.slug, renderFaqPage())
  await appendSitemapRoutes()
  console.log(`Pre-rendered ${seoLandingPages.length + 1} SEO pages`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
