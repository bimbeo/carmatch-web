import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tripDestinations as fallbackTripDestinations } from '../src/data/tripDestinations.ts';

let generatedTripDestinations = fallbackTripDestinations;
import { travelCollections as fallbackTravelCollections } from '../src/data/travelCollections.ts';

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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createSupabaseClient(supabaseUrl, supabaseAnonKey) : null;

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
    author: row.author || 'Car Match',
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
  if (!supabase) {
    throw new Error('Supabase blog source is not configured for static generation.');
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, main_image_url, author, category_slug, content_html, seo_title, seo_description, canonical_url, cta_enabled, cta_title, cta_description, cta_primary_label, cta_primary_url, cta_zalo_label, cta_zalo_url, related_destination_slugs, related_vehicle_links, related_post_slugs, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Supabase blog fetch failed during static generation: ${error.message}`);
  }

  return (data || []).map(mapSupabasePost);
}

async function fetchTravelDestinations() {
  if (!supabase) return [];
  const baseSelect = 'slug,name,region,summary,image_url,seo_title,seo_description,tags,distance_km,duration,ideal,route,stops,driving_note,parking_note,recommended_vehicle,nearby_places,schedule,notes,faq,toll_estimate,fuel_cost_per_km,sort_order';
  const extendedSelect = `latitude,longitude,map_url,checklist,${baseSelect}`;
  let result = await supabase
    .from('travel_destinations')
    .select(extendedSelect)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (result.error && /latitude|longitude|map_url|checklist/i.test(result.error.message)) {
    result = await supabase
      .from('travel_destinations')
      .select(baseSelect)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
  }
  const { data, error } = result;
  if (error) {
    console.warn(`Skipped travel destinations: ${error.message}`);
    return [];
  }
  return (data || []).map((row) => ({
    slug: row.slug,
    name: row.name,
    region: row.region || undefined,
    summary: row.summary || undefined,
    imageUrl: row.image_url || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    distanceKm: Number(row.distance_km || 0),
    duration: row.duration || 'Theo lịch trình',
    ideal: row.ideal || 'Khách Car Match cần tư vấn xe phù hợp',
    route: row.route || 'Hà Nội → điểm đến',
    stops: Array.isArray(row.stops) ? row.stops : [],
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    mapUrl: row.map_url || undefined,
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    drivingNote: row.driving_note || undefined,
    parkingNote: row.parking_note || undefined,
    recommendedVehicle: row.recommended_vehicle || undefined,
    nearbyPlaces: Array.isArray(row.nearby_places) ? row.nearby_places : [],
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    notes: Array.isArray(row.notes) ? row.notes : [],
    faq: Array.isArray(row.faq) ? row.faq : [],
    tollEstimate: Number(row.toll_estimate || 0),
    fuelCostPerKm: row.fuel_cost_per_km ? Number(row.fuel_cost_per_km) : undefined,
  }));
}

const blogMeta = {
  title: 'Blog Kinh Nghiệm Thuê Xe Tự Lái | Car Match Hà Nội',
  description:
    'Kinh nghiệm thuê xe tự lái Hà Nội: giấy tờ cần chuẩn bị, đặt cọc, bảo hiểm, chọn xe phù hợp và dịch vụ giao xe tận sảnh chung cư.',
  canonical: `${siteUrl}/blog`,
};

const routeMeta = [
  {
    path: '/',
    title: 'Car Match — Thuê Xe Tự Lái Hà Nội | Từ 600K/Ngày',
    description:
      'Car Match - Thuê xe tự lái Hà Nội. 20+ mẫu xe: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 600K/ngày. Giao xe tận nơi. Đặt qua Zalo 0975 563 290.',
    canonical: siteUrl,
    priority: '1.0',
    changefreq: 'weekly',
  },
  {
    path: '/xe',
    title: 'Thuê Xe Tự Lái Hà Nội — 20+ Mẫu Xe | Car Match',
    description:
      'Duyệt 20+ mẫu xe tự lái cho thuê tại Hà Nội: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 600K/ngày. Giao xe tận sảnh tòa nhà.',
    canonical: `${siteUrl}/xe`,
    priority: '0.9',
    changefreq: 'daily',
  },
  {
    path: '/thue-xe-tu-lai-ha-noi',
    title: 'Thuê xe tự lái Hà Nội - giao xe tận sảnh chung cư | Car Match',
    description:
      'Thuê xe tự lái Hà Nội qua Car Match, giao xe tận sảnh chung cư/khu đô thị, xe 5 chỗ, 7 chỗ, xe điện VinFast, đặt Zalo xác nhận 30 phút.',
    canonical: `${siteUrl}/thue-xe-tu-lai-ha-noi`,
    priority: '0.92',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau',
    title: 'Đi Đâu Gần Hà Nội Bằng Xe Tự Lái | Car Match',
    description:
      'Gợi ý đi đâu gần Hà Nội bằng xe tự lái: lịch trình cuối tuần, chi phí di chuyển, điểm dừng và loại xe phù hợp cho gia đình.',
    canonical: `${siteUrl}/di-dau`,
    priority: '0.86',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/cuoi-tuan-gan-ha-noi',
    title: 'Cuối Tuần Gần Hà Nội Đi Đâu Bằng Xe Tự Lái | Car Match',
    description:
      'Gợi ý điểm đi chơi cuối tuần gần Hà Nội bằng xe tự lái: Ba Vì, Sóc Sơn, Tam Đảo, Ninh Bình, Đại Lải, Ecopark.',
    canonical: `${siteUrl}/di-dau/chu-de/cuoi-tuan-gan-ha-noi`,
    priority: '0.82',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/di-trong-ngay',
    title: 'Đi Trong Ngày Từ Hà Nội Bằng Xe Tự Lái | Car Match',
    description:
      'Các điểm đi trong ngày từ Hà Nội: Nội Bài, Ecopark, Sóc Sơn, Ba Vì, Ninh Bình, Hồ Núi Cốc kèm chi phí di chuyển.',
    canonical: `${siteUrl}/di-dau/chu-de/di-trong-ngay`,
    priority: '0.82',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/cho-gia-dinh-co-tre-em',
    title: 'Đi Đâu Gần Hà Nội Cho Gia Đình Có Trẻ Em | Car Match',
    description:
      'Gợi ý điểm đi chơi gần Hà Nội cho gia đình có trẻ em, kèm loại xe nên thuê, lịch trình nhẹ và lưu ý chỗ đỗ.',
    canonical: `${siteUrl}/di-dau/chu-de/cho-gia-dinh-co-tre-em`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/xe-7-cho-di-tinh',
    title: 'Thuê Xe 7 Chỗ Đi Tỉnh Từ Hà Nội | Car Match',
    description:
      'Gợi ý các tuyến nên thuê xe 7 chỗ đi tỉnh từ Hà Nội: Hạ Long, Mộc Châu, Mai Châu, Pù Luông, Sapa, Cát Bà.',
    canonical: `${siteUrl}/di-dau/chu-de/xe-7-cho-di-tinh`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/chu-de/di-xe-dien',
    title: 'Đi Du Lịch Gần Hà Nội Bằng Xe Điện | Car Match',
    description:
      'Gợi ý tuyến gần Hà Nội phù hợp đi xe điện: Nội Bài, Ecopark, Ninh Bình, Hải Phòng, Hạ Long, Đại Lải.',
    canonical: `${siteUrl}/di-dau/chu-de/di-xe-dien`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ha-long',
    title: 'Đi Hạ Long Bằng Xe Tự Lái — Lịch Trình & Chi Phí | Car Match',
    description:
      'Guide đi Hạ Long từ Hà Nội bằng xe tự lái: đường đi, chỗ đỗ, lịch trình 2 ngày 1 đêm, chi phí cao tốc/xăng sạc và xe phù hợp.',
    canonical: `${siteUrl}/di-dau/ha-long`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ninh-binh',
    title: 'Đi Ninh Bình Bằng Xe Tự Lái — Lịch Trình & Chi Phí | Car Match',
    description:
      'Guide đi Ninh Bình từ Hà Nội bằng xe tự lái: lịch trình trong ngày hoặc 2 ngày, điểm dừng, chỗ đỗ và chi phí di chuyển dự kiến.',
    canonical: `${siteUrl}/di-dau/ninh-binh`,
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/tam-dao',
    title: 'Đi Tam Đảo Bằng Xe Tự Lái — Đường Đèo & Xe Phù Hợp | Car Match',
    description:
      'Guide đi Tam Đảo từ Hà Nội bằng xe tự lái: lưu ý đường đèo, chỗ đỗ, lịch trình 2 ngày 1 đêm và loại xe phù hợp.',
    canonical: `${siteUrl}/di-dau/tam-dao`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/moc-chau',
    title: 'Đi Mộc Châu Bằng Xe Tự Lái — Lịch Trình 3N2Đ | Car Match',
    description:
      'Guide đi Mộc Châu từ Hà Nội bằng xe tự lái: cung đường dài, điểm dừng, lịch trình 3 ngày 2 đêm, chi phí và xe nên chọn.',
    canonical: `${siteUrl}/di-dau/moc-chau`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/noi-bai',
    title: 'Đi Nội Bài Bằng Xe Tự Lái — Chi Phí & Lưu Ý | Car Match',
    description:
      'Guide đi sân bay Nội Bài bằng xe tự lái: tuyến đường, điểm đón trả, chỗ gửi xe, chi phí dự kiến và xe phù hợp.',
    canonical: `${siteUrl}/di-dau/noi-bai`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ba-vi',
    title: 'Đi Ba Vì Bằng Xe Tự Lái — Lịch Trình & Chi Phí | Car Match',
    description:
      'Guide đi Ba Vì từ Hà Nội bằng xe tự lái: lịch trình trong ngày hoặc 2 ngày 1 đêm, chỗ đỗ, đường đi và xe phù hợp.',
    canonical: `${siteUrl}/di-dau/ba-vi`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/soc-son',
    title: 'Đi Sóc Sơn Bằng Xe Tự Lái — Villa, Cafe, Hồ Đồng Đò | Car Match',
    description:
      'Guide đi Sóc Sơn từ Hà Nội bằng xe tự lái: villa cuối tuần, cafe rừng, Hồ Đồng Đò, chỗ đỗ và xe nên chọn.',
    canonical: `${siteUrl}/di-dau/soc-son`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ecopark',
    title: 'Đi Ecopark Bằng Xe Tự Lái — Picnic & Cafe Trong Ngày | Car Match',
    description:
      'Guide đi Ecopark bằng xe tự lái từ Hà Nội: lịch trình trong ngày, chỗ đỗ xe, điểm ăn chơi và xe phù hợp gia đình.',
    canonical: `${siteUrl}/di-dau/ecopark`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/dai-lai',
    title: 'Đi Đại Lải Bằng Xe Tự Lái — Resort Cuối Tuần | Car Match',
    description:
      'Guide đi Đại Lải từ Hà Nội bằng xe tự lái: lịch trình 2 ngày 1 đêm, resort/villa, chỗ đỗ và xe nên thuê.',
    canonical: `${siteUrl}/di-dau/dai-lai`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/hai-phong',
    title: 'Đi Hải Phòng Bằng Xe Tự Lái — Food Tour & Chi Phí | Car Match',
    description:
      'Guide đi Hải Phòng bằng xe tự lái từ Hà Nội: food tour trong ngày, cao tốc, chỗ đỗ và chi phí di chuyển dự kiến.',
    canonical: `${siteUrl}/di-dau/hai-phong`,
    priority: '0.76',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/cat-ba',
    title: 'Đi Cát Bà Bằng Xe Tự Lái — Phà, Chỗ Đỗ, Xe 7 Chỗ | Car Match',
    description:
      'Guide đi Cát Bà bằng xe tự lái từ Hà Nội: phà/cáp treo, lịch trình 2-3 ngày, chỗ đỗ và xe 7 chỗ phù hợp.',
    canonical: `${siteUrl}/di-dau/cat-ba`,
    priority: '0.74',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/mai-chau',
    title: 'Đi Mai Châu Bằng Xe Tự Lái — Lịch Trình 2N1Đ | Car Match',
    description:
      'Guide đi Mai Châu từ Hà Nội bằng xe tự lái: đèo Thung Khe, Bản Lác, lịch trình 2 ngày 1 đêm và xe nên chọn.',
    canonical: `${siteUrl}/di-dau/mai-chau`,
    priority: '0.74',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/pu-luong',
    title: 'Đi Pù Luông Bằng Xe Tự Lái — Xe Gầm Cao & Lịch Trình | Car Match',
    description:
      'Guide đi Pù Luông bằng xe tự lái từ Hà Nội: cung đường, lịch trình 3 ngày 2 đêm, chỗ đỗ và loại xe phù hợp.',
    canonical: `${siteUrl}/di-dau/pu-luong`,
    priority: '0.74',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/sapa',
    title: 'Đi Sapa Bằng Xe Tự Lái — Đường Dài & Xe Phù Hợp | Car Match',
    description:
      'Guide đi Sapa bằng xe tự lái từ Hà Nội: cao tốc Nội Bài - Lào Cai, đường đèo, chỗ đỗ và xe 7 chỗ/SUV phù hợp.',
    canonical: `${siteUrl}/di-dau/sapa`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/di-dau/ho-nui-coc',
    title: 'Đi Hồ Núi Cốc Bằng Xe Tự Lái — Trong Ngày Từ Hà Nội | Car Match',
    description:
      'Guide đi Hồ Núi Cốc bằng xe tự lái từ Hà Nội: lịch trình trong ngày, cao tốc Thái Nguyên, chỗ đỗ và chi phí dự kiến.',
    canonical: `${siteUrl}/di-dau/ho-nui-coc`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di',
    title: 'Lập Kế Hoạch Thuê Xe Tự Lái Từ Hà Nội | Car Match',
    description:
      'Lập kế hoạch thuê xe tự lái từ Hà Nội theo điểm đến, số người và ngân sách: gợi ý xe, chi phí dự kiến, lịch trình và CTA Zalo.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di`,
    priority: '0.85',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/ha-long',
    title: 'Thuê Xe Tự Lái Đi Hạ Long — Lịch Trình & Chi Phí | Car Match',
    description:
      'Lập kế hoạch thuê xe tự lái đi Hạ Long từ Hà Nội: gợi ý xe phù hợp, chi phí dự kiến, lịch trình 2 ngày 1 đêm và gửi yêu cầu qua Zalo.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/ha-long`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/ninh-binh',
    title: 'Thuê Xe Tự Lái Đi Ninh Bình — Lịch Trình & Chi Phí | Car Match',
    description:
      'Lập kế hoạch thuê xe tự lái đi Ninh Bình từ Hà Nội: gợi ý xe 5-7 chỗ, chi phí dự kiến, lịch trình trong ngày hoặc 2 ngày.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/ninh-binh`,
    priority: '0.78',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/tam-dao',
    title: 'Thuê Xe Tự Lái Đi Tam Đảo — Lịch Trình & Chi Phí | Car Match',
    description:
      'Gợi ý thuê xe tự lái đi Tam Đảo từ Hà Nội: chọn xe phù hợp đường đèo, chi phí dự kiến và lịch trình 2 ngày 1 đêm.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/tam-dao`,
    priority: '0.75',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/moc-chau',
    title: 'Thuê Xe Tự Lái Đi Mộc Châu — Lịch Trình & Chi Phí | Car Match',
    description:
      'Lập kế hoạch thuê xe tự lái đi Mộc Châu từ Hà Nội: gợi ý xe đường dài, chi phí dự kiến, lịch trình 3 ngày 2 đêm.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/moc-chau`,
    priority: '0.75',
    changefreq: 'weekly',
  },
  {
    path: '/lap-ke-hoach-chuyen-di/noi-bai',
    title: 'Thuê Xe Tự Lái Đi Nội Bài — Chi Phí & Gợi Ý Xe | Car Match',
    description:
      'Tính chi phí thuê xe tự lái đi sân bay Nội Bài từ Hà Nội, gợi ý xe phù hợp và gửi yêu cầu tư vấn qua Zalo Car Match.',
    canonical: `${siteUrl}/lap-ke-hoach-chuyen-di/noi-bai`,
    priority: '0.72',
    changefreq: 'weekly',
  },
  {
    path: '/thue-xe-thang',
    title: 'Cho thuê xe theo tháng Hà Nội - từ 10tr/tháng | Car Match',
    description:
      'Cho thuê xe theo tháng tại Hà Nội từ 10tr/tháng. Xe tự lái cho cá nhân, gia đình, doanh nghiệp nhỏ; giao xe tận nơi, hợp đồng rõ ràng.',
    canonical: `${siteUrl}/thue-xe-thang`,
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/hop-tac',
    title: 'Hợp Tác Chủ Xe — Cho Thuê Xe Sinh Lời | Car Match',
    description:
      'Hợp tác chủ xe cùng Car Match: tối ưu doanh thu xe nhàn rỗi, vận hành minh bạch, lịch đặt xe rõ ràng và hỗ trợ khách thuê tại Hà Nội.',
    canonical: `${siteUrl}/hop-tac`,
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/gioi-thieu',
    title: 'Giới Thiệu Car Match — Dịch Vụ Thuê Xe Tự Lái Hà Nội',
    description:
      'Car Match cung cấp dịch vụ thuê xe tự lái tại Hà Nội, giao xe tận sảnh chung cư, quy trình đặt xe rõ ràng và hỗ trợ khách hàng mỗi ngày.',
    canonical: `${siteUrl}/gioi-thieu`,
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    path: '/faq',
    title: 'Câu Hỏi Thường Gặp — Car Match',
    description:
      'Giải đáp câu hỏi thường gặp về đặt xe online, thanh toán, nhận xe, giấy tờ, bảo hiểm và phụ phí khi thuê xe tại Car Match.',
    canonical: `${siteUrl}/faq`,
    priority: '0.5',
    changefreq: 'monthly',
  },
  {
    path: '/chinh-sach',
    title: 'Chính Sách Thuê Xe — Car Match',
    description:
      'Điều kiện thuê xe, đặt cọc, hủy chuyến, bảo hiểm, giới hạn km và các chính sách cần biết khi thuê xe tự lái tại Car Match.',
    canonical: `${siteUrl}/chinh-sach`,
    priority: '0.5',
    changefreq: 'monthly',
  },
];

