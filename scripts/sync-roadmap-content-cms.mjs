import { pathToFileURL } from 'node:url';

import { wave2LocalRentalAreas } from '../src/data/localRentalExpansionAreas.ts';
import { createDestinationCostPosts } from './destination-cost-posts.mjs';
import { createModelKeywordPosts } from './model-keyword-posts.mjs';
import { createModelKeywordBatch2Posts } from './model-keyword-posts-batch2.mjs';
import { createMonthlyB2bPosts } from './monthly-b2b-posts.mjs';
import { createSupportAeoPosts } from './support-aeo-posts.mjs';
import { createTet2027Posts } from './tet-2027-posts.mjs';

const siteUrl = 'https://www.carmatch.vn';
const currentZaloUrl = 'https://zalo.me/0971163290';

const vehicleCovers = {
  vf3: `${siteUrl}/generated/vehicle-covers/b604b3db-7956-4bcd-bf83-eb550565466f.webp`,
  fadil: `${siteUrl}/generated/vehicle-covers/2e34eff0-9c4c-4d22-80dd-509724d7f04c.webp`,
  vf5: `${siteUrl}/generated/vehicle-covers/5694e25f-5a1c-4082-b6ef-1efc06728729.webp`,
  creta: `${siteUrl}/generated/vehicle-covers/dc6bbea5-4cad-430b-a4f3-ece0710ef167.webp`,
  vf6: `${siteUrl}/generated/vehicle-covers/9d7eedad-4d6e-4ecf-bcf4-7da79bea721b.webp`,
  xpander: `${siteUrl}/generated/vehicle-covers/2b2d5af0-582b-4cb8-9e0f-708643c51555.webp`,
  vf7: `${siteUrl}/generated/vehicle-covers/1afeaf24-316c-46e2-8c3b-d3f2ffca058f.webp`,
  limo: `${siteUrl}/generated/vehicle-covers/9d315ce9-3b23-4834-b630-36976624acdb.webp`,
  vf8: `${siteUrl}/generated/vehicle-covers/528d4663-ce70-4571-a4e5-7192508104bb.webp`,
  carnival: `${siteUrl}/generated/vehicle-covers/5e55fb77-5c0c-4111-a80f-85fd62a6c15b.webp`,
};

const postGroups = [
  { key: 'model-1', category: 'xe-va-chi-phi', posts: createModelKeywordPosts({ siteUrl, brandSocialImage: vehicleCovers.vf5 }) },
  { key: 'model-2', category: 'xe-va-chi-phi', posts: createModelKeywordBatch2Posts({ siteUrl, brandSocialImage: vehicleCovers.vf6 }) },
  { key: 'destination', category: 'di-dau-bang-xe', posts: createDestinationCostPosts({ siteUrl, brandSocialImage: vehicleCovers.carnival }) },
  { key: 'aeo', category: 'kinh-nghiem-thue-xe', posts: createSupportAeoPosts({ siteUrl, brandSocialImage: vehicleCovers.vf5 }) },
  { key: 'monthly-b2b', category: 'kinh-nghiem-thue-xe', posts: createMonthlyB2bPosts({ siteUrl, brandSocialImage: vehicleCovers.creta }) },
  { key: 'tet-2027', category: 'kinh-nghiem-thue-xe', posts: createTet2027Posts({ siteUrl, brandSocialImage: vehicleCovers.carnival }) },
];

