import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const siteUrl = 'https://www.carmatch.vn';
const brandLogo = `${siteUrl}/brand/carmatch-lockup-navy.png`;
const brandIcon = `${siteUrl}/brand/carmatch-logo-stacked-navy.png`;
const hanoiDeliveryDetails = {
  '@type': 'OfferShippingDetails',
  shippingDestination: {
    '@type': 'DefinedRegion',
    addressCountry: 'VN',
    addressRegion: 'Hà Nội',
  },
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: 0,
    currency: 'VND',
  },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: 1,
      unitCode: 'DAY',
    },
    transitTime: {
      '@type': 'QuantitativeValue',
      minValue: 0,
      maxValue: 1,
      unitCode: 'DAY',
    },
  },
};
const rentalReturnPolicy = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'VN',
  returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
};

const client = createSanityClient({
  projectId: 'zwazjo4q',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createSupabaseClient(supabaseUrl, supabaseAnonKey) : null;

const postsQuery = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->title,
  author,
  body,
  seoTitle,
  seoDescription
}`;

function categoryLabel(slug = '') {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapSupabasePost(row) {
  return {
    _id: row.id,
    title: row.title,
    slug: { current: row.slug },
    publishedAt: row.published_at || row.updated_at || row.created_at,
    excerpt: row.excerpt || '',
    mainImageUrl: row.main_image_url || null,
    categories: row.category_slug ? [categoryLabel(row.category_slug)] : [],
    author: row.author || 'CarMatch',
    body: [],
    bodyHtml: row.content_html || '',
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    canonicalUrl: row.canonical_url || undefined,
    ctaEnabled: row.cta_enabled ?? true,
    ctaTitle: row.cta_title || undefined,
    ctaDescription: row.cta_description || undefined,
    ctaPrimaryLabel: row.cta_primary_label || undefined,
    ctaPrimaryUrl: row.cta_primary_url || undefined,
    ctaZaloLabel: row.cta_zalo_label || undefined,
    ctaZaloUrl: row.cta_zalo_url || undefined,
    relatedDestinationSlugs: row.related_destination_slugs || [],
    relatedVehicleLinks: row.related_vehicle_links || [],
    relatedPostSlugs: row.related_post_slugs || [],
  };
}

async function fetchBlogPosts() {
  if (supabase) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, main_image_url, author, category_slug, content_html, seo_title, seo_description, canonical_url, cta_enabled, cta_title, cta_description, cta_primary_label, cta_primary_url, cta_zalo_label, cta_zalo_url, related_destination_slugs, related_vehicle_links, related_post_slugs, status, published_at, created_at, updated_at')
      .eq('status', 'published')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (!error && data?.length) {
      return data.map(mapSupabasePost);
    }

    if (error) {
      console.warn(`Skipped Supabase blog source: ${error.message}`);
    }
  }

  return client.fetch(postsQuery);
}

async function fetchTravelDestinations() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('travel_destinations')
    .select('slug, name')
    .eq('status', 'published');
  if (error) {
    console.warn(`Skipped travel destination labels: ${error.message}`);
    return [];
  }
  return data || [];
}

const blogMeta = {
  title: 'Blog Kinh Nghiệm Thuê Xe Tự Lái | CarMatch Hà Nội',
  description:
    'Kinh nghiệm thuê xe tự lái Hà Nội: giấy tờ cần chuẩn bị, đặt cọc, bảo hiểm, chọn xe phù hợp và dịch vụ giao xe tận sảnh chung cư.',
  canonical: `${siteUrl}/blog`,
};

const routeMeta = [
  {
    path: '/',
    title: 'CarMatch — Thuê Xe Tự Lái Hà Nội | Giá Từ 800K/Ngày',
    description:
      'CarMatch - Thuê xe tự lái Hà Nội. 20+ mẫu xe: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 800K/ngày. Giao xe tận nơi. Đặt qua Zalo 0975 563 290.',
    canonical: siteUrl,
    priority: '1.0',
    changefreq: 'weekly',
  },
  {
    path: '/xe',
    title: 'Thuê Xe Tự Lái Hà Nội — 20+ Mẫu Xe | CarMatch',
    description:
      'Duyệt 20+ mẫu xe tự lái cho thuê tại Hà Nội: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 800K/ngày. Giao xe tận sảnh tòa nhà.',
    canonical: `${siteUrl}/xe`,
    priority: '0.9',
    changefreq: 'daily',
  },
  {
    path: '/di-dau',
    title: 'Đi Đâu Bằng Xe Quanh Hà Nội | CarMatch',
    description:
      'Gợi ý điểm đi chơi, ăn uống và du lịch gần Hà Nội kèm lịch trình, chi phí di chuyển và loại xe tự lái phù hợp từ CarMatch.',
    canonical: `${siteUrl}/di-dau`,
    priority: '0.86',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/cuoi-tuan-gan-ha-noi',
    title: 'Cuối Tuần Gần Hà Nội Đi Đâu Bằng Xe Tự Lái | CarMatch',
    description:
      'Gợi ý điểm đi chơi cuối tuần gần Hà Nội bằng xe tự lái: Ba Vì, Sóc Sơn, Tam Đảo, Ninh Bình, Đại Lải, Ecopark.',
    canonical: `${siteUrl}/di-dau/chu-de/cuoi-tuan-gan-ha-noi`,
    priority: '0.82',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/di-trong-ngay',
    title: 'Đi Trong Ngày Từ Hà Nội Bằng Xe Tự Lái | CarMatch',
    description:
      'Các điểm đi trong ngày từ Hà Nội: Nội Bài, Ecopark, Sóc Sơn, Ba Vì, Ninh Bình, Hồ Núi Cốc kèm chi phí di chuyển.',
    canonical: `${siteUrl}/di-dau/chu-de/di-trong-ngay`,
    priority: '0.82',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/cho-gia-dinh-co-tre-em',
    title: 'Đi Đâu Gần Hà Nội Cho Gia Đình Có Trẻ Em | CarMatch',
    description:
      'Gợi ý điểm đi chơi gần Hà Nội cho gia đình có trẻ em, kèm loại xe nên thuê, lịch trình nhẹ và lưu ý chỗ đỗ.',
    canonical: `${siteUrl}/di-dau/chu-de/cho-gia-dinh-co-tre-em`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/xe-7-cho-di-tinh',
    title: 'Thuê Xe 7 Chỗ Đi Tỉnh Từ Hà Nội | CarMatch',
    description:
      'Gợi ý các tuyến nên thuê xe 7 chỗ đi tỉnh từ Hà Nội: Hạ Long, Mộc Châu, Mai Châu, Pù Luông, Sapa, Cát Bà.',
    canonical: `${siteUrl}/di-dau/chu-de/xe-7-cho-di-tinh`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/di-xe-dien',
    title: 'Đi Du Lịch Gần Hà Nội Bằng Xe Điện | CarMatch',
    description:
      'Gợi ý tuyến gần Hà Nội phù hợp đi xe điện: Nội Bài, Ecopark, Ninh Bình, Hải Phòng, Hạ Long, Đại Lải.',
    canonical: `${siteUrl}/di-dau/chu-de/di-xe-dien`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ha-long',
    title: 'Đi Hạ Long Bằng Xe Tự Lái — Lịch Trình & Chi Phí | CarMatch',
    description:
      'Guide đi Hạ Long từ Hà Nội bằng xe tự lái: đường đi, chỗ đỗ, lịch trình 2 ngày 1 đêm, chi phí cao tốc/xăng sạc và xe phù hợp.',
    canonical: `${siteUrl}/di-dau/ha-long`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ninh-binh',
    title: 'Đi Ninh Bình Bằng Xe Tự Lái — Lịch Trình & Chi Phí | CarMatch',
    description:
      'Guide đi Ninh Bình từ Hà Nội bằng xe tự lái: lịch trình trong ngày hoặc 2 ngày, điểm dừng, chỗ đỗ và chi phí di chuyển dự kiến.',
    canonical: `${siteUrl}/di-dau/ninh-binh`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/tam-dao',
    title: 'Đi Tam Đảo Bằng Xe Tự Lái — Đường Đèo & Xe Phù Hợp | CarMatch',
    description:
      'Guide đi Tam Đảo từ Hà Nội bằng xe tự lái: lưu ý đường đèo, chỗ đỗ, lịch trình 2 ngày 1 đêm và loại xe phù hợp.',
    canonical: `${siteUrl}/di-dau/tam-dao`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/moc-chau',
    title: 'Đi Mộc Châu Bằng Xe Tự Lái — Lịch Trình 3N2Đ | CarMatch',
    description:
      'Guide đi Mộc Châu từ Hà Nội bằng xe tự lái: cung đường dài, điểm dừng, lịch trình 3 ngày 2 đêm, chi phí và xe nên chọn.',
    canonical: `${siteUrl}/di-dau/moc-chau`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/noi-bai',
    title: 'Đi Nội Bài Bằng Xe Tự Lái — Chi Phí & Lưu Ý | CarMatch',
    description:
      'Guide đi sân bay Nội Bài bằng xe tự lái: tuyến đường, điểm đón trả, chỗ gửi xe, chi phí dự kiến và xe phù hợp.',
    canonical: `${siteUrl}/di-dau/noi-bai`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ba-vi',
    title: 'Đi Ba Vì Bằng Xe Tự Lái — Lịch Trình & Chi Phí | CarMatch',
    description:
      'Guide đi Ba Vì từ Hà Nội bằng xe tự lái: lịch trình trong ngày hoặc 2 ngày 1 đêm, chỗ đỗ, đường đi và xe phù hợp.',
    canonical: `${siteUrl}/di-dau/ba-vi`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/soc-son',
    title: 'Đi Sóc Sơn Bằng Xe Tự Lái — Villa, Cafe, Hồ Đồng Đò | CarMatch',
    description:
      'Guide đi Sóc Sơn từ Hà Nội bằng xe tự lái: villa cuối tuần, cafe rừng, Hồ Đồng Đò, chỗ đỗ và xe nên chọn.',
    canonical: `${siteUrl}/di-dau/soc-son`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ecopark',
    title: 'Đi Ecopark Bằng Xe Tự Lái — Picnic & Cafe Trong Ngày | CarMatch',
    description:
      'Guide đi Ecopark bằng xe tự lái từ Hà Nội: lịch trình trong ngày, chỗ đỗ xe, điểm ăn chơi và xe phù hợp gia đình.',
    canonical: `${siteUrl}/di-dau/ecopark`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/dai-lai',
    title: 'Đi Đại Lải Bằng Xe Tự Lái — Resort Cuối Tuần | CarMatch',
    description:
      'Guide đi Đại Lải từ Hà Nội bằng xe tự lái: lịch trình 2 ngày 1 đêm, resort/villa, chỗ đỗ và xe nên thuê.',
    canonical: `${siteUrl}/di-dau/dai-lai`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/hai-phong',
    title: 'Đi Hải Phòng Bằng Xe Tự Lái — Food Tour & Chi Phí | CarMatch',
    description:
      'Guide đi Hải Phòng bằng xe tự lái từ Hà Nội: food tour trong ngày, cao tốc, chỗ đỗ và chi phí di chuyển dự kiến.',
    canonical: `${siteUrl}/di-dau/hai-phong`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/cat-ba',
    title: 'Đi Cát Bà Bằng Xe Tự Lái — Phà, Chỗ Đỗ, Xe 7 Chỗ | CarMatch',
    description:
      'Guide đi Cát Bà bằng xe tự lái từ Hà Nội: phà/cáp treo, lịch trình 2-3 ngày, chỗ đỗ và xe 7 chỗ phù hợp.',
    canonical: `${siteUrl}/di-dau/cat-ba`,
    priority: '0.74',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/mai-chau',
    title: 'Đi Mai Châu Bằng Xe Tự Lái — Lịch Trình 2N1Đ | CarMatch',
    description:
      'Guide đi Mai Châu từ Hà Nội bằng xe tự lái: đèo Thung Khe, Bản Lác, lịch trình 2 ngày 1 đêm và xe nên chọn.',
    canonical: `${siteUrl}/di-dau/mai-chau`,
    priority: '0.74',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/pu-luong',
    title: 'Đi Pù Luông Bằng Xe Tự Lái — Xe Gầm Cao & Lịch Trình | CarMatch',
    description:
      'Guide đi Pù Luông bằng xe tự lái từ Hà Nội: cung đường, lịch trình 3 ngày 2 đêm, chỗ đỗ và loại xe phù hợp.',
    canonical: `${siteUrl}/di-dau/pu-luong`,
    priority: '0.74',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/sapa',
    title: 'Đi Sapa Bằng Xe Tự Lái — Đường Dài & Xe Phù Hợp | CarMatch',
    description:
      'Guide đi Sapa bằng xe tự lái từ Hà Nội: cao tốc Nội Bài - Lào Cai, đường đèo, chỗ đỗ và xe 7 chỗ/SUV phù hợp.',
    canonical: `${siteUrl}/di-dau/sapa`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ho-nui-coc',
    title: 'Đi Hồ Núi Cốc Bằng Xe Tự Lái — Trong Ngày Từ Hà Nội | CarMatch',
    description:
      'Guide đi Hồ Núi Cốc bằng xe tự lái từ Hà Nội: lịch trình trong ngày, cao tốc Thái Nguyên, chỗ đỗ và chi phí dự kiến.',
    canonical: `${siteUrl}/di-dau/ho-nui-coc`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di',
    title: 'Lập Kế Hoạch Thuê Xe Tự Lái Theo Chuyến | CarMatch',
    description:
      'Nhập điểm đến, ngày đi và số người để CarMatch gợi ý loại xe, chi phí dự kiến, lịch trình và xe còn phù hợp cho chuyến đi tự lái từ Hà Nội.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di`,
    priority: '0.85',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/ha-long',
    title: 'Thuê Xe Tự Lái Đi Hạ Long — Lịch Trình & Chi Phí | CarMatch',
    description:
      'Lập kế hoạch thuê xe tự lái đi Hạ Long từ Hà Nội: gợi ý xe phù hợp, chi phí dự kiến, lịch trình 2 ngày 1 đêm và gửi yêu cầu qua Zalo.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/ha-long`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/ninh-binh',
    title: 'Thuê Xe Tự Lái Đi Ninh Bình — Lịch Trình & Chi Phí | CarMatch',
    description:
      'Lập kế hoạch thuê xe tự lái đi Ninh Bình từ Hà Nội: gợi ý xe 5-7 chỗ, chi phí dự kiến, lịch trình trong ngày hoặc 2 ngày.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/ninh-binh`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/tam-dao',
    title: 'Thuê Xe Tự Lái Đi Tam Đảo — Lịch Trình & Chi Phí | CarMatch',
    description:
      'Gợi ý thuê xe tự lái đi Tam Đảo từ Hà Nội: chọn xe phù hợp đường đèo, chi phí dự kiến và lịch trình 2 ngày 1 đêm.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/tam-dao`,
    priority: '0.75',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/moc-chau',
    title: 'Thuê Xe Tự Lái Đi Mộc Châu — Lịch Trình & Chi Phí | CarMatch',
    description:
      'Lập kế hoạch thuê xe tự lái đi Mộc Châu từ Hà Nội: gợi ý xe đường dài, chi phí dự kiến, lịch trình 3 ngày 2 đêm.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/moc-chau`,
    priority: '0.75',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/noi-bai',
    title: 'Thuê Xe Tự Lái Đi Nội Bài — Chi Phí & Gợi Ý Xe | CarMatch',
    description:
      'Tính chi phí thuê xe tự lái đi sân bay Nội Bài từ Hà Nội, gợi ý xe phù hợp và gửi yêu cầu tư vấn qua Zalo CarMatch.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/noi-bai`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/thue-xe-thang',
    title: 'Thuê Xe Theo Tháng Hà Nội — Cư Dân & Doanh Nghiệp | CarMatch',
    description:
      'Gói thuê xe theo tháng tại Hà Nội: tiết kiệm 30–40% so với thuê ngày lẻ. Giao xe tận tòa nhà, hóa đơn VAT, linh hoạt 1–12 tháng. Báo giá miễn phí.',
    canonical: `${siteUrl}/thue-xe-thang`,
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/hop-tac',
    title: 'Hợp Tác Chủ Xe — Cho Thuê Xe Sinh Lời | CarMatch',
    description:
      'Hợp tác chủ xe cùng CarMatch: tối ưu doanh thu xe nhàn rỗi, vận hành minh bạch, lịch đặt xe rõ ràng và hỗ trợ khách thuê tại Hà Nội.',
    canonical: `${siteUrl}/hop-tac`,
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/gioi-thieu',
    title: 'Giới Thiệu CarMatch — Dịch Vụ Thuê Xe Tự Lái Hà Nội',
    description:
      'CarMatch cung cấp dịch vụ thuê xe tự lái tại Hà Nội, giao xe tận sảnh chung cư, quy trình đặt xe rõ ràng và hỗ trợ khách hàng mỗi ngày.',
    canonical: `${siteUrl}/gioi-thieu`,
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    path: '/faq',
    title: 'Câu Hỏi Thường Gặp — CarMatch',
    description:
      'Giải đáp câu hỏi thường gặp về đặt xe online, thanh toán, nhận xe, giấy tờ, bảo hiểm và phụ phí khi thuê xe tại CarMatch.',
    canonical: `${siteUrl}/faq`,
    priority: '0.5',
    changefreq: 'monthly',
  },
  {
    path: '/chinh-sach',
    title: 'Chính Sách Thuê Xe — CarMatch',
    description:
      'Điều kiện thuê xe, đặt cọc, hủy chuyến, bảo hiểm, giới hạn km và các chính sách cần biết khi thuê xe tự lái tại CarMatch.',
    canonical: `${siteUrl}/chinh-sach`,
    priority: '0.5',
    changefreq: 'monthly',
  },
];