const noIndexRouteMeta = [
  {
    path: '/dat-xe',
    title: 'Xác Nhận Đặt Xe | Car Match',
    description: 'Trang xác nhận đặt xe Car Match.',
    canonical: `${siteUrl}/dat-xe`,
    noIndex: true,
  },
  {
    path: '/admin',
    title: 'Admin Dashboard | Car Match',
    description: 'Trang quản trị nội bộ Car Match.',
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
    { href: '/xe', label: 'Xem xe đang có tại Car Match' },
    { href: '/blog/thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh', label: 'Thuê xe tự lái Vinhomes Ocean Park' },
    { href: '/thue-xe-thang', label: 'Tìm hiểu gói thuê xe dài ngày' },
  ],
};

function escapeHtml(value = '') {
  return normalizeBrandText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeBrandText(value = '') {
  return String(value)
    .replace(/\bCarMatch\b/g, 'Car Match')
    .replace(/\bCARMATCH\b/g, 'CAR MATCH');
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
  return vehicle.display_name || [model.make, model.model].filter(Boolean).join(' ') || 'Xe Car Match';
}

function vehicleDescription(vehicle) {
  const model = vehicle.vehicle_models || {};
  const price = vehicle.daily_base_price
    ? `${Number(vehicle.daily_base_price).toLocaleString('vi-VN')}đ/ngày`
    : 'giá tốt theo ngày';
  const seats = model.seats ? `${model.seats} chỗ` : 'nhiều lựa chọn';
  const fuel = model.fuel_type ? `, ${model.fuel_type}` : '';
  return `Thuê ${getVehicleName(vehicle)} tại Hà Nội: xe ${seats}${fuel}, ${price}. Giao xe tận nơi, đặt cọc online và xác nhận nhanh qua Car Match.`;
}

function publisherData() {
  return {
    '@type': 'Organization',
    name: 'Car Match',
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
      name: 'Car Match',
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
        name: 'Cần giấy tờ gì để thuê xe tự lái tại Car Match?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Khách thuê cần CCCD, giấy phép lái xe còn hạn và đặt cọc theo quy định từng dòng xe.',
        },
      },
      {
        '@type': 'Question',
        name: 'Car Match có giao xe tận nơi không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có. Car Match hỗ trợ giao xe tận sảnh chung cư, tòa nhà và khu đô thị tại Hà Nội theo lịch hẹn.',
        },
      },
      {
        '@type': 'Question',
        name: 'Giá thuê xe tự lái tại Car Match tính thế nào?',
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
      title: `Thuê ${name} Tự Lái Hà Nội | Car Match`,
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
    <meta property="og:site_name" content="Car Match" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="Car Match logo" />
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
    <script type="application/ld+json">${normalizeBrandText(JSON.stringify(structuredData))}</script>
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
        <a class="brand" href="/" aria-label="Car Match">
          <img src="/brand/carmatch-lockup-navy.png" alt="Car Match" />
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
    ${normalizeBrandText(body)}
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
  return descriptionOverrides[post.slug.current] || post.seoDescription || post.excerpt || 'Kinh nghiệm thuê xe tự lái Hà Nội từ Car Match.';
}

function postImage(post) {
  return post.mainImageUrl || brandIcon;
}

function postAuthor(post) {
  return post.author || 'Car Match';
}