function coverForPost(post, groupKey) {
  const text = `${post.title} ${post.slug?.current}`.toLowerCase();
  if (text.includes('carnival')) return vehicleCovers.carnival;
  if (text.includes('limo green')) return vehicleCovers.limo;
  if (text.includes('xpander') || text.includes('7-nguoi') || text.includes('7-chỗ')) return vehicleCovers.xpander;
  if (text.includes('vf8')) return vehicleCovers.vf8;
  if (text.includes('vf7')) return vehicleCovers.vf7;
  if (text.includes('vf6')) return vehicleCovers.vf6;
  if (text.includes('vf5')) return vehicleCovers.vf5;
  if (text.includes('vf3')) return vehicleCovers.vf3;
  if (text.includes('fadil')) return vehicleCovers.fadil;
  if (text.includes('creta')) return vehicleCovers.creta;
  if (groupKey === 'tet-2027') return vehicleCovers.carnival;
  if (groupKey === 'destination') return vehicleCovers.carnival;
  if (groupKey === 'monthly-b2b') return vehicleCovers.creta;
  return vehicleCovers.vf5;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function toBlogRow(post, group, index) {
  const originalCategories = Array.isArray(post.categories) ? post.categories : [];
  return {
    slug: post.slug.current,
    title: post.title,
    excerpt: post.excerpt || post.seoDescription || '',
    main_image_url: coverForPost(post, group.key),
    author: 'Car Match',
    category_slug: group.category,
    tags: unique([...originalCategories, group.key === 'tet-2027' ? 'Tết 2027' : 'Roadmap 64 URL']),
    content_html: post.bodyHtml || '',
    content_json: { type: 'doc', content: [] },
    seo_title: post.seoTitle || post.title,
    seo_description: post.seoDescription || post.excerpt || '',
    canonical_url: post.canonicalUrl || `${siteUrl}/blog/${post.slug.current}`,
    status: 'published',
    featured: false,
    published_at: group.key === 'tet-2027'
      ? `2026-11-10T00:${String(index).padStart(2, '0')}:00+07:00`
      : post.publishedAt || post.updatedAt || '2026-11-09T00:00:00+07:00',
    cta_enabled: post.ctaEnabled ?? true,
    cta_title: post.ctaTitle || null,
    cta_description: post.ctaDescription || null,
    cta_primary_label: post.ctaPrimaryLabel || null,
    cta_primary_url: post.ctaPrimaryUrl || null,
    cta_zalo_label: post.ctaZaloLabel || 'Nhắn Zalo Car Match',
    cta_zalo_url: currentZaloUrl,
    related_destination_slugs: post.relatedDestinationSlugs || [],
    related_vehicle_links: post.relatedVehicleLinks || [],
    related_post_slugs: post.relatedPostSlugs || [],
  };
}

function baseLandingContent() {
  return {
    blockOrder: ['proof', 'areas', 'scenarios', 'process', 'trust', 'blog', 'faq', 'gallery'],
    blockDesign: {},
    stats: [],
    proofCards: [],
    vehicles: [],
    priceRows: [],
    deliveryAreas: [],
    scenarios: [],
    processSteps: [
      ['01', 'Gửi nhu cầu', 'Gửi ngày nhận–trả, địa chỉ, số người, hành lý và tuyến dự kiến.'],
      ['02', 'Kiểm tra phương án', 'Car Match kiểm tra đúng xe, lịch, giá và điều kiện giao nhận.'],
      ['03', 'Xác nhận bằng văn bản', 'Hai bên thống nhất xe, thời gian, điểm hẹn, cọc và điều kiện sử dụng.'],
      ['04', 'Bàn giao và đối chiếu', 'Kiểm tra giấy tờ, hiện trạng, km, nhiên liệu hoặc pin và phụ kiện.'],
    ],
    trustLinks: [
      ['Danh sách xe và giá thực tế', '/xe'],
      ['Câu hỏi thường gặp', '/faq'],
      ['Chính sách thuê xe', '/chinh-sach'],
    ],
    blogLinks: [],
    faqItems: [],
    testimonials: [],
    gallery: [],
    videoEmbed: { url: '', title: '', description: '' },
    autoBlog: false,
  };
}

function toLocalLandingRow(area) {
  return {
    slug: area.path.replace(/^\//, ''),
    title: `Thuê xe tự lái ${area.name}`,
    description: area.description,
    seo_title: area.seoTitle,
    seo_description: area.description,
    canonical_url: `${siteUrl}${area.path}`,
    hero_title: `Thuê xe tự lái ${area.name}`,
    hero_kicker: 'Car Match · thuê xe tự lái theo khu vực',
    hero_description: area.heroAnswer,
    hero_image_url: vehicleCovers.vf5,
    cta_primary_label: 'Nhắn Zalo kiểm tra xe',
    cta_primary_url: currentZaloUrl,
    cta_secondary_label: 'Xem danh sách xe',
    cta_secondary_url: '/xe',
    status: 'published',
    published_at: '2026-11-09T20:00:00+07:00',
    page_content: {
      ...baseLandingContent(),
      proofCards: area.localContexts.map((item) => [item.title, item.description]),
      deliveryAreas: [
        [area.locality, area.pickupNote],
        ['Lưu ý địa giới và địa chỉ', area.locationNote],
      ],
      scenarios: area.useCases.map((item) => ({ title: item.title, meta: area.shortName, text: item.description })),
      blogLinks: area.relatedLinks.map((item) => [item.label, item.href]),
      faqItems: area.faqs,
    },
  };
}

const ownerTetBlogLinks = [
  ['Xe nhàn rỗi dịp Tết có nên cho thuê không?', '/blog/xe-nhan-roi-dip-tet-co-nen-cho-thue-khong'],
  ['Hợp tác chủ xe cho thuê Tết cần gì?', '/blog/hop-tac-chu-xe-cho-thue-tet-can-gi'],
  ['Cho thuê xe cá nhân ngày Tết có an toàn không?', '/blog/cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong'],
  ['Hợp đồng hợp tác cần điều khoản gì?', '/blog/hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi'],
  ['Doanh thu xe nhàn rỗi dịp Tết tính thế nào?', '/blog/doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao'],
  ['Ủy thác xe theo ngày hay cho thuê theo tháng?', '/blog/uy-thac-xe-theo-ngay-hay-cho-thue-theo-thang'],
  ['Xe nào phù hợp khai thác dịp Tết?', '/blog/xe-nao-phu-hop-khai-thac-dip-tet'],
  ['Chuẩn bị xe trước khi cho thuê Tết', '/blog/chuan-bi-xe-truoc-khi-cho-thue-tet'],
  ['Phạt nguội, VETC và hư hỏng xử lý thế nào?', '/blog/phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao'],
  ['Chủ xe cần chuẩn bị gì khi bàn giao?', '/blog/chu-xe-can-chuan-bi-gi-khi-ban-giao-xe-tet'],
];

const rentalTetBlogLinks = [
  ['Nên đặt xe Tết 2027 trước bao lâu?', '/blog/thue-xe-tu-lai-tet-2027-nen-dat-truoc-bao-lau'],
  ['Chọn gói thuê xe Tết 7 ngày hay 10 ngày?', '/blog/goi-thue-xe-tet-7-ngay-hay-10-ngay'],
  ['Về quê ăn Tết nên chọn xe nào?', '/blog/thue-xe-ve-que-an-tet-nen-chon-xe-nao'],
  ['Thuê xe Tết cho gia đình 5–7 người', '/blog/thue-xe-tet-cho-gia-dinh-5-7-nguoi'],
  ['Nhiều hành lý nên chọn xe nào?', '/blog/thue-xe-tet-co-nhieu-hanh-ly-chon-xe-nao'],
  ['Thuê xe điện đi Tết có phù hợp không?', '/blog/thue-xe-dien-di-tet-co-phu-hop-khong'],
  ['Nhận trả xe tự lái dịp Tết cần lưu ý gì?', '/blog/nhan-tra-xe-tu-lai-dip-tet-can-luu-y-gi'],
  ['Đi tỉnh dịp Tết cần báo trước gì?', '/blog/thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi'],
];

function createTetLandingRows() {
  const ownerContent = baseLandingContent();
  ownerContent.proofCards = [
    ['Thẩm định trước khi nhận xe', 'Car Match kiểm tra hồ sơ, tình trạng, lịch rảnh và khả năng phù hợp trước khi trao đổi phương án hợp tác.'],
    ['Không cam kết doanh thu chung', 'Doanh thu phụ thuộc mẫu xe, tình trạng, lịch, nhu cầu và điều kiện hai bên thống nhất bằng văn bản.'],
    ['Bàn giao có đối chiếu', 'Hiện trạng, km, nhiên liệu hoặc pin, VETC, chìa khóa và phụ kiện cần được ghi nhận rõ.'],
    ['Đối soát theo thỏa thuận', 'Cách tính, chi phí, thời điểm đối soát và trách nhiệm phát sinh phải được xác nhận trước khi giao xe.'],
  ];
  ownerContent.deliveryAreas = [['Hà Nội', 'Gửi khu vực đỗ xe, địa chỉ, mẫu xe và lịch rảnh để Car Match kiểm tra phương án phù hợp.']];
  ownerContent.scenarios = [
    { title: 'Xe gia đình ít sử dụng dịp Tết', meta: 'Chủ xe', text: 'Cân nhắc hợp tác khi lịch rảnh rõ, xe đủ điều kiện và trách nhiệm hai bên được ghi bằng văn bản.' },
    { title: 'Muốn khai thác theo ngày', meta: 'Lịch cao điểm', text: 'Cần thống nhất cách duyệt khách, giá, giới hạn sử dụng, giao nhận và xử lý phát sinh.' },
    { title: 'Muốn ủy thác dài hơn', meta: 'Theo tháng', text: 'So sánh quyền sử dụng xe, lịch cá nhân, bảo dưỡng, chi phí và cách chấm dứt hợp tác.' },
  ];
  ownerContent.trustLinks = [
    ['Trang hợp tác chủ xe', '/hop-tac'],
    ['Chính sách thuê xe', '/chinh-sach'],
    ['Câu hỏi thường gặp', '/faq'],
  ];
  ownerContent.blogLinks = ownerTetBlogLinks;
  ownerContent.faqItems = [
    { question: 'Gửi thông tin xe có đồng nghĩa Car Match chắc chắn nhận khai thác không?', answer: 'Không. Car Match cần thẩm định hồ sơ, tình trạng xe, lịch và nhu cầu phù hợp trước khi xác nhận phương án hợp tác.' },
    { question: 'Car Match có cam kết một mức doanh thu dịp Tết không?', answer: 'Không có mức cam kết chung cho mọi xe. Chỉ nên sử dụng ước tính gắn với đúng mẫu xe, lịch và điều kiện đã xác nhận.' },
    { question: 'Chủ xe cần chuẩn bị gì?', answer: 'Chuẩn bị thông tin xe, giấy tờ, ảnh hiện trạng, lịch rảnh, khu vực đỗ và các yêu cầu sử dụng cần được ghi trong thỏa thuận.' },
    { question: 'Khi nào nên bàn giao xe?', answer: 'Chỉ bàn giao sau khi các bên đã xác nhận người nhận, mục đích, lịch, giá, trách nhiệm, biên bản hiện trạng và đầu mối xử lý phát sinh.' },
  ];

  const rentalContent = baseLandingContent();
  rentalContent.proofCards = [
    ['Báo đúng ngày và tuyến', 'Giá và nguồn xe chỉ được xác nhận cho đúng ngày nhận–trả, tuyến, người lái và mẫu xe.'],
    ['Chọn xe theo người và hành lý', 'Đủ số ghế chưa chắc đủ khoang đồ; cần gửi cả vali, ghế trẻ em và vật dụng đặc biệt.'],
    ['Kiểm tra tổng chi phí', 'Đối chiếu tiền thuê, cọc, km, giao nhận, VETC, nhiên liệu hoặc sạc và điều kiện trả xe.'],
    ['Nhận trả có bằng chứng', 'Chụp hiện trạng, km, nhiên liệu hoặc pin, phụ kiện và giữ xác nhận bàn giao.'],
  ];
  rentalContent.deliveryAreas = [['Hà Nội', 'Điểm nhận–trả được kiểm tra theo địa chỉ, lịch xe và khả năng giao nhận của đúng booking.']];
  rentalContent.scenarios = [
    { title: 'Về quê ăn Tết', meta: 'Đi tỉnh', text: 'Gửi tỉnh đến, tổng km, số người, hành lý và các đoạn đường đặc biệt để kiểm tra xe phù hợp.' },
    { title: 'Gia đình 5–7 người', meta: 'Nhóm đông', text: 'Ưu tiên kiểm tra cả số ghế và khoang hành lý; có thể cần xe lớn hơn khi mang nhiều đồ.' },
    { title: 'Thuê 7–10 ngày', meta: 'Dài ngày', text: 'So sánh tổng tiền và điều kiện sử dụng của đúng gói thay vì chỉ nhìn giá trung bình mỗi ngày.' },
    { title: 'Đi Tết bằng xe điện', meta: 'Xe điện', text: 'Chỉ chọn khi quãng đường, điểm sạc, thời gian dừng và phương án dự phòng khả thi.' },
  ];
  rentalContent.blogLinks = rentalTetBlogLinks;
  rentalContent.faqItems = [
    { question: 'Thuê xe Tết nên đặt trước bao lâu?', answer: 'Nên gửi lịch ngay khi ngày đi, ngày về và tuyến đã tương đối rõ. Xe chỉ được coi là giữ lịch khi đúng mẫu xe và điều kiện booking đã được xác nhận.' },
    { question: 'Giá thuê xe Tết có cố định không?', answer: 'Không có một mức chung cho mọi xe và mọi ngày. Cần nhận báo giá cho đúng mẫu xe, khoảng ngày, điểm giao nhận và điều kiện sử dụng.' },
    { question: 'Có thể đổi người lái hoặc tuyến đi không?', answer: 'Cần báo trước và chỉ thay đổi khi người lái, giấy tờ và phạm vi sử dụng mới đã được chấp thuận.' },
    { question: 'Cần kiểm tra gì khi nhận xe?', answer: 'Kiểm tra giấy tờ, ngoại thất, nội thất, lốp, km, nhiên liệu hoặc pin, VETC, chìa khóa, phụ kiện và đèn cảnh báo.' },
  ];

  return [
    {
      slug: 'hop-tac-chu-xe-cho-thue-tet',
      title: 'Hợp tác chủ xe cho thuê Tết',
      description: 'Hướng dẫn chủ xe tại Hà Nội chuẩn bị hồ sơ, lịch rảnh, bàn giao và thỏa thuận hợp tác khai thác xe dịp Tết 2027.',
      seo_title: 'Hợp Tác Chủ Xe Cho Thuê Tết 2027 | Car Match',
      seo_description: 'Có xe nhàn rỗi dịp Tết? Xem quy trình thẩm định, bàn giao, trách nhiệm và đối soát trước khi hợp tác cùng Car Match.',
      canonical_url: `${siteUrl}/hop-tac-chu-xe-cho-thue-tet`,
      hero_title: 'Có xe nhàn rỗi dịp Tết? Chuẩn bị đúng trước khi hợp tác',
      hero_kicker: 'Car Match · hợp tác chủ xe Tết 2027',
      hero_description: 'Gửi mẫu xe, tình trạng, khu vực đỗ và lịch rảnh để Car Match thẩm định. Việc gửi thông tin không đồng nghĩa xe chắc chắn được nhận khai thác hoặc có mức doanh thu cam kết chung.',
      hero_image_url: vehicleCovers.xpander,
      cta_primary_label: 'Nhắn Zalo gửi thông tin xe',
      cta_primary_url: currentZaloUrl,
      cta_secondary_label: 'Xem hướng dẫn hợp tác',
      cta_secondary_url: '/hop-tac',
      status: 'published',
      published_at: '2026-11-10T00:10:00+07:00',
      page_content: ownerContent,
    },
    {
      slug: 'thue-xe-tu-lai-tet-ha-noi',
      title: 'Thuê xe tự lái Tết tại Hà Nội',
      description: 'Lập kế hoạch thuê xe tự lái Tết 2027 tại Hà Nội theo ngày, tuyến, số người, hành lý và tổng chi phí của đúng booking.',
      seo_title: 'Thuê Xe Tự Lái Tết Hà Nội 2027 | Car Match',
      seo_description: 'Hướng dẫn chọn và thuê xe tự lái Tết 2027 tại Hà Nội: thời điểm đặt, loại xe, tổng chi phí, nhận trả và đi tỉnh.',
      canonical_url: `${siteUrl}/thue-xe-tu-lai-tet-ha-noi`,
      hero_title: 'Thuê xe tự lái Tết tại Hà Nội: chốt theo đúng lịch và hành trình',
      hero_kicker: 'Car Match · thuê xe Tết 2027',
      hero_description: 'Gửi ngày nhận–trả, số người, hành lý, tuyến đi và khu vực nhận xe để Car Match kiểm tra mẫu xe, lịch và báo giá phù hợp. Website không thể hiện tồn xe theo thời gian thực.',
      hero_image_url: vehicleCovers.carnival,
      cta_primary_label: 'Nhắn Zalo kiểm tra xe Tết',
      cta_primary_url: currentZaloUrl,
      cta_secondary_label: 'Xem danh sách xe',
      cta_secondary_url: '/xe',
      status: 'published',
      published_at: '2026-11-10T00:00:00+07:00',
      page_content: rentalContent,
    },
  ];
}

export function createCmsContentInventory() {
  const blogs = postGroups.flatMap((group) => group.posts.map((post, index) => toBlogRow(post, group, index)));
  const landings = [...wave2LocalRentalAreas.map(toLocalLandingRow), ...createTetLandingRows()];
  return { blogs, landings };
}

function sqlText(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlText(JSON.stringify(value))}::jsonb`;
}

function sqlTextArray(values) {
  if (!values?.length) return 'ARRAY[]::text[]';
  return `ARRAY[${values.map(sqlText).join(', ')}]::text[]`;
}

function renderBlogValue(row) {
  return `(
    ${sqlText(row.slug)}, ${sqlText(row.title)}, ${sqlText(row.excerpt)}, ${sqlText(row.main_image_url)},
    ${sqlText(row.author)}, ${sqlText(row.category_slug)}, ${sqlTextArray(row.tags)}, ${sqlText(row.content_html)},
    ${sqlJson(row.content_json)}, ${sqlText(row.seo_title)}, ${sqlText(row.seo_description)}, ${sqlText(row.canonical_url)},
    ${row.status === 'published' ? "'published'" : "'draft'"}, ${row.featured ? 'true' : 'false'}, ${sqlText(row.published_at)}::timestamptz,
    ${row.cta_enabled ? 'true' : 'false'}, ${sqlText(row.cta_title)}, ${sqlText(row.cta_description)},
    ${sqlText(row.cta_primary_label)}, ${sqlText(row.cta_primary_url)}, ${sqlText(row.cta_zalo_label)}, ${sqlText(row.cta_zalo_url)},
    ${sqlTextArray(row.related_destination_slugs)}, ${sqlJson(row.related_vehicle_links)}, ${sqlTextArray(row.related_post_slugs)}
  )`;
}

function renderLandingValue(row) {
  return `(
    ${sqlText(row.slug)}, ${sqlText(row.title)}, ${sqlText(row.description)}, ${sqlText(row.seo_title)},
    ${sqlText(row.seo_description)}, ${sqlText(row.canonical_url)}, ${sqlText(row.hero_title)}, ${sqlText(row.hero_kicker)},
    ${sqlText(row.hero_description)}, ${sqlText(row.hero_image_url)}, ${sqlText(row.cta_primary_label)}, ${sqlText(row.cta_primary_url)},
    ${sqlText(row.cta_secondary_label)}, ${sqlText(row.cta_secondary_url)}, ${sqlText(row.status)}, ${sqlJson(row.page_content)},
    ${sqlText(row.published_at)}::timestamptz
  )`;
}

export function renderCmsInsertSql({ blogs, landings }) {
  const statements = [];
  if (blogs.length) statements.push(`insert into public.blog_posts (
  slug, title, excerpt, main_image_url, author, category_slug, tags, content_html,
  content_json, seo_title, seo_description, canonical_url, status, featured, published_at,
  cta_enabled, cta_title, cta_description, cta_primary_label, cta_primary_url,
  cta_zalo_label, cta_zalo_url, related_destination_slugs, related_vehicle_links, related_post_slugs
)
values
${blogs.map(renderBlogValue).join(',\n')}
on conflict (slug) do nothing;`);
  if (landings.length) statements.push(`insert into public.seo_landing_pages (
  slug, title, description, seo_title, seo_description, canonical_url, hero_title,
  hero_kicker, hero_description, hero_image_url, cta_primary_label, cta_primary_url,
  cta_secondary_label, cta_secondary_url, status, page_content, published_at
)
values
${landings.map(renderLandingValue).join(',\n')}
on conflict (slug) do nothing;`);

  return `begin;\n\n${statements.join('\n\n')}\n\ncommit;`;
}

function validateInventory(inventory) {
  const blogSlugs = inventory.blogs.map((item) => item.slug);
  const landingSlugs = inventory.landings.map((item) => item.slug);
  const problems = [];
  if (blogSlugs.length !== 70) problems.push(`Expected 70 blogs, received ${blogSlugs.length}`);
  if (landingSlugs.length !== 14) problems.push(`Expected 14 landings, received ${landingSlugs.length}`);
  if (new Set(blogSlugs).size !== blogSlugs.length) problems.push('Duplicate blog slugs');
  if (new Set(landingSlugs).size !== landingSlugs.length) problems.push('Duplicate landing slugs');
  const serialized = JSON.stringify(inventory);
  if (serialized.includes('0975563290') || serialized.includes('0975 563 290')) problems.push('Old phone number remains');
  if (serialized.includes('og-image-20260619')) problems.push('Old generic social image remains');
  if (problems.length) throw new Error(problems.join('; '));
}

const directRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (directRun) {
  const inventory = createCmsContentInventory();
  validateInventory(inventory);
  if (process.argv.includes('--sql')) {
    const kindArg = process.argv.find((arg) => arg.startsWith('--kind='))?.split('=')[1] || 'all';
    const offset = Number(process.argv.find((arg) => arg.startsWith('--offset='))?.split('=')[1] || 0);
    const limitValue = process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1];
    const limit = limitValue ? Number(limitValue) : Number.POSITIVE_INFINITY;
    const selected = {
      blogs: kindArg === 'all' || kindArg === 'blog' ? inventory.blogs.slice(offset, offset + limit) : [],
      landings: kindArg === 'all' || kindArg === 'landing' ? inventory.landings.slice(offset, offset + limit) : [],
    };
    process.stdout.write(renderCmsInsertSql(selected));
  } else {
    process.stdout.write(`${JSON.stringify({
      blogs: inventory.blogs.length,
      landings: inventory.landings.length,
      total: inventory.blogs.length + inventory.landings.length,
      blogSlugs: inventory.blogs.map((item) => item.slug),
      landingSlugs: inventory.landings.map((item) => item.slug),
    }, null, 2)}\n`);
  }
}