const noIndexRouteMeta = [
  {
    path: '/dat-xe',
    title: 'Xác Nhận Đặt Xe | CarMatch',
    description: 'Trang xác nhận đặt xe CarMatch.',
    canonical: `${siteUrl}/dat-xe`,
    noIndex: true,
  },
  {
    path: '/admin',
    title: 'Admin Dashboard | CarMatch',
    description: 'Trang quản trị nội bộ CarMatch.',
    canonical: `${siteUrl}/admin`,
    noIndex: true,
  },
];

const descriptionOverrides = {
  'thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh':
    'Thuê xe tự lái Vinhomes Ocean Park, giao xe tận sảnh tại Gia Lâm. Bảng giá, thủ tục, đặt cọc và kinh nghiệm chọn xe phù hợp.',
};

const internalLinks = {
  'thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh': [
    { href: '/xe', label: 'Xem danh sách xe tự lái tại Hà Nội' },
    { href: '/thue-xe-thang', label: 'Tham khảo gói thuê xe theo tháng' },
    { href: '/blog/kinh-nghiem-thue-xe-tu-lai-ha-noi', label: 'Đọc kinh nghiệm thuê xe tự lái Hà Nội' },
  ],
  'kinh-nghiem-thue-xe-tu-lai-ha-noi': [
    { href: '/xe', label: 'Xem xe đang có tại CarMatch' },
    { href: '/blog/thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh', label: 'Thuê xe tự lái Vinhomes Ocean Park' },
    { href: '/thue-xe-thang', label: 'Tìm hiểu gói thuê xe dài ngày' },
  ],
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugify(text, fallback = '') {
  const base = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallback;
}

function makeVehicleSlug(vehicle) {
  const model = vehicle.vehicle_models || {};
  const displayName = vehicle.display_name || [model.make, model.model, model.variant, vehicle.model_year].filter(Boolean).join(' ');
  return slugify(displayName, vehicle.id);
}

function makeDuplicateVehicleSlug(vehicle) {
  const baseSlug = makeVehicleSlug(vehicle);
  const platePart = slugify(vehicle.plate_number || '');
  const colorPart = slugify(vehicle.color || '');
  const suffix = platePart || colorPart || String(vehicle.id || '').slice(0, 8).toLowerCase();
  return `${baseSlug}-${suffix}`;
}

function getVehicleImage(vehicle) {
  const refs = vehicle.external_refs && typeof vehicle.external_refs === 'object' ? vehicle.external_refs : {};
  return refs.coverImageUrl || refs.vehiclePhotoUrl || refs.imageUrl || brandIcon;
}

function getVehicleName(vehicle) {
  const model = vehicle.vehicle_models || {};
  return vehicle.display_name || [model.make, model.model].filter(Boolean).join(' ') || 'Xe CarMatch';
}

function vehicleDescription(vehicle) {
  const model = vehicle.vehicle_models || {};
  const price = vehicle.daily_base_price
    ? `${Number(vehicle.daily_base_price).toLocaleString('vi-VN')}đ/ngày`
    : 'giá tốt theo ngày';
  const seats = model.seats ? `${model.seats} chỗ` : 'nhiều lựa chọn';
  const fuel = model.fuel_type ? `, ${model.fuel_type}` : '';
  return `Thuê ${getVehicleName(vehicle)} tại Hà Nội: xe ${seats}${fuel}, ${price}. Giao xe tận nơi, đặt cọc online và xác nhận nhanh qua CarMatch.`;
}

function publisherData() {
  return {
    '@type': 'Organization',
    name: 'CarMatch',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: brandIcon,
    },
  };
}