function renderInternalLinks(post, contentIndex) {
  const configuredLinks = [
    ...(post.relatedDestinationSlugs || []).slice(0, 2).map((slug) => ({ href: `/di-dau/${slug}`, label: `Đi ${contentIndex.destinationNames.get(slug) || categoryLabel(slug)} bằng xe tự lái`, action: 'related_destination' })),
    ...(post.relatedVehicleLinks || []).slice(0, 1).map((link) => ({ href: link.url, label: link.label, action: 'related_vehicle' })),
    ...(post.relatedPostSlugs || []).slice(0, 1).map((slug) => ({ href: `/blog/${slug}`, label: contentIndex.postTitles.get(slug) || categoryLabel(slug), action: 'related_post' })),
  ].filter((link) => link.href && link.label);
  const links = (configuredLinks.length ? configuredLinks : internalLinks[post.slug.current] || [
    { href: '/xe', label: 'Xem xe tự lái Car Match' },
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
    ? `<a class="button" href="${escapeHtml(post.ctaPrimaryUrl)}" data-article-slug="${escapeHtml(post.slug.current)}" data-blog-action="cta_primary" data-blog-target="${escapeHtml(post.ctaPrimaryUrl)}">${escapeHtml(post.ctaPrimaryLabel || 'Đặt xe với Car Match')}</a>`
    : '';
  const zaloUrl = post.ctaZaloUrl || 'https://zalo.me/0975563290';
  const zaloButton = `<a class="button secondary" href="${escapeHtml(zaloUrl)}" data-article-slug="${escapeHtml(post.slug.current)}" data-blog-action="cta_zalo" data-blog-target="${escapeHtml(zaloUrl)}">${escapeHtml(post.ctaZaloLabel || 'Đặt xe qua Zalo')}</a>`;
  return `<div class="cta">
          <p class="eyebrow">Car Match hỗ trợ nhanh</p>
          <h2>${escapeHtml(post.ctaTitle || 'Sẵn sàng đặt xe?')}</h2>
          <p>${escapeHtml(post.ctaDescription || 'Nhắn Zalo Car Match để được tư vấn xe phù hợp và giao xe tận nơi.')}</p>
          <div class="cta-actions">${primaryButton}${zaloButton}</div>
        </div>`;
}

function renderBlogIndex(posts) {
  return layout({
    ...blogMeta,
    type: 'website',
    body: `<main>
      <p class="eyebrow">Blog Car Match</p>
      <h1>Kinh nghiệm thuê xe tự lái Hà Nội</h1>
      <p>${escapeHtml(blogMeta.description)}</p>
      <section class="grid" aria-label="Danh sách bài viết">
        ${posts.map((post) => `<a class="card" href="/blog/${escapeHtml(post.slug.current)}">
          ${post.mainImageUrl ? `<img src="${escapeHtml(post.mainImageUrl)}" alt="${escapeHtml(post.title)}" />` : ''}
          <div class="card-body">
            <h2>${escapeHtml(post.title)}</h2>
            <p>${escapeHtml(post.excerpt || '')}</p>
            <p class="meta">${escapeHtml(post.author || 'Car Match')}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''}</p>
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
  const title = `${post.seoTitle || post.title} | Car Match`;
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

function renderHanoiLanding() {
  const title = 'Thuê xe tự lái Hà Nội - giao xe tận sảnh chung cư | Car Match';
  const description = 'Thuê xe tự lái Hà Nội qua Car Match, giao xe tận sảnh chung cư/khu đô thị, xe 5 chỗ, 7 chỗ, xe điện VinFast, đặt Zalo xác nhận 30 phút.';
  const canonical = `${siteUrl}/thue-xe-tu-lai-ha-noi`;
  const heroImage = 'https://ohuibfpxlxqvqistycrc.supabase.co/storage/v1/object/public/team-media/images/2026-06-04/21246fc6-1f47-4460-b94d-266b416dedf9.jpg';
  const faqItems = [
    ['Thuê xe tự lái Hà Nội tại Car Match cần giấy tờ gì?', 'Khách thuê cần CCCD và GPLX hạng B hợp lệ. Tùy lịch thuê và mẫu xe, Car Match sẽ xác nhận thêm thông tin đặt cọc khi tư vấn qua Zalo.'],
    ['Car Match có giao xe tận sảnh chung cư không?', 'Có. Car Match tập trung phục vụ cư dân chung cư/khu đô thị tại Hà Nội và hỗ trợ giao xe tận sảnh hoặc điểm hẹn phù hợp trong khu vực phục vụ.'],
    ['Giá thuê xe tự lái Hà Nội bắt đầu từ bao nhiêu?', 'Giá thuê xe tự lái tại Car Match tham khảo từ 600.000 VND/ngày. Gói thuê theo tháng tham khảo từ 10.000.000 VND/tháng.'],
    ['Đặt xe qua Car Match mất bao lâu để xác nhận?', 'Khách nhắn Zalo 0975 563 290, Car Match kiểm tra lịch xe và phản hồi xác nhận trong khoảng 30 phút khi có xe phù hợp.'],
  ];
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: 'Thuê xe tự lái Hà Nội',
      serviceType: 'Thuê xe tự lái',
      provider: publisherData(),
      areaServed: ['Vinhomes Ocean Park', 'Times City', 'Vinhomes Smart City', 'Ecopark', 'The Manor Central Park', 'Linh Đàm'],
      url: canonical,
      description,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'VND',
        price: '600000',
        availability: 'https://schema.org/InStock',
        url: canonical,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: faqItems.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Thuê xe tự lái Hà Nội', path: '/thue-xe-tu-lai-ha-noi' },
    ]),
  ];

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#fffaf1" />
    <meta name="robots" content="index, follow" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Car Match" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(heroImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(heroImage)}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="preload" as="image" href="/brand/carmatch-lockup-navy.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <script type="application/ld+json">${normalizeBrandText(JSON.stringify(structuredData))}</script>
    <style>
      :root { color-scheme: light; font-family: "Be Vietnam Pro", Inter, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body { margin: 0; background: #f8fafc; color: #0f172a; }
      a { color: inherit; text-decoration: none; }
      .nav { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid #e5e7eb; background: rgba(255,255,255,.94); backdrop-filter: blur(12px); }
      .nav-inner { align-items: center; display: flex; justify-content: space-between; margin: 0 auto; max-width: 1180px; padding: 16px 20px; }
      .brand img { display: block; height: 34px; width: auto; }
      .nav-links { align-items: center; display: flex; gap: 24px; font-size: 14px; font-weight: 800; color: #475569; }
      .nav-links a:hover { color: #0f766e; }
      .nav-cta, .btn-primary { align-items: center; background: #0f766e; border-radius: 999px; color: white; display: inline-flex; font-weight: 900; justify-content: center; padding: 14px 22px; box-shadow: 0 14px 30px rgba(15,118,110,.18); }
      .btn-secondary { align-items: center; background: white; border: 1px solid #dbe4ef; border-radius: 999px; display: inline-flex; font-weight: 900; justify-content: center; padding: 13px 20px; }
      main { display: flex; flex-direction: column; }
      section { width: 100%; }
      .container { margin: 0 auto; max-width: 1180px; padding-left: 20px; padding-right: 20px; }
      .hero-wrap { background: linear-gradient(135deg, #f8fafc 0%, #fff7ed 48%, #ecfeff 100%); border-bottom: 1px solid #e5e7eb; }
      .hero { display: grid; gap: 36px; grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr); padding-bottom: 54px; padding-top: 58px; align-items: center; }
      .eyebrow { color: #0f766e; font-size: 12px; font-weight: 900; letter-spacing: .16em; margin: 0; text-transform: uppercase; }
      h1 { font-size: clamp(42px, 5.8vw, 76px); letter-spacing: 0; line-height: 1.02; margin: 18px 0; }
      h2 { font-size: clamp(28px, 3.6vw, 44px); letter-spacing: 0; line-height: 1.12; margin: 10px 0 0; }
      h3 { font-size: 20px; margin: 0 0 8px; }
      p { color: #475569; font-size: 16px; font-weight: 600; line-height: 1.72; }
      .lead { font-size: 18px; line-height: 1.75; max-width: 660px; }
      .stats { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 30px; }
      .stat, .card, .vehicle, .area, details, .quote-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
      .stat { padding: 18px; box-shadow: 0 12px 34px rgba(15,23,42,.05); }
      .stat strong { display: block; font-size: 26px; color: #020617; }
      .stat span { color: #64748b; display: block; font-size: 12px; font-weight: 800; margin-top: 4px; text-transform: uppercase; }
      .hero-panel { background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 24px 80px rgba(15,23,42,.12); padding: 18px; }
      .hero-media { background: #020617; border-radius: 8px; color: white; display: grid; grid-template-columns: .95fr 1.05fr; min-height: 300px; overflow: hidden; }
      .hero-media-copy { padding: 28px; display: flex; flex-direction: column; justify-content: center; }
      .hero-media-copy p { color: rgba(255,255,255,.72); }
      .hero-media img { height: 100%; min-height: 300px; object-fit: cover; width: 100%; }
      .info-list { display: grid; gap: 12px; margin-top: 18px; }
      .info-item { align-items: center; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; display: flex; gap: 12px; padding: 14px 16px; }
      .info-item b { display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase; }
      .info-item span { color: #0f172a; font-size: 15px; font-weight: 900; }
      .actions { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; margin-top: 18px; }
      .band { background: white; border-bottom: 1px solid #e5e7eb; border-top: 1px solid #e5e7eb; }
      .proof { display: grid; gap: 18px; grid-template-columns: repeat(4, minmax(0, 1fr)); padding-bottom: 34px; padding-top: 34px; }
      .card, .area, .quote-card { padding: 22px; box-shadow: 0 12px 30px rgba(15,23,42,.04); }
      .card h3:before, .area h3:before { background: #0f766e; border-radius: 999px; content: ""; display: block; height: 3px; margin-bottom: 14px; width: 34px; }
      .section-pad { padding-bottom: 72px; padding-top: 72px; }
      .section-head { align-items: end; display: flex; gap: 24px; justify-content: space-between; margin-bottom: 30px; }
      .muted { color: #64748b; max-width: 680px; }
      .vehicle-grid { display: grid; gap: 18px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .vehicle { overflow: hidden; }
      .vehicle-top { background: linear-gradient(135deg, #020617, #134e4a); color: white; min-height: 154px; padding: 22px; position: relative; }
      .vehicle-top span { color: #5eead4; font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
      .vehicle-top h3 { font-size: 24px; margin-top: 40px; }
      .vehicle-body { padding: 20px; }
      .price-panel { background: #0f172a; border-radius: 8px; color: white; overflow: hidden; box-shadow: 0 24px 70px rgba(15,23,42,.18); }
      .price-panel-head { background: linear-gradient(135deg, #0f766e, #020617); padding: 24px; }
      .price-panel-head p { color: rgba(255,255,255,.74); margin-bottom: 0; }
      .price-table { background: white; overflow-x: auto; }
      table { border-collapse: collapse; min-width: 680px; width: 100%; }
      th { background: #f8fafc; color: #64748b; font-size: 12px; letter-spacing: .08em; padding: 16px 18px; text-align: left; text-transform: uppercase; }
      td { border-top: 1px solid #e5e7eb; color: #475569; font-weight: 700; padding: 18px; vertical-align: top; }
      td:first-child, td:nth-child(2) { color: #0f172a; font-weight: 900; }
      .price-note { background: #f8fafc; color: #64748b; font-size: 13px; font-weight: 700; padding: 16px 20px; }
      .two-col { display: grid; gap: 36px; grid-template-columns: .9fr 1.1fr; }
      .area-grid, .process-grid { display: grid; gap: 18px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .scenario-grid { display: grid; gap: 18px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .dark-cta { background: #020617; border-radius: 8px; color: white; padding: 30px; align-self: start; }
      .dark-cta p { color: rgba(255,255,255,.72); }
      .steps { display: grid; gap: 14px; }
      .step { align-items: start; display: grid; gap: 14px; grid-template-columns: 44px 1fr; }
      .step-num { align-items: center; background: #ccfbf1; border-radius: 999px; color: #0f766e; display: inline-flex; font-weight: 900; height: 44px; justify-content: center; width: 44px; }
      .mini-grid { display: grid; gap: 14px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 22px; }
      .mini { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
      .mini strong { display: block; font-size: 22px; }
      .quote-card { background: #fff7ed; border-color: #fed7aa; }
      .link-pills { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
      .link-pills a { background: white; border: 1px solid #dbe4ef; border-radius: 999px; color: #334155; font-size: 14px; font-weight: 900; padding: 10px 16px; }
      details { padding: 20px; margin-top: 12px; }
      summary { cursor: pointer; font-size: 18px; font-weight: 900; }
      .final-cta { background: linear-gradient(135deg, #0f766e, #020617); color: white; }
      .final-cta h2, .final-cta p { color: white; }
      footer { background: #020617; color: white; padding: 34px 20px; text-align: center; }
      footer p { color: rgba(255,255,255,.68); margin: 8px auto 0; }
      @media (max-width: 980px) {
        .hero, .two-col { grid-template-columns: 1fr; }
        .proof, .vehicle-grid, .scenario-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .nav-links { display: none; }
      }
      @media (max-width: 640px) {
        .hero { padding-top: 34px; }
        h1 { font-size: 40px; }
        .stats, .proof, .vehicle-grid, .area-grid, .process-grid, .scenario-grid, .actions, .mini-grid { grid-template-columns: 1fr; }
        .hero-media { grid-template-columns: 1fr; }
        .section-head { align-items: start; flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" href="/"><img src="/brand/carmatch-lockup-navy.png" alt="Car Match" /></a>
        <nav class="nav-links" aria-label="Landing navigation">
          <a href="#xe-phu-hop">Xe phù hợp</a>
          <a href="#bang-gia">Bảng giá</a>
          <a href="#khu-vuc">Khu vực</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a class="nav-cta" href="https://zalo.me/0975563290">Zalo</a>
      </div>
    </header>
    <main>
      <section class="hero-wrap">
      <div class="container hero">
        <div>
          <p class="eyebrow">Car Match · giao xe tận sảnh Hà Nội</p>
          <h1>Thuê xe tự lái Hà Nội cho cư dân chung cư và gia đình trẻ</h1>
          <p class="lead">Chọn xe theo ngày hoặc theo tháng, nhận xe tại sảnh chung cư/khu đô thị, kiểm tra lịch qua Zalo và xác nhận rõ giá, giấy tờ, điểm giao nhận trước chuyến đi.</p>
          <div class="stats">
            <div class="stat"><strong>20+ mẫu xe</strong><span>5 chỗ, 7 chỗ, xe điện</span></div>
            <div class="stat"><strong>Từ 600K/ngày</strong><span>tùy xe và thời điểm</span></div>
            <div class="stat"><strong>7:00-22:00</strong><span>hỗ trợ giao nhận</span></div>
          </div>
          <div class="actions" style="max-width:520px">
            <a class="btn-primary" href="https://zalo.me/0975563290">Nhắn Zalo kiểm tra xe</a>
            <a class="btn-secondary" href="#bang-gia">Xem bảng giá</a>
          </div>
        </div>
        <aside class="hero-panel">
          <div class="hero-media">
            <div class="hero-media-copy">
              <p class="eyebrow" style="color:#5eead4">Kiểm tra xe trống</p>
              <h2 style="color:white;font-size:30px">Gửi nhu cầu, Car Match tư vấn xe phù hợp</h2>
              <p>Nói rõ ngày đi, khu vực nhận xe và số người. Đội vận hành kiểm tra lịch xe thật trước khi báo giá.</p>
            </div>
            <img src="${escapeHtml(heroImage)}" alt="Thuê xe tự lái Hà Nội cho cư dân chung cư và gia đình trẻ" />
          </div>
          <div class="info-list">
            <div class="info-item"><b>Khu vực nhận xe</b><span>Hà Nội · chung cư/khu đô thị lớn</span></div>
            <div class="info-item"><b>Lịch thuê</b><span>Theo ngày, cuối tuần hoặc theo tháng</span></div>
            <div class="info-item"><b>Giấy tờ</b><span>CCCD + GPLX hạng B còn hiệu lực</span></div>
          </div>
          <div class="actions">
            <a class="btn-primary" href="https://zalo.me/0975563290">Nhắn Zalo kiểm tra xe</a>
            <a class="btn-secondary" href="/xe">Xem danh sách xe</a>
          </div>
        </aside>
      </div>
      </section>
      <section class="band">
        <div class="container proof">
          <article class="card"><h3>Giao tận sảnh</h3><p>Nhận xe ở sảnh tòa hoặc điểm hẹn phù hợp trong khu vực phục vụ.</p></article>
          <article class="card"><h3>Tư vấn người thật</h3><p>So sánh xe theo số người, hành lý, cung đường và ngân sách.</p></article>
          <article class="card"><h3>Giá có điều kiện rõ</h3><p>Báo theo mẫu xe, ngày thuê, phí giao nhận và lịch trống thực tế.</p></article>
          <article class="card"><h3>Hợp đồng rõ ràng</h3><p>Thống nhất giấy tờ, đặt cọc, kiểm tra xe và trả xe trước chuyến đi.</p></article>
        </div>
      </section>
      <section id="xe-phu-hop" class="container section-pad">
        <div class="section-head">
          <div><p class="eyebrow">Chọn xe theo nhu cầu</p><h2>Nhóm xe Car Match thường tư vấn tại Hà Nội</h2><p class="muted">Mỗi chuyến đi cần một loại xe khác nhau. Car Match ưu tiên hỏi rõ số người, hành lý, cung đường và điểm nhận xe trước khi chốt mẫu.</p></div>
          <a class="btn-secondary" href="/xe">Xem 20+ mẫu xe</a>
        </div>
        <div class="vehicle-grid">
          <article class="vehicle"><div class="vehicle-top"><span>Xe điện 5 chỗ</span><h3>VinFast VF5 / VF6</h3></div><div class="vehicle-body"><p>Đi phố, đi làm, gia đình trẻ, ưu tiên nhận xe gọn trong nội thành.</p><strong>từ 600.000đ/ngày</strong></div></article>
          <article class="vehicle"><div class="vehicle-top"><span>SUV/Crossover</span><h3>Kia Seltos / Hyundai Creta</h3></div><div class="vehicle-body"><p>Cân bằng cho gia đình 3-5 người, đi tỉnh cuối tuần.</p><strong>tùy dòng xe</strong></div></article>
          <article class="vehicle"><div class="vehicle-top"><span>Xe 7 chỗ</span><h3>Innova / Carnival</h3></div><div class="vehicle-body"><p>Phù hợp gia đình đông người, đi tỉnh, nhiều hành lý.</p><strong>báo theo lịch</strong></div></article>
          <article class="vehicle"><div class="vehicle-top"><span>Thuê tháng</span><h3>Gói linh hoạt</h3></div><div class="vehicle-body"><p>Cho gia đình hoặc doanh nghiệp dùng xe định kỳ.</p><strong>từ 10.000.000đ/tháng</strong></div></article>
        </div>
      </section>
      <section id="bang-gia" class="band">
        <div class="container section-pad two-col">
          <div><p class="eyebrow">Bảng giá tham khảo</p><h2>Giá thuê xe tự lái Hà Nội từ 600K/ngày</h2><p>Giá cuối cùng phụ thuộc mẫu xe, thời điểm thuê, số ngày sử dụng và khu vực giao nhận. Khi nhắn Zalo, anh/chị sẽ được báo rõ xe còn trống, phí giao nhận và giấy tờ cần chuẩn bị.</p><div class="mini-grid"><div class="mini"><strong>600K+</strong><span>xe đô thị/ngày</span></div><div class="mini"><strong>100K</strong><span>phí giao nhận/chiều</span></div><div class="mini"><strong>30 phút</strong><span>phản hồi khi có xe</span></div></div></div>
          <div class="price-panel"><div class="price-panel-head"><h3>Bảng giá theo nhóm xe</h3><p>Mức tham khảo để dự tính ngân sách trước khi đặt xe.</p></div><div class="price-table"><table><thead><tr><th>Nhóm xe</th><th>Giá tham khảo</th><th>Phù hợp</th></tr></thead><tbody>
            <tr><td>Xe điện/xe 5 chỗ đô thị</td><td>Từ 600.000đ/ngày</td><td>Đi phố, đi làm, gia đình trẻ, nhận xe tại chung cư</td></tr>
            <tr><td>SUV/Crossover</td><td>Tùy dòng xe</td><td>Gia đình 3-5 người, đi tỉnh cuối tuần</td></tr>
            <tr><td>Xe 7 chỗ</td><td>Báo theo lịch</td><td>Gia đình đông người, nhiều hành lý</td></tr>
            <tr><td>Gói thuê theo tháng</td><td>Từ 10.000.000đ/tháng</td><td>Gia đình/doanh nghiệp dùng xe định kỳ</td></tr>
          </tbody></table></div><div class="price-note">Báo giá chính xác sau khi kiểm tra lịch xe thật. Giá có thể thay đổi theo cuối tuần, lễ Tết và thời gian thuê.</div></div>
        </div>
      </section>
      <section id="khu-vuc" class="container section-pad two-col">
        <div><p class="eyebrow">Khu vực phục vụ</p><h2>Tập trung vào cư dân chung cư và khu đô thị lớn</h2><p>Đây là điểm khác biệt nên giữ cho Car Match: không cố nói “có mặt khắp nơi”, mà làm tốt bài toán nhận xe tận sảnh ở những cụm khách có nhu cầu thuê thật.</p></div>
        <div class="area-grid">
          <article class="area"><h3>Khu Đông</h3><p>Vinhomes Ocean Park, Ecopark, Gia Lâm, Long Biên</p></article>
          <article class="area"><h3>Khu Tây</h3><p>Vinhomes Smart City, Mỹ Đình, Nam Từ Liêm</p></article>
          <article class="area"><h3>Khu Nam</h3><p>The Manor Central Park, Linh Đàm, Hoàng Mai</p></article>
          <article class="area"><h3>Nội thành</h3><p>Times City, Royal City và các điểm hẹn phù hợp</p></article>
        </div>
      </section>
      <section class="band">
        <div class="container section-pad">
          <p class="eyebrow">Tình huống thuê xe thực tế</p><h2>Khi nào nên thuê xe tự lái thay vì mua xe?</h2>
          <div class="scenario-grid">
            <article class="card"><h3>Gia đình ở chung cư cần xe cuối tuần</h3><p>Phù hợp khi không dùng xe hằng ngày nhưng muốn có xe riêng cho lịch về quê, picnic hoặc đưa gia đình đi nhiều điểm trong ngày.</p></article>
            <article class="card"><h3>Khách cần xe đi tỉnh hoặc Nội Bài</h3><p>Đội tư vấn hỏi số người, hành lý, cung đường và thời gian trả xe để gợi ý nhóm xe phù hợp.</p></article>
            <article class="card"><h3>Doanh nghiệp nhỏ cần xe theo tháng</h3><p>Phù hợp đội sale, vận hành hoặc chủ doanh nghiệp cần xe đều đặn nhưng chưa muốn mua xe.</p></article>
          </div>
        </div>
      </section>
      <section class="container section-pad two-col">
        <div><p class="eyebrow">Quy trình đặt xe</p><h2>Từ nhu cầu đến nhận xe trong 4 bước rõ ràng</h2><div class="steps">
          <div class="step"><span class="step-num">01</span><div><h3>Gửi nhu cầu</h3><p>Khu vực nhận xe, ngày đi/ngày về, số người, loại xe mong muốn.</p></div></div>
          <div class="step"><span class="step-num">02</span><div><h3>Kiểm tra xe</h3><p>Car Match kiểm tra xe trống, giá thuê, phí giao nhận và giấy tờ.</p></div></div>
          <div class="step"><span class="step-num">03</span><div><h3>Xác nhận</h3><p>Thống nhất lịch, đặt cọc qua chuyển khoản và điểm giao nhận.</p></div></div>
          <div class="step"><span class="step-num">04</span><div><h3>Nhận xe</h3><p>Kiểm tra xe, ký hợp đồng, bàn giao chìa khóa và bắt đầu chuyến đi.</p></div></div>
        </div></div>
        <aside class="dark-cta"><h2 style="color:white">Cần kiểm tra lịch xe hôm nay?</h2><p>Nhắn Zalo 0975 563 290. Khi có xe phù hợp, Car Match phản hồi lịch, giá và điều kiện thuê trong khoảng 30 phút.</p><a class="btn-primary" href="https://zalo.me/0975563290">Nhắn Zalo Car Match</a></aside>
      </section>
      <section class="band">
        <div class="container section-pad two-col">
          <div class="quote-card"><h2>Trước khi nhận xe cần chuẩn bị gì?</h2><p>CCCD, GPLX hạng B còn hiệu lực và khoản đặt cọc theo mẫu xe. Car Match xác nhận điều kiện thuê trước khi giao xe để tránh phát sinh tại sảnh.</p><div class="link-pills"><a href="/faq">Xem FAQ thuê xe</a><a href="/chinh-sach">Chính sách thuê xe</a><a href="/xe">Danh sách xe</a></div></div>
          <div><h2>Gợi ý thêm cho chuyến đi</h2><p>Nếu chưa chắc nên chọn xe nào, anh/chị có thể xem các lịch trình đi gần Hà Nội hoặc đọc kinh nghiệm thuê xe tự lái trước khi đặt.</p><div class="link-pills"><a href="/blog/kinh-nghiem-thue-xe-tu-lai-ha-noi">Kinh nghiệm thuê xe tự lái Hà Nội</a><a href="/di-dau">Gợi ý đi đâu bằng xe tự lái</a></div></div>
        </div>
      </section>
      <section class="final-cta">
        <div class="container section-pad two-col">
          <div><p class="eyebrow" style="color:#99f6e4">Đặt xe qua Zalo</p><h2>Muốn biết xe nào còn trống cho lịch của anh/chị?</h2><p>Gửi ngày thuê, khu vực nhận xe và số người đi. Car Match kiểm tra lịch xe thật rồi báo mẫu xe, giá thuê và giấy tờ cần chuẩn bị.</p></div>
          <div class="actions" style="align-self:center"><a class="btn-primary" href="https://zalo.me/0975563290">Nhắn Zalo 0975 563 290</a><a class="btn-secondary" href="/xe">Xem danh sách xe</a></div>
        </div>
      </section>
      <section id="faq" class="container section-pad">
        <h2>Câu hỏi thường gặp</h2>
        ${faqItems.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('\n')}
      </section>
    </main>
    <footer><img src="/brand/carmatch-lockup-white.png" alt="Car Match" style="height:38px;width:auto" /><p>Thuê xe tự lái Hà Nội · giao xe tận sảnh chung cư/khu đô thị</p></footer>
  </body>
</html>`;
}

function renderSeoLandingLayout({ title, description, canonical, structuredData, active = '', body }) {
  const normalizedTitle = normalizeBrandText(title);
  const normalizedDescription = normalizeBrandText(description);
  const normalizedStructuredData = normalizeBrandText(JSON.stringify(structuredData));
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f8fafc" />
    <meta name="robots" content="index, follow" />
    <title>${escapeHtml(normalizedTitle)}</title>
    <meta name="description" content="${escapeHtml(normalizedDescription)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Car Match" />
    <meta property="og:title" content="${escapeHtml(normalizedTitle)}" />
    <meta property="og:description" content="${escapeHtml(normalizedDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(brandIcon)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(normalizedTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(normalizedDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(brandIcon)}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="preload" as="image" href="/brand/carmatch-lockup-navy.png" />
    <script type="application/ld+json">${normalizedStructuredData}</script>
    <style>
      :root { color-scheme: light; font-family: "Be Vietnam Pro", Inter, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f8fafc; }
      a { color: inherit; text-decoration: none; }
      .nav { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid #e2e8f0; background: rgba(255,255,255,.94); backdrop-filter: blur(10px); }
      .nav-inner { align-items: center; display: flex; justify-content: space-between; margin: 0 auto; max-width: 1180px; padding: 14px 20px; }
      .brand img { display: block; height: 34px; width: auto; }
      .links { align-items: center; display: flex; gap: 22px; font-size: 14px; font-weight: 850; color: #475569; }
      .links a[data-active="true"] { color: #0f766e; }
      .nav-cta, .btn { align-items: center; border-radius: 999px; display: inline-flex; font-weight: 900; justify-content: center; padding: 13px 18px; }
      .nav-cta, .btn.primary { background: #0f766e; color: white; }
      .btn.secondary { background: white; border: 1px solid #cbd5e1; color: #0f172a; }
      .container { margin: 0 auto; max-width: 1180px; padding-left: 20px; padding-right: 20px; }
      .hero { display: grid; gap: 34px; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); padding-bottom: 58px; padding-top: 62px; }
      .eyebrow { color: #0f766e; font-size: 12px; font-weight: 950; letter-spacing: .16em; margin: 0 0 12px; text-transform: uppercase; }
      h1 { font-size: clamp(38px, 6vw, 68px); letter-spacing: 0; line-height: 1; margin: 0 0 18px; }
      h2 { font-size: clamp(28px, 4vw, 44px); letter-spacing: 0; line-height: 1.08; margin: 0 0 18px; }
      h3 { font-size: 21px; line-height: 1.25; margin: 0 0 8px; }
      p, li { color: #475569; font-size: 16px; font-weight: 650; line-height: 1.72; }
      .lead { font-size: 18px; max-width: 700px; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
      .panel, .card, .band-card, details { background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 14px 38px rgba(15,23,42,.05); }
      .panel { padding: 24px; }
      .panel-image { aspect-ratio: 16 / 10; border-radius: 8px; display: block; margin: -8px -8px 20px; object-fit: cover; width: calc(100% + 16px); }
      .metric-grid { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0,1fr)); margin-top: 24px; }
      .metric { background: #f1f5f9; border-radius: 8px; padding: 16px; }
      .metric strong { display: block; font-size: 24px; }
      .metric span { color: #64748b; display: block; font-size: 12px; font-weight: 900; margin-top: 4px; text-transform: uppercase; }
      .section { padding-bottom: 64px; padding-top: 64px; }
      .band { background: white; border-bottom: 1px solid #e2e8f0; border-top: 1px solid #e2e8f0; }
      .section-head { align-items: end; display: flex; gap: 22px; justify-content: space-between; margin-bottom: 28px; }
      .muted { max-width: 720px; }
      .grid-2 { display: grid; gap: 18px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-3 { display: grid; gap: 18px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid-4 { display: grid; gap: 18px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .card { padding: 22px; }
      .card .tag { color: #0f766e; display: block; font-size: 12px; font-weight: 950; letter-spacing: .12em; margin-bottom: 12px; text-transform: uppercase; }
      .card-link { display: block; transition: transform .16s ease, box-shadow .16s ease; }
      .card-link:hover { box-shadow: 0 18px 46px rgba(15,23,42,.1); transform: translateY(-2px); }
      .route-card { display: block; overflow: hidden; padding: 0; }
      .route-card-image { aspect-ratio: 16 / 10; background: linear-gradient(135deg,#0f766e,#0f172a); display: block; object-fit: cover; width: 100%; }
      .route-card-body { padding: 22px; }
      .route-stats { display: grid; gap: 10px; grid-template-columns: repeat(3,minmax(0,1fr)); margin-top: 16px; }
      .route-stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
      .route-stat strong { display: block; font-size: 15px; }
      .route-stat span { color: #64748b; display: block; font-size: 11px; font-weight: 900; margin-top: 3px; text-transform: uppercase; }
      .hero-photo { border-radius: 8px; min-height: 440px; overflow: hidden; padding: 0; }
      .hero-photo img { display: block; height: 100%; min-height: 440px; object-fit: cover; width: 100%; }
      .mini-list { display: grid; gap: 12px; margin-top: 18px; }
      .mini { align-items: start; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: grid; gap: 6px; padding: 15px; }
      .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow-x: auto; }
      table { border-collapse: collapse; min-width: 720px; width: 100%; }
      th { background: #0f172a; color: white; padding: 16px; text-align: left; }
      td { border-top: 1px solid #e2e8f0; color: #475569; font-weight: 750; padding: 16px; }
      td:first-child { color: #0f172a; font-weight: 950; }
      .dark { background: #0f172a; color: white; }
      .dark p, .dark li { color: #cbd5e1; }
      .dark h2, .dark h3 { color: white; }
      .pill-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
      .pill-links a { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; color: #334155; font-size: 14px; font-weight: 900; padding: 10px 14px; }
      details { box-shadow: none; margin-top: 12px; padding: 19px 20px; }
      summary { cursor: pointer; font-size: 18px; font-weight: 950; }
      footer { background: #020617; color: white; padding: 34px 20px; text-align: center; }
      footer p { color: #cbd5e1; margin: 8px 0 0; }
      @media (max-width: 980px) { .hero, .grid-4 { grid-template-columns: 1fr 1fr; } .grid-3 { grid-template-columns: 1fr 1fr; } .links { display: none; } }
      @media (max-width: 680px) { .hero, .grid-2, .grid-3, .grid-4, .metric-grid { grid-template-columns: 1fr; } .hero { padding-top: 38px; } .section-head { align-items: start; flex-direction: column; } .nav-cta { display: none; } }
    </style>
  </head>
  <body>
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" href="/"><img src="/brand/carmatch-lockup-navy.png" alt="Car Match" /></a>
        <nav class="links" aria-label="Điều hướng chính">
          <a href="/xe">Thuê xe tự lái</a>
          <a href="/di-dau" data-active="${active === 'di-dau'}">Đi đâu</a>
          <a href="/lap-ke-hoach-chuyen-di" data-active="${active === 'planner'}">Lập chuyến đi</a>
          <a href="/blog">Blog</a>
        </nav>
        <a class="nav-cta" href="https://zalo.me/0975563290">Đặt xe qua Zalo</a>
      </div>
    </header>
    ${normalizeBrandText(body)}
    <footer><img src="/brand/carmatch-lockup-white.png" alt="Car Match" style="height:38px;width:auto" /><p>Car Match · thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư/khu đô thị</p></footer>
  </body>
</html>`;
}

function renderGoWhereLanding() {
  const title = 'Đi Đâu Gần Hà Nội Bằng Xe Tự Lái | Car Match';
  const description = 'Gợi ý đi đâu gần Hà Nội bằng xe tự lái: lịch trình cuối tuần, chi phí di chuyển, điểm dừng và loại xe phù hợp cho gia đình.';
  const canonical = `${siteUrl}/di-dau`;
  const destinations = generatedTripDestinations.slice(0, 9);
  const faqItems = [
    ['Cuối tuần gần Hà Nội nên đi đâu bằng xe tự lái?', 'Nếu muốn đi gọn trong ngày, bạn có thể chọn Ba Vì, Sóc Sơn, Ecopark hoặc Ninh Bình. Nếu muốn nghỉ qua đêm, Hạ Long, Tam Đảo, Đại Lải, Mai Châu và Mộc Châu phù hợp hơn.'],
    ['Đi gia đình 4-6 người nên thuê xe gì?', 'Gia đình 3-4 người có thể dùng xe 5 chỗ hoặc xe điện. Nhóm 5-6 người, có trẻ nhỏ hoặc nhiều hành lý nên ưu tiên xe 7 chỗ để ngồi thoải mái hơn.'],
    ['Chi phí đi tỉnh bằng xe tự lái gồm những khoản nào?', 'Chi phí thường gồm tiền thuê xe, phí giao nhận nếu có, xăng hoặc sạc điện, cao tốc/cầu đường, gửi xe, ăn uống và lưu trú nếu đi qua đêm.'],
    ['Car Match có giúp chọn xe theo điểm đến không?', 'Có. Bạn gửi điểm đến, ngày đi, số người và khu vực nhận xe; Car Match kiểm tra lịch xe và gợi ý nhóm xe phù hợp qua Zalo.'],
  ];
  const structuredData = [
    webPageData({ title, description, canonical }, {
      type: 'CollectionPage',
      fields: {
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: destinations.length,
          itemListElement: destinations.map((destination, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: `Đi ${destination.name} bằng xe tự lái`,
            url: `${siteUrl}/di-dau/${destination.slug}`,
          })),
        },
      },
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Đi đâu gần Hà Nội', path: '/di-dau' },
    ]),
  ];

  return renderSeoLandingLayout({
    title,
    description,
    canonical,
    active: 'di-dau',
    structuredData,
    body: `<main>
      <section class="container hero">
        <div>
          <p class="eyebrow">Car Match Đi Đâu</p>
          <h1>Chọn điểm đi chơi quanh Hà Nội, tính luôn xe và chi phí.</h1>
          <p class="lead">Trang này giúp bạn chọn điểm đến, ước tính quãng đường, thời gian đi, chi phí di chuyển và loại xe phù hợp trước khi thuê xe tự lái từ Hà Nội.</p>
          <div class="actions">
            <a class="btn primary" href="/lap-ke-hoach-chuyen-di">Lập kế hoạch chuyến đi</a>
            <a class="btn secondary" href="#diem-den">Xem điểm đến gợi ý</a>
          </div>
          <div class="metric-grid">
            <div class="metric"><strong>${destinations.length}+ tuyến</strong><span>gần Hà Nội</span></div>
            <div class="metric"><strong>5-7 chỗ</strong><span>gợi ý theo nhóm</span></div>
            <div class="metric"><strong>Zalo</strong><span>kiểm tra xe trống</span></div>
          </div>
        </div>
        <aside class="panel hero-photo">
          ${destinations[0]?.imageUrl ? `<img src="${escapeHtml(destinations[0].imageUrl)}" alt="Đi ${escapeHtml(destinations[0].name)} bằng xe tự lái" />` : `<div style="min-height:440px;background:linear-gradient(135deg,#0f766e,#0f172a)"></div>`}
        </aside>
      </section>

      <section class="container section" style="padding-top:0">
        <div class="grid-3">
          <article class="card"><span class="tag">Bước 1</span><h3>Chọn tuyến</h3><p>Xem nhanh quãng đường, thời gian, điểm dừng và mức độ phù hợp theo nhu cầu.</p></article>
          <article class="card"><span class="tag">Bước 2</span><h3>Tính xe và chi phí</h3><p>Ước tính loại xe, xăng/sạc, cao tốc, thời gian thuê và ngân sách di chuyển.</p></article>
          <article class="card"><span class="tag">Bước 3</span><h3>Gửi Zalo giữ xe</h3><p>Chuyển kế hoạch thành yêu cầu để Car Match kiểm tra lịch xe thật.</p></article>
        </div>
      </section>

      <section class="band">
        <div class="container section">
          <div class="section-head">
            <div><p class="eyebrow">Tuyến đang được quan tâm</p><h2>Chọn nhanh theo hành trình</h2></div>
            <a class="btn secondary" href="/lap-ke-hoach-chuyen-di">Tự tính chuyến riêng</a>
          </div>
          <div class="mini-list">
            ${destinations.slice(0, 4).map((destination, index) => `<a class="mini" href="/di-dau/${escapeHtml(destination.slug)}"><strong>0${index + 1} · Hà Nội → ${escapeHtml(destination.name)}</strong><span>${destinationRoundTripKm(destination)} km hai chiều · ${escapeHtml(destination.duration || 'Theo lịch')} · ${formatVnd(destinationMobilityEstimate(destination))} di chuyển</span></a>`).join('\n')}
          </div>
        </div>
      </section>

      <section class="container section grid-2">
        <div>
          <p class="eyebrow">Gợi ý theo nhu cầu</p>
          <h2>Không biết cuối tuần này nên đi đâu?</h2>
          <p>Trên bản web tương tác, bạn có thể nhập số người, thời gian, gu chuyến đi và thời tiết để Car Match gợi ý tuyến phù hợp hơn.</p>
          <div class="pill-links">
            <a href="/lap-ke-hoach-chuyen-di?so-nguoi=4&thoi-gian=weekend&phong-cach=family">Gia đình đi cuối tuần</a>
            <a href="/lap-ke-hoach-chuyen-di?so-nguoi=6&thoi-gian=weekend&phong-cach=family">Nhóm 6 người cần xe rộng</a>
            <a href="/lap-ke-hoach-chuyen-di?so-nguoi=3&thoi-gian=day&phong-cach=friends">Đi trong ngày</a>
          </div>
        </div>
        <aside class="card">
          <p class="eyebrow">Trợ lý chuyến đi</p>
          <h2>Hỏi nhanh trước khi đặt xe</h2>
          <p>Trợ lý trên trang chỉ dùng dữ liệu tuyến, chi phí và xe gợi ý của Car Match; nếu thiếu dữ liệu sẽ hướng khách mở Trip Finder hoặc nhắn Zalo để xác nhận.</p>
        </aside>
      </section>

      <section id="diem-den" class="container section">
        <div class="section-head">
          <div><p class="eyebrow">Điểm đến gợi ý</p><h2>Các tuyến dễ lên kế hoạch bằng xe tự lái</h2></div>
          <a class="btn secondary" href="/lap-ke-hoach-chuyen-di">Tính chi phí chuyến đi</a>
        </div>
        <div class="grid-3">
          ${destinations.map((destination) => `<a class="card card-link route-card" href="/di-dau/${escapeHtml(destination.slug)}">
            ${destination.imageUrl ? `<img class="route-card-image" src="${escapeHtml(destination.imageUrl)}" alt="Đi ${escapeHtml(destination.name)} bằng xe tự lái" />` : `<span class="route-card-image"></span>`}
            <span class="route-card-body">
              <span class="tag">${escapeHtml(destination.duration || 'Gợi ý')}</span>
              <h3>Đi ${escapeHtml(destination.name)} bằng xe tự lái</h3>
              <p>${escapeHtml(destination.summary || '')}</p>
              <span class="route-stats">
                <span class="route-stat"><strong>${destination.distanceKm} km</strong><span>một lượt</span></span>
                <span class="route-stat"><strong>${formatVnd(destinationMobilityEstimate(destination))}</strong><span>di chuyển</span></span>
                <span class="route-stat"><strong>${escapeHtml(destination.recommendedVehicle || 'Xe phù hợp')}</strong><span>gợi ý</span></span>
              </span>
            </span>
          </a>`).join('\n')}
        </div>
      </section>

      <section class="band">
        <div class="container section">
          <div class="section-head">
            <div><p class="eyebrow">Bảng chọn xe</p><h2>Nên thuê xe gì theo kiểu chuyến đi?</h2></div>
            <p class="muted">Đây là gợi ý theo nhu cầu phổ biến. Car Match vẫn cần kiểm tra lịch xe thật trước khi xác nhận.</p>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nhu cầu</th><th>Loại xe nên cân nhắc</th><th>Lưu ý trước khi đặt</th></tr></thead>
              <tbody>
                <tr><td>Đi trong ngày 2-4 người</td><td>Xe 5 chỗ, xe điện VinFast VF5/VF6</td><td>Ưu tiên xe gọn, dễ gửi, chi phí vận hành thấp.</td></tr>
                <tr><td>Gia đình 4-6 người</td><td>SUV hoặc xe 7 chỗ</td><td>Tính thêm ghế trẻ em, hành lý, đồ picnic.</td></tr>
                <tr><td>Đi cao tốc/đường dài</td><td>SUV, MPV, xe 7 chỗ</td><td>Kiểm tra giới hạn km/ngày và phí vượt km nếu có.</td></tr>
                <tr><td>Đi xe điện</td><td>VF5, VF6, VF8 tùy số người</td><td>Xem điểm sạc trên tuyến và thời gian dừng nghỉ.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="container section grid-2">
        <div>
          <p class="eyebrow">Next step</p>
          <h2>Sau khi chọn điểm đến, hãy tính ngân sách chuyến đi</h2>
          <p>Trang lập kế hoạch chuyến đi giúp bạn nhập điểm đến, ngày đi, số người và phong cách chuyến. Từ đó có khung chi phí thuê xe, xăng/sạc, cao tốc, ăn uống và lưu trú.</p>
          <div class="actions">
            <a class="btn primary" href="/lap-ke-hoach-chuyen-di">Mở trang lập kế hoạch</a>
            <a class="btn secondary" href="https://zalo.me/0975563290">Nhắn Zalo Car Match</a>
          </div>
        </div>
        <aside class="card dark">
          <h2>Link nội bộ nên đẩy lực SEO</h2>
          <p>Các tuyến cụ thể nên nhận link từ hub này bằng anchor tự nhiên.</p>
          <div class="pill-links">
            <a href="/di-dau/ha-long">Đi Hạ Long bằng xe tự lái</a>
            <a href="/di-dau/ninh-binh">Đi Ninh Bình bằng xe tự lái</a>
            <a href="/di-dau/tam-dao">Đi Tam Đảo bằng xe tự lái</a>
            <a href="/xe?seats=7">Thuê xe 7 chỗ</a>
          </div>
        </aside>
      </section>

      <section class="band">
        <div class="container section">
          <p class="eyebrow">FAQ</p>
          <h2>Câu hỏi thường gặp khi đi gần Hà Nội bằng xe tự lái</h2>
          ${faqItems.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('\n')}
        </div>
      </section>
    </main>`,
  });
}

function renderTripPlannerLanding() {
  const title = 'Lập Kế Hoạch Thuê Xe Tự Lái Từ Hà Nội | Car Match';
  const description = 'Lập kế hoạch thuê xe tự lái từ Hà Nội theo điểm đến, số người và ngân sách: gợi ý xe, chi phí dự kiến, lịch trình và CTA Zalo.';
  const canonical = `${siteUrl}/lap-ke-hoach-chuyen-di`;
  const faqItems = [
    ['Trang lập kế hoạch chuyến đi dùng để làm gì?', 'Trang này giúp khách ước tính trước loại xe phù hợp, số ngày thuê, chi phí di chuyển và lịch trình tham khảo trước khi nhắn Car Match kiểm tra xe thật.'],
    ['Chi phí trên trang có phải báo giá cuối cùng không?', 'Không. Đây là khung dự kiến để khách hình dung ngân sách. Giá cuối cùng phụ thuộc mẫu xe, ngày thuê, điểm giao nhận và lịch trống thực tế.'],
    ['Tôi có thể thuê xe tự lái đi tỉnh từ Hà Nội không?', 'Có. Car Match hỗ trợ tư vấn xe tự lái đi các tuyến gần Hà Nội như Hạ Long, Ninh Bình, Tam Đảo, Ba Vì, Sóc Sơn và các điểm phù hợp khác.'],
    ['Sau khi lập kế hoạch, bước tiếp theo là gì?', 'Bạn gửi điểm đến, ngày đi, số người, khu vực nhận xe qua Zalo. Car Match kiểm tra lịch xe và báo phương án phù hợp.'],
  ];
  const structuredData = [
    webPageData({ title, description, canonical }, {
      fields: {
        potentialAction: {
          '@type': 'ContactAction',
          target: 'https://zalo.me/0975563290',
          name: 'Nhắn Zalo kiểm tra xe trống',
        },
      },
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Lập kế hoạch chuyến đi', path: '/lap-ke-hoach-chuyen-di' },
    ]),
  ];

  return renderSeoLandingLayout({
    title,
    description,
    canonical,
    active: 'planner',
    structuredData,
    body: `<main>
      <section class="container hero">
        <div>
          <p class="eyebrow">Trip Planner Car Match</p>
          <h1>Lập kế hoạch thuê xe tự lái từ Hà Nội</h1>
          <p class="lead">Nhập điểm đến, ngày đi, số người và phong cách chuyến để có khung chọn xe, ngân sách và lịch trình trước khi Car Match kiểm tra xe trống.</p>
          <div class="actions">
            <a class="btn primary" href="https://zalo.me/0975563290">Nhắn Zalo kiểm tra xe</a>
            <a class="btn secondary" href="#bang-chi-phi">Xem cách tính chi phí</a>
          </div>
          <div class="metric-grid">
            <div class="metric"><strong>4 bước</strong><span>lên kế hoạch</span></div>
            <div class="metric"><strong>5-7 chỗ</strong><span>gợi ý theo người</span></div>
            <div class="metric"><strong>30 phút</strong><span>phản hồi khi có xe</span></div>
          </div>
        </div>
        <aside class="panel">
          <p class="eyebrow">Thông tin cần chuẩn bị</p>
          <h2>Gửi càng rõ, Car Match tư vấn càng nhanh</h2>
          <div class="mini-list">
            <div class="mini"><strong>Điểm đến và ngày đi</strong><span>Ví dụ: Hạ Long, 2 ngày 1 đêm, nhận xe sáng thứ Bảy.</span></div>
            <div class="mini"><strong>Số người và hành lý</strong><span>Giúp chọn xe 5 chỗ, SUV hay xe 7 chỗ.</span></div>
            <div class="mini"><strong>Khu vực nhận xe</strong><span>Chung cư, khu đô thị hoặc điểm hẹn tại Hà Nội.</span></div>
          </div>
        </aside>
      </section>

      <section class="band">
        <div class="container section">
          <div class="section-head">
            <div><p class="eyebrow">Cách dùng trang này</p><h2>Từ ý tưởng chuyến đi đến phương án thuê xe</h2></div>
            <p class="muted">Trang này không thay thế báo giá cuối cùng. Nó giúp khách tự chuẩn bị trước khi Car Match kiểm tra lịch xe thật.</p>
          </div>
          <div class="grid-4">
            <article class="card"><span class="tag">01</span><h3>Chọn điểm đến</h3><p>Hạ Long, Ninh Bình, Tam Đảo, Ba Vì, Sóc Sơn hoặc tuyến riêng.</p></article>
            <article class="card"><span class="tag">02</span><h3>Nhập ngày và số người</h3><p>Xác định số ngày thuê, số ghế, hành lý và phong cách chuyến.</p></article>
            <article class="card"><span class="tag">03</span><h3>Ước tính ngân sách</h3><p>Tách riêng tiền thuê xe, xăng/sạc, cao tốc, ăn uống và lưu trú.</p></article>
            <article class="card"><span class="tag">04</span><h3>Gửi Zalo kiểm tra xe</h3><p>Car Match xác nhận xe trống, giá và điều kiện thuê trước chuyến đi.</p></article>
          </div>
        </div>
      </section>

      <section class="container section grid-2">
        <div class="card">
          <p class="eyebrow">Nhập nhanh nhu cầu</p>
          <h2>Ví dụ prompt để planner tự điền</h2>
          <p>Trên bản tương tác, khách có thể nhập câu tự nhiên như “Gia đình 6 người có trẻ em muốn đi Hạ Long 2 ngày 1 đêm, ưu tiên xe rộng”. Planner sẽ tự điền điểm đến, số người, thời gian và ưu tiên xe.</p>
        </div>
        <aside class="card dark">
          <p class="eyebrow">Trợ lý chuyến đi</p>
          <h2>Hỏi trước khi gửi lead</h2>
          <p>Trợ lý AI/fallback trả lời dựa trên dữ liệu Car Match đang có: tuyến, chi phí, xe gợi ý, checklist và lưu ý chỗ đỗ. Nếu thiếu dữ liệu sẽ yêu cầu Car Match xác nhận lại.</p>
        </aside>
      </section>

      <section id="bang-chi-phi" class="container section">
        <div class="section-head">
          <div><p class="eyebrow">Bảng chi phí</p><h2>Những khoản nên tính trước khi thuê xe tự lái đi tỉnh</h2></div>
          <a class="btn secondary" href="/di-dau">Xem điểm đến gợi ý</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Khoản chi</th><th>Cách ước tính</th><th>Lưu ý</th></tr></thead>
            <tbody>
              <tr><td>Tiền thuê xe</td><td>Giá/ngày x số ngày thuê</td><td>Giá thay đổi theo mẫu xe, ngày thuê và lịch trống.</td></tr>
              <tr><td>Xăng hoặc sạc điện</td><td>Quãng đường hai chiều x mức tiêu hao</td><td>Xe điện phù hợp nhiều tuyến gần Hà Nội nhưng cần xem điểm sạc.</td></tr>
              <tr><td>Cao tốc/cầu đường</td><td>Theo tuyến đi thực tế</td><td>Hạ Long, Hải Phòng, Ninh Bình thường cần tính phí đường.</td></tr>
              <tr><td>Gửi xe/lưu trú/ăn uống</td><td>Theo số người và số ngày</td><td>Không thuộc giá thuê xe nhưng ảnh hưởng ngân sách chuyến đi.</td></tr>
              <tr><td>Phí giao nhận</td><td>Theo khu vực nhận trả xe</td><td>Car Match xác nhận trước khi chốt lịch.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="band">
        <div class="container section">
          <div class="section-head">
            <div><p class="eyebrow">Gợi ý tuyến phổ biến</p><h2>Các chuyến dễ lập kế hoạch từ Hà Nội</h2></div>
            <p class="muted">Mỗi tuyến có trang riêng để đọc lịch trình và chi phí sâu hơn.</p>
          </div>
          <div class="grid-3">
            <a class="card card-link" href="/lap-ke-hoach-chuyen-di/ha-long?diem-den=ha-long&thoi-gian=weekend&phong-cach=family#trip-form"><span class="tag">2 ngày 1 đêm</span><h3>Thuê xe tự lái đi Hạ Long</h3><p>Phù hợp gia đình, nhóm bạn, có cao tốc và nhiều lựa chọn lưu trú.</p></a>
            <a class="card card-link" href="/lap-ke-hoach-chuyen-di/ninh-binh?diem-den=ninh-binh&thoi-gian=day&phong-cach=family#trip-form"><span class="tag">Trong ngày hoặc 2 ngày</span><h3>Thuê xe tự lái đi Ninh Bình</h3><p>Dễ đi cuối tuần, phù hợp xe 5 chỗ hoặc xe điện nếu đi ít người.</p></a>
            <a class="card card-link" href="/lap-ke-hoach-chuyen-di/tam-dao?diem-den=tam-dao&thoi-gian=weekend&phong-cach=friends#trip-form"><span class="tag">Đường đèo</span><h3>Thuê xe tự lái đi Tam Đảo</h3><p>Nên ưu tiên xe dễ lái, phanh tốt, người lái quen cung đường dốc.</p></a>
          </div>
        </div>
      </section>

      <section class="container section grid-2">
        <div>
          <p class="eyebrow">Chọn xe theo nhóm người</p>
          <h2>Xe phù hợp phụ thuộc số người, hành lý và cung đường</h2>
          <div class="mini-list">
            <div class="mini"><strong>2-4 người</strong><span>Xe 5 chỗ hoặc xe điện giúp tối ưu chi phí và dễ gửi xe.</span></div>
            <div class="mini"><strong>4-5 người có hành lý</strong><span>SUV/crossover giúp ngồi thoải mái hơn xe đô thị nhỏ.</span></div>
            <div class="mini"><strong>5-7 người</strong><span>Xe 7 chỗ phù hợp gia đình đông người hoặc chuyến dài ngày.</span></div>
          </div>
        </div>
        <aside class="card dark">
          <h2>Muốn kiểm tra xe trống ngay?</h2>
          <p>Gửi điểm đến, ngày đi, ngày về, số người và khu vực nhận xe. Car Match sẽ kiểm tra lịch xe và báo phương án phù hợp.</p>
          <div class="actions">
            <a class="btn primary" href="https://zalo.me/0975563290">Nhắn Zalo Car Match</a>
            <a class="btn secondary" href="/xe">Xem danh sách xe</a>
          </div>
        </aside>
      </section>

      <section class="band">
        <div class="container section">
          <p class="eyebrow">FAQ</p>
          <h2>Câu hỏi thường gặp khi lập kế hoạch thuê xe tự lái</h2>
          ${faqItems.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('\n')}
        </div>
      </section>
    </main>`,
  });
}

function formatVnd(value = 0) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function destinationTitle(destination) {
  return destination.seoTitle || `Đi ${destination.name} Bằng Xe Tự Lái — Lịch Trình & Chi Phí | Car Match`;
}

function destinationDescription(destination) {
  return destination.seoDescription || `Guide đi ${destination.name} từ Hà Nội bằng xe tự lái: lịch trình, chi phí di chuyển, điểm dừng và loại xe phù hợp.`;
}

function destinationRoundTripKm(destination) {
  return Number(destination.distanceKm || 0) * 2;
}

function destinationEnergyEstimate(destination) {
  const costPerKm = Number(destination.fuelCostPerKm || 1800);
  return Math.round((destinationRoundTripKm(destination) * costPerKm) / 1000) * 1000;
}

function destinationMobilityEstimate(destination) {
  return destinationEnergyEstimate(destination) + Number(destination.tollEstimate || 0);
}

function destinationStructuredData(destination) {
  const canonical = `${siteUrl}/di-dau/${destination.slug}`;
  const faqItems = destination.faq?.length ? destination.faq : [
    {
      question: `Đi ${destination.name} bằng xe tự lái nên thuê xe gì?`,
      answer: destination.recommendedVehicle || 'Car Match sẽ tư vấn xe phù hợp theo số người, hành lý, lịch trình và xe trống thực tế.',
    },
    {
      question: `Chi phí đi ${destination.name} bằng xe tự lái gồm những gì?`,
      answer: 'Chi phí thường gồm tiền thuê xe, xăng hoặc sạc điện, phí cao tốc/cầu đường, gửi xe và chi phí ăn uống/lưu trú nếu có.',
    },
  ];

  return [
    webPageData({
      title: destinationTitle(destination),
      description: destinationDescription(destination),
      canonical,
    }, {
      type: 'Article',
      fields: {
        headline: `Đi ${destination.name} bằng xe tự lái từ Hà Nội`,
        mainEntityOfPage: canonical,
        author: publisherData(),
        dateModified: new Date().toISOString().slice(0, 10),
      },
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Đi đâu gần Hà Nội', path: '/di-dau' },
      { name: destination.name, path: `/di-dau/${destination.slug}` },
    ]),
  ];
}

function renderDestinationLanding(destination) {
  const title = destinationTitle(destination);
  const description = destinationDescription(destination);
  const canonical = `${siteUrl}/di-dau/${destination.slug}`;
  const roundTripKm = destinationRoundTripKm(destination);
  const energyEstimate = destinationEnergyEstimate(destination);
  const mobilityEstimate = destinationMobilityEstimate(destination);
  const faqItems = destination.faq?.length ? destination.faq : [
    {
      question: `Đi ${destination.name} nên thuê xe 5 chỗ hay 7 chỗ?`,
      answer: destination.recommendedVehicle || 'Nên chọn xe theo số người, hành lý và cung đường. Car Match sẽ kiểm tra xe trống trước khi xác nhận.',
    },
    {
      question: `Đi ${destination.name} có cần tính phí cao tốc không?`,
      answer: 'Tùy tuyến đi thực tế. Trang này chỉ dùng mức ước tính để bạn hình dung ngân sách trước khi đặt xe.',
    },
  ];
  const relatedDestinations = fallbackTripDestinations
    .filter((item) => item.slug !== destination.slug)
    .filter((item) => (item.tags || []).some((tag) => (destination.tags || []).includes(tag)) || item.duration === destination.duration)
    .slice(0, 3);

  return renderSeoLandingLayout({
    title,
    description,
    canonical,
    active: 'di-dau',
    structuredData: destinationStructuredData(destination),
    body: `<main>
      <section class="container hero">
        <div>
          <p class="eyebrow">${escapeHtml(destination.region || 'Miền Bắc')} · ${escapeHtml(destination.duration || 'Theo lịch trình')}</p>
          <h1>Đi ${escapeHtml(destination.name)} bằng xe tự lái từ Hà Nội</h1>
          <p class="lead">${escapeHtml(destination.summary || description)}</p>
          <div class="actions">
            <a class="btn primary" href="/lap-ke-hoach-chuyen-di/${escapeHtml(destination.slug)}?diem-den=${escapeHtml(destination.slug)}#trip-form">Tính chi phí tuyến này</a>
            <a class="btn secondary" href="https://zalo.me/0975563290">Hỏi xe qua Zalo</a>
          </div>
          <div class="metric-grid">
            <div class="metric"><strong>${roundTripKm} km</strong><span>ước tính hai chiều</span></div>
            <div class="metric"><strong>${escapeHtml(destination.duration || 'Theo lịch')}</strong><span>thời gian nên đi</span></div>
            <div class="metric"><strong>${formatVnd(mobilityEstimate)}</strong><span>xăng/sạc + phí đường</span></div>
          </div>
        </div>
        <aside class="panel">
          ${destination.imageUrl ? `<img class="panel-image" src="${escapeHtml(destination.imageUrl)}" alt="Đi ${escapeHtml(destination.name)} bằng xe tự lái" />` : ''}
          <p class="eyebrow">Tóm tắt nhanh</p>
          <h2>Tuyến này hợp với ai?</h2>
          <p>${escapeHtml(destination.ideal || 'Khách cần thuê xe tự lái từ Hà Nội và muốn chủ động lịch trình.')}</p>
          <div class="mini-list">
            <div class="mini"><strong>Tuyến đường</strong><span>${escapeHtml(destination.route || 'Hà Nội → điểm đến')}</span></div>
            <div class="mini"><strong>Xe nên cân nhắc</strong><span>${escapeHtml(destination.recommendedVehicle || 'Xe 5 chỗ hoặc 7 chỗ tùy số người.')}</span></div>
            <div class="mini"><strong>Lưu ý lái xe</strong><span>${escapeHtml(destination.drivingNote || 'Kiểm tra lịch trình, giấy tờ và điều kiện thuê trước khi đi.')}</span></div>
          </div>
        </aside>
      </section>

      <section class="band">
        <div class="container section">
          <div class="section-head">
            <div><p class="eyebrow">Chi phí di chuyển</p><h2>Đi ${escapeHtml(destination.name)} bằng xe tự lái hết khoảng bao nhiêu?</h2></div>
            <p class="muted">Bảng này chưa gồm tiền thuê xe, ăn uống, lưu trú và phát sinh riêng. Car Match sẽ báo giá thuê theo xe còn trống.</p>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Khoản chi</th><th>Ước tính</th><th>Ghi chú</th></tr></thead>
              <tbody>
                <tr><td>Quãng đường</td><td>${roundTripKm} km hai chiều</td><td>Theo tuyến phổ biến từ Hà Nội.</td></tr>
                <tr><td>Xăng hoặc sạc điện</td><td>${formatVnd(energyEstimate)}</td><td>Ước tính theo quãng đường và mức tiêu hao tham khảo.</td></tr>
                <tr><td>Cao tốc/phí đường</td><td>${formatVnd(destination.tollEstimate || 0)}</td><td>Có thể thay đổi theo điểm vào/ra và tuyến đi.</td></tr>
                <tr><td>Tổng di chuyển</td><td>${formatVnd(mobilityEstimate)}</td><td>Chưa gồm tiền thuê xe và phí giao nhận nếu có.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="container section grid-2">
        <div>
          <p class="eyebrow">Lịch trình gợi ý</p>
          <h2>Lịch trình đi ${escapeHtml(destination.name)} bằng xe tự lái</h2>
          <div class="mini-list">
            ${(destination.schedule || []).map((block) => `<div class="mini"><strong>${escapeHtml(block.title)}</strong><span>${escapeHtml((block.items || []).join(' · '))}</span></div>`).join('\n')}
          </div>
        </div>
        <aside class="card">
          <p class="eyebrow">Điểm dừng và chỗ đỗ</p>
          <h2>Ăn gì, chơi gì, gửi xe ở đâu?</h2>
          <div class="mini-list">
            ${(destination.nearbyPlaces || destination.stops || []).slice(0, 4).map((place) => {
              if (typeof place === 'string') return `<div class="mini"><strong>${escapeHtml(place)}</strong><span>Điểm dừng phổ biến trên tuyến.</span></div>`;
              return `<div class="mini"><strong>${escapeHtml(place.name)}</strong><span>${escapeHtml(place.type)} · ${escapeHtml(place.note)}${place.price ? ` · ${escapeHtml(place.price)}` : ''}${place.openingHours ? ` · Giờ mở cửa: ${escapeHtml(place.openingHours)}` : ''}${place.parkingNote ? ` · Đỗ xe: ${escapeHtml(place.parkingNote)}` : ''}</span></div>`;
            }).join('\n')}
          </div>
        </aside>
      </section>

      <section class="container section grid-2">
        <div class="card">
          <p class="eyebrow">Checklist trước chuyến</p>
          <h2>Chuẩn bị gì trước khi đi ${escapeHtml(destination.name)}?</h2>
          <div class="mini-list">
            ${(destination.checklist?.length ? destination.checklist : [
              destination.recommendedVehicle || 'Chọn xe theo số người và hành lý.',
              destination.drivingNote || 'Kiểm tra đường đi, tốc độ và điểm dừng nghỉ trước khi xuất phát.',
              destination.parkingNote || 'Hỏi trước bãi đỗ tại điểm đến hoặc nơi lưu trú.',
            ]).map((item) => `<div class="mini"><strong>✓</strong><span>${escapeHtml(item)}</span></div>`).join('\n')}
          </div>
        </div>
        <aside class="card dark">
          <p class="eyebrow">Bản đồ tuyến đi</p>
          <h2>Hà Nội → ${escapeHtml(destination.name)}</h2>
          <p>${destination.mapUrl ? 'Trang tương tác sẽ hiển thị bản đồ Google Maps đã nhập từ CMS.' : `Tuyến tham khảo ${roundTripKm} km hai chiều, cần xác nhận lại theo điểm nhận xe và điểm đến thực tế.`}</p>
          <div class="metric-grid">
            <div class="metric"><strong>Hà Nội</strong><span>xuất phát</span></div>
            <div class="metric"><strong>${roundTripKm} km</strong><span>hai chiều</span></div>
            <div class="metric"><strong>${escapeHtml(destination.name)}</strong><span>điểm đến</span></div>
          </div>
        </aside>
      </section>

      <section class="band">
        <div class="container section grid-2">
          <div>
            <p class="eyebrow">Chọn xe</p>
            <h2>Nên thuê xe gì để đi ${escapeHtml(destination.name)}?</h2>
            <p>${escapeHtml(destination.recommendedVehicle || 'Nếu đi ít người, xe 5 chỗ thường đủ dùng. Nếu đi gia đình đông, có trẻ em hoặc nhiều hành lý, nên cân nhắc xe 7 chỗ.')}</p>
            <div class="pill-links">
              <a href="/xe">Xem danh sách xe tự lái</a>
              <a href="/xe?seats=7">Thuê xe 7 chỗ</a>
              <a href="/lap-ke-hoach-chuyen-di/${escapeHtml(destination.slug)}?diem-den=${escapeHtml(destination.slug)}#trip-form">Lập kế hoạch tuyến này</a>
            </div>
          </div>
          <aside class="card dark">
            <h2>Muốn Car Match kiểm tra xe trống?</h2>
            <p>Gửi ngày đi, số người, điểm nhận xe và nhu cầu hành lý. Car Match kiểm tra lịch xe thật rồi báo phương án phù hợp.</p>
            <div class="actions">
              <a class="btn primary" href="https://zalo.me/0975563290">Nhắn Zalo</a>
              <a class="btn secondary" href="/lap-ke-hoach-chuyen-di/${escapeHtml(destination.slug)}?diem-den=${escapeHtml(destination.slug)}#trip-form">Tính chuyến đi</a>
            </div>
          </aside>
        </div>
      </section>

      <section class="container section">
        <div class="section-head">
          <div><p class="eyebrow">Đọc tiếp</p><h2>Các tuyến liên quan gần Hà Nội</h2></div>
          <a class="btn secondary" href="/di-dau">Xem tất cả điểm đến</a>
        </div>
        <div class="grid-3">
          ${relatedDestinations.map((item) => `<a class="card card-link" href="/di-dau/${escapeHtml(item.slug)}"><span class="tag">${escapeHtml(item.duration || 'Gợi ý')}</span><h3>Đi ${escapeHtml(item.name)} bằng xe tự lái</h3><p>${escapeHtml(item.summary || '')}</p></a>`).join('\n')}
        </div>
      </section>

      <section class="band">
        <div class="container section">
          <p class="eyebrow">FAQ</p>
          <h2>Câu hỏi thường gặp khi đi ${escapeHtml(destination.name)} bằng xe tự lái</h2>
          ${faqItems.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('\n')}
        </div>
      </section>
    </main>`,
  });
}

function collectionStructuredData(collection, destinations) {
  const canonical = `${siteUrl}/di-dau/chu-de/${collection.slug}`;
  const faqItems = [
    {
      question: `${collection.title} nên chọn tuyến nào?`,
      answer: `Bạn có thể cân nhắc ${destinations.slice(0, 4).map((item) => item.name).join(', ')} tùy số người, thời gian đi và loại xe muốn thuê.`,
    },
    {
      question: 'Car Match có tư vấn xe theo nhóm điểm đến không?',
      answer: 'Có. Car Match tư vấn xe theo số người, hành lý, cung đường, thời gian thuê và xe trống thực tế.',
    },
  ];

  return [
    webPageData({
      title: `${collection.seoTitle} | Car Match`,
      description: collection.seoDescription,
      canonical,
    }, {
      type: 'CollectionPage',
      fields: {
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: destinations.length,
          itemListElement: destinations.map((destination, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: `Đi ${destination.name} bằng xe tự lái`,
            url: `${siteUrl}/di-dau/${destination.slug}`,
          })),
        },
      },
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Đi đâu gần Hà Nội', path: '/di-dau' },
      { name: collection.title, path: `/di-dau/chu-de/${collection.slug}` },
    ]),
  ];
}

function renderCollectionLanding(collection) {
  const destinations = collection.destinationSlugs
    .map((slug) => generatedTripDestinations.find((destination) => destination.slug === slug))
    .filter(Boolean);
  const title = `${collection.seoTitle} | Car Match`;
  const description = collection.seoDescription;
  const canonical = `${siteUrl}/di-dau/chu-de/${collection.slug}`;
  const faqItems = [
    {
      question: `${collection.title} nên thuê xe gì?`,
      answer: 'Nếu đi 2-4 người, xe 5 chỗ hoặc xe điện thường đủ dùng. Nếu đi gia đình đông, nhiều đồ hoặc đường dài, xe 7 chỗ/SUV sẽ thoải mái hơn.',
    },
    {
      question: 'Có thể nhờ Car Match kiểm tra xe theo ngày đi không?',
      answer: 'Có. Bạn gửi ngày đi, số người, điểm nhận xe và điểm đến qua Zalo; Car Match kiểm tra lịch xe thật rồi tư vấn phương án phù hợp.',
    },
    {
      question: 'Trang chủ đề khác gì trang từng điểm đến?',
      answer: 'Trang chủ đề giúp so sánh nhanh nhiều tuyến theo cùng nhu cầu. Trang từng điểm đến sẽ đi sâu hơn về lịch trình, chi phí và lưu ý lái xe.',
    },
  ];

  return renderSeoLandingLayout({
    title,
    description,
    canonical,
    active: 'di-dau',
    structuredData: collectionStructuredData(collection, destinations),
    body: `<main>
      <section class="container hero">
        <div>
          <p class="eyebrow">${escapeHtml(collection.eyebrow || 'Car Match Đi Đâu')}</p>
          <h1>${escapeHtml(collection.seoTitle || collection.title)}</h1>
          <p class="lead">${escapeHtml(collection.description || description)}</p>
          <div class="actions">
            <a class="btn primary" href="/lap-ke-hoach-chuyen-di#trip-form">${escapeHtml(collection.ctaLabel || 'Lập kế hoạch chuyến đi')}</a>
            <a class="btn secondary" href="#danh-sach">Xem danh sách gợi ý</a>
          </div>
          <div class="metric-grid">
            <div class="metric"><strong>${destinations.length}</strong><span>điểm đến</span></div>
            <div class="metric"><strong>5-7 chỗ</strong><span>gợi ý theo nhóm</span></div>
            <div class="metric"><strong>Zalo</strong><span>kiểm tra xe thật</span></div>
          </div>
        </div>
        <aside class="panel">
          <p class="eyebrow">Cách chọn tuyến</p>
          <h2>So sánh theo thời gian, số người và cung đường</h2>
          <div class="mini-list">
            <div class="mini"><strong>Đi ít người</strong><span>Ưu tiên xe 5 chỗ hoặc xe điện để tối ưu chi phí.</span></div>
            <div class="mini"><strong>Đi gia đình</strong><span>Ưu tiên xe rộng, cốp đủ hành lý, lịch trình không quá dày.</span></div>
            <div class="mini"><strong>Đi đường dài</strong><span>Cần kiểm tra km/ngày, cao tốc, VETC, chỗ đỗ và giờ trả xe.</span></div>
          </div>
        </aside>
      </section>

      <section id="danh-sach" class="band">
        <div class="container section">
          <div class="section-head">
            <div><p class="eyebrow">Danh sách gợi ý</p><h2>${escapeHtml(collection.title)}: nên đi đâu?</h2></div>
            <p class="muted">${escapeHtml(description)}</p>
          </div>
          <div class="grid-3">
            ${destinations.map((destination) => `<a class="card card-link" href="/di-dau/${escapeHtml(destination.slug)}">
              <span class="tag">${escapeHtml(destination.duration || 'Gợi ý')}</span>
              <h3>Đi ${escapeHtml(destination.name)} bằng xe tự lái</h3>
              <p>${escapeHtml(destination.summary || '')}</p>
              <p><strong>${destination.distanceKm || 0} km/lượt</strong> · ${escapeHtml(destination.recommendedVehicle || 'Xe phù hợp theo nhu cầu')}</p>
            </a>`).join('\n')}
          </div>
        </div>
      </section>

      <section class="container section">
        <div class="section-head">
          <div><p class="eyebrow">So sánh nhanh</p><h2>Chọn tuyến theo thời gian và loại xe</h2></div>
          <a class="btn secondary" href="/lap-ke-hoach-chuyen-di">Tính chi phí chuyến đi</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Điểm đến</th><th>Thời gian</th><th>Quãng đường</th><th>Xe nên cân nhắc</th></tr></thead>
            <tbody>
              ${destinations.map((destination) => `<tr><td><a href="/di-dau/${escapeHtml(destination.slug)}">${escapeHtml(destination.name)}</a></td><td>${escapeHtml(destination.duration || 'Theo lịch')}</td><td>${destination.distanceKm || 0} km/lượt</td><td>${escapeHtml(destination.recommendedVehicle || 'Xe 5 chỗ hoặc 7 chỗ tùy số người')}</td></tr>`).join('\n')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="band">
        <div class="container section grid-2">
          <div>
            <p class="eyebrow">Chọn xe</p>
            <h2>Car Match tư vấn xe theo nhu cầu chuyến đi</h2>
            <p>Không nên chọn xe chỉ theo giá. Với chuyến đi từ Hà Nội, cần tính số người, hành lý, cung đường, thời gian thuê và điểm nhận trả xe.</p>
            <div class="pill-links">
              <a href="/xe">Danh sách xe tự lái</a>
              <a href="/xe?seats=7">Thuê xe 7 chỗ</a>
              <a href="/di-dau">Tất cả điểm đến</a>
            </div>
          </div>
          <aside class="card dark">
            <h2>Gửi nhu cầu để kiểm tra xe trống</h2>
            <p>Nhắn Zalo Car Match với ngày đi, số người, khu vực nhận xe và điểm đến. Đội vận hành sẽ kiểm tra xe còn phù hợp.</p>
            <div class="actions"><a class="btn primary" href="https://zalo.me/0975563290">Nhắn Zalo</a><a class="btn secondary" href="/lap-ke-hoach-chuyen-di#trip-form">Lập chuyến đi</a></div>
          </aside>
        </div>
      </section>

      <section class="container section">
        <p class="eyebrow">FAQ</p>
        <h2>Câu hỏi thường gặp về ${escapeHtml(collection.title.toLowerCase())}</h2>
        ${faqItems.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('\n')}
      </section>
    </main>`,
  });
}

async function main() {
  const [posts, vehicles, destinations] = await Promise.all([fetchBlogPosts(), fetchVehicles(), fetchTravelDestinations()]);
  const travelDestinations = destinations.length ? destinations : fallbackTripDestinations;
  generatedTripDestinations = travelDestinations;
  const baseHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
  const contentIndex = {
    destinationNames: new Map(travelDestinations.map((destination) => [destination.slug, destination.name])),
    postTitles: new Map(posts.map((post) => [post.slug.current, post.title])),
  };

  await writeStaticRouteShells(vehicles);

  await mkdir(path.join(distDir, 'thue-xe-tu-lai-ha-noi'), { recursive: true });
  await writeFile(path.join(distDir, 'thue-xe-tu-lai-ha-noi', 'index.html'), renderHanoiLanding(), 'utf8');

  const goWhereMeta = routeMeta.find((meta) => meta.path === '/di-dau');
  if (goWhereMeta) {
    await writeSpaShell(baseHtml, {
      ...goWhereMeta,
      structuredData: routeStructuredData(goWhereMeta, vehicles),
    });
  }

  const tripPlannerMeta = routeMeta.find((meta) => meta.path === '/lap-ke-hoach-chuyen-di');
  if (tripPlannerMeta) {
    await writeSpaShell(baseHtml, {
      ...tripPlannerMeta,
      structuredData: routeStructuredData(tripPlannerMeta, vehicles),
    });
  }

  for (const destination of travelDestinations) {
    await writeSpaShell(baseHtml, {
      path: `/di-dau/${destination.slug}`,
      title: destinationTitle(destination),
      description: destinationDescription(destination),
      canonical: `${siteUrl}/di-dau/${destination.slug}`,
      image: destination.imageUrl,
      structuredData: destinationStructuredData(destination),
    });
  }

  for (const collection of fallbackTravelCollections) {
    const collectionDestinations = collection.destinationSlugs
      .map((slug) => travelDestinations.find((destination) => destination.slug === slug))
      .filter(Boolean);
    await writeSpaShell(baseHtml, {
      path: `/di-dau/chu-de/${collection.slug}`,
      title: collection.seoTitle || `${collection.title} | Car Match`,
      description: collection.seoDescription || collection.description,
      canonical: `${siteUrl}/di-dau/chu-de/${collection.slug}`,
      image: collectionDestinations[0]?.imageUrl,
      structuredData: collectionStructuredData(collection, collectionDestinations),
    });
  }

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
    ['User-agent: *', 'Allow: /', 'Allow: /blog', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n'),
    'utf8',
  );

  console.log(`Generated static SEO HTML for ${routeMeta.length} routes, ${vehicles.length} vehicles, ${posts.length} posts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