function breadcrumbData(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path === '/' ? '' : item.path}`,
    })),
  };
}

function webPageData(meta, extra = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': extra.type || 'WebPage',
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
    inLanguage: 'vi-VN',
    isPartOf: {
      '@type': 'WebSite',
      name: 'CarMatch',
      url: siteUrl,
    },
    publisher: publisherData(),
    ...extra.fields,
  };
}

function faqPageData(meta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
    inLanguage: 'vi-VN',
    publisher: publisherData(),
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Cần giấy tờ gì để thuê xe tự lái tại CarMatch?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Khách thuê cần CCCD, giấy phép lái xe còn hạn và đặt cọc theo quy định từng dòng xe.',
        },
      },
      {
        '@type': 'Question',
        name: 'CarMatch có giao xe tận nơi không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có. CarMatch hỗ trợ giao xe tận sảnh chung cư, tòa nhà và khu đô thị tại Hà Nội theo lịch hẹn.',
        },
      },
      {
        '@type': 'Question',
        name: 'Giá thuê xe tự lái tại CarMatch tính thế nào?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Giá thuê phụ thuộc mẫu xe, thời gian thuê và nhu cầu giao nhận. Khách có thể xem danh sách xe hoặc liên hệ Zalo để được báo giá nhanh.',
        },
      },
    ],
  };
}

function vehicleStructuredData(vehicle) {
  const name = getVehicleName(vehicle);
  const model = vehicle.vehicle_models || {};
  const url = `${siteUrl}/xe/${vehicle.slug}`;
  const price = Number(vehicle.daily_base_price || 0);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `Thuê ${name}`,
      description: vehicleDescription(vehicle),
      image: [getVehicleImage(vehicle)],
      brand: model.make ? { '@type': 'Brand', name: model.make } : undefined,
      category: 'Xe tự lái',
      url,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'VND',
        price: price || undefined,
        availability: 'https://schema.org/InStock',
        seller: publisherData(),
        shippingDetails: hanoiDeliveryDetails,
        hasMerchantReturnPolicy: rentalReturnPolicy,
      },
    },
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Thuê xe tự lái', path: '/xe' },
      { name, path: `/xe/${vehicle.slug}` },
    ]),
  ];
}

function fleetStructuredData(meta, vehicles) {
  return [
    webPageData(meta, {
      type: 'CollectionPage',
      fields: {
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: vehicles.length,
          itemListElement: vehicles.slice(0, 50).map((vehicle, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: getVehicleName(vehicle),
            url: `${siteUrl}/xe/${vehicle.slug}`,
          })),
        },
      },
    }),
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Thuê xe tự lái', path: '/xe' },
    ]),
  ];
}

function routeStructuredData(meta, vehicles) {
  if (meta.path === '/') return undefined;
  if (meta.path === '/xe') return fleetStructuredData(meta, vehicles);
  if (meta.path === '/faq') return [
    faqPageData(meta),
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ]),
  ];

  const currentName = meta.path === '/thue-xe-thang'
    ? 'Thuê xe tháng'
    : meta.path === '/hop-tac'
      ? 'Hợp tác chủ xe'
      : meta.path === '/gioi-thieu'
        ? 'Giới thiệu'
        : meta.path === '/chinh-sach'
          ? 'Chính sách'
          : meta.title;

  return [
    webPageData(meta),
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: currentName, path: meta.path },
    ]),
  ];
}

async function fetchVehicles() {
  if (!supabase) {
    try {
      const response = await fetch(`${siteUrl}/api/vehicles`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return uniqueVehicleSlugs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn(`Skipped vehicle sitemap generation: ${error.message}`);
      return [];
    }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select(
      'id,display_name,plate_number,color,model_year,daily_base_price,status,published,external_refs,vehicle_models(make,model,variant,seats,fuel_type,transmission)'
    )
    .eq('status', 'available')
    .eq('published', true)
    .order('daily_base_price', { ascending: true });

  if (error) {
    console.warn(`Skipped vehicle sitemap generation: ${error.message}`);
    return [];
  }

  return uniqueVehicleSlugs(data || []);
}

function uniqueVehicleSlugs(vehicles) {
  const counts = new Map();
  vehicles.forEach((vehicle) => {
    const baseSlug = makeVehicleSlug(vehicle);
    counts.set(baseSlug, (counts.get(baseSlug) || 0) + 1);
  });

  const used = new Set();
  return vehicles.map((vehicle) => {
    const baseSlug = makeVehicleSlug(vehicle);
    let slug = (counts.get(baseSlug) || 0) > 1 ? makeDuplicateVehicleSlug(vehicle) : baseSlug;
    let index = 2;
    while (used.has(slug)) {
      slug = `${makeDuplicateVehicleSlug(vehicle)}-${index}`;
      index += 1;
    }
    used.add(slug);
    return { ...vehicle, slug };
  });
}

function replaceOrInsertHead(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace('</head>', `    ${replacement}\n  </head>`);
}

function renderSpaShell(baseHtml, meta) {
  let html = baseHtml;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonical);
  const image = escapeHtml(meta.image || brandIcon);
  const robots = meta.noIndex ? 'noindex, nofollow' : 'index, follow';

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = replaceOrInsertHead(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`);
  html = replaceOrInsertHead(html, /<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${robots}" />`);
  html = replaceOrInsertHead(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${image}" />`);
  html = replaceOrInsertHead(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`);
  html = replaceOrInsertHead(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`);
  html = replaceOrInsertHead(html, /<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${image}" />`);
  if (meta.structuredData) {
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`,
    );
  }

  return html;
}

async function writeSpaShell(baseHtml, meta) {
  const routePath = meta.path === '/' ? '' : meta.path.replace(/^\/+/, '');
  const outputDir = path.join(distDir, routePath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), renderSpaShell(baseHtml, meta), 'utf8');
}

async function writeStaticRouteShells(vehicles) {
  const baseHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');

  for (const meta of routeMeta) {
    await writeSpaShell(baseHtml, {
      ...meta,
      structuredData: routeStructuredData(meta, vehicles),
    });
  }

  for (const meta of noIndexRouteMeta) {
    await writeSpaShell(baseHtml, {
      ...meta,
      structuredData: webPageData(meta),
    });
  }

  for (const vehicle of vehicles) {
    const name = getVehicleName(vehicle);
    await writeSpaShell(baseHtml, {
      path: `/xe/${vehicle.slug}`,
      title: `Thuê ${name} Tự Lái Hà Nội | CarMatch`,
      description: vehicleDescription(vehicle),
      canonical: `${siteUrl}/xe/${vehicle.slug}`,
      image: getVehicleImage(vehicle),
      structuredData: vehicleStructuredData(vehicle),
    });
  }
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

function getText(children = []) {
  return children.map((child) => child.text || '').join('');
}

function renderMarks(text, marks = []) {
  let rendered = escapeHtml(text);
  for (const mark of marks) {
    if (mark === 'strong') rendered = `<strong>${rendered}</strong>`;
    if (mark === 'em') rendered = `<em>${rendered}</em>`;
  }
  return rendered;
}

function renderChildren(children = []) {
  return children.map((child) => renderMarks(child.text || '', child.marks || [])).join('');
}

function renderPortableText(blocks = []) {
  const html = [];
  let listType = null;
  let listItems = [];

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    const tag = listType === 'number' ? 'ol' : 'ul';
    html.push(`<${tag}>${listItems.map((item) => `<li>${item}</li>`).join('')}</${tag}>`);
    listType = null;
    listItems = [];
  };

  for (const block of blocks) {
    if (block._type === 'image') {
      flushList();
      continue;
    }

    if (block._type !== 'block') continue;

    const content = renderChildren(block.children);
    if (!content.trim()) continue;

    if (block.listItem) {
      const currentType = block.listItem === 'number' ? 'number' : 'bullet';
      if (listType && listType !== currentType) flushList();
      listType = currentType;
      listItems.push(content);
      continue;
    }

    flushList();

    if (block.style === 'h2') {
      html.push(`<h2>${content}</h2>`);
    } else if (block.style === 'h3') {
      html.push(`<h3>${content}</h3>`);
    } else if (block.style === 'blockquote') {
      html.push(`<blockquote><p>${content}</p></blockquote>`);
    } else {
      html.push(`<p>${content}</p>`);
    }
  }

  flushList();
  return html.join('\n');
}

function layout({ title, description, canonical, image, type = 'article', body, structuredData }) {
  const ogImage = image || brandIcon;

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#11163e" />
    <meta name="robots" content="index, follow" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:site_name" content="CarMatch" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="CarMatch logo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="preload" as="image" href="/brand/carmatch-lockup-navy.png" />
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
    <style>
      :root { color-scheme: light; font-family: "Be Vietnam Pro", Arial, sans-serif; color: #172033; background: #f8fafc; }
      * { box-sizing: border-box; }
      body { margin: 0; padding-top: 64px; }
      a { color: #11163e; font-weight: 800; text-decoration: none; }
      .topbar { background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid #f3f4f6; left: 0; position: fixed; right: 0; top: 0; z-index: 50; }
      .nav { align-items: center; display: flex; height: 64px; justify-content: space-between; margin: 0 auto; max-width: 1280px; padding: 0 32px; }
      .brand { align-items: center; display: inline-flex; line-height: 0; }
      .brand img { display: block; height: 36px; object-fit: contain; width: auto; }
      .nav-center { display: contents; }
      .navlinks { align-items: center; display: flex; gap: 32px; }
      .navlinks a { color: #4b5563; font-size: 14px; font-weight: 500; transition: color .16s ease; }
      .navlinks a:hover, .navlinks a.active { color: #11163e; }
      .nav-cta { background: #11163e; border-radius: 999px; color: #fff; display: inline-flex; font-size: 14px; font-weight: 700; padding: 10px 20px; transition: background .16s ease; white-space: nowrap; }
      .nav-cta:hover { background: #0d1130; color: #fff; }
      main { margin: 0 auto; max-width: 1040px; padding: 88px 20px 80px; }
      .eyebrow { color: #11163e; font-size: 13px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      h1 { color: #101827; font-size: clamp(34px, 6vw, 62px); line-height: 1.02; margin: 14px 0 18px; }
      h2 { color: #111827; font-size: clamp(25px, 4vw, 36px); line-height: 1.16; margin: 44px 0 14px; }
      h3 { color: #1f2937; font-size: 22px; line-height: 1.25; margin: 32px 0 10px; }
      p, li { color: #374151; font-size: 18px; line-height: 1.78; }
      ul, ol { padding-left: 24px; }
      strong { color: #111827; }
      blockquote { border-left: 4px solid #11163e; margin: 28px 0; padding: 2px 0 2px 20px; }
      .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: 32px; }
      .card, .article { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 12px 30px rgba(15,23,42,.04); }
      .card { display: block; overflow: hidden; }
      .card img { aspect-ratio: 16/9; display: block; object-fit: cover; width: 100%; }
      .card-body { padding: 22px; }
      .card h2 { font-size: 22px; margin: 0 0 10px; }
      .card p { font-size: 15px; line-height: 1.6; margin: 0; }
      .meta { color: #6b7280; font-size: 13px; font-weight: 700; margin-top: 14px; }
      .article { padding: clamp(22px, 5vw, 56px); }
      .article img.hero { aspect-ratio: 16/9; border-radius: 8px; display: block; margin: 28px 0 34px; object-fit: cover; width: 100%; }
      .related { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; margin-top: 40px; padding: 22px; }
      .related h2 { font-size: 22px; margin: 0 0 10px; }
      .related ul { margin: 0; }
      .related li { font-size: 16px; line-height: 1.7; }
      .cta { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 16px; margin-top: 44px; padding: 28px; text-align: center; }
      .cta .eyebrow { color: #2563eb; margin: 0 0 10px; }
      .cta h2 { font-size: 28px; margin: 0 0 8px; }
      .cta p { font-size: 16px; margin: 0 0 16px; }
      .button { background: #11163e; border-radius: 999px; color: #fff; display: inline-flex; margin-top: 8px; padding: 13px 22px; }
      .cta-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
      .button.secondary { background: #fff; border: 1px solid #cbd5e1; color: #11163e; }
      @media (max-width: 900px) { .nav { padding: 0 16px; } .navlinks a:nth-child(2), .navlinks a:nth-child(3), .navlinks a:nth-child(4) { display: none; } .nav-cta { display: none; } }
      @media (max-width: 640px) { main { padding: 48px 16px 64px; } p, li { font-size: 16px; } .article { margin-left: -16px; margin-right: -16px; border-radius: 0; } .brand img { height: 32px; } .navlinks { gap: 18px; } }
    </style>
  </head>
  <body>
    <header class="topbar">
      <nav class="nav" aria-label="Điều hướng chính">
        <a class="brand" href="/" aria-label="CarMatch">
          <img src="/brand/carmatch-lockup-navy.png" alt="CarMatch" />
        </a>
        <div class="nav-center">
          <div class="navlinks">
            <a href="/xe">Thuê xe tự lái</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/hop-tac">Hợp tác chủ xe</a>
            <a href="/gioi-thieu">Giới thiệu</a>
            <a class="active" href="/blog">Blog</a>
          </div>
          <a class="nav-cta" href="https://zalo.me/0975563290" rel="noopener noreferrer">Đặt xe qua Zalo</a>
        </div>
      </nav>
    </header>
    ${body}
    <script>
      document.addEventListener('click', function (event) {
        var target = event.target;
        var link = target && target.closest ? target.closest('[data-blog-action]') : null;
        if (!link) return;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'blog_conversion_click',
          article_slug: link.getAttribute('data-article-slug') || '',
          action: link.getAttribute('data-blog-action') || '',
          target: link.getAttribute('data-blog-target') || link.getAttribute('href') || ''
        });
      });
    </script>
  </body>
</html>`;
}

function postUrl(post) {
  return post.canonicalUrl || `${siteUrl}/blog/${post.slug.current}`;
}

function postDescription(post) {
  return descriptionOverrides[post.slug.current] || post.seoDescription || post.excerpt || 'Kinh nghiệm thuê xe tự lái Hà Nội từ CarMatch.';
}

function postImage(post) {
  return post.mainImageUrl || brandIcon;
}

function postAuthor(post) {
  return post.author || 'CarMatch';
}

function renderInternalLinks(post, contentIndex) {
  const configuredLinks = [
    ...(post.relatedDestinationSlugs || []).slice(0, 2).map((slug) => ({ href: `/di-dau/${slug}`, label: `Đi ${contentIndex.destinationNames.get(slug) || categoryLabel(slug)} bằng xe tự lái`, action: 'related_destination' })),
    ...(post.relatedVehicleLinks || []).slice(0, 1).map((link) => ({ href: link.url, label: link.label, action: 'related_vehicle' })),
    ...(post.relatedPostSlugs || []).slice(0, 1).map((slug) => ({ href: `/blog/${slug}`, label: contentIndex.postTitles.get(slug) || categoryLabel(slug), action: 'related_post' })),
  ].filter((link) => link.href && link.label);
  const links = (configuredLinks.length ? configuredLinks : internalLinks[post.slug.current] || [
    { href: '/xe', label: 'Xem xe tự lái CarMatch' },
    { href: '/blog', label: 'Đọc thêm kinh nghiệm thuê xe' },
  ]).slice(0, 4);

  return `<aside class="related" aria-label="Liên kết liên quan">
          <h2>Đọc tiếp</h2>
          <ul>${links.map((link) => `<li><a href="${escapeHtml(link.href)}" data-article-slug="${escapeHtml(post.slug.current)}" data-blog-action="${escapeHtml(link.action || 'related_fallback')}" data-blog-target="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join('')}</ul>
        </aside>`;
}

function renderPostCta(post) {
  if (post.ctaEnabled === false) return '';
  const primaryButton = post.ctaPrimaryUrl
    ? `<a class="button" href="${escapeHtml(post.ctaPrimaryUrl)}" data-article-slug="${escapeHtml(post.slug.current)}" data-blog-action="cta_primary" data-blog-target="${escapeHtml(post.ctaPrimaryUrl)}">${escapeHtml(post.ctaPrimaryLabel || 'Đặt xe với CarMatch')}</a>`
    : '';
  const zaloUrl = post.ctaZaloUrl || 'https://zalo.me/0975563290';
  const zaloButton = `<a class="button secondary" href="${escapeHtml(zaloUrl)}" data-article-slug="${escapeHtml(post.slug.current)}" data-blog-action="cta_zalo" data-blog-target="${escapeHtml(zaloUrl)}">${escapeHtml(post.ctaZaloLabel || 'Đặt xe qua Zalo')}</a>`;
  return `<div class="cta">
          <p class="eyebrow">CarMatch hỗ trợ nhanh</p>
          <h2>${escapeHtml(post.ctaTitle || 'Sẵn sàng đặt xe?')}</h2>
          <p>${escapeHtml(post.ctaDescription || 'Nhắn Zalo CarMatch để được tư vấn xe phù hợp và giao xe tận nơi.')}</p>
          <div class="cta-actions">${primaryButton}${zaloButton}</div>
        </div>`;
}

function renderBlogIndex(posts) {
  return layout({
    ...blogMeta,
    type: 'website',
    body: `<main>
      <p class="eyebrow">Blog CarMatch</p>
      <h1>Kinh nghiệm thuê xe tự lái Hà Nội</h1>
      <p>${escapeHtml(blogMeta.description)}</p>
      <section class="grid" aria-label="Danh sách bài viết">
        ${posts.map((post) => `<a class="card" href="/blog/${escapeHtml(post.slug.current)}">
          ${post.mainImageUrl ? `<img src="${escapeHtml(post.mainImageUrl)}" alt="${escapeHtml(post.title)}" />` : ''}
          <div class="card-body">
            <h2>${escapeHtml(post.title)}</h2>
            <p>${escapeHtml(post.excerpt || '')}</p>
            <p class="meta">${escapeHtml(post.author || 'CarMatch')}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''}</p>
          </div>
        </a>`).join('\n')}
      </section>
    </main>`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: blogMeta.title,
      description: blogMeta.description,
      url: blogMeta.canonical,
      blogPost: posts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: postDescription(post),
        url: postUrl(post),
        image: [postImage(post)],
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: { '@type': 'Person', name: postAuthor(post) },
        publisher: publisherData(),
      })),
    },
  });
}

function renderPost(post, contentIndex) {
  const title = `${post.seoTitle || post.title} | CarMatch`;
  const description = postDescription(post);
  const canonical = postUrl(post);
  const image = postImage(post);
  const hasInlineBodyImages = /<img\b/i.test(post.bodyHtml || '');

  return layout({
    title,
    description,
    canonical,
    image,
    body: `<main>
      <article class="article">
        ${(post.categories || []).length ? `<p class="eyebrow">${escapeHtml(post.categories.join(' / '))}</p>` : ''}
        <h1>${escapeHtml(post.title)}</h1>
        <p class="meta">${escapeHtml(postAuthor(post))}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''}</p>
        ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
        ${post.mainImageUrl && !hasInlineBodyImages ? `<img class="hero" src="${escapeHtml(post.mainImageUrl)}" alt="${escapeHtml(post.title)}" />` : ''}
        ${post.bodyHtml ? post.bodyHtml : renderPortableText(post.body)}
        ${renderInternalLinks(post, contentIndex)}
        ${renderPostCta(post)}
      </article>
    </main>`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      url: canonical,
      mainEntityOfPage: canonical,
      image: [image],
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { '@type': 'Person', name: postAuthor(post) },
      publisher: publisherData(),
      inLanguage: 'vi-VN',
    },
  });
}

function renderSitemap(posts, vehicles) {
  const urls = [
    ...routeMeta.map((meta) => ({
      loc: meta.canonical,
      priority: meta.priority,
      changefreq: meta.changefreq,
    })),
    {
      loc: `${siteUrl}/blog`,
      priority: '0.8',
      changefreq: 'weekly',
    },
    ...vehicles.map((vehicle) => ({
      loc: `${siteUrl}/xe/${vehicle.slug}`,
      priority: '0.7',
      changefreq: 'daily',
    })),
    ...posts.map((post) => ({
      loc: postUrl(post),
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: post.publishedAt?.slice(0, 10),
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

async function main() {
  const [posts, vehicles, destinations] = await Promise.all([fetchBlogPosts(), fetchVehicles(), fetchTravelDestinations()]);
  const contentIndex = {
    destinationNames: new Map(destinations.map((destination) => [destination.slug, destination.name])),
    postTitles: new Map(posts.map((post) => [post.slug.current, post.title])),
  };

  await writeStaticRouteShells(vehicles);

  await mkdir(path.join(distDir, 'blog'), { recursive: true });
  await writeFile(path.join(distDir, 'blog', 'index.html'), renderBlogIndex(posts), 'utf8');

  for (const post of posts) {
    const outputDir = path.join(distDir, 'blog', post.slug.current);
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'index.html'), renderPost(post, contentIndex), 'utf8');
  }

  await writeFile(path.join(distDir, 'sitemap.xml'), renderSitemap(posts, vehicles), 'utf8');
  await writeFile(
    path.join(distDir, 'robots.txt'),
    [
      'User-agent: *',
      'Allow: /',
      '',
      'User-agent: GPTBot',
      'Allow: /',
      '',
      'User-agent: ChatGPT-User',
      'Allow: /',
      '',
      'User-agent: PerplexityBot',
      'Allow: /',
      '',
      'User-agent: ClaudeBot',
      'Allow: /',
      '',
      'User-agent: Google-Extended',
      'Allow: /',
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n'),
    'utf8',
  );

  console.log(`Generated static SEO HTML for ${routeMeta.length} routes, ${vehicles.length} vehicles, ${posts.length} posts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
