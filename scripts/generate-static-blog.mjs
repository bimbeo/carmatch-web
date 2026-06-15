import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { tripDestinations as fallbackTripDestinations } from '../src/data/tripDestinations.ts';

process.env.NODE_ENV ||= 'production';

let generatedTripDestinations = fallbackTripDestinations;
import { travelCollections as fallbackTravelCollections } from '../src/data/travelCollections.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const siteUrl = 'https://www.carmatch.vn';
const brandLogo = `${siteUrl}/brand/carmatch-lockup-navy.png`;
const brandIcon = `${siteUrl}/brand/carmatch-logo-stacked-navy.png`;
const brandSocialImage = `${siteUrl}/og-image.png`;
const homeLastModified = '2026-06-14';
const socialProfiles = [
  'https://zalo.me/0975563290',
  'https://www.facebook.com/carmatchvn',
  'https://www.instagram.com/carmatchvn/',
];
const vehiclePlaceholderImage =
  'https://images.unsplash.com/photo-1493238792000-8113da705763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
let prerenderedHomeRoot = '';
let prerenderedFleetRoot = '';
let prerenderedMonthlyRoot = '';
let prerenderedContactRoot = '';
let spaBaseHtml = '';
const hanoiDeliveryDetails = {
  '@type': 'OfferShippingDetails',
  shippingDestination: {
    '@type': 'DefinedRegion',
    addressCountry: 'VN',
    addressRegion: 'Hà Nội',
  },
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: 100000,
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
    title: normalizeRequiredText(row.title),
    slug: { current: row.slug },
    publishedAt: row.published_at || row.updated_at || row.created_at,
    excerpt: normalizeRequiredText(row.excerpt),
    mainImageUrl: row.main_image_url || null,
    categories: row.category_slug ? [categoryLabel(row.category_slug)] : [],
    author: normalizeRequiredText(row.author, 'Car Match'),
    body: [],
    bodyHtml: normalizeRequiredText(row.content_html),
    seoTitle: normalizeOptionalText(row.seo_title),
    seoDescription: normalizeOptionalText(row.seo_description),
    canonicalUrl: row.canonical_url || undefined,
    ctaEnabled: row.cta_enabled ?? true,
    ctaTitle: normalizeOptionalText(row.cta_title),
    ctaDescription: normalizeOptionalText(row.cta_description),
    ctaPrimaryLabel: normalizeOptionalText(row.cta_primary_label),
    ctaPrimaryUrl: row.cta_primary_url || undefined,
    ctaZaloLabel: normalizeOptionalText(row.cta_zalo_label),
    ctaZaloUrl: row.cta_zalo_url || undefined,
    relatedDestinationSlugs: row.related_destination_slugs || [],
    relatedVehicleLinks: normalizeRelatedVehicleLinks(row.related_vehicle_links),
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

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function mergeRecord(primary, fallback) {
  if (!fallback) return primary;
  const merged = { ...fallback, ...primary };

  for (const [key, fallbackValue] of Object.entries(fallback)) {
    const primaryValue = primary[key];
    if (!hasValue(primaryValue) && hasValue(fallbackValue)) {
      merged[key] = fallbackValue;
    }
  }

  return merged;
}

function mergeBySlug(primary, fallback) {
  const fallbackBySlug = new Map(fallback.map((item) => [item.slug, item]));
  const seen = new Set(primary.map((item) => item.slug));
  const mergedPrimary = primary.map((item) => mergeRecord(item, fallbackBySlug.get(item.slug)));
  const missingFallback = fallback.filter((item) => !seen.has(item.slug));
  return [...mergedPrimary, ...missingFallback];
}

const blogMeta = {
  title: 'Blog Kinh Nghiệm Thuê Xe Tự Lái | Car Match Hà Nội',
  description:
    'Kinh nghiệm thuê xe tự lái Hà Nội: giấy tờ cần chuẩn bị, đặt cọc, bảo hiểm, chọn xe phù hợp và dịch vụ giao xe tận sảnh chung cư.',
  canonical: `${siteUrl}/blog`,
};

const blogHubTopics = [
  {
    title: 'Chuẩn bị giấy tờ khi thuê xe',
    body: 'Khách thuê nên chuẩn bị CCCD, giấy phép lái xe hạng B và thông tin lịch trình trước khi nhắn Car Match. Việc chốt sớm ngày nhận, ngày trả, khu vực giao xe và số người đi giúp đội vận hành kiểm tra mẫu xe phù hợp nhanh hơn.',
    links: [
      { href: '/thue-xe-tu-lai-ha-noi', label: 'Thuê xe tự lái Hà Nội' },
      { href: '/chinh-sach', label: 'Điều kiện thuê xe' },
    ],
  },
  {
    title: 'Chọn xe theo nhu cầu di chuyển',
    body: 'Xe 5 chỗ phù hợp đi nội đô hoặc cặp đôi cuối tuần, xe 7 chỗ thoải mái hơn cho gia đình có trẻ nhỏ, còn xe điện VinFast hợp với lịch trình có điểm sạc rõ ràng. Blog Car Match tập trung vào cách chọn xe theo hành lý, cung đường và thời gian thuê.',
    links: [
      { href: '/xe', label: 'Xem danh sách xe' },
      { href: '/xe?seats=7', label: 'Xe 7 chỗ' },
      { href: '/xe?category=electric', label: 'Xe điện VinFast' },
    ],
  },
  {
    title: 'Lên lịch trình trước khi đặt xe',
    body: 'Với các chuyến đi Hạ Long, Ninh Bình, Tam Đảo, Mộc Châu hoặc Nội Bài, khách nên kiểm tra cao tốc, bãi đỗ, giờ nhận phòng và chi phí xăng sạc. Các hướng dẫn trên blog sẽ ưu tiên lịch trình thực tế cho gia đình và nhóm bạn xuất phát từ Hà Nội.',
    links: [
      { href: '/di-dau', label: 'Gợi ý đi đâu gần Hà Nội' },
      { href: '/lap-ke-hoach-chuyen-di', label: 'Lập kế hoạch chuyến đi' },
    ],
  },
];

const blogHubFaqItems = [
  {
    question: 'Blog Car Match phù hợp với ai?',
    answer: 'Blog dành cho khách đang tìm thuê xe tự lái Hà Nội, khách thuê xe theo tháng, gia đình chuẩn bị đi chơi gần Hà Nội và người cần so sánh xe 5 chỗ, 7 chỗ, xe điện trước khi đặt.',
  },
  {
    question: 'Chưa thấy bài viết mới thì có đặt xe được không?',
    answer: 'Có. Khách vẫn có thể xem danh sách xe hoặc nhắn Zalo 0975 563 290 để Car Match kiểm tra lịch xe, tư vấn giấy tờ cần chuẩn bị và gợi ý mẫu xe theo lịch trình.',
  },
  {
    question: 'Car Match có tư vấn lịch trình trước khi thuê xe không?',
    answer: 'Có. Car Match có thể gợi ý loại xe, điểm nhận trả, lưu ý bãi đỗ và chi phí di chuyển tham khảo cho các tuyến phổ biến quanh Hà Nội.',
  },
];

function renderBlogHubContent() {
  return `<section class="hub-section" aria-label="Hướng dẫn thuê xe tự lái">
        <div class="hub-heading">
          <p class="eyebrow">Hướng dẫn nhanh</p>
          <h2>Nên đọc gì trước khi thuê xe tự lái?</h2>
          <p>Trong lúc các bài viết chuyên sâu được đăng dần, trang này vẫn gom các chủ đề quan trọng nhất để khách mới không bị lạc giữa giấy tờ, giá thuê, chọn xe và lịch trình.</p>
        </div>
        <div class="guide-grid">
          ${blogHubTopics.map((topic) => `<article class="guide-card">
            <h3>${escapeHtml(topic.title)}</h3>
            <p>${escapeHtml(topic.body)}</p>
            <div class="guide-links">
              ${topic.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}
            </div>
          </article>`).join('')}
        </div>
      </section>
      <section class="hub-section hub-split" aria-label="Cách Car Match hỗ trợ khách thuê xe">
        <div>
          <p class="eyebrow">Quy trình đặt xe</p>
          <h2>Từ đọc kinh nghiệm đến chốt xe</h2>
          <ol class="step-list">
            <li><strong>Chọn nhu cầu:</strong> xác định số người đi, hành lý, cung đường và số ngày thuê.</li>
            <li><strong>Đối chiếu mẫu xe:</strong> xem xe 5 chỗ, 7 chỗ, xe điện hoặc gói thuê tháng phù hợp ngân sách.</li>
            <li><strong>Nhắn Zalo:</strong> gửi lịch trình, khu vực nhận xe và giấy tờ để Car Match kiểm tra xe còn phù hợp.</li>
            <li><strong>Xác nhận nhận xe:</strong> thống nhất điểm hẹn, thời gian giao nhận và các lưu ý trước chuyến đi.</li>
          </ol>
        </div>
        <aside class="hub-cta">
          <p class="eyebrow">Cần xe sớm?</p>
          <h2>Nhắn Car Match kiểm tra xe</h2>
          <p>Đội vận hành hỗ trợ 7h-22h, ưu tiên tư vấn theo lịch trình thực tế và khu vực nhận xe tại Hà Nội.</p>
          <div class="cta-actions">
            <a class="button" href="https://zalo.me/0975563290" rel="me noopener noreferrer" data-blog-action="hub_zalo" data-blog-target="https://zalo.me/0975563290">Nhắn Zalo</a>
            <a class="button secondary" href="/xe" data-blog-action="hub_fleet" data-blog-target="/xe">Xem xe</a>
          </div>
        </aside>
      </section>
      <section class="hub-section" aria-label="Câu hỏi thường gặp về blog thuê xe">
        <div class="hub-heading">
          <p class="eyebrow">FAQ</p>
          <h2>Câu hỏi thường gặp</h2>
        </div>
        <div class="faq-grid">
          ${blogHubFaqItems.map((item) => `<article class="faq-card">
            <h3>${escapeHtml(item.question)}</h3>
            <p>${escapeHtml(item.answer)}</p>
          </article>`).join('')}
        </div>
      </section>`;
}

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
    title: 'Thuê Xe Tự Lái Đi Ninh Bình - Lịch Trình | Car Match',
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
    title: 'Thuê xe tự lái theo tháng Hà Nội từ 10tr | Car Match',
    description:
      'Thuê xe tự lái theo tháng tại Hà Nội từ 10-20tr/tháng. Giao xe tận tòa nhà, hợp đồng rõ ràng, tư vấn báo giá trong 30 phút.',
    canonical: `${siteUrl}/thue-xe-thang`,
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/hop-tac',
    title: 'Hợp Tác Chủ Xe Tại Hà Nội | Car Match',
    description:
      'Chủ xe tại Hà Nội có thể gửi thông tin xe để Car Match thẩm định phương án hợp tác, lịch khai thác, điều kiện vận hành và đối soát doanh thu.',
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
    path: '/lien-he',
    title: 'Liên Hệ Thuê Xe Tự Lái Hà Nội | Car Match',
    description:
      'Liên hệ Car Match qua Zalo 0975 563 290, hotline hoặc email để kiểm tra xe trống, giá thuê, giấy tờ và lịch giao xe tận sảnh tại Hà Nội.',
    canonical: `${siteUrl}/lien-he`,
    priority: '0.65',
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
    description:
      'Tra cứu thông tin đặt xe Car Match bằng mã booking, xem trạng thái xác nhận và thông tin chuyến thuê đã gửi.',
    canonical: `${siteUrl}/dat-xe`,
    noIndex: true,
  },
  {
    path: '/admin',
    title: 'Admin Dashboard | Car Match',
    description:
      'Trang quản trị nội bộ Car Match dành cho đội vận hành theo dõi booking, trạng thái khách hàng và lịch xử lý.',
    canonical: `${siteUrl}/admin`,
    noIndex: true,
  },
];

const generatedRoutePaths = new Set([...routeMeta, ...noIndexRouteMeta].map((meta) => meta.path));

const descriptionOverrides = {
  'thue-xe-tu-lai-vinhomes-ocean-park-giao-xe-tan-sanh':
    'Thuê xe tự lái Vinhomes Ocean Park, giao xe tận sảnh tại Gia Lâm. Bảng giá, thủ tục, đặt cọc và kinh nghiệm chọn xe phù hợp.',
};

const postTitleOverrides = {
  'kinh-nghiem-thue-xe-tu-lai-ha-noi': 'Kinh Nghiệm Thuê Xe Tự Lái Hà Nội | Car Match',
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
  return normalizeCustomerText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function staticMobileConversionBar(source = 'static', zaloLabel = 'Nhắn Zalo') {
  const safeSource = escapeHtml(source);
  const safeZaloLabel = escapeHtml(zaloLabel);
  return `<div class="cm-static-mobile-conversion" aria-label="Liên hệ nhanh Car Match">
    <div class="cm-static-mobile-conversion-row">
      <a href="tel:0975563290" data-cta="${safeSource}-mobile-phone">Gọi</a>
      <a class="primary" href="https://zalo.me/0975563290" data-cta="${safeSource}-mobile-zalo">${safeZaloLabel}</a>
    </div>
    <p>Hỗ trợ 7h-22h</p>
  </div>`;
}

function staticZaloHref(message = 'Xin chào Car Match, tôi cần thuê xe tự lái tại Hà Nội. Nhờ Car Match kiểm tra giúp xe còn lịch trống, giá thuê, cọc và điểm giao nhận phù hợp ạ.') {
  return `https://zalo.me/0975563290?text=${encodeURIComponent(message)}`;
}

function tripPlannerHref(destination, params = {}) {
  const slug = destination?.slug || '';
  const basePath = generatedRoutePaths.has(`/lap-ke-hoach-chuyen-di/${slug}`)
    ? `/lap-ke-hoach-chuyen-di/${slug}`
    : '/lap-ke-hoach-chuyen-di';
  const searchParams = new URLSearchParams({ 'diem-den': slug, ...params });
  return `${basePath}?${searchParams.toString()}#trip-form`;
}

function staticAnswerSection({ eyebrow = 'Trả lời nhanh', title, lead, answers = [], links = [] }) {
  return `<section class="cm-static-answer">
        <div class="cm-static-wrap">
          <p class="cm-static-answer-eyebrow">${escapeHtml(eyebrow)}</p>
          <div class="cm-static-answer-head">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(lead)}</p>
          </div>
          <div class="cm-static-answer-grid">
            ${answers.map((item) => `<article class="cm-static-answer-card"><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join('')}
          </div>
          ${links.length ? `<div class="cm-static-answer-links" aria-label="Link nội bộ liên quan">${links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>` : ''}
        </div>
      </section>`;
}

function normalizeBrandText(value = '') {
  return String(value)
    .replace(/\bCarMatch\b/g, 'Car Match')
    .replace(/\bCARMATCH\b/g, 'CAR MATCH');
}

function normalizeCustomerText(value = '') {
  return normalizeBrandText(value)
    .replace(/hỗ trợ\s*24\/7/gi, 'hỗ trợ trong giờ vận hành')
    .replace(/bảo hiểm đầy đủ/gi, 'điều kiện bảo hiểm được xác nhận trước')
    .replace(/xác nhận tự động/gi, 'đối soát nhanh hơn')
    .replace(/chịu trách nhiệm toàn bộ/gi, 'chịu trách nhiệm theo hợp đồng và quy định đối với');
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return normalizeCustomerText(value);
}

function normalizeRequiredText(value, fallback = '') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return normalizeCustomerText(value);
}

function normalizeRelatedVehicleLinks(links) {
  if (!Array.isArray(links)) return [];
  return links.map((link) => ({
    ...link,
    label: normalizeRequiredText(link?.label),
  }));
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

function makeLegacyColorVehicleSlug(vehicle) {
  const baseSlug = makeVehicleSlug(vehicle);
  const colorPart = slugify(vehicle.color || '');
  return colorPart ? `${baseSlug}-${colorPart}` : '';
}

function getVehicleImage(vehicle) {
  const refs = vehicle.external_refs && typeof vehicle.external_refs === 'object' ? vehicle.external_refs : {};
  const mediaFiles = Array.isArray(refs.mediaFiles) ? refs.mediaFiles : [];
  const mediaImage = mediaFiles.find((file) => (
    file &&
    typeof file === 'object' &&
    file.fileUrl &&
    file.category === 'vehicle_photos' &&
    (!file.mimeType || String(file.mimeType).startsWith('image/'))
  ));
  return refs.coverImageUrl || refs.vehiclePhotoUrl || refs.imageUrl || mediaImage?.fileUrl || vehiclePlaceholderImage;
}

function optimizedStaticImageUrl(src, width, quality = 62) {
  try {
    const url = new URL(src);

    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(quality));
      return url.toString();
    }

    if (
      url.hostname.endsWith('.supabase.co') &&
      url.pathname.includes('/storage/v1/object/public/')
    ) {
      url.pathname = url.pathname.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/',
      );
      url.searchParams.set('width', String(width));
      url.searchParams.set('quality', String(quality));
      url.searchParams.set('resize', 'contain');
      url.searchParams.set('format', 'webp');
      return url.toString();
    }

    if (
      url.hostname === 'commons.wikimedia.org' &&
      url.pathname.includes('/wiki/Special:Redirect/file/')
    ) {
      url.searchParams.set('width', String(width));
      return url.toString();
    }

    if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/upload/')) {
      url.pathname = url.pathname.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
      return url.toString();
    }
  } catch {
    return src;
  }

  return src;
}

function optimizedStaticImageSrcSet(src, widths = [640, 960, 1280], quality = 62) {
  return widths.map((width) => `${optimizedStaticImageUrl(src, width, quality)} ${width}w`).join(', ');
}

function optimizeStaticBodyImages(html = '', fallbackAlt = 'Ảnh minh họa bài viết Car Match') {
  return String(html).replace(/<img\b[^>]*\ssrc=(["'])([^"']+)\1[^>]*>/gi, (match, _quote, src) => {
    let img = match.replace(src, optimizedStaticImageUrl(src, 1400, 68));
    const additions = [];
    if (!/\ssrcset\s*=/i.test(img)) additions.push(`srcset="${escapeHtml(optimizedStaticImageSrcSet(src, [640, 960, 1280], 68))}"`);
    if (!/\ssizes\s*=/i.test(img)) additions.push('sizes="(min-width: 1024px) 760px, 100vw"');
    if (!/\sloading\s*=/i.test(img)) additions.push('loading="lazy"');
    if (!/\sdecoding\s*=/i.test(img)) additions.push('decoding="async"');
    if (!/\salt\s*=/i.test(img)) additions.push(`alt="${escapeHtml(fallbackAlt)}"`);
    if (!/\swidth\s*=/i.test(img)) additions.push('width="1200"');
    if (!/\sheight\s*=/i.test(img)) additions.push('height="675"');
    if (!additions.length) return img;
    return img.replace(/(\s*\/?>)$/, ` ${additions.join(' ')}$1`);
  });
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
  return `Thuê ${getVehicleName(vehicle)} tại Hà Nội: xe ${seats}${fuel}, ${price}. Giao nhận tại sảnh chung cư hoặc điểm hẹn theo lịch xác nhận với Car Match.`;
}

function vehiclePriceText(vehicle) {
  return vehicle.daily_base_price
    ? `từ ${Number(vehicle.daily_base_price).toLocaleString('vi-VN')}đ/ngày, tùy thời điểm và lịch xe`
    : 'liên hệ để Car Match báo giá theo ngày thuê và lịch xe thực tế';
}

function vehicleFitText(vehicle) {
  const model = vehicle.vehicle_models || {};
  const seats = Number(model.seats || 0);
  const fuelType = String(model.fuel_type || '').toLowerCase();
  if (seats >= 7) {
    return 'phù hợp gia đình đông người, nhóm bạn có nhiều hành lý hoặc chuyến đi tỉnh cần khoang rộng.';
  }
  if (fuelType.includes('điện') || fuelType.includes('electric')) {
    return 'phù hợp đi trong phố, cuối tuần gần Hà Nội hoặc khách muốn trải nghiệm xe điện và chủ động điểm sạc.';
  }
  if (seats > 0 && seats <= 4) {
    return 'phù hợp đi phố, đi làm ngắn ngày hoặc nhóm ít người cần xe gọn, dễ xoay trở.';
  }
  return 'phù hợp nhu cầu đi lại cá nhân, gia đình nhỏ hoặc chuyến ngắn ngày quanh Hà Nội.';
}

function vehicleStaticDetailHtml(vehicle) {
  const name = getVehicleName(vehicle);
  const model = vehicle.vehicle_models || {};
  const seats = model.seats ? `${model.seats} chỗ` : 'nhiều lựa chọn chỗ ngồi';
  const fuel = model.fuel_type || 'nhiên liệu theo cấu hình xe';
  const transmission = model.transmission || 'hộp số theo cấu hình xe';
  const price = vehiclePriceText(vehicle);
  const fit = vehicleFitText(vehicle);

  return `<section class="cm-static-fallback-section" aria-labelledby="vehicle-summary">
        <div class="cm-static-fallback-grid">
          <article>
            <p class="cm-static-fallback-kicker">Thông tin thuê xe</p>
            <h2 id="vehicle-summary">Thuê ${escapeHtml(name)} phù hợp với nhu cầu nào?</h2>
            <p>${escapeHtml(name)} là lựa chọn ${escapeHtml(fit)} Giá tham khảo ${escapeHtml(price)}. Trước khi chốt, Car Match sẽ kiểm tra lịch xe, điểm giao nhận, điều kiện cọc và thời gian thuê để tránh hiểu nhầm về chi phí.</p>
          </article>
          <article>
            <p class="cm-static-fallback-kicker">Tóm tắt xe</p>
            <dl class="cm-static-fallback-facts">
              <div><dt>Số chỗ</dt><dd>${escapeHtml(seats)}</dd></div>
              <div><dt>Nhiên liệu</dt><dd>${escapeHtml(fuel)}</dd></div>
              <div><dt>Hộp số</dt><dd>${escapeHtml(transmission)}</dd></div>
              <div><dt>Giá thuê</dt><dd>${escapeHtml(price)}</dd></div>
            </dl>
          </article>
        </div>
      </section>
      <section class="cm-static-fallback-section" aria-labelledby="vehicle-process">
        <div class="cm-static-fallback-grid">
          <article>
            <h2 id="vehicle-process">Quy trình nhận ${escapeHtml(name)} tại Hà Nội</h2>
            <ol class="cm-static-fallback-list">
              <li>Nhắn Zalo 0975 563 290 với mẫu xe, ngày thuê, khu vực nhận xe và số người đi.</li>
              <li>Car Match kiểm tra lịch xe thật, giá thuê, phí giao nhận nếu có và điều kiện đặt cọc.</li>
              <li>Khi nhận xe, hai bên kiểm tra ngoại thất, nội thất, mức xăng/pin, phụ kiện và ghi nhận bàn giao.</li>
              <li>Khách trả xe tại điểm hẹn, Car Match kiểm tra lại tình trạng xe và đối soát phát sinh theo chính sách.</li>
            </ol>
          </article>
          <article>
            <h2>Cần chuẩn bị gì?</h2>
            <p>Khách thuê cần CCCD bản gốc và giấy phép lái xe hạng B còn hiệu lực. Với chuyến đi tỉnh hoặc thuê nhiều ngày, nên gửi trước lịch trình, số người, hành lý và điểm nhận xe để Car Match tư vấn xe phù hợp hơn.</p>
            <div class="cm-static-fallback-links">
              <a href="/faq">FAQ giấy tờ và đặt cọc</a>
              <a href="/chinh-sach">Chính sách thuê xe</a>
              <a href="/xe">Xem xe tự lái khác</a>
              <a href="/thue-xe-thang">Thuê xe theo tháng</a>
            </div>
          </article>
        </div>
      </section>
      <section class="cm-static-fallback-section" aria-labelledby="vehicle-faq">
        <h2 id="vehicle-faq">Câu hỏi thường gặp về ${escapeHtml(name)}</h2>
        <div class="cm-static-fallback-faq">
          <details><summary>${escapeHtml(name)} có luôn trống để thuê không?</summary><p>Lịch xe phụ thuộc ngày thuê, thời gian nhận trả và lịch bảo dưỡng. Website hiển thị mẫu xe để khách tham khảo; Car Match vẫn cần kiểm tra lịch thực tế qua Zalo trước khi xác nhận.</p></details>
          <details><summary>Giá thuê ${escapeHtml(name)} đã bao gồm những gì?</summary><p>Giá trên trang là giá thuê xe tham khảo theo ngày. Phí giao nhận, xăng/sạc, cao tốc, gửi xe, vệ sinh hoặc phát sinh khác sẽ được xác nhận riêng theo lịch thuê và hợp đồng.</p></details>
          <details><summary>Có thể nhận xe tại chung cư hoặc điểm hẹn không?</summary><p>Có. Car Match hỗ trợ giao nhận tại sảnh chung cư hoặc điểm hẹn phù hợp tại Hà Nội theo lịch đã xác nhận, trong khung hỗ trợ vận hành 7h-22h.</p></details>
        </div>
      </section>`;
}

function publisherData() {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Car Match',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: brandIcon,
    },
  };
}

function organizationData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Car Match',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: brandIcon,
      width: 512,
      height: 512,
    },
    image: brandLogo,
    email: 'info@carmatch.vn',
    telephone: '+84975563290',
    sameAs: socialProfiles,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+84975563290',
        contactType: 'customer support',
        areaServed: 'VN',
        availableLanguage: ['vi'],
      },
    ],
  };
}

function webSiteData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'Car Match',
    url: siteUrl,
    inLanguage: 'vi-VN',
    publisher: publisherData(),
  };
}

function localBusinessData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    '@id': `${siteUrl}/#localbusiness`,
    name: 'Car Match — The Manor Central Park',
    alternateName: 'Car Match',
    description: 'Dịch vụ thuê xe tự lái tại Hà Nội, giao xe tận sảnh chung cư và khu đô thị.',
    url: siteUrl,
    telephone: '+84975563290',
    email: 'info@carmatch.vn',
    image: brandIcon,
    logo: brandIcon,
    hasMap: 'https://www.google.com/maps/search/?api=1&query=Car%20Match%20The%20Manor%20Central%20Park%2038%20Sunrise%20H%20Ha%20Noi',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '38 Sunrise H, The Manor Central Park, Định Công',
      addressLocality: 'Hà Nội',
      postalCode: '10000',
      addressCountry: 'VN',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '22:00',
    },
    priceRange: '600.000đ – 25.000.000đ',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Chuyển khoản, Tiền mặt',
    areaServed: [
      { '@type': 'Place', name: 'Vinhomes Ocean Park, Gia Lâm, Hà Nội' },
      { '@type': 'Place', name: 'Vinhomes Smart City, Nam Từ Liêm, Hà Nội' },
      { '@type': 'Place', name: 'Vinhomes Times City, Hai Bà Trưng, Hà Nội' },
      { '@type': 'Place', name: 'Ecopark, Văn Giang, Hưng Yên' },
      { '@type': 'Place', name: 'The Manor Central Park, Định Công, Hà Nội' },
    ],
    sameAs: socialProfiles,
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

function imageObjectData(url, name, width, height) {
  return {
    '@type': 'ImageObject',
    url,
    name,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
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
          text: 'Khách thuê cần CCCD, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo từng mẫu xe, được xác nhận trước khi giao xe.',
        },
      },
      {
        '@type': 'Question',
        name: 'Car Match có giao xe tận nơi không?',
        acceptedAnswer: {
        '@type': 'Answer',
          text: 'Có. Car Match hỗ trợ giao xe tận sảnh chung cư, tòa nhà hoặc điểm hẹn phù hợp tại Hà Nội theo lịch xe đã xác nhận.',
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

function homeFaqData(meta) {
  const faqs = [
    {
      question: 'Thuê xe tự lái Car Match phù hợp với ai?',
      answer: 'Car Match phù hợp với cư dân Hà Nội không muốn sở hữu xe thường xuyên nhưng vẫn cần xe cho cuối tuần, về quê, đi tỉnh, công tác hoặc thuê theo tháng. Dịch vụ tập trung vào giao xe tận sảnh tòa nhà, điều kiện bảo hiểm được xác nhận trước khi chốt và đội vận hành hỗ trợ khi phát sinh trên đường.',
    },
    {
      question: 'Car Match có giao xe tận nơi ở Hà Nội không?',
      answer: 'Có. Car Match hỗ trợ giao xe tận sảnh chung cư, văn phòng hoặc điểm hẹn phù hợp tại Hà Nội. Các khu vực được nhắc nhiều trên website gồm Vinhomes Ocean Park, Times City, Smart City, Royal City, Ecopark, The Manor Central Park và Linh Đàm.',
    },
    {
      question: 'Khách thuê cần chuẩn bị giấy tờ gì?',
      answer: 'Khách thuê cần CCCD bản gốc và giấy phép lái xe hạng B còn hiệu lực. Khi nhận xe, hai bên kiểm tra tình trạng xe, mức pin/xăng, số km, phụ kiện và ghi nhận bàn giao để tránh tranh cãi khi trả xe.',
    },
    {
      question: 'Nếu hủy chuyến hoặc trả xe muộn thì xử lý thế nào?',
      answer: 'Car Match có chính sách hủy và phụ phí theo thời điểm hủy, giờ trả xe và tình trạng xe khi hoàn trả. Khách nên đọc trang chính sách trước khi đặt, hoặc nhắn Zalo để được xác nhận điều kiện cụ thể theo mẫu xe và lịch thuê.',
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteUrl}/#home-faq`,
    name: 'Câu hỏi thường gặp về thuê xe tự lái Car Match',
    url: meta.canonical,
    inLanguage: 'vi-VN',
    publisher: publisherData(),
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function homeStructuredData(meta, vehicles) {
  return [
    organizationData(),
    webSiteData(),
    localBusinessData(),
    webPageData(meta, {
      type: 'WebPage',
      fields: {
        '@id': `${siteUrl}/#webpage`,
        dateModified: homeLastModified,
        datePublished: '2026-06-14',
        primaryImageOfPage: imageObjectData(brandLogo, 'Car Match - thuê xe tự lái Hà Nội', 288, 66),
        thumbnailUrl: brandIcon,
        about: [
          { '@type': 'Thing', name: 'Thuê xe tự lái Hà Nội' },
          { '@type': 'Thing', name: 'Giao xe tận sảnh chung cư' },
          { '@type': 'Thing', name: 'Thuê xe theo tháng' },
        ],
        mainEntity: {
          '@type': 'ItemList',
          name: 'Một số xe tự lái đang có tại Car Match',
          numberOfItems: vehicles.length,
          itemListElement: vehicles.slice(0, 12).map((vehicle, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: getVehicleName(vehicle),
            url: `${siteUrl}/xe/${vehicle.slug}`,
          })),
        },
      },
    }),
    homeFaqData(meta),
    breadcrumbData([{ name: 'Trang chủ', path: '/' }]),
  ];
}

function monthlyRentalStructuredData(meta) {
  const faqs = [
    {
      question: 'Thuê xe tự lái theo tháng tại Hà Nội giá bao nhiêu?',
      answer: 'Giá thuê xe tự lái theo tháng tại Hà Nội thường bắt đầu từ khoảng 10-12 triệu/tháng với xe nhỏ hoặc xe điện đô thị. Nhóm sedan, crossover 5 chỗ thường khoảng 14-18 triệu/tháng, còn xe 7 chỗ hoặc MPV thường từ 20 triệu/tháng tùy mẫu xe, thời gian thuê và giới hạn km.',
    },
    {
      question: 'Thuê xe tháng có giới hạn km không?',
      answer: 'Có. Gói thuê xe tháng thường có giới hạn km theo hợp đồng, phổ biến khoảng 2.500-3.000 km/tháng với nhiều nhóm xe. Nếu nhu cầu đi lại cao hơn, Car Match sẽ tư vấn gói phù hợp hơn trước khi chốt hợp đồng.',
    },
    {
      question: 'Car Match có giao xe tận tòa nhà khi thuê theo tháng không?',
      answer: 'Có. Car Match hỗ trợ giao xe tận tòa nhà, khu đô thị hoặc điểm hẹn phù hợp tại Hà Nội sau khi xác nhận lịch xe, thời gian nhận xe và điều kiện giao nhận.',
    },
    {
      question: 'Cần chuẩn bị gì để thuê xe tự lái theo tháng?',
      answer: 'Khách thuê thường cần CCCD gắn chip, giấy phép lái xe hạng B còn hiệu lực, thông tin điểm giao nhận tại Hà Nội và khoản đặt cọc theo mẫu xe. Với khách doanh nghiệp có thể cần thêm thông tin công ty để làm hợp đồng hoặc xuất hóa đơn.',
    },
    {
      question: 'Thuê 1 tháng có được không hay phải thuê dài hạn?',
      answer: 'Có thể thuê 1 tháng nếu có xe phù hợp và lịch xe trống. Khi thuê 3 tháng, 6 tháng hoặc thuê nhiều xe cùng lúc, đơn giá thường dễ tối ưu hơn so với thuê ngắn.',
    },
  ];

  return [
    webPageData(meta, {
      type: 'Service',
      fields: {
        serviceType: 'Thuê xe tự lái theo tháng',
        provider: publisherData(),
        areaServed: {
          '@type': 'City',
          name: 'Hà Nội',
          addressCountry: 'VN',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'VND',
          lowPrice: 10000000,
          highPrice: 25000000,
          offerCount: 3,
          availability: 'https://schema.org/InStock',
          url: meta.canonical,
        },
      },
    }),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: 'FAQ thuê xe tự lái theo tháng tại Hà Nội',
      url: meta.canonical,
      inLanguage: 'vi-VN',
      publisher: publisherData(),
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Thuê xe tự lái theo tháng', path: '/thue-xe-thang' },
    ]),
  ];
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
        availability: 'https://schema.org/LimitedAvailability',
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
    localBusinessData(),
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

function contactStructuredData(meta) {
  return [
    organizationData(),
    localBusinessData(),
    webPageData(meta, {
      type: 'ContactPage',
      fields: {
        '@id': `${siteUrl}/lien-he#webpage`,
        mainEntity: {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'Car Match',
          url: siteUrl,
          email: 'info@carmatch.vn',
          telephone: '+84975563290',
          contactPoint: [
            {
              '@type': 'ContactPoint',
              telephone: '+84975563290',
              contactType: 'customer support',
              areaServed: 'VN',
              availableLanguage: ['vi'],
            },
          ],
        },
      },
    }),
    breadcrumbData([
      { name: 'Trang chủ', path: '/' },
      { name: 'Liên hệ', path: '/lien-he' },
    ]),
  ];
}

function routeStructuredData(meta, vehicles) {
  if (meta.path === '/') return homeStructuredData(meta, vehicles);
  if (meta.path === '/xe') return fleetStructuredData(meta, vehicles);
  if (meta.path === '/thue-xe-thang') return monthlyRentalStructuredData(meta);
  if (meta.path === '/lien-he') return contactStructuredData(meta);
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
        : meta.path === '/lien-he'
          ? 'Liên hệ'
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
  const legacyColorUsed = new Map();
  return vehicles.map((vehicle) => {
    const baseSlug = makeVehicleSlug(vehicle);
    const slugAliases = [];
    let slug = (counts.get(baseSlug) || 0) > 1 ? makeDuplicateVehicleSlug(vehicle) : baseSlug;
    if (slug !== baseSlug) slugAliases.push(baseSlug);
    let index = 2;
    while (used.has(slug)) {
      slug = `${makeDuplicateVehicleSlug(vehicle)}-${index}`;
      index += 1;
    }
    used.add(slug);

    if ((counts.get(baseSlug) || 0) > 1) {
      const legacyColorSlug = makeLegacyColorVehicleSlug(vehicle);
      if (legacyColorSlug) {
        const legacyIndex = (legacyColorUsed.get(legacyColorSlug) || 0) + 1;
        legacyColorUsed.set(legacyColorSlug, legacyIndex);
        const legacyAlias = legacyIndex === 1 ? legacyColorSlug : `${legacyColorSlug}-${legacyIndex}`;
        if (legacyAlias !== slug && !slugAliases.includes(legacyAlias)) {
          slugAliases.push(legacyAlias);
        }
      }
    }

    return { ...vehicle, slug, slugAliases };
  });
}

function replaceOrInsertHead(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace('</head>', `    ${replacement}\n  </head>`);
}

function moveStylesheetsBeforeModuleScripts(html) {
  return html.replace(
    /(\s*<script type="module" crossorigin src="[^"]+"><\/script>)\s*(<link rel="stylesheet" crossorigin href="[^"]+">)/g,
    '\n    $2$1',
  );
}

function serializeForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function pruneVehicleForClient(vehicle) {
  const refs = vehicle.external_refs && typeof vehicle.external_refs === 'object' ? vehicle.external_refs : {};
  const firstMediaImage = Array.isArray(refs.mediaFiles)
    ? refs.mediaFiles
        .filter((file) => {
          if (!file || typeof file !== 'object') return false;
          return (
            file.category === 'vehicle_photos' &&
            file.fileUrl &&
            (!file.mimeType || String(file.mimeType).startsWith('image/'))
          );
        })
        .map((file) => file.fileUrl)[0]
    : null;
  const coverImageUrl = refs.coverImageUrl || refs.vehiclePhotoUrl || refs.imageUrl || firstMediaImage;

  return {
    id: vehicle.id,
    display_name: vehicle.display_name ?? null,
    plate_number: vehicle.plate_number ?? null,
    color: vehicle.color ?? null,
    model_year: vehicle.model_year ?? null,
    daily_base_price: vehicle.daily_base_price ?? null,
    current_km: vehicle.current_km ?? null,
    status: vehicle.status,
    published: vehicle.published,
    slug: vehicle.slug ?? null,
    slugAliases: Array.isArray(vehicle.slugAliases) ? vehicle.slugAliases : [],
    external_refs: {
      ...(coverImageUrl ? { coverImageUrl } : {}),
    },
    vehicle_models: vehicle.vehicle_models
      ? {
          make: vehicle.vehicle_models.make ?? null,
          model: vehicle.vehicle_models.model ?? null,
          variant: vehicle.vehicle_models.variant ?? null,
          seats: vehicle.vehicle_models.seats ?? null,
          fuel_type: vehicle.vehicle_models.fuel_type ?? null,
          transmission: vehicle.vehicle_models.transmission ?? null,
        }
      : null,
  };
}

async function writeStaticVehicleData(vehicles) {
  await mkdir(path.join(distDir, 'data'), { recursive: true });
  await writeFile(
    path.join(distDir, 'data', 'vehicles.json'),
    JSON.stringify(vehicles.map(pruneVehicleForClient)),
    'utf8',
  );
}

function prunePostForClient(post) {
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
    publishedAt: post.publishedAt,
    excerpt: post.excerpt || '',
    mainImageUrl: post.mainImageUrl || null,
    categories: post.categories || [],
    author: post.author || 'Car Match',
    body: post.body || [],
    bodyHtml: post.bodyHtml || '',
    seoTitle: post.seoTitle || undefined,
    seoDescription: post.seoDescription || undefined,
    canonicalUrl: post.canonicalUrl || undefined,
    ctaEnabled: post.ctaEnabled ?? true,
    ctaTitle: post.ctaTitle || undefined,
    ctaDescription: post.ctaDescription || undefined,
    ctaPrimaryLabel: post.ctaPrimaryLabel || undefined,
    ctaPrimaryUrl: post.ctaPrimaryUrl || undefined,
    ctaZaloLabel: post.ctaZaloLabel || undefined,
    ctaZaloUrl: post.ctaZaloUrl || undefined,
    relatedDestinationSlugs: post.relatedDestinationSlugs || [],
    relatedVehicleLinks: post.relatedVehicleLinks || [],
    relatedPostSlugs: post.relatedPostSlugs || [],
  };
}

async function writeStaticBlogData(posts) {
  await mkdir(path.join(distDir, 'data'), { recursive: true });
  await writeFile(
    path.join(distDir, 'data', 'blog-posts.json'),
    JSON.stringify(posts.map(prunePostForClient)),
    'utf8',
  );
}

async function renderReactHomeRoot(vehicles) {
  const initialVehicles = vehicles.slice(0, 6).map(pruneVehicleForClient);
  const totalVehicles = vehicles.length;
  const vite = await createViteServer({
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'error',
  });

  try {
    const { renderHome } = await vite.ssrLoadModule('/src/ssg/renderHome.tsx');
    globalThis.__CM_TOTAL_VEHICLES__ = totalVehicles;
    const html = renderHome(initialVehicles);
    const data = serializeForInlineScript(initialVehicles);
    return `<div id="root" data-prerendered="home">${html}</div><script>window.__CM_INITIAL_VEHICLES__=${data};window.__CM_TOTAL_VEHICLES__=${totalVehicles};</script>`;
  } finally {
    delete globalThis.__CM_TOTAL_VEHICLES__;
    await vite.close();
  }
}

async function renderReactMonthlyRoot(vehicles) {
  const initialVehicles = vehicles.map(pruneVehicleForClient);
  const vite = await createViteServer({
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'error',
  });

  try {
    const { renderMonthlyRental } = await vite.ssrLoadModule('/src/ssg/renderHome.tsx');
    const html = renderMonthlyRental(initialVehicles);
    const data = serializeForInlineScript(initialVehicles);
    return `<div id="root" data-prerendered="monthly">${html}</div><script>window.__CM_INITIAL_VEHICLES__=${data};</script>`;
  } finally {
    await vite.close();
  }
}

async function renderReactContactRoot() {
  const vite = await createViteServer({
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'error',
  });

  try {
    const { renderContact } = await vite.ssrLoadModule('/src/ssg/renderHome.tsx');
    const html = renderContact();
    return `<div id="root" data-prerendered="contact">${html}</div>`;
  } finally {
    await vite.close();
  }
}

async function renderReactFleetRoot(vehicles) {
  const initialVehicles = vehicles.map(pruneVehicleForClient);
  const vite = await createViteServer({
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'error',
  });

  try {
    const { renderFleet } = await vite.ssrLoadModule('/src/ssg/renderHome.tsx');
    const html = renderFleet(initialVehicles);
    const data = serializeForInlineScript(initialVehicles);
    return `<div id="root" data-prerendered="fleet">${html}</div><script>window.__CM_INITIAL_VEHICLES__=${data};</script>`;
  } finally {
    await vite.close();
  }
}

function staticShellCss() {
  return `
    :root{color-scheme:light}
    #root{min-height:100vh}
    .cm-static-home{background:#f8fafc;color:#0f172a;font-family:"Be Vietnam Pro",Inter,Arial,sans-serif}
    .cm-static-home *{box-sizing:border-box}
    .cm-static-home a{color:inherit;text-decoration:none}
    .cm-static-nav{background:rgba(255,255,255,.96);border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:40}
    .cm-static-nav-inner{align-items:center;display:flex;height:64px;justify-content:space-between;margin:0 auto;max-width:1180px;padding:0 20px}
    .cm-static-logo img{display:block;height:36px;width:auto}
    .cm-static-menu{align-items:center;display:flex;gap:18px;font-size:13px;font-weight:800;color:#475569}
    .cm-static-menu a:hover{color:#11163e}
    .cm-static-cta,.cm-static-btn{align-items:center;border-radius:999px;display:inline-flex;font-weight:900;justify-content:center}
    .cm-static-cta{background:#11163e;color:white!important;padding:10px 16px}
    .cm-static-mobile-menu{display:none;font-size:28px;font-weight:900;line-height:1}
    .cm-static-mobile-conversion{display:none}
    .cm-static-hero{background:linear-gradient(135deg,#f8fafc 0%,#fff 55%,#eef7ff 100%);border-bottom:1px solid #e5e7eb}
    .cm-static-inner{display:grid;gap:34px;grid-template-columns:minmax(0,1.1fr) 420px;margin:0 auto;max-width:1180px;padding:64px 20px 46px}
    .cm-static-pill{color:#0f766e;font-size:12px;font-weight:950;letter-spacing:.12em;margin-bottom:14px;text-transform:uppercase}
    .cm-static-title{font-size:clamp(38px,6vw,66px);letter-spacing:0;line-height:1.02;margin:0 0 18px}
    .cm-static-title span{color:#11163e}
    .cm-static-lead{color:#334155;font-size:18px;font-weight:750;line-height:1.7;margin:0 0 8px;max-width:660px}
    .cm-static-sublead{color:#64748b;font-size:14px;font-weight:700;line-height:1.65;margin:0 0 24px}
    .cm-static-actions{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}
    .cm-static-btn{border:1px solid #dbe4ef;padding:13px 18px}
    .cm-static-btn.primary{background:#11163e;border-color:#11163e;color:white}
    .cm-static-btn.secondary{background:white;color:#111827}
    .cm-static-trust{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
    .cm-static-check{background:white;border:1px solid #e5e7eb;border-radius:999px;color:#475569;font-size:13px;font-weight:800;padding:8px 12px}
    .cm-static-search{background:white;border:1px solid #dbeafe;border-radius:8px;box-shadow:0 18px 45px rgba(15,23,42,.08);margin-top:28px;padding:18px}
    .cm-static-search h2{font-size:22px;line-height:1.2;margin:0 0 8px}
    .cm-static-search p{color:#64748b;font-size:14px;font-weight:700;line-height:1.55;margin:0 0 14px}
    .cm-static-search-grid{display:grid;gap:10px;grid-template-columns:1.2fr .8fr .8fr .9fr .9fr auto}
    .cm-static-search select,.cm-static-search input{border:1px solid #dbe4ef;border-radius:8px;color:#0f172a;font:700 13px inherit;height:44px;min-width:0;padding:0 10px;width:100%}
    .cm-static-search button{background:#11163e;border:0;border-radius:8px;color:white;cursor:pointer;font:900 13px inherit;height:44px;padding:0 18px;white-space:nowrap}
    .cm-static-fleet{background:white;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 20px 55px rgba(15,23,42,.08);padding:16px}
    .cm-static-fleet-head{align-items:center;color:#64748b;display:flex;font-size:12px;font-weight:900;justify-content:space-between;margin-bottom:10px;text-transform:uppercase}
    .cm-static-fleet-head a{color:#11163e;text-transform:none}
    .cm-static-fleet-card{border:1px solid #f1f5f9;border-radius:8px;display:grid;gap:12px;grid-template-columns:112px 1fr;margin-top:10px;overflow:hidden}
    .cm-static-fleet-img{background:#e5e7eb;height:96px}
    .cm-static-fleet-img img{display:block;height:100%;object-fit:cover;width:100%}
    .cm-static-fleet-body{padding:12px 12px 10px 0}
    .cm-static-fleet-row{align-items:start;display:flex;gap:8px;justify-content:space-between}
    .cm-static-fleet-title{color:#0f172a;font-size:14px;font-weight:950;line-height:1.25;margin:0}
    .cm-static-fleet-meta{color:#64748b;font-size:12px;font-weight:800;margin-top:4px}
    .cm-static-status{background:#ecfdf5;border-radius:999px;color:#047857;font-size:10px;font-weight:950;padding:4px 7px;white-space:nowrap}
    .cm-static-price{color:#11163e;font-size:18px;font-weight:950;margin-top:12px}
    .cm-static-price span{color:#64748b;font-size:12px;font-weight:750}
    .cm-static-more{align-items:center;background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;color:#11163e;display:flex;font-size:14px;font-weight:950;justify-content:space-between;margin-top:10px;padding:14px}
    .cm-static-stats,.cm-static-summary,.cm-static-guide,.cm-static-faq,.cm-static-final{background:white;border-bottom:1px solid #e5e7eb}
    .cm-static-answer{background:#f8fafc;border-bottom:1px solid #e5e7eb}
    .cm-static-wrap{margin:0 auto;max-width:1180px;padding:34px 20px}
    .cm-static-stats-grid{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr))}
    .cm-static-stat{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:18px;text-align:center}
    .cm-static-stat strong{color:#11163e;display:block;font-size:28px}
    .cm-static-stat span{color:#64748b;font-size:12px;font-weight:850}
    .cm-static-summary-grid,.cm-static-guide-grid{display:grid;gap:22px;grid-template-columns:1fr 1.2fr}
    .cm-static-summary h2,.cm-static-guide h2,.cm-static-faq h2,.cm-static-final h2{font-size:30px;letter-spacing:0;line-height:1.15;margin:0 0 12px}
    .cm-static-summary p,.cm-static-guide p,.cm-static-faq p,.cm-static-final p{color:#475569;font-size:15px;font-weight:700;line-height:1.7;margin:0}
    .cm-static-guide p+p{margin-top:12px}
    .cm-static-guide-list{display:grid;gap:12px;margin:0;padding:0}
    .cm-static-guide-list li{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;color:#475569;font-size:14px;font-weight:750;line-height:1.65;list-style:none;padding:14px}
    .cm-static-guide-list b{color:#0f172a;display:block;font-size:15px;margin-bottom:4px}
    .cm-static-answer-eyebrow{color:#0f766e;font-size:12px;font-weight:950;letter-spacing:.12em;margin:0 0 10px;text-transform:uppercase}
    .cm-static-answer-head{display:grid;gap:24px;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);margin-bottom:18px}
    .cm-static-answer-head h2{font-size:30px;letter-spacing:0;line-height:1.15;margin:0}
    .cm-static-answer-head p{color:#475569;font-size:15px;font-weight:750;line-height:1.72;margin:0}
    .cm-static-answer-grid{display:grid;gap:14px;grid-template-columns:repeat(2,minmax(0,1fr))}
    .cm-static-answer-card{background:white;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 12px 30px rgba(15,23,42,.04);padding:18px}
    .cm-static-answer-card h3{font-size:18px;line-height:1.25;margin:0 0 10px}
    .cm-static-answer-card p{color:#475569;font-size:14px;font-weight:700;line-height:1.7;margin:0}
    .cm-static-answer-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .cm-static-answer-links a{background:white;border:1px solid #dbe4ef;border-radius:999px;color:#11163e;font-size:13px;font-weight:900;padding:9px 12px}
    .cm-static-facts{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
    .cm-static-fact{display:grid;grid-template-columns:140px 1fr}
    .cm-static-fact+ .cm-static-fact{border-top:1px solid #e5e7eb}
    .cm-static-fact b{background:#f8fafc;padding:13px}
    .cm-static-fact span{padding:13px}
    .cm-static-area-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
    .cm-static-area-list a{background:#f8fafc;border:1px solid #e5e7eb;border-radius:999px;color:#334155;font-size:13px;font-weight:850;padding:9px 12px}
    .cm-static-faq-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:18px}
    .cm-static-faq article{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-faq h3{font-size:16px;margin:0 0 8px}
    .cm-static-final{background:#eff6ff;text-align:center}
    .cm-static-fleet-page{background:#f8fafc;color:#0f172a;font-family:"Be Vietnam Pro",Inter,Arial,sans-serif;min-height:100vh}
    .cm-static-fleet-hero{background:white;border-bottom:1px solid #e5e7eb}
    .cm-static-fleet-hero .cm-static-wrap{padding-top:42px}
    .cm-static-fleet-kicker{color:#0f766e;font-size:12px;font-weight:950;letter-spacing:.14em;margin:0 0 10px;text-transform:uppercase}
    .cm-static-fleet-heading{font-size:clamp(34px,5vw,58px);letter-spacing:0;line-height:1.05;margin:0 0 12px}
    .cm-static-fleet-copy{color:#475569;font-size:16px;font-weight:700;line-height:1.7;margin:0;max-width:760px}
    .cm-static-fleet-filter{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;display:grid;gap:10px;grid-template-columns:1.2fr .8fr .8fr auto;margin-top:22px;padding:14px}
    .cm-static-fleet-filter select,.cm-static-fleet-filter button{border-radius:8px;font:800 13px inherit;height:44px}
    .cm-static-fleet-filter select{background:white;border:1px solid #dbe4ef;color:#0f172a;padding:0 10px}
    .cm-static-fleet-filter button{background:#11163e;border:0;color:white;padding:0 16px}
    .cm-static-fleet-grid{display:grid;gap:16px;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:26px}
    .cm-static-fleet-item{background:white;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 12px 30px rgba(15,23,42,.05);overflow:hidden}
    .cm-static-fleet-item img{aspect-ratio:16/10;display:block;height:auto;object-fit:cover;width:100%}
    .cm-static-fleet-item-body{padding:16px}
    .cm-static-fleet-item h2{font-size:19px;line-height:1.25;margin:0 0 6px}
    .cm-static-fleet-item p{color:#64748b;font-size:13px;font-weight:750;line-height:1.55;margin:0}
    .cm-static-fleet-item strong{color:#11163e;display:block;font-size:22px;margin-top:12px}
    .cm-static-fleet-section{background:white;border-top:1px solid #e5e7eb;margin-top:34px}
    .cm-static-fleet-notes{display:grid;gap:14px;grid-template-columns:repeat(3,minmax(0,1fr))}
    .cm-static-fleet-note{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-fleet-note h2{font-size:18px;margin:0 0 8px}
    .cm-static-fleet-note p{color:#475569;font-size:14px;font-weight:700;line-height:1.65;margin:0}
    .cm-static-leadbox-section{background:#f8fafc;border-bottom:1px solid #e5e7eb}
    .cm-static-leadbox{display:grid;gap:18px;grid-template-columns:.85fr 1.4fr auto;align-items:end}
    .cm-static-leadbox h2{font-size:24px;line-height:1.18;margin:0 0 8px}
    .cm-static-leadbox p{color:#64748b;font-size:14px;font-weight:700;line-height:1.65;margin:0}
    .cm-static-leadbox form{display:grid;gap:10px;grid-template-columns:1fr 1fr 1fr auto}
    .cm-static-leadbox input,.cm-static-leadbox select{background:white;border:1px solid #dbe4ef;border-radius:8px;color:#0f172a;font:800 13px inherit;height:44px;min-width:0;padding:0 10px}
    .cm-static-leadbox button,.cm-static-leadbox a{align-items:center;border-radius:8px;display:inline-flex;font-size:13px;font-weight:950;height:44px;justify-content:center;white-space:nowrap}
    .cm-static-leadbox button{background:#11163e;border:0;color:white;padding:0 16px}
    .cm-static-leadbox a{background:white;border:1px solid #dbe4ef;color:#11163e;padding:0 14px}
    .cm-static-monthly-page{background:#f8fafc;color:#0f172a;font-family:"Be Vietnam Pro",Inter,Arial,sans-serif;min-height:100vh}
    .cm-static-monthly-page *{box-sizing:border-box}
    .cm-static-monthly-page a{color:inherit;text-decoration:none}
    .cm-static-monthly-hero{background:linear-gradient(135deg,#f8fafc 0%,#fff 48%,#ecfeff 100%);border-bottom:1px solid #e5e7eb}
    .cm-static-monthly-grid{display:grid;gap:34px;grid-template-columns:minmax(0,1.04fr) 430px;margin:0 auto;max-width:1180px;padding:58px 20px 48px}
    .cm-static-monthly-title{font-size:clamp(36px,5.6vw,64px);letter-spacing:0;line-height:1.04;margin:0 0 16px}
    .cm-static-monthly-lead{color:#334155;font-size:18px;font-weight:750;line-height:1.72;margin:0;max-width:680px}
    .cm-static-monthly-panel{background:white;border:1px solid #dbeafe;border-radius:8px;box-shadow:0 22px 60px rgba(15,23,42,.1);padding:20px}
    .cm-static-monthly-panel h2{font-size:24px;line-height:1.2;margin:0 0 8px}
    .cm-static-monthly-panel p{color:#64748b;font-size:14px;font-weight:700;line-height:1.6;margin:0}
    .cm-static-monthly-quote{display:grid;gap:10px;margin-top:16px}
    .cm-static-monthly-quote input,.cm-static-monthly-quote select{background:#f8fafc;border:1px solid #dbe4ef;border-radius:8px;color:#0f172a;font:750 13px inherit;height:44px;padding:0 10px;width:100%}
    .cm-static-monthly-quote button{background:#11163e;border:0;border-radius:8px;color:white;font:900 13px inherit;height:44px}
    .cm-static-monthly-stats{display:grid;gap:12px;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:24px}
    .cm-static-monthly-stat{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px}
    .cm-static-monthly-stat strong{color:#11163e;display:block;font-size:22px}
    .cm-static-monthly-stat span{color:#64748b;font-size:12px;font-weight:850}
    .cm-static-monthly-section{background:white;border-bottom:1px solid #e5e7eb}
    .cm-static-monthly-section.alt{background:#f8fafc}
    .cm-static-monthly-head{display:flex;gap:18px;justify-content:space-between;margin-bottom:20px}
    .cm-static-monthly-head h2{font-size:30px;line-height:1.15;margin:0}
    .cm-static-monthly-head p{color:#64748b;font-size:15px;font-weight:700;line-height:1.7;margin:0;max-width:620px}
    .cm-static-price-grid{display:grid;gap:14px;grid-template-columns:repeat(3,minmax(0,1fr))}
    .cm-static-price-card{background:white;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 12px 30px rgba(15,23,42,.04);padding:18px}
    .cm-static-price-card h3{font-size:19px;margin:0 0 8px}
    .cm-static-price-card strong{color:#11163e;display:block;font-size:26px;margin:12px 0 2px}
    .cm-static-price-card p{color:#64748b;font-size:14px;font-weight:700;line-height:1.62;margin:0}
    .cm-static-monthly-steps{display:grid;gap:14px;grid-template-columns:repeat(4,minmax(0,1fr))}
    .cm-static-monthly-step{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-monthly-step b{align-items:center;background:#ccfbf1;border-radius:999px;color:#0f766e;display:inline-flex;font-size:13px;height:34px;justify-content:center;margin-bottom:12px;width:34px}
    .cm-static-monthly-step h3{font-size:16px;margin:0 0 8px}
    .cm-static-monthly-step p{color:#475569;font-size:14px;font-weight:700;line-height:1.65;margin:0}
    .cm-static-monthly-facts{display:grid;gap:14px;grid-template-columns:1fr 1fr}
    .cm-static-monthly-fact{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-monthly-fact h3{font-size:18px;margin:0 0 8px}
    .cm-static-monthly-fact p{color:#475569;font-size:14px;font-weight:700;line-height:1.68;margin:0}
    .cm-static-monthly-areas{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}
    .cm-static-monthly-areas span{background:white;border:1px solid #dbe4ef;border-radius:999px;color:#334155;font-size:13px;font-weight:850;padding:9px 12px}
    .cm-static-contact-page{background:#f8fafc;color:#0f172a;font-family:"Be Vietnam Pro",Inter,Arial,sans-serif;min-height:100vh}
    .cm-static-contact-page *{box-sizing:border-box}
    .cm-static-contact-page a{color:inherit;text-decoration:none}
    .cm-static-contact-hero{background:white;border-bottom:1px solid #e5e7eb}
    .cm-static-contact-grid{display:grid;gap:34px;grid-template-columns:minmax(0,1.04fr) 410px;margin:0 auto;max-width:1180px;padding:58px 20px 48px}
    .cm-static-contact-title{font-size:clamp(36px,5.5vw,62px);letter-spacing:0;line-height:1.04;margin:0 0 16px}
    .cm-static-contact-lead{color:#334155;font-size:18px;font-weight:750;line-height:1.72;margin:0;max-width:700px}
    .cm-static-contact-panel{background:#ecfeff;border:1px solid #ccfbf1;border-radius:8px;padding:20px}
    .cm-static-contact-panel h2{font-size:22px;line-height:1.2;margin:0 0 10px}
    .cm-static-contact-panel ul{display:grid;gap:10px;margin:0;padding:0}
    .cm-static-contact-panel li{background:white;border:1px solid #dbe4ef;border-radius:8px;color:#475569;font-size:14px;font-weight:750;line-height:1.55;list-style:none;padding:12px}
    .cm-static-contact-methods{display:grid;gap:14px;grid-template-columns:repeat(3,minmax(0,1fr))}
    .cm-static-contact-card{background:white;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 12px 30px rgba(15,23,42,.04);display:block;padding:18px}
    .cm-static-contact-card.primary{background:#11163e;border-color:#11163e;color:white}
    .cm-static-contact-card h2{font-size:18px;margin:0 0 8px}
    .cm-static-contact-card strong{display:block;font-size:22px;margin-bottom:8px}
    .cm-static-contact-card p{color:#64748b;font-size:14px;font-weight:700;line-height:1.62;margin:0}
    .cm-static-contact-card.primary p{color:rgba(255,255,255,.75)}
    .cm-static-contact-card span{display:inline-flex;font-size:13px;font-weight:950;margin-top:14px}
    .cm-static-contact-section{background:white;border-bottom:1px solid #e5e7eb}
    .cm-static-contact-section.alt{background:#f8fafc}
    .cm-static-contact-head{display:flex;gap:18px;justify-content:space-between;margin-bottom:20px}
    .cm-static-contact-head h2{font-size:30px;line-height:1.15;margin:0}
    .cm-static-contact-head p{color:#64748b;font-size:15px;font-weight:700;line-height:1.7;margin:0;max-width:620px}
    .cm-static-contact-areas{display:grid;gap:12px;grid-template-columns:repeat(3,minmax(0,1fr))}
    .cm-static-contact-area{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;color:#334155;font-size:14px;font-weight:850;line-height:1.55;padding:15px}
    .cm-static-contact-info{display:grid;gap:14px;grid-template-columns:repeat(2,minmax(0,1fr))}
    .cm-static-contact-info article{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-contact-info h3{font-size:18px;margin:0 0 8px}
    .cm-static-contact-info p{color:#475569;font-size:14px;font-weight:700;line-height:1.68;margin:0}
    .cm-static-contact-steps{display:grid;gap:14px;grid-template-columns:repeat(4,minmax(0,1fr))}
    .cm-static-contact-step{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-contact-step b{align-items:center;background:#ccfbf1;border-radius:999px;color:#0f766e;display:inline-flex;font-size:13px;height:34px;justify-content:center;margin-bottom:12px;width:34px}
    .cm-static-contact-step h3{font-size:16px;margin:0 0 8px}
    .cm-static-contact-step p{color:#475569;font-size:14px;font-weight:700;line-height:1.65;margin:0}
    .cm-static-trust-page{background:#f8fafc;color:#0f172a;font-family:"Be Vietnam Pro",Inter,Arial,sans-serif;min-height:100vh}
    .cm-static-trust-page *{box-sizing:border-box}
    .cm-static-trust-page a{color:inherit;text-decoration:none}
    .cm-static-trust-hero{background:linear-gradient(135deg,#f8fafc 0%,#fff 52%,#ecfeff 100%);border-bottom:1px solid #e5e7eb}
    .cm-static-trust-grid{display:grid;gap:34px;grid-template-columns:minmax(0,1.08fr) 380px;margin:0 auto;max-width:1180px;padding:58px 20px 48px}
    .cm-static-trust-title{font-size:clamp(36px,5.5vw,62px);letter-spacing:0;line-height:1.04;margin:0 0 16px}
    .cm-static-trust-lead{color:#334155;font-size:18px;font-weight:750;line-height:1.72;margin:0;max-width:720px}
    .cm-static-trust-panel{background:white;border:1px solid #dbeafe;border-radius:8px;box-shadow:0 22px 60px rgba(15,23,42,.08);padding:20px}
    .cm-static-trust-panel h2{font-size:22px;line-height:1.2;margin:0 0 12px}
    .cm-static-trust-panel ul{display:grid;gap:10px;margin:0;padding:0}
    .cm-static-trust-panel li{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;color:#475569;font-size:14px;font-weight:750;line-height:1.55;list-style:none;padding:12px}
    .cm-static-trust-section{background:white;border-bottom:1px solid #e5e7eb}
    .cm-static-trust-section.alt{background:#f8fafc}
    .cm-static-trust-stats{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr))}
    .cm-static-trust-stat{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-trust-stat strong{color:#11163e;display:block;font-size:24px;line-height:1.15}
    .cm-static-trust-stat span{color:#64748b;font-size:12px;font-weight:850}
    .cm-static-trust-head{display:flex;gap:20px;justify-content:space-between;margin-bottom:20px}
    .cm-static-trust-head h2{font-size:30px;line-height:1.15;margin:0}
    .cm-static-trust-head p{color:#64748b;font-size:15px;font-weight:700;line-height:1.7;margin:0;max-width:640px}
    .cm-static-trust-cards{display:grid;gap:14px;grid-template-columns:repeat(3,minmax(0,1fr))}
    .cm-static-trust-card{background:white;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 12px 30px rgba(15,23,42,.04);padding:18px}
    .cm-static-trust-card h3{font-size:18px;margin:0 0 8px}
    .cm-static-trust-card p{color:#475569;font-size:14px;font-weight:700;line-height:1.68;margin:0}
    .cm-static-trust-steps{display:grid;gap:14px;grid-template-columns:repeat(4,minmax(0,1fr))}
    .cm-static-trust-step{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-trust-step b{align-items:center;background:#ccfbf1;border-radius:999px;color:#0f766e;display:inline-flex;font-size:13px;height:34px;justify-content:center;margin-bottom:12px;width:34px}
    .cm-static-trust-step h3{font-size:16px;margin:0 0 8px}
    .cm-static-trust-step p{color:#475569;font-size:14px;font-weight:700;line-height:1.65;margin:0}
    .cm-static-trust-faqs{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
    .cm-static-trust-faqs article{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:18px}
    .cm-static-trust-faqs h3{font-size:16px;margin:0 0 8px}
    .cm-static-trust-faqs p{color:#475569;font-size:14px;font-weight:700;line-height:1.65;margin:0}
    @media(max-width:960px){.cm-static-menu{display:none}.cm-static-mobile-menu{display:block}.cm-static-inner,.cm-static-summary-grid,.cm-static-guide-grid,.cm-static-answer-head,.cm-static-leadbox,.cm-static-monthly-grid,.cm-static-contact-grid,.cm-static-trust-grid{grid-template-columns:1fr}.cm-static-search-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-static-search button{grid-column:1/-1}.cm-static-stats-grid,.cm-static-monthly-stats,.cm-static-trust-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-static-fleet-grid,.cm-static-fleet-notes,.cm-static-answer-grid,.cm-static-price-grid,.cm-static-monthly-steps,.cm-static-monthly-facts,.cm-static-contact-methods,.cm-static-contact-areas,.cm-static-contact-steps,.cm-static-trust-cards,.cm-static-trust-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-static-fleet-filter,.cm-static-leadbox form{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-static-fleet-filter button,.cm-static-leadbox button{grid-column:1/-1}.cm-static-monthly-head,.cm-static-contact-head,.cm-static-trust-head{display:block}}
    @media(max-width:640px){.cm-static-home,.cm-static-fleet-page,.cm-static-monthly-page,.cm-static-contact-page,.cm-static-trust-page{padding-bottom:96px}.cm-static-mobile-conversion{background:rgba(255,255,255,.97);border-top:1px solid #dbe4ef;bottom:0;box-shadow:0 -14px 34px rgba(15,23,42,.12);display:block;left:0;padding:8px 12px max(8px,env(safe-area-inset-bottom));position:fixed;right:0;z-index:90}.cm-static-mobile-conversion-row{display:grid;gap:8px;grid-template-columns:1fr 1.25fr}.cm-static-mobile-conversion a{align-items:center;border:1px solid #dbe4ef;border-radius:8px;color:#11163e;display:flex;font-size:14px;font-weight:950;height:48px;justify-content:center}.cm-static-mobile-conversion a.primary{background:#11163e;border-color:#11163e;color:white}.cm-static-mobile-conversion p{color:#64748b;font-size:11px;font-weight:850;line-height:1.2;margin:5px 0 0;text-align:center}}
    @media(max-width:560px){.cm-static-inner{padding-top:38px}.cm-static-title{font-size:36px}.cm-static-actions{flex-direction:column}.cm-static-btn{width:100%}.cm-static-search-grid,.cm-static-faq-grid,.cm-static-answer-grid,.cm-static-leadbox form,.cm-static-fact,.cm-static-trust-faqs{grid-template-columns:1fr}.cm-static-leadbox a{width:100%}.cm-static-fleet-card{grid-template-columns:96px 1fr}.cm-static-stats-grid{grid-template-columns:1fr}.cm-static-fact b{padding-bottom:0}.cm-static-fact span{padding-top:6px}}
    @media(max-width:560px){.cm-static-fleet-grid,.cm-static-fleet-notes,.cm-static-fleet-filter,.cm-static-price-grid,.cm-static-monthly-steps,.cm-static-monthly-facts,.cm-static-monthly-stats,.cm-static-contact-methods,.cm-static-contact-areas,.cm-static-contact-info,.cm-static-contact-steps,.cm-static-trust-cards,.cm-static-trust-steps,.cm-static-trust-stats{grid-template-columns:1fr}.cm-static-fleet-filter button{grid-column:auto}.cm-static-monthly-grid,.cm-static-contact-grid,.cm-static-trust-grid{padding-top:38px}.cm-static-monthly-title,.cm-static-contact-title,.cm-static-trust-title{font-size:36px}}
`;
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function rootCriticalCss() {
  return '<link data-critical-home rel="stylesheet" href="/static-shell.css" />';
}

function formatStaticPrice(value) {
  const price = Number(value || 0);
  if (price >= 1000000) {
    const millions = price / 1000000;
    return Number.isInteger(millions) ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (price > 0) return `${Math.round(price / 1000)}k`;
  return 'Liên hệ';
}

function staticVehicleMeta(vehicle) {
  const model = vehicle.vehicle_models || {};
  const seats = model.seats ? `${model.seats} chỗ` : '5 chỗ';
  const fuel = model.fuel_type
    ? String(model.fuel_type).replace(/^electric$/i, 'Điện').replace(/^gasoline$/i, 'Xăng').replace(/^diesel$/i, 'Dầu')
    : 'Tự lái';
  return `${seats} · ${fuel}`;
}

function renderStaticFleet(vehicles = []) {
  const availableVehicles = vehicles.filter((vehicle) => Number(vehicle.daily_base_price || 0) > 0).slice(0, 3);
  if (availableVehicles.length === 0) {
    return `
            <div class="cm-static-fleet-card"><div class="cm-static-fleet-img"></div><div class="cm-static-fleet-body"><div class="cm-static-line" style="width:150px"></div><div class="cm-static-line sm"></div><div class="cm-static-line price"></div></div></div>
            <div class="cm-static-fleet-card"><div class="cm-static-fleet-img"></div><div class="cm-static-fleet-body"><div class="cm-static-line" style="width:140px"></div><div class="cm-static-line sm"></div><div class="cm-static-line price"></div></div></div>
            <a class="cm-static-more" href="/xe"><span>+0 xe khác</span><span>→</span></a>`;
  }

  const cards = availableVehicles.map((vehicle) => {
    const name = getVehicleName(vehicle);
    return `
            <a class="cm-static-fleet-card" href="/xe/${escapeHtml(vehicle.slug)}">
              <div class="cm-static-fleet-img"><img src="${escapeHtml(optimizedStaticImageUrl(getVehicleImage(vehicle), 320))}" alt="${escapeHtml(`Thuê ${name} tự lái tại Hà Nội`)}" loading="lazy" decoding="async" width="112" height="96"></div>
              <div class="cm-static-fleet-body"><div class="cm-static-fleet-row"><div><p class="cm-static-fleet-title">${escapeHtml(name)}</p><div class="cm-static-fleet-meta">${escapeHtml(staticVehicleMeta(vehicle))}</div></div><span class="cm-static-status">Sẵn sàng</span></div><div class="cm-static-price">${escapeHtml(formatStaticPrice(vehicle.daily_base_price))} <span>/ngày</span></div></div>
            </a>`;
  }).join('');

  return `${cards}
            <a class="cm-static-more" href="/xe"><span>+${Math.max(0, vehicles.length - availableVehicles.length)} xe khác</span><span>→</span></a>`;
}

function renderStaticFleetPageCards(vehicles = []) {
  const availableVehicles = vehicles.filter((vehicle) => Number(vehicle.daily_base_price || 0) > 0).slice(0, 9);
  if (availableVehicles.length === 0) {
    return `<article class="cm-static-fleet-item"><div class="cm-static-fleet-item-body"><h2>Danh sách xe đang cập nhật</h2><p>Car Match đang kiểm tra lịch xe trống. Nhắn Zalo 0975 563 290 để được báo mẫu xe phù hợp ngay.</p><strong>Liên hệ</strong></div></article>`;
  }

  return availableVehicles.map((vehicle) => {
    const name = getVehicleName(vehicle);
    const model = vehicle.vehicle_models || {};
    const seats = model.seats ? `${model.seats} chỗ` : '5 chỗ';
    const fuel = model.fuel_type
      ? String(model.fuel_type).replace(/^electric$/i, 'Điện').replace(/^gasoline$/i, 'Xăng').replace(/^diesel$/i, 'Dầu')
      : 'Tự lái';
    const transmission = model.transmission
      ? String(model.transmission).replace(/^automatic$/i, 'Tự động').replace(/^manual$/i, 'Số sàn')
      : 'Tự động';
    return `<article class="cm-static-fleet-item">
        <a href="/xe/${escapeHtml(vehicle.slug)}">
          <img src="${escapeHtml(optimizedStaticImageUrl(getVehicleImage(vehicle), 640))}" alt="${escapeHtml(`Thuê ${name} tự lái tại Hà Nội, ${seats}`)}" loading="lazy" decoding="async" width="640" height="400">
          <div class="cm-static-fleet-item-body">
            <h2>${escapeHtml(name)}</h2>
            <p>${escapeHtml(`${seats} · ${fuel} · ${transmission}`)}. Phù hợp đi nội thành, cuối tuần hoặc đi tỉnh gần Hà Nội.</p>
            <strong>${escapeHtml(formatStaticPrice(vehicle.daily_base_price))} <span style="font-size:13px;color:#64748b">/ngày</span></strong>
          </div>
        </a>
      </article>`;
  }).join('');
}

function fleetStaticShell(vehicles = []) {
  const totalVehicles = vehicles.length || 20;

  return `<div id="root" data-static-shell="fleet"><div class="cm-static-fleet-page">
      <header class="cm-static-nav">
        <div class="cm-static-nav-inner">
          <a class="cm-static-logo" href="/" aria-label="Car Match">
            <img src="/brand/carmatch-lockup-navy.png" alt="Car Match logo màu navy" width="288" height="66" fetchpriority="high">
          </a>
          <nav class="cm-static-menu" aria-label="Điều hướng chính">
            <a href="/xe">Thuê xe tự lái</a>
            <a href="/di-dau">Đi đâu</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/chinh-sach">Chính sách</a>
            <a href="/lien-he">Liên hệ</a>
            <a class="cm-static-cta" href="https://zalo.me/0975563290">Đặt xe qua Zalo</a>
          </nav>
          <a class="cm-static-mobile-menu" href="https://zalo.me/0975563290" aria-label="Nhắn Zalo Car Match">☏</a>
        </div>
      </header>
      <main id="main-content">
        <section class="cm-static-fleet-hero">
          <div class="cm-static-wrap">
            <p class="cm-static-fleet-kicker">Đội xe Car Match tại Hà Nội</p>
            <h1 class="cm-static-fleet-heading">Thuê xe tự lái Hà Nội: ${totalVehicles}+ mẫu xe, giao tận sảnh</h1>
            <p class="cm-static-fleet-copy">Danh sách xe tự lái Car Match gồm xe 5 chỗ, 7 chỗ, xe điện VinFast, sedan, SUV và MPV cho gia đình. Khách chọn xe theo số chỗ, nhiên liệu, khu vực nhận xe và lịch thuê; đội vận hành sẽ kiểm tra xe trống thực tế trước khi báo giá qua Zalo.</p>
            <form class="cm-static-fleet-filter" action="/xe" method="get" aria-label="Lọc xe tự lái">
              <select name="area" aria-label="Khu vực nhận xe">
                <option value="">Khu vực nhận</option>
                <option value="Vinhomes Ocean Park">Vinhomes Ocean Park</option>
                <option value="Vinhomes Smart City">Vinhomes Smart City</option>
                <option value="The Manor Central Park">The Manor Central Park</option>
                <option value="Ecopark">Ecopark</option>
              </select>
              <select name="seatFilter" aria-label="Số chỗ">
                <option value="">Số chỗ</option>
                <option value="5">5 chỗ</option>
                <option value="7">7 chỗ</option>
                <option value="8+">8+ chỗ</option>
              </select>
              <select name="fuelFilter" aria-label="Nhiên liệu">
                <option value="">Nhiên liệu</option>
                <option value="Điện">Xe điện</option>
                <option value="Xăng">Xe xăng</option>
                <option value="Dầu">Xe dầu</option>
              </select>
              <button type="submit">Tìm xe</button>
            </form>
            <div class="cm-static-fleet-grid" aria-label="Một số xe tự lái đang có">
              ${renderStaticFleetPageCards(vehicles)}
            </div>
          </div>
        </section>
        <section class="cm-static-leadbox-section">
          <div class="cm-static-wrap cm-static-leadbox">
            <div>
              <h2>Gửi nhu cầu để Car Match lọc xe nhanh</h2>
              <p>Khách gửi khu vực nhận xe, ngày thuê và số người. Car Match kiểm tra lịch xe thật, giá thuê, cọc và điểm giao nhận trước khi chốt.</p>
            </div>
            <form action="/lien-he" method="get" aria-label="Gửi nhu cầu thuê xe tự lái">
              <input name="area" type="text" placeholder="Khu vực nhận xe" aria-label="Khu vực nhận xe">
              <input name="from" type="date" aria-label="Ngày nhận xe dự kiến">
              <select name="need" aria-label="Nhu cầu thuê xe">
                <option value="">Nhu cầu</option>
                <option value="Xe 5 chỗ">Xe 5 chỗ</option>
                <option value="Xe 7 chỗ">Xe 7 chỗ</option>
                <option value="Xe điện">Xe điện</option>
                <option value="Thuê theo tháng">Thuê theo tháng</option>
              </select>
              <button type="submit">Mở trang liên hệ</button>
            </form>
            <a href="${escapeHtml(staticZaloHref('Xin chào Car Match, tôi đang xem danh sách xe tự lái tại Hà Nội. Nhờ Car Match tư vấn giúp mẫu xe phù hợp, lịch trống, giá thuê, cọc và điểm giao nhận ạ.'))}">Nhắn Zalo ngay</a>
          </div>
        </section>
        <section class="cm-static-fleet-section">
          <div class="cm-static-wrap cm-static-fleet-notes">
            <article class="cm-static-fleet-note"><h2>Chọn xe theo nhu cầu</h2><p>Xe 5 chỗ phù hợp đi nội thành, sân bay, cặp đôi hoặc gia đình nhỏ. Xe 7 chỗ và MPV phù hợp nhóm đông người, đi tỉnh, nhiều hành lý hoặc cần khoang ngồi rộng.</p></article>
            <article class="cm-static-fleet-note"><h2>Giấy tờ và đặt cọc</h2><p>Khách thuê cần CCCD bản gốc, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo mẫu xe. Tất cả điều kiện được xác nhận trước khi nhận xe.</p></article>
            <article class="cm-static-fleet-note"><h2>Giao nhận tại Hà Nội</h2><p>Car Match hỗ trợ giao xe tận sảnh chung cư, văn phòng hoặc điểm hẹn phù hợp tại Vinhomes, The Manor, Ecopark, Linh Đàm và nhiều khu vực nội thành.</p></article>
            <article class="cm-static-fleet-note"><h2>Xe điện VinFast</h2><p>Nhóm VF3, VF5, VF6 và VF8 phù hợp khách muốn xe mới, chi phí vận hành dễ kiểm soát và trải nghiệm êm trong nội thành. Khi đi tỉnh, Car Match sẽ tư vấn tuyến sạc, phạm vi di chuyển và lịch trình phù hợp.</p></article>
            <article class="cm-static-fleet-note"><h2>Xe 7 chỗ đi tỉnh</h2><p>Gia đình có trẻ em, người lớn tuổi hoặc nhiều hành lý nên ưu tiên Innova, Carnival, SUV hoặc MPV 7 chỗ. Trước chuyến đi dài, hai bên kiểm tra lốp, phụ kiện, mức nhiên liệu và điều kiện bảo hiểm.</p></article>
            <article class="cm-static-fleet-note"><h2>Báo giá chính xác</h2><p>Giá trên website là giá tham khảo theo ngày. Mức cuối cùng phụ thuộc ngày thuê, thời lượng, phụ phí giao nhận, nhu cầu đi tỉnh, giới hạn km và xe còn trống tại thời điểm khách xác nhận.</p></article>
          </div>
        </section>
        ${staticAnswerSection({
          title: 'Cách chọn xe tự lái theo nhu cầu',
          lead: 'Trang danh sách xe nên giúp khách tự loại bớt phương án trước khi nhắn Zalo. Các câu trả lời dưới đây gom logic chọn xe, ngân sách và điều kiện xác nhận vào một nơi dễ đọc.',
          answers: [
            {
              question: 'Nên chọn xe 5 chỗ, 7 chỗ hay xe điện?',
              answer: 'Nếu đi nội thành, sân bay hoặc cuối tuần 2-4 người, xe 5 chỗ và xe điện như VinFast VF5, VF6 thường dễ gửi, dễ xoay trở và kiểm soát chi phí tốt. Nếu đi tỉnh, có trẻ em, người lớn tuổi hoặc nhiều hành lý, nhóm 7 chỗ, SUV hoặc MPV như Innova, Fortuner, Carnival sẽ hợp lý hơn vì khoang ngồi rộng và hành lý thoải mái. Với xe điện, khách nên nói rõ tuyến đi, số km dự kiến và khả năng dừng sạc để Car Match tư vấn mẫu xe, phạm vi di chuyển và lịch trình phù hợp.',
            },
            {
              question: 'Giá xe trong danh sách có phải giá cuối cùng không?',
              answer: 'Giá trên trang danh sách xe là giá tham khảo để khách so sánh nhanh giữa các nhóm xe. Mức cuối cùng cần được xác nhận theo ngày thuê, thời lượng thuê, khu vực giao nhận, phụ phí đi tỉnh, giới hạn km, điều kiện cọc và xe còn trống tại thời điểm chốt lịch. Vì vậy, bước đúng nhất là chọn 1-2 mẫu xe phù hợp, gửi ngày nhận/trả và khu vực nhận xe qua Zalo 0975 563 290; Car Match sẽ kiểm tra lịch xe thật rồi báo lại phương án có thể đặt.',
            },
          ],
          links: [
            { href: '/', label: 'Thuê xe tự lái Hà Nội' },
            { href: '/di-dau', label: 'Gợi ý xe theo điểm đến' },
            { href: '/faq', label: 'FAQ giấy tờ và đặt cọc' },
            { href: '/lien-he', label: 'Nhắn thông tin để lọc xe' },
          ],
        })}
      </main>
      ${staticMobileConversionBar('fleet', 'Nhắn Zalo')}
    </div></div>`;
}

function monthlyStaticShell(vehicles = []) {
  const totalVehicles = vehicles.length || 20;
  const priceGroups = [
    {
      group: 'Xe nhỏ / xe điện đô thị',
      price: 'Từ 10-12tr/tháng',
      examples: 'VinFast VF3, Fadil hoặc xe đô thị tương đương',
      fit: 'Đi làm hằng ngày, đi nội thành, gửi xe dễ, chi phí dễ kiểm soát.',
    },
    {
      group: 'Sedan / Crossover 5 chỗ',
      price: 'Khoảng 14-18tr/tháng',
      examples: 'Mazda 3, Toyota Raize, Kia Sonet, VinFast VF5/VF6',
      fit: 'Gia đình nhỏ, công tác linh hoạt, đi tỉnh gần Hà Nội cuối tuần.',
    },
    {
      group: 'Xe 7 chỗ / MPV',
      price: 'Từ 20tr/tháng',
      examples: 'Toyota Innova, Kia Carnival hoặc nhóm 7 chỗ tương đương',
      fit: 'Gia đình đông người, doanh nghiệp, đi tỉnh nhiều hành lý.',
    },
  ];
  const steps = [
    ['Gửi nhu cầu', 'Cho biết khu vực nhận xe, số xe cần dùng, thời gian thuê, số km dự kiến và loại xe mong muốn.'],
    ['Kiểm tra lịch xe', 'Car Match đối chiếu xe còn trống, tình trạng xe, bảo hiểm, giới hạn km và điều kiện giao nhận.'],
    ['Báo giá và cọc', 'Khách nhận báo giá theo mẫu xe, thời hạn thuê, điều kiện cọc, phí giao nhận và chính sách phát sinh.'],
    ['Bàn giao xe', 'Hai bên kiểm tra ngoại thất, nội thất, km, nhiên liệu/pin, phụ kiện và ký nhận trước khi sử dụng.'],
  ];

  return `<div id="root" data-static-shell="monthly"><div class="cm-static-monthly-page">
      <header class="cm-static-nav">
        <div class="cm-static-nav-inner">
          <a class="cm-static-logo" href="/" aria-label="Car Match">
            <img src="/brand/carmatch-lockup-navy.png" alt="Car Match logo màu navy" width="288" height="66" fetchpriority="high">
          </a>
          <nav class="cm-static-menu" aria-label="Điều hướng chính">
            <a href="/xe">Thuê xe tự lái</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/chinh-sach">Chính sách</a>
            <a href="/faq">FAQ</a>
            <a href="/lien-he">Liên hệ</a>
            <a class="cm-static-cta" href="https://zalo.me/0975563290">Nhận báo giá Zalo</a>
          </nav>
          <a class="cm-static-mobile-menu" href="https://zalo.me/0975563290" aria-label="Nhắn Zalo Car Match">☏</a>
        </div>
      </header>
      <main id="main-content">
        <section class="cm-static-monthly-hero">
          <div class="cm-static-monthly-grid">
            <div>
              <p class="cm-static-pill">Thuê xe tự lái theo tháng tại Hà Nội</p>
              <h1 class="cm-static-monthly-title">Thuê xe tháng Hà Nội<br><span style="color:#11163e">từ 10tr/tháng</span></h1>
              <p class="cm-static-monthly-lead">Car Match cho thuê xe tự lái theo tháng cho cư dân chung cư, gia đình trẻ và doanh nghiệp nhỏ tại Hà Nội. Khách có thể thuê 1-12 tháng, nhận xe tận tòa nhà, có hợp đồng rõ ràng và được tư vấn xe phù hợp theo số người, khu vực nhận xe, ngân sách và số km dự kiến.</p>
              <div class="cm-static-actions">
                <a class="cm-static-btn primary" href="https://zalo.me/0975563290">Nhắn Zalo nhận báo giá</a>
                <a class="cm-static-btn secondary" href="/xe">Xem ${totalVehicles}+ xe đang có</a>
                <a class="cm-static-btn secondary" href="/lien-he">Liên hệ Car Match</a>
              </div>
              <div class="cm-static-monthly-stats">
                <div class="cm-static-monthly-stat"><strong>10-25tr</strong><span>Giá tham khảo mỗi tháng</span></div>
                <div class="cm-static-monthly-stat"><strong>1-12 tháng</strong><span>Linh hoạt thời hạn thuê</span></div>
                <div class="cm-static-monthly-stat"><strong>30 phút</strong><span>Phản hồi báo giá khi có xe</span></div>
              </div>
            </div>
            <aside class="cm-static-monthly-panel">
              <h2>Nhận báo giá xe tháng nhanh</h2>
              <p>Form tĩnh này giúp khách gửi nhu cầu ngay cả khi JavaScript chưa tải. Car Match vẫn xác nhận lịch xe thật qua Zalo trước khi chốt.</p>
              <form class="cm-static-monthly-quote" action="/lien-he" method="get" aria-label="Yêu cầu báo giá thuê xe tháng">
                <input name="area" type="text" placeholder="Khu vực nhận xe: Times City, Ocean Park..." aria-label="Khu vực nhận xe">
                <select name="carModel" aria-label="Loại xe mong muốn">
                  <option value="">Loại xe mong muốn</option>
                  <option value="Xe nhỏ / xe điện đô thị">Xe nhỏ / xe điện đô thị</option>
                  <option value="Sedan / Crossover 5 chỗ">Sedan / Crossover 5 chỗ</option>
                  <option value="Xe 7 chỗ / MPV">Xe 7 chỗ / MPV</option>
                  <option value="Cần tư vấn">Chưa chắc, cần tư vấn</option>
                </select>
                <select name="duration" aria-label="Thời gian thuê">
                  <option value="">Thời gian thuê</option>
                  <option value="1 tháng">1 tháng</option>
                  <option value="2-3 tháng">2-3 tháng</option>
                  <option value="3-6 tháng">3-6 tháng</option>
                  <option value="6+ tháng">6+ tháng</option>
                </select>
                <button type="submit">Gửi nhu cầu</button>
              </form>
            </aside>
          </div>
        </section>
        <section class="cm-static-monthly-section">
          <div class="cm-static-wrap">
            <div class="cm-static-monthly-head">
              <h2>Bảng giá thuê xe tự lái theo tháng</h2>
              <p>Mức dưới đây là giá tham khảo để khách dự tính ngân sách. Giá chính xác phụ thuộc mẫu xe, lịch trống, thời gian thuê, khu vực giao nhận, giới hạn km và điều kiện cọc theo từng xe.</p>
            </div>
            <div class="cm-static-price-grid">
              ${priceGroups.map((item) => `<article class="cm-static-price-card"><h3>${escapeHtml(item.group)}</h3><p>${escapeHtml(item.examples)}</p><strong>${escapeHtml(item.price)}</strong><p>${escapeHtml(item.fit)}</p></article>`).join('')}
            </div>
          </div>
        </section>
        <section class="cm-static-monthly-section alt">
          <div class="cm-static-wrap">
            <div class="cm-static-monthly-head">
              <h2>Quy trình thuê xe tháng Car Match</h2>
              <p>Khách không cần tự đi hỏi từng chủ xe. Car Match lọc xe còn lịch trống, báo giá theo nhu cầu thật và thống nhất giấy tờ trước khi bàn giao.</p>
            </div>
            <div class="cm-static-monthly-steps">
              ${steps.map((step, index) => `<article class="cm-static-monthly-step"><b>${index + 1}</b><h3>${escapeHtml(step[0])}</h3><p>${escapeHtml(step[1])}</p></article>`).join('')}
            </div>
          </div>
        </section>
        <section class="cm-static-monthly-section">
          <div class="cm-static-wrap cm-static-monthly-facts">
            <article class="cm-static-monthly-fact"><h3>Ai nên thuê xe theo tháng?</h3><p>Cư dân chung cư cần xe đi làm, gia đình cần xe cuối tuần, chủ doanh nghiệp cần xe tiếp khách, nhân sự sales/field work hoặc khách đang cân nhắc mua xe nhưng muốn dùng thử trước. Thuê tháng giúp tránh chi phí sở hữu xe dài hạn, bảo dưỡng, khấu hao và rủi ro xe nằm bãi.</p></article>
            <article class="cm-static-monthly-fact"><h3>Cần chuẩn bị giấy tờ gì?</h3><p>Khách thuê cá nhân thường cần CCCD bản gốc, giấy phép lái xe hạng B còn hiệu lực, thông tin nơi nhận xe và khoản đặt cọc theo nhóm xe. Khách doanh nghiệp có thể cần thêm thông tin công ty, hợp đồng, nhu cầu xuất hóa đơn và người phụ trách nhận bàn giao.</p></article>
            <article class="cm-static-monthly-fact"><h3>Khu vực giao xe phổ biến</h3><p>Car Match ưu tiên các khu đô thị, chung cư và văn phòng tại Hà Nội để việc giao nhận ổn định. Các khu vực thường được khách hỏi gồm Vinhomes Ocean Park, Times City, Smart City, The Manor Central Park, Linh Đàm, Royal City và Ecopark.</p><div class="cm-static-monthly-areas"><span>Vinhomes Ocean Park</span><span>Times City</span><span>Smart City</span><span>The Manor</span><span>Linh Đàm</span><span>Ecopark</span></div></article>
            <article class="cm-static-monthly-fact"><h3>Điều kiện giá cần xác nhận</h3><p>Trước khi chốt, hai bên cần thống nhất số km/tháng, phụ phí vượt km, phí giao nhận, lịch bảo dưỡng, phạm vi đi tỉnh, bảo hiểm, trách nhiệm khi phát sinh phạt nguội và quy định trả xe sớm hoặc gia hạn hợp đồng.</p></article>
          </div>
        </section>
        ${staticAnswerSection({
          title: 'Khi nào nên thuê xe theo tháng thay vì thuê theo ngày?',
          lead: 'Khách tìm gói tháng thường cần so sánh với thuê lẻ nhiều ngày hoặc mua xe riêng. Phần này giải thích rõ khi nào gói tháng đáng cân nhắc và những điều kiện cần chốt trước hợp đồng.',
          answers: [
            {
              question: 'Thuê xe tháng phù hợp với nhu cầu nào?',
              answer: 'Thuê xe tự lái theo tháng phù hợp khi khách dùng xe lặp lại nhiều ngày trong tháng: đi làm, đưa đón gia đình, chạy công việc bán hàng, tiếp khách, công tác quanh Hà Nội hoặc cần xe trong giai đoạn chờ mua xe. So với thuê theo ngày rời rạc, gói tháng giúp khách chủ động lịch dùng xe hơn và dễ dự trù ngân sách, nhưng vẫn cần thống nhất số km, phạm vi đi tỉnh, lịch bảo dưỡng, điều kiện giao nhận và trách nhiệm khi phát sinh. Giá tham khảo của Car Match bắt đầu từ 10.000.000đ/tháng, tùy mẫu xe và thời hạn thuê.',
            },
            {
              question: 'Khách doanh nghiệp cần gửi thông tin gì để nhận báo giá?',
              answer: 'Doanh nghiệp nên gửi số lượng xe cần dùng, loại xe mong muốn, thời hạn thuê, khu vực nhận xe, số km dự kiến mỗi tháng, nhu cầu xuất hóa đơn và người phụ trách bàn giao. Nếu xe dùng cho đội sales, tiếp khách hoặc vận hành nội bộ, cần nói rõ lịch chạy tỉnh, yêu cầu thương hiệu xe và giới hạn ngân sách để Car Match lọc phương án sát thực tế hơn. Báo giá cuối cùng chỉ nên chốt sau khi kiểm tra xe còn lịch trống, tình trạng xe, điều kiện cọc, phụ phí giao nhận và điều khoản hợp đồng.',
            },
          ],
          links: [
            { href: '/xe', label: 'Xem xe có thể thuê dài ngày' },
            { href: '/lien-he', label: 'Gửi yêu cầu báo giá xe tháng' },
            { href: '/chinh-sach', label: 'Xem điều kiện thuê và phát sinh' },
            { href: '/blog/kinh-nghiem-thue-xe-tu-lai-ha-noi', label: 'Kinh nghiệm thuê xe tự lái' },
          ],
        })}
        <section class="cm-static-final">
          <div class="cm-static-wrap">
            <h2>Muốn biết xe tháng nào còn trống?</h2>
            <p>Nhắn Zalo 0975 563 290 với khu vực nhận xe, thời gian thuê và loại xe mong muốn. Car Match kiểm tra đội xe thật rồi báo lại mẫu xe, cọc, giới hạn km và lịch bàn giao.</p>
            <div class="cm-static-actions" style="justify-content:center"><a class="cm-static-btn primary" href="https://zalo.me/0975563290">Nhận báo giá qua Zalo</a><a class="cm-static-btn secondary" href="/xe">Xem danh sách xe</a></div>
          </div>
        </section>
      </main>
      ${staticMobileConversionBar('monthly', 'Nhận báo giá')}
    </div></div>`;
}

function contactStaticShell() {
  const methods = [
    {
      title: 'Zalo đặt xe',
      detail: '0975 563 290',
      description: 'Cách nhanh nhất để gửi ngày thuê, khu vực nhận xe, số người, hành lý và mẫu xe mong muốn.',
      href: 'https://zalo.me/0975563290',
      label: 'Nhắn Zalo kiểm tra xe',
      primary: true,
    },
    {
      title: 'Hotline',
      detail: '0975 563 290',
      description: 'Phù hợp khi cần xác nhận xe gấp, thay đổi lịch nhận/trả hoặc hỏi điều kiện thuê trước khi đặt cọc.',
      href: 'tel:0975563290',
      label: 'Gọi ngay',
      primary: false,
    },
    {
      title: 'Email',
      detail: 'info@carmatch.vn',
      description: 'Dành cho thuê xe theo tháng, khách doanh nghiệp, hợp đồng, xuất hóa đơn hoặc hợp tác chủ xe.',
      href: 'mailto:info@carmatch.vn',
      label: 'Gửi email',
      primary: false,
    },
  ];
  const areas = [
    'Vinhomes Ocean Park, Gia Lâm',
    'Vinhomes Smart City, Nam Từ Liêm',
    'Vinhomes Times City, Hai Bà Trưng',
    'Ecopark và khu vực lân cận Hà Nội',
    'The Manor Central Park, Hoàng Mai',
    'Điểm hẹn nội thành theo lịch xe',
  ];
  const steps = [
    ['Gửi nhu cầu', 'Cho biết ngày nhận/trả xe, khu vực nhận xe, số người, hành lý, điểm đến dự kiến và nhóm xe mong muốn.'],
    ['Kiểm tra lịch xe', 'Car Match đối chiếu xe còn trống, vị trí xe, chi phí giao nhận, điều kiện cọc và lịch bàn giao.'],
    ['Báo giá rõ điều kiện', 'Khách nhận thông tin mẫu xe, giá thuê, giấy tờ cần chuẩn bị, giới hạn km và chính sách phát sinh.'],
    ['Chốt lịch qua Zalo', 'Hai bên xác nhận điểm hẹn, thời gian giao nhận, đặt cọc giữ xe và kiểm tra xe khi bàn giao.'],
  ];

  return `<div id="root" data-static-shell="contact"><div class="cm-static-contact-page">
      <header class="cm-static-nav">
        <div class="cm-static-nav-inner">
          <a class="cm-static-logo" href="/" aria-label="Car Match">
            <img src="/brand/carmatch-lockup-navy.png" alt="Car Match logo màu navy" width="288" height="66" fetchpriority="high">
          </a>
          <nav class="cm-static-menu" aria-label="Điều hướng chính">
            <a href="/xe">Thuê xe tự lái</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/chinh-sach">Chính sách</a>
            <a href="/faq">FAQ</a>
            <a href="/lien-he">Liên hệ</a>
            <a class="cm-static-cta" href="https://zalo.me/0975563290">Nhắn Zalo</a>
          </nav>
          <a class="cm-static-mobile-menu" href="https://zalo.me/0975563290" aria-label="Nhắn Zalo Car Match">☏</a>
        </div>
      </header>
      <main id="main-content">
        <section class="cm-static-contact-hero">
          <div class="cm-static-contact-grid">
            <div>
              <p class="cm-static-pill">Liên hệ Car Match</p>
              <h1 class="cm-static-contact-title">Kiểm tra xe trống, giá thuê và điểm giao nhận tại Hà Nội</h1>
              <p class="cm-static-contact-lead">Cách nhanh nhất là nhắn Zalo cho Car Match với ngày thuê, khu vực nhận xe, số người và nhu cầu chuyến đi. Đội vận hành sẽ kiểm tra lịch xe thật trước khi báo giá, xác nhận giấy tờ, điều kiện cọc và lịch giao nhận.</p>
              <div class="cm-static-actions">
                <a class="cm-static-btn primary" href="https://zalo.me/0975563290">Nhắn Zalo kiểm tra xe</a>
                <a class="cm-static-btn secondary" href="tel:0975563290">Gọi 0975 563 290</a>
                <a class="cm-static-btn secondary" href="mailto:info@carmatch.vn">Gửi email</a>
              </div>
            </div>
            <aside class="cm-static-contact-panel">
              <h2>Thông tin nên gửi trước</h2>
              <ul>
                <li>Ngày nhận xe, ngày trả xe và khoảng giờ mong muốn.</li>
                <li>Khu vực nhận xe: chung cư, văn phòng hoặc điểm hẹn tại Hà Nội.</li>
                <li>Số người, hành lý, cung đường dự kiến và nhu cầu đi tỉnh nếu có.</li>
                <li>Nhóm xe mong muốn: xe điện, 5 chỗ, 7 chỗ hoặc thuê theo tháng.</li>
              </ul>
            </aside>
          </div>
        </section>
        <section class="cm-static-contact-section">
          <div class="cm-static-wrap cm-static-contact-methods">
            ${methods.map((method) => `<a class="cm-static-contact-card${method.primary ? ' primary' : ''}" href="${escapeHtml(method.href)}"><h2>${escapeHtml(method.title)}</h2><strong>${escapeHtml(method.detail)}</strong><p>${escapeHtml(method.description)}</p><span>${escapeHtml(method.label)}</span></a>`).join('')}
          </div>
        </section>
        <section class="cm-static-contact-section alt">
          <div class="cm-static-wrap">
            <div class="cm-static-contact-head">
              <h2>Khu vực Car Match thường phục vụ</h2>
              <p>Car Match tập trung vào các khu đô thị, chung cư và điểm hẹn thuận tiện tại Hà Nội. Lịch giao nhận cụ thể phụ thuộc mẫu xe, thời điểm thuê và đội vận hành trong ngày.</p>
            </div>
            <div class="cm-static-contact-areas">
              ${areas.map((area) => `<div class="cm-static-contact-area">${escapeHtml(area)}</div>`).join('')}
            </div>
          </div>
        </section>
        <section class="cm-static-contact-section">
          <div class="cm-static-wrap">
            <div class="cm-static-contact-head">
              <h2>Car Match xử lý yêu cầu thuê xe như thế nào?</h2>
              <p>Mục tiêu của trang liên hệ không chỉ là để lại số điện thoại. Khách gửi đủ bối cảnh thì Car Match có thể lọc xe phù hợp, báo giá sát hơn và giảm rủi ro đổi xe sát giờ.</p>
            </div>
            <div class="cm-static-contact-steps">
              ${steps.map((step, index) => `<article class="cm-static-contact-step"><b>${index + 1}</b><h3>${escapeHtml(step[0])}</h3><p>${escapeHtml(step[1])}</p></article>`).join('')}
            </div>
          </div>
        </section>
        <section class="cm-static-contact-section alt">
          <div class="cm-static-wrap cm-static-contact-info">
            <article><h3>Giờ hỗ trợ</h3><p>Tư vấn và xác nhận lịch thuê trong khung 7h-22h mỗi ngày. Với chuyến gấp hoặc thay đổi lịch nhận/trả, gọi hotline thường nhanh hơn email.</p></article>
            <article><h3>Giấy tờ cần chuẩn bị</h3><p>Khách thuê thường cần CCCD bản gốc, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo mẫu xe. Điều kiện cụ thể được xác nhận trước khi nhận xe.</p></article>
            <article><h3>Điểm giao nhận</h3><p>Car Match hỗ trợ giao nhận xe tận sảnh chung cư hoặc điểm hẹn phù hợp tại Hà Nội khi lịch xe và khu vực đáp ứng điều kiện vận hành.</p></article>
            <article><h3>Thuê xe theo tháng</h3><p>Khách cá nhân hoặc doanh nghiệp cần xe dài ngày nên gửi thêm thời hạn thuê, số km dự kiến, nhu cầu xuất hóa đơn và số lượng xe để nhận báo giá phù hợp.</p></article>
          </div>
        </section>
        <section class="cm-static-final">
          <div class="cm-static-wrap">
            <h2>Cần kiểm tra xe hôm nay?</h2>
            <p>Nhắn Zalo 0975 563 290 với ngày thuê và khu vực nhận xe. Car Match sẽ kiểm tra xe còn trống, báo giá và hướng dẫn giấy tờ trước khi chốt lịch.</p>
            <div class="cm-static-actions" style="justify-content:center"><a class="cm-static-btn primary" href="https://zalo.me/0975563290">Nhắn Zalo</a><a class="cm-static-btn secondary" href="/xe">Xem danh sách xe</a></div>
          </div>
        </section>
      </main>
      ${staticMobileConversionBar('contact', 'Kiểm tra xe')}
    </div></div>`;
}

function trustNav(ctaLabel = 'Nhắn Zalo') {
  return `<header class="cm-static-nav">
        <div class="cm-static-nav-inner">
          <a class="cm-static-logo" href="/" aria-label="Car Match">
            <img src="/brand/carmatch-lockup-navy.png" alt="Car Match logo màu navy" width="288" height="66" fetchpriority="high">
          </a>
          <nav class="cm-static-menu" aria-label="Điều hướng chính">
            <a href="/xe">Thuê xe tự lái</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/gioi-thieu">Giới thiệu</a>
            <a href="/chinh-sach">Chính sách</a>
            <a href="/faq">FAQ</a>
            <a href="/lien-he">Liên hệ</a>
            <a class="cm-static-cta" href="https://zalo.me/0975563290">${escapeHtml(ctaLabel)}</a>
          </nav>
          <a class="cm-static-mobile-menu" href="https://zalo.me/0975563290" aria-label="Nhắn Zalo Car Match">☏</a>
        </div>
      </header>`;
}

function trustStaticShell(config) {
  const stats = config.stats || [];
  const panelItems = config.panelItems || [];
  const cards = config.cards || [];
  const steps = config.steps || [];
  const faqs = config.faqs || [];

  return `<div id="root" data-static-shell="${escapeHtml(config.shellName)}"><div class="cm-static-trust-page">
      ${trustNav(config.navCtaLabel)}
      <main id="main-content">
        <section class="cm-static-trust-hero">
          <div class="cm-static-trust-grid">
            <div>
              <p class="cm-static-pill">${escapeHtml(config.eyebrow)}</p>
              <h1 class="cm-static-trust-title">${escapeHtml(config.title)}</h1>
              <p class="cm-static-trust-lead">${escapeHtml(config.lead)}</p>
              <div class="cm-static-actions">
                <a class="cm-static-btn primary" href="${escapeHtml(config.primaryHref || 'https://zalo.me/0975563290')}">${escapeHtml(config.primaryLabel || 'Nhắn Zalo')}</a>
                <a class="cm-static-btn secondary" href="${escapeHtml(config.secondaryHref || '/xe')}">${escapeHtml(config.secondaryLabel || 'Xem xe tự lái')}</a>
              </div>
            </div>
            <aside class="cm-static-trust-panel">
              <h2>${escapeHtml(config.panelTitle)}</h2>
              <ul>${panelItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </aside>
          </div>
        </section>
        ${stats.length ? `<section class="cm-static-trust-section">
          <div class="cm-static-wrap cm-static-trust-stats">
            ${stats.map((stat) => `<div class="cm-static-trust-stat"><strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span></div>`).join('')}
          </div>
        </section>` : ''}
        ${cards.length ? `<section class="cm-static-trust-section alt">
          <div class="cm-static-wrap">
            <div class="cm-static-trust-head"><h2>${escapeHtml(config.cardsTitle)}</h2><p>${escapeHtml(config.cardsLead)}</p></div>
            <div class="cm-static-trust-cards">
              ${cards.map((card) => `<article class="cm-static-trust-card"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></article>`).join('')}
            </div>
          </div>
        </section>` : ''}
        ${steps.length ? `<section class="cm-static-trust-section">
          <div class="cm-static-wrap">
            <div class="cm-static-trust-head"><h2>${escapeHtml(config.stepsTitle)}</h2><p>${escapeHtml(config.stepsLead)}</p></div>
            <div class="cm-static-trust-steps">
              ${steps.map((step, index) => `<article class="cm-static-trust-step"><b>${index + 1}</b><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></article>`).join('')}
            </div>
          </div>
        </section>` : ''}
        ${faqs.length ? `<section class="cm-static-trust-section alt">
          <div class="cm-static-wrap">
            <div class="cm-static-trust-head"><h2>${escapeHtml(config.faqTitle || 'Câu hỏi thường gặp')}</h2><p>${escapeHtml(config.faqLead || 'Các câu trả lời dưới đây giúp khách hiểu rõ điều kiện trước khi đặt xe.')}</p></div>
            <div class="cm-static-trust-faqs">
              ${faqs.map((faq) => `<article><h3>${escapeHtml(faq.q)}</h3><p>${escapeHtml(faq.a)}</p></article>`).join('')}
            </div>
          </div>
        </section>` : ''}
        <section class="cm-static-final">
          <div class="cm-static-wrap">
            <h2>${escapeHtml(config.finalTitle)}</h2>
            <p>${escapeHtml(config.finalText)}</p>
            <div class="cm-static-actions" style="justify-content:center">
              <a class="cm-static-btn primary" href="${escapeHtml(config.finalPrimaryHref || 'https://zalo.me/0975563290')}">${escapeHtml(config.finalPrimaryLabel || 'Nhắn Zalo')}</a>
              <a class="cm-static-btn secondary" href="${escapeHtml(config.finalSecondaryHref || '/xe')}">${escapeHtml(config.finalSecondaryLabel || 'Xem danh sách xe')}</a>
            </div>
          </div>
        </section>
      </main>
      ${staticMobileConversionBar(config.shellName || 'trust', config.mobileCtaLabel || config.finalPrimaryLabel || config.navCtaLabel || 'Nhắn Zalo')}
    </div></div>`;
}

function aboutStaticShell() {
  return trustStaticShell({
    shellName: 'about',
    eyebrow: 'Giới thiệu Car Match',
    title: 'Về Car Match',
    lead: 'Car Match là dịch vụ thuê xe tự lái tại Hà Nội, tập trung vào trải nghiệm thuê xe minh bạch: xem xe online, kiểm tra lịch xe thật, xác nhận điều kiện thuê và giao xe tận sảnh tòa nhà hoặc điểm hẹn phù hợp.',
    navCtaLabel: 'Kiểm tra xe',
    primaryLabel: 'Nhắn Zalo kiểm tra xe',
    secondaryLabel: 'Xem đội xe',
    secondaryHref: '/xe',
    panelTitle: 'Car Match ưu tiên điều gì?',
    panelItems: [
      'Không hiển thị đánh giá ảo hoặc claim chưa kiểm chứng.',
      'Báo rõ giấy tờ, cọc, phụ phí và lịch giao nhận trước khi chốt.',
      'Kiểm tra tình trạng xe cùng khách khi nhận và trả xe.',
      'Tập trung phục vụ cư dân chung cư, khu đô thị và khách cần xe linh hoạt tại Hà Nội.',
    ],
    stats: [
      { value: '20+', label: 'Mẫu xe tham khảo' },
      { value: '7h-22h', label: 'Giờ hỗ trợ vận hành' },
      { value: 'CCCD + GPLX', label: 'Giấy tờ chính' },
      { value: 'Zalo', label: 'Kênh kiểm tra lịch xe' },
    ],
    cardsTitle: 'Cách Car Match tạo niềm tin',
    cardsLead: 'Các tín hiệu trust trên website phải khớp với quy trình vận hành thật để khách tự kiểm tra được trước khi đặt xe.',
    cards: [
      { title: 'Lịch xe thật', text: 'Khách gửi ngày nhận, ngày trả, khu vực nhận xe và nhu cầu chuyến đi. Car Match kiểm tra xe còn phù hợp rồi mới báo mẫu, giá và điều kiện thuê.' },
      { title: 'Bàn giao có ghi nhận', text: 'Khi nhận xe, hai bên kiểm tra ngoại thất, nội thất, nhiên liệu hoặc pin, số km và phụ kiện. Đây là cơ sở để đối soát khi trả xe.' },
      { title: 'Điều kiện rõ trước khi cọc', text: 'Khoản cọc, phí giao nhận, giới hạn km, phụ phí trả muộn và trách nhiệm khi phát sinh được xác nhận trước khi khách chốt lịch thuê.' },
    ],
    stepsTitle: 'Quy trình thuê xe tự lái',
    stepsLead: 'Quy trình được trình bày rõ để khách biết mình cần làm gì trước, trong và sau khi nhận xe.',
    steps: [
      { title: 'Chọn xe hoặc gửi nhu cầu', text: 'Khách xem danh sách xe hoặc nhắn Zalo để Car Match lọc xe theo số chỗ, nhiên liệu, ngân sách và khu vực nhận xe.' },
      { title: 'Xác nhận lịch và giấy tờ', text: 'Đội vận hành kiểm tra xe trống, CCCD, giấy phép lái xe hạng B, khoản cọc và điều kiện thuê theo từng mẫu xe.' },
      { title: 'Nhận xe tại điểm hẹn', text: 'Car Match giao xe tận sảnh chung cư hoặc điểm hẹn phù hợp khi lịch xe và khu vực đáp ứng điều kiện vận hành.' },
      { title: 'Trả xe và đối soát', text: 'Hai bên kiểm tra lại tình trạng xe, chi phí phát sinh nếu có và xử lý cọc theo hợp đồng hoặc thỏa thuận thuê xe.' },
    ],
    faqs: [
      { q: 'Car Match có phải marketplace xe tự lái tại Hà Nội không?', a: 'Car Match vận hành theo hướng kết nối đội xe phù hợp với nhu cầu thuê xe tự lái tại Hà Nội, đồng thời hỗ trợ kiểm tra lịch, giấy tờ, điều kiện cọc và quy trình bàn giao.' },
      { q: 'Car Match khác gì so với tự hỏi từng chủ xe?', a: 'Khách không phải hỏi rời rạc từng xe. Car Match gom nhu cầu, lọc xe còn lịch phù hợp, báo giá và điều kiện thuê trước khi khách quyết định đặt cọc.' },
    ],
    finalTitle: 'Cần kiểm tra xe cho lịch sắp tới?',
    finalText: 'Nhắn Zalo 0975 563 290 với ngày thuê, khu vực nhận xe, số người và loại xe mong muốn. Car Match sẽ kiểm tra lịch xe thật trước khi báo giá.',
  });
}

function policyStaticShell() {
  return trustStaticShell({
    shellName: 'policy',
    eyebrow: 'Chính sách thuê xe',
    title: 'Chính sách thuê xe tự lái Car Match',
    lead: 'Trang chính sách giúp khách hiểu trước các điều kiện về đặt cọc, hủy chuyến, phụ phí, giấy tờ, bảo hiểm, phạm vi sử dụng và quy trình giao nhận xe. Điều khoản cuối cùng có thể khác theo từng mẫu xe và hợp đồng.',
    navCtaLabel: 'Hỏi chính sách',
    primaryLabel: 'Hỏi qua Zalo',
    secondaryLabel: 'Xem FAQ',
    secondaryHref: '/faq',
    panelTitle: 'Trước khi đặt cọc nên xác nhận',
    panelItems: [
      'Mẫu xe, ngày nhận/trả, khu vực giao nhận và phí giao nhận nếu có.',
      'Khoản cọc, điều kiện hoàn/hủy và cách đối soát khi trả xe.',
      'Giới hạn km, phụ phí vượt km, phụ phí trả muộn và quy định đi tỉnh.',
      'Phạm vi bảo hiểm, mức khấu trừ nếu có và trách nhiệm khi phát sinh sự cố.',
    ],
    stats: [
      { value: 'CCCD', label: 'Cần bản gốc khi nhận xe' },
      { value: 'GPLX B', label: 'Còn hiệu lực' },
      { value: '3.000đ/km', label: 'Phụ phí vượt km tham khảo' },
      { value: '100.000đ/giờ', label: 'Phụ phí trả muộn tham khảo' },
    ],
    cardsTitle: 'Các nhóm chính sách chính',
    cardsLead: 'Các mục dưới đây là nội dung khách thường cần đọc trước khi quyết định thuê xe tự lái.',
    cards: [
      { title: 'Hủy chuyến và hoàn cọc', text: 'Điều kiện hoàn cọc phụ thuộc thời điểm hủy, mẫu xe và lịch đã giữ. Khách nên báo hủy qua hotline hoặc Zalo để Car Match xác nhận phương án xử lý cụ thể.' },
      { title: 'Giấy tờ và đặt cọc', text: 'Khách thường cần CCCD bản gốc, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo mẫu xe. Điều kiện cọc được xác nhận trước khi giao xe.' },
      { title: 'Phụ phí phát sinh', text: 'Các phụ phí có thể gồm vượt km, trả xe muộn, vệ sinh xe, nhiên liệu hoặc pin thiếu, phí giao nhận và các chi phí khác theo biên bản bàn giao.' },
      { title: 'Bảo hiểm và trách nhiệm', text: 'Điều kiện bảo hiểm và trách nhiệm sử dụng xe được ghi trong hợp đồng hoặc biên bản bàn giao. Khách nên xác nhận phạm vi bảo hiểm trước khi nhận xe.' },
      { title: 'Quy định sử dụng xe', text: 'Không sử dụng xe cho mục đích vận tải thương mại, không để người không có tên trong hợp đồng lái xe và không dùng xe khi đã uống rượu bia.' },
      { title: 'Giao nhận xe', text: 'Khi nhận và trả xe, hai bên kiểm tra tình trạng xe, chụp ảnh hiện trạng, ghi nhận km, nhiên liệu hoặc pin và đối soát chi phí phát sinh.' },
    ],
    stepsTitle: 'Cách đọc chính sách trước khi chốt xe',
    stepsLead: 'Chính sách nên được dùng như checklist để khách hỏi rõ trước khi đặt cọc, không phải đọc sau khi phát sinh vấn đề.',
    steps: [
      { title: 'Xem xe và giá', text: 'Đọc giá tham khảo trên website, sau đó hỏi lại giá cuối cùng theo ngày thuê và khu vực nhận xe.' },
      { title: 'Xác nhận điều kiện cọc', text: 'Hỏi rõ khoản cọc, thời điểm chuyển cọc, điều kiện hoàn cọc và cách đối soát khi trả xe.' },
      { title: 'Kiểm tra giới hạn sử dụng', text: 'Xác nhận km/ngày, phạm vi đi tỉnh, phụ phí vượt km, trả muộn và điều kiện người lái.' },
      { title: 'Lưu biên bản bàn giao', text: 'Giữ thông tin bàn giao, ảnh xe, hợp đồng và nội dung trao đổi Zalo để hai bên dễ đối chiếu.' },
    ],
    faqs: [
      { q: 'Chính sách có giống nhau cho mọi xe không?', a: 'Không nhất thiết. Một số điều kiện có thể thay đổi theo mẫu xe, thời điểm thuê, lịch xe, khu vực giao nhận và thỏa thuận trong hợp đồng.' },
      { q: 'Nếu có khác biệt giữa website và hợp đồng thì sao?', a: 'Nội dung trong hợp đồng thuê xe và biên bản bàn giao là căn cứ áp dụng cuối cùng. Website dùng để khách chuẩn bị câu hỏi trước khi chốt xe.' },
    ],
    finalTitle: 'Chưa rõ điều kiện thuê xe?',
    finalText: 'Gửi mẫu xe, ngày thuê và khu vực nhận xe qua Zalo 0975 563 290. Car Match sẽ xác nhận điều kiện cọc, giấy tờ và phụ phí trước khi chốt.',
    finalSecondaryHref: '/xe',
    finalSecondaryLabel: 'Xem xe tự lái',
  });
}

function faqStaticShell() {
  return trustStaticShell({
    shellName: 'faq',
    eyebrow: 'FAQ thuê xe tự lái',
    title: 'Câu hỏi thường gặp khi thuê xe Car Match',
    lead: 'FAQ này trả lời các câu hỏi khách thường hỏi trước khi đặt xe: quy trình đặt xe, giấy tờ, đặt cọc, hủy chuyến, giao xe, bảo hiểm, giới hạn km, đi tỉnh và xử lý sự cố trên đường.',
    navCtaLabel: 'Hỏi nhanh',
    primaryLabel: 'Nhắn Zalo hỏi xe',
    secondaryLabel: 'Xem chính sách',
    secondaryHref: '/chinh-sach',
    panelTitle: 'Câu trả lời nhanh',
    panelItems: [
      'Cần CCCD bản gốc và giấy phép lái xe hạng B còn hiệu lực.',
      'Khoản cọc, bảo hiểm và phụ phí được xác nhận theo từng mẫu xe.',
      'Giao xe tận sảnh hoặc điểm hẹn phù hợp tại Hà Nội khi lịch xe đáp ứng.',
      'Khi có sự cố, khách liên hệ hotline/Zalo để được hướng dẫn bước xử lý tiếp theo.',
    ],
    stats: [
      { value: '7h-22h', label: 'Giờ hỗ trợ thông thường' },
      { value: '200-300km', label: 'Giới hạn km/ngày tùy xe' },
      { value: '3.000đ/km', label: 'Vượt km tham khảo' },
      { value: 'Zalo', label: 'Kênh xác nhận nhanh' },
    ],
    cardsTitle: 'Nhóm câu hỏi quan trọng',
    cardsLead: 'FAQ được chia theo hành trình thuê xe để khách đọc đúng phần mình cần trước khi đặt.',
    cards: [
      { title: 'Đặt xe và thanh toán', text: 'Khách chọn xe hoặc gửi nhu cầu, Car Match kiểm tra lịch xe thật, xác nhận giá, giấy tờ và khoản cọc trước khi giữ lịch thuê.' },
      { title: 'Nhận xe và sử dụng', text: 'Khi nhận xe, khách xuất trình giấy tờ, kiểm tra hiện trạng xe, ghi nhận km, nhiên liệu hoặc pin và thống nhất kênh hỗ trợ khi có phát sinh.' },
      { title: 'Trả xe và đối soát', text: 'Khi trả xe, hai bên kiểm tra lại tình trạng xe, đối soát phụ phí nếu có và xử lý cọc theo điều kiện đã thỏa thuận.' },
    ],
    stepsTitle: 'Quy trình đặt xe online',
    stepsLead: 'Các bước dưới đây giúp khách hiểu cách chuyển từ xem xe trên website sang đặt xe thật qua đội vận hành.',
    steps: [
      { title: 'Chọn xe hoặc gửi nhu cầu', text: 'Khách xem danh sách xe theo số chỗ, nhiên liệu, ngân sách hoặc gửi khu vực nhận xe để được lọc mẫu phù hợp.' },
      { title: 'Kiểm tra lịch xe', text: 'Car Match đối chiếu lịch xe còn trống, vị trí xe, điều kiện giao nhận và nhu cầu chuyến đi.' },
      { title: 'Xác nhận cọc và giấy tờ', text: 'Khách nhận thông tin giấy tờ, khoản cọc, giá thuê, giới hạn km và phụ phí cần biết trước khi chốt.' },
      { title: 'Nhận xe theo lịch hẹn', text: 'Hai bên kiểm tra xe cùng nhau, ký nhận hoặc ghi nhận bàn giao rồi khách bắt đầu chuyến đi.' },
    ],
    faqTitle: 'Các câu hỏi được hỏi nhiều nhất',
    faqLead: 'Các câu trả lời này tránh hứa quá mức; mỗi xe cụ thể vẫn cần được Car Match xác nhận trước khi khách đặt cọc.',
    faqs: [
      { q: 'Quy trình đặt xe online như thế nào?', a: 'Khách chọn xe, chọn ngày giờ, điền thông tin hoặc nhắn Zalo. Car Match kiểm tra lịch xe thật, xác nhận giá thuê, giấy tờ, khoản cọc và lịch giao nhận trước khi chốt.' },
      { q: 'Tôi có thể hủy và hoàn cọc không?', a: 'Có thể hủy, nhưng điều kiện hoàn cọc phụ thuộc thời điểm hủy, mẫu xe và lịch đã giữ. Khách nên liên hệ hotline/Zalo để được xác nhận phương án cụ thể.' },
      { q: 'Cần mang giấy tờ gì khi nhận xe?', a: 'Khách cần CCCD hoặc căn cước bản gốc, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo mẫu xe. Điều kiện cụ thể được xác nhận trước khi giao xe.' },
      { q: 'Xe có bảo hiểm không?', a: 'Điều kiện bảo hiểm và trách nhiệm sử dụng được ghi nhận trong hợp đồng hoặc biên bản bàn giao. Khách nên xác nhận phạm vi bảo hiểm, mức khấu trừ nếu có và quy trình xử lý sự cố.' },
      { q: 'Tôi có thể đi ra ngoài tỉnh không?', a: 'Cần thông báo trước với Car Match. Một số tuyến phổ biến có thể được chấp thuận, nhưng phí bổ sung và điều kiện sử dụng sẽ được xác nhận theo từng xe.' },
      { q: 'Xe bị hỏng giữa đường thì làm sao?', a: 'Khách liên hệ hotline/Zalo 0975 563 290, mô tả tình trạng xe và vị trí hiện tại. Car Match sẽ hướng dẫn bước xử lý tiếp theo theo tình huống thực tế.' },
    ],
    finalTitle: 'Không thấy câu hỏi của bạn?',
    finalText: 'Nhắn Zalo 0975 563 290 với mẫu xe, ngày thuê và nội dung cần hỏi. Car Match sẽ trả lời theo điều kiện xe thật trước khi khách đặt cọc.',
  });
}

function partnerStaticShell() {
  return trustStaticShell({
    shellName: 'partner',
    eyebrow: 'Hợp tác chủ xe',
    title: 'Hợp tác chủ xe tại Hà Nội cùng Car Match',
    lead: 'Chủ xe có thể gửi thông tin xe để Car Match thẩm định mẫu xe, lịch rảnh, khu vực đỗ, điều kiện vận hành và phương án đối soát doanh thu. Nội dung này không cam kết mức doanh thu cụ thể; phương án thực tế phụ thuộc xe và hợp đồng.',
    navCtaLabel: 'Gửi thông tin',
    primaryLabel: 'Nhắn Zalo hợp tác',
    secondaryLabel: 'Liên hệ Car Match',
    secondaryHref: '/lien-he',
    panelTitle: 'Thông tin chủ xe nên chuẩn bị',
    panelItems: [
      'Mẫu xe, đời xe, tình trạng xe, đăng kiểm và hồ sơ xe hiện có.',
      'Khu vực xe đang đỗ, lịch xe rảnh và hình thức hợp tác mong muốn.',
      'Thiết bị theo dõi, ETC, bảo hiểm hiện tại và lịch bảo dưỡng gần nhất.',
      'Kỳ vọng doanh thu và điều kiện rút xe hoặc tạm dừng hợp tác.',
    ],
    stats: [
      { value: 'Theo xe', label: 'Ước tính doanh thu' },
      { value: 'Theo hợp đồng', label: 'Tỷ lệ đối soát' },
      { value: 'Hà Nội', label: 'Khu vực ưu tiên' },
      { value: 'Zalo', label: 'Kênh gửi thông tin nhanh' },
    ],
    cardsTitle: 'Car Match đánh giá xe như thế nào?',
    cardsLead: 'Mục tiêu là tìm phương án khai thác hợp lý cho cả chủ xe, khách thuê và đội vận hành.',
    cards: [
      { title: 'Hồ sơ và tình trạng xe', text: 'Car Match xem đời xe, đăng kiểm, bảo hiểm, tình trạng nội ngoại thất, lịch bảo dưỡng và mức độ phù hợp với nhu cầu thuê tự lái tại Hà Nội.' },
      { title: 'Khu vực và lịch rảnh', text: 'Xe ở chung cư, khu đô thị hoặc điểm giao nhận thuận tiện thường dễ điều phối hơn. Lịch rảnh càng rõ thì khả năng khai thác càng dễ dự báo.' },
      { title: 'Điều kiện vận hành', text: 'Hai bên cần thống nhất trách nhiệm giao nhận, bảo dưỡng, bảo hiểm, xử lý sự cố, theo dõi xe, doanh thu và thời hạn hợp tác.' },
    ],
    stepsTitle: 'Quy trình hợp tác chủ xe',
    stepsLead: 'Các bước này giúp chủ xe biết mình cần gửi gì và Car Match sẽ đánh giá ra sao trước khi ký hợp đồng.',
    steps: [
      { title: 'Gửi thông tin xe', text: 'Chủ xe gửi mẫu xe, đời xe, ảnh xe, khu vực đỗ, hồ sơ xe và hình thức hợp tác mong muốn qua Zalo hoặc form.' },
      { title: 'Thẩm định phù hợp', text: 'Car Match kiểm tra nhu cầu thị trường, tình trạng xe, điều kiện vận hành và khả năng khai thác theo khu vực.' },
      { title: 'Thống nhất hợp đồng', text: 'Hai bên thống nhất trách nhiệm, lịch xe, bảo hiểm, bảo dưỡng, đối soát doanh thu và điều kiện tạm dừng hoặc rút xe.' },
      { title: 'Đưa xe vào vận hành', text: 'Xe chỉ được đưa vào vận hành khi hồ sơ, thiết bị và quy trình bàn giao đã rõ để giảm rủi ro cho chủ xe và khách thuê.' },
    ],
    faqs: [
      { q: 'Car Match có cam kết doanh thu không?', a: 'Không nên hiểu nội dung trên website là cam kết doanh thu. Doanh thu phụ thuộc mẫu xe, tình trạng xe, lịch rảnh, khu vực, nhu cầu thuê và điều khoản hợp đồng.' },
      { q: 'Xe cần đáp ứng tiêu chuẩn gì?', a: 'Xe cần hồ sơ đầy đủ, đăng kiểm còn hạn, tình trạng sử dụng phù hợp và đáp ứng yêu cầu vận hành. Car Match sẽ thẩm định trước khi đề xuất hợp tác.' },
      { q: 'Nếu xe bị hỏng hoặc phát sinh sự cố thì sao?', a: 'Trách nhiệm bảo hiểm, bảo dưỡng, hao mòn, hư hỏng và xử lý sự cố cần được ghi rõ trong hợp đồng hợp tác và biên bản bàn giao thực tế.' },
    ],
    finalTitle: 'Muốn Car Match thẩm định xe của bạn?',
    finalText: 'Gửi mẫu xe, đời xe, khu vực đỗ, ảnh xe và lịch xe rảnh qua Zalo 0975 563 290. Car Match sẽ phản hồi phương án phù hợp sau khi xem thông tin.',
    finalSecondaryHref: '/lien-he',
    finalSecondaryLabel: 'Xem thông tin liên hệ',
  });
}

function rootStaticShell(vehicles = []) {
  const totalVehicles = vehicles.length || 20;
  return `<div id="root" data-static-shell="home"><div class="cm-static-home">
      <header class="cm-static-nav">
        <div class="cm-static-nav-inner">
          <a class="cm-static-logo" href="/" aria-label="Car Match">
            <img src="/brand/carmatch-lockup-navy.png" alt="Car Match logo màu navy" width="288" height="66" fetchpriority="high">
          </a>
          <nav class="cm-static-menu" aria-label="Điều hướng chính">
            <a href="/xe">Thuê xe tự lái</a>
            <a href="/di-dau">Đi đâu</a>
            <a href="/lap-ke-hoach-chuyen-di">Lập chuyến đi</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/hop-tac">Hợp tác chủ xe</a>
            <a href="/gioi-thieu">Giới thiệu</a>
            <a href="/lien-he">Liên hệ</a>
            <a href="/blog">Blog</a>
            <a class="cm-static-cta" href="https://zalo.me/0975563290">Đặt xe qua Zalo</a>
          </nav>
          <a class="cm-static-mobile-menu" href="/xe" aria-label="Mở danh sách xe">≡</a>
        </div>
      </header>
      <main id="main-content" class="cm-static-hero">
        <div class="cm-static-inner">
          <div class="cm-static-copy">
            <div class="cm-static-pill">Dịch vụ xe cho cư dân đô thị Hà Nội</div>
            <h1 class="cm-static-title">Thuê xe tự lái Hà Nội<br><span>giao xe tận sảnh</span></h1>
            <p class="cm-static-lead">Car Match cho thuê xe tự lái theo ngày hoặc theo tháng tại Hà Nội. Khách có thể xem xe online, chọn lịch, nhận xe tại sảnh chung cư/khu đô thị và được hỗ trợ qua Zalo.</p>
            <p class="cm-static-sublead">Vinhomes Ocean Park, Times City, Smart City, Ecopark, The Manor Central Park, Linh Đàm. Giá tham khảo từ 600.000đ/ngày, tùy mẫu xe và thời điểm thuê.</p>
            <div class="cm-static-actions">
              <a class="cm-static-btn primary" href="/xe">Xem xe đang có</a>
              <a class="cm-static-btn secondary" href="https://zalo.me/0975563290">Đặt xe qua Zalo</a>
              <a class="cm-static-btn secondary" href="/lien-he">Liên hệ Car Match</a>
            </div>
            <div class="cm-static-trust"><span class="cm-static-check">Giao xe tận tòa nhà</span><span class="cm-static-check">Kiểm tra xe khi bàn giao</span><span class="cm-static-check">Báo cọc/phí trước khi chốt</span></div>
            <form class="cm-static-search" action="/xe" method="get" aria-label="Tìm xe tự lái nhanh">
              <h2>Tìm xe tự lái theo lịch, khu vực nhận và số chỗ</h2>
              <p>Form này hoạt động ngay cả khi JavaScript chưa tải. Car Match vẫn xác nhận lại xe trống và giá thuê qua Zalo trước khi chốt lịch.</p>
              <div class="cm-static-search-grid">
                <select name="area" aria-label="Khu vực nhận xe">
                  <option value="">Khu vực nhận</option>
                  <option value="Vinhomes Ocean Park">Vinhomes Ocean Park</option>
                  <option value="Vinhomes Times City">Vinhomes Times City</option>
                  <option value="Vinhomes Smart City">Vinhomes Smart City</option>
                  <option value="The Manor Central Park">The Manor Central Park</option>
                  <option value="Ecopark">Ecopark</option>
                </select>
                <select name="seatFilter" aria-label="Số chỗ">
                  <option value="">Số chỗ</option>
                  <option value="5">5 chỗ</option>
                  <option value="7">7 chỗ</option>
                  <option value="8+">8+ chỗ</option>
                </select>
                <select name="fuelFilter" aria-label="Nhiên liệu">
                  <option value="">Nhiên liệu</option>
                  <option value="Điện">Xe điện</option>
                  <option value="Xăng">Xe xăng</option>
                  <option value="Dầu">Xe dầu</option>
                </select>
                <input name="from" type="date" aria-label="Ngày nhận xe">
                <input name="to" type="date" aria-label="Ngày trả xe">
                <button type="submit">Tìm xe</button>
              </div>
            </form>
          </div>
          <div class="cm-static-fleet" aria-hidden="true">
            <div class="cm-static-fleet-head"><span>Gợi ý xe tự lái</span><a href="/xe">Xem tất cả →</a></div>
${renderStaticFleet(vehicles)}
          </div>
        </div>
      </main>
      <section class="cm-static-stats">
        <div class="cm-static-wrap cm-static-stats-grid">
          <div class="cm-static-stat"><strong>20+</strong><span>Mẫu xe</span></div>
          <div class="cm-static-stat"><strong>7h-22h</strong><span>Hỗ trợ mỗi ngày</span></div>
          <div class="cm-static-stat"><strong>CCCD + GPLX</strong><span>Giấy tờ chính</span></div>
          <div class="cm-static-stat"><strong>30 phút</strong><span>Phản hồi lịch xe</span></div>
        </div>
      </section>
      <section class="cm-static-summary">
        <div class="cm-static-wrap cm-static-summary-grid">
          <div>
            <h2>Thuê xe tự lái Car Match cần biết gì?</h2>
            <p>Car Match tập trung vào khách tại Hà Nội cần xe linh hoạt cho cuối tuần, về quê, đi tỉnh, công tác hoặc thuê theo tháng. Điểm mạnh là giao xe tận sảnh, quy trình bàn giao rõ ràng và đội vận hành hỗ trợ khi phát sinh trên đường.</p>
            <div class="cm-static-area-list">
              <a href="/xe">Danh sách ${totalVehicles} xe</a>
              <a href="/thue-xe-thang">Thuê xe theo tháng</a>
              <a href="/chinh-sach">Chính sách thuê xe</a>
              <a href="/faq">FAQ thuê xe</a>
            </div>
          </div>
          <div class="cm-static-facts" role="table" aria-label="Thông tin nhanh về thuê xe tự lái Car Match">
            <div class="cm-static-fact" role="row"><b role="cell">Giá thuê</b><span role="cell">Từ 600.000đ/ngày, tùy mẫu xe và lịch thuê.</span></div>
            <div class="cm-static-fact" role="row"><b role="cell">Khu vực</b><span role="cell">Nội thành Hà Nội, Vinhomes, Ecopark, The Manor, Linh Đàm.</span></div>
            <div class="cm-static-fact" role="row"><b role="cell">Giấy tờ</b><span role="cell">CCCD và giấy phép lái xe hạng B còn hiệu lực.</span></div>
            <div class="cm-static-fact" role="row"><b role="cell">Liên hệ</b><span role="cell">Zalo 0975 563 290, hỗ trợ 7h-22h.</span></div>
          </div>
        </div>
      </section>
      <section class="cm-static-guide">
        <div class="cm-static-wrap cm-static-guide-grid">
          <div>
            <h2>Vì sao nên dùng Car Match khi cần xe ở Hà Nội?</h2>
            <p>Khách thuê xe tự lái thường mất thời gian hỏi từng chủ xe, kiểm tra xe còn trống, so sánh giá, đọc điều kiện cọc và hẹn điểm giao nhận. Car Match gom các bước đó về một luồng: khách gửi nhu cầu, đội vận hành lọc xe đang có, xác nhận giá thuê, giấy tờ và lịch giao nhận trước khi chốt.</p>
            <p>Dịch vụ phù hợp với người ở chung cư, gia đình trẻ, nhóm đi tỉnh cuối tuần, khách cần xe đi sân bay Nội Bài, khách thuê xe điện VinFast để đi nội thành hoặc doanh nghiệp cần xe dùng theo tháng nhưng chưa muốn mua xe riêng.</p>
          </div>
          <ul class="cm-static-guide-list" aria-label="Các bước thuê xe tự lái tại Car Match">
            <li><b>1. Gửi nhu cầu thuê xe</b>Cho biết ngày nhận/trả, khu vực nhận xe, số người, hành lý và cung đường dự kiến để Car Match lọc xe phù hợp.</li>
            <li><b>2. Kiểm tra lịch xe thật</b>Đội vận hành đối chiếu lịch đặt, tình trạng xe, mức pin/xăng, chi phí giao nhận và các điều kiện riêng của từng mẫu xe.</li>
            <li><b>3. Xác nhận giấy tờ và đặt cọc</b>Khách chuẩn bị CCCD, giấy phép lái xe hạng B còn hiệu lực và khoản đặt cọc theo nhóm xe trước khi nhận xe.</li>
            <li><b>4. Bàn giao và hỗ trợ trên đường</b>Hai bên kiểm tra ngoại thất, nội thất, km, nhiên liệu, phụ kiện và thống nhất kênh hỗ trợ khi phát sinh trong chuyến đi.</li>
          </ul>
        </div>
      </section>
      ${staticAnswerSection({
        title: 'Thuê xe tự lái Hà Nội tại Car Match phù hợp với ai?',
        lead: 'Khối này trả lời trực tiếp các câu hỏi chính mà khách thường tìm trước khi đặt xe: dịch vụ hỗ trợ gì, giá tham khảo ra sao và cần chuẩn bị gì để nhận xe thuận lợi.',
        answers: [
          {
            question: 'Car Match hỗ trợ thuê xe tự lái ở Hà Nội như thế nào?',
            answer: 'Car Match nhận nhu cầu thuê xe theo ngày hoặc theo tháng tại Hà Nội, sau đó kiểm tra xe phù hợp theo ngày nhận/trả, khu vực nhận xe, số người, hành lý và cung đường dự kiến. Khách có thể xem danh sách xe trên website, dùng bộ lọc để chọn xe điện, xe 5 chỗ hoặc 7 chỗ, rồi nhắn Zalo 0975 563 290 để xác nhận lịch xe thật. Giá trên website là giá tham khảo từ 600.000đ/ngày và có thể thay đổi theo mẫu xe, thời điểm thuê, phụ phí giao nhận hoặc nhu cầu đi tỉnh.',
          },
          {
            question: 'Khách cần chuẩn bị gì trước khi nhận xe?',
            answer: 'Khách nên chuẩn bị CCCD bản gốc, giấy phép lái xe hạng B còn hiệu lực, ngày giờ nhận/trả xe, điểm giao nhận và khoản đặt cọc theo mẫu xe. Khi bàn giao, hai bên kiểm tra ngoại thất, nội thất, mức nhiên liệu hoặc pin, số km và phụ kiện để ghi nhận hiện trạng. Nếu thuê xe theo tháng, khách nên nói rõ thời hạn thuê, số km dự kiến, nhu cầu xuất hóa đơn và khu vực gửi xe để Car Match báo phương án phù hợp hơn.',
          },
        ],
        links: [
          { href: '/xe', label: 'Xem danh sách xe tự lái Hà Nội' },
          { href: '/thue-xe-thang', label: 'Tìm hiểu thuê xe theo tháng' },
          { href: '/chinh-sach', label: 'Đọc chính sách thuê xe' },
          { href: '/lien-he', label: 'Liên hệ kiểm tra xe trống' },
        ],
      })}
      <section class="cm-static-faq">
        <div class="cm-static-wrap">
          <h2>Câu hỏi thường gặp về thuê xe tự lái Hà Nội</h2>
          <div class="cm-static-faq-grid">
            <article><h3>Car Match có giao xe tận nơi không?</h3><p>Có. Car Match hỗ trợ giao xe tận sảnh chung cư, văn phòng hoặc điểm hẹn phù hợp tại Hà Nội, tùy lịch xe và khu vực nhận xe.</p></article>
            <article><h3>Khách thuê cần chuẩn bị giấy tờ gì?</h3><p>Khách thuê cần CCCD bản gốc và giấy phép lái xe hạng B còn hiệu lực. Điều kiện cọc và giao nhận được xác nhận trước khi nhận xe.</p></article>
            <article><h3>Thuê xe theo tháng có được không?</h3><p>Có. Gói tháng phù hợp gia đình hoặc doanh nghiệp dùng xe định kỳ, giá tham khảo từ 10.000.000đ/tháng tùy mẫu xe và thời gian thuê.</p></article>
            <article><h3>Làm sao biết xe còn trống?</h3><p>Gửi ngày nhận/trả, khu vực nhận xe và số người qua Zalo. Car Match kiểm tra lịch xe thật rồi báo mẫu xe, giá và điều kiện thuê.</p></article>
          </div>
        </div>
      </section>
      <section class="cm-static-final">
        <div class="cm-static-wrap">
          <h2>Muốn kiểm tra lịch xe hôm nay?</h2>
          <p>Nhắn Zalo 0975 563 290 hoặc vào danh sách xe để chọn mẫu phù hợp. Nội dung homepage cập nhật ngày 14/06/2026.</p>
          <div class="cm-static-actions" style="justify-content:center"><a class="cm-static-btn primary" href="https://zalo.me/0975563290">Nhắn Zalo</a><a class="cm-static-btn secondary" href="/xe">Xem danh sách xe</a></div>
          <p style="margin-top:18px;font-size:14px;color:#64748b">Chia sẻ trang cho người đang cần thuê xe tự lái tại Hà Nội.</p>
          <div class="cm-static-actions" style="justify-content:center;margin-top:10px"><a class="cm-static-btn secondary" href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.carmatch.vn%2F">Chia sẻ Facebook</a><a class="cm-static-btn secondary" href="mailto:?subject=Car%20Match%20-%20thu%C3%AA%20xe%20t%E1%BB%B1%20l%C3%A1i%20H%C3%A0%20N%E1%BB%99i&body=https%3A%2F%2Fwww.carmatch.vn%2F">Gửi email</a></div>
        </div>
      </section>
      ${staticMobileConversionBar('home', 'Nhắn Zalo')}
    </div></div>`;
}

function staticH1FromTitle(title = '') {
  return normalizeBrandText(String(title)
    .replace(/\s*[|—-]\s*Car Match.*$/i, '')
    .replace(/\s*[|—-]\s*Từ .*$/i, '')
    .trim());
}

function staticFallbackRoot(meta) {
  const h1 = escapeHtml(meta.staticH1 || staticH1FromTitle(meta.title));
  const lead = escapeHtml(meta.staticLead || meta.description || '');
  const primaryHref = meta.staticPrimaryHref || (String(meta.path || '').startsWith('/xe/') ? 'https://zalo.me/0975563290' : '/xe');
  const primaryLabel = escapeHtml(meta.staticPrimaryLabel || (String(meta.path || '').startsWith('/xe/') ? 'Hỏi xe qua Zalo' : 'Xem xe tự lái'));
  const secondaryHref = meta.staticSecondaryHref || 'https://zalo.me/0975563290';
  const secondaryLabel = escapeHtml(meta.staticSecondaryLabel || 'Nhắn Zalo tư vấn');
  const extraHtml = meta.staticExtraHtml || '';

  return `<div id="root" data-static-fallback="true">
    <main class="cm-static-fallback">
      <section class="cm-static-fallback-inner">
        <p class="cm-static-fallback-eyebrow">Car Match · Thuê xe tự lái Hà Nội</p>
        <h1>${h1}</h1>
        <p>${lead}</p>
        <div class="cm-static-fallback-actions">
          <a class="cm-static-fallback-btn primary" href="${escapeHtml(primaryHref)}">${primaryLabel}</a>
          <a class="cm-static-fallback-btn secondary" href="${escapeHtml(secondaryHref)}">${secondaryLabel}</a>
        </div>
      </section>
      ${extraHtml}
    </main>
  </div>`;
}

function plannerDetailStaticHtml(meta) {
  const slug = String(meta.path || '').split('/').filter(Boolean).pop() || '';
  const destination = generatedTripDestinations.find((item) => item.slug === slug);
  const name = destination?.name || staticH1FromTitle(meta.title).replace(/^Thuê xe tự lái đi\s+/i, '');
  const roundTripKm = destination ? destinationRoundTripKm(destination) : 0;
  const mobilityEstimate = destination ? destinationMobilityEstimate(destination) : 0;
  const duration = destination?.duration || 'theo lịch trình';
  const vehicle = destination?.recommendedVehicle || 'xe 5 chỗ, xe 7 chỗ hoặc xe điện tùy số người và hành lý';
  const route = destination?.route || `Hà Nội → ${name}`;
  const destinationHref = destination ? `/di-dau/${destination.slug}` : '/di-dau';
  const plannerHref = destination ? tripPlannerHref(destination) : '/lap-ke-hoach-chuyen-di#trip-form';

  return `<section class="cm-static-fallback-section" aria-labelledby="planner-summary">
        <div class="cm-static-fallback-grid">
          <article>
            <p class="cm-static-fallback-kicker">Lập kế hoạch chuyến đi</p>
            <h2 id="planner-summary">Tính trước chi phí thuê xe tự lái đi ${escapeHtml(name)}</h2>
            <p>Trang này giúp khách chuẩn bị thông tin trước khi nhắn Car Match: ngày đi, số người, điểm nhận xe, điểm trả xe, hành lý và ngân sách dự kiến. Con số trên trang chỉ là khung tham khảo; lịch xe, giá thuê và phí giao nhận vẫn cần được xác nhận theo xe còn trống.</p>
          </article>
          <article>
            <p class="cm-static-fallback-kicker">Tóm tắt tuyến</p>
            <dl class="cm-static-fallback-facts">
              <div><dt>Tuyến đi</dt><dd>${escapeHtml(route)}</dd></div>
              <div><dt>Thời gian</dt><dd>${escapeHtml(duration)}</dd></div>
              <div><dt>Quãng đường</dt><dd>${roundTripKm ? `${roundTripKm} km hai chiều` : 'ước tính theo điểm nhận xe'}</dd></div>
              <div><dt>Chi phí di chuyển</dt><dd>${mobilityEstimate ? formatVnd(mobilityEstimate) : 'tính theo tuyến thực tế'}</dd></div>
            </dl>
          </article>
        </div>
      </section>
      <section class="cm-static-fallback-section" aria-labelledby="planner-vehicle">
        <div class="cm-static-fallback-grid">
          <article>
            <h2 id="planner-vehicle">Nên chọn xe gì để đi ${escapeHtml(name)}?</h2>
            <p>Gợi ý ban đầu: ${escapeHtml(vehicle)}. Nếu đi gia đình có trẻ nhỏ hoặc nhiều hành lý, nên ưu tiên xe rộng hơn. Nếu đi trong ngày hoặc ít người, xe nhỏ hoặc xe điện có thể tối ưu chi phí hơn, miễn là phù hợp điểm dừng và lịch sạc/xăng.</p>
          </article>
          <article>
            <h2>Thông tin nên gửi cho Car Match</h2>
            <ol class="cm-static-fallback-list">
              <li>Ngày nhận xe, ngày trả xe và khung giờ mong muốn.</li>
              <li>Số người đi, lượng hành lý và có trẻ nhỏ/người lớn tuổi không.</li>
              <li>Khu vực nhận xe tại Hà Nội và điểm trả xe dự kiến.</li>
              <li>Nhu cầu xe điện, xe 5 chỗ, xe 7 chỗ hoặc thuê theo tháng nếu chuyến dài.</li>
            </ol>
          </article>
        </div>
      </section>
      <section class="cm-static-fallback-section" aria-labelledby="planner-next">
        <h2 id="planner-next">Bước tiếp theo để chốt chuyến ${escapeHtml(name)}</h2>
        <p>Sau khi có lịch trình cơ bản, khách có thể mở form lập kế hoạch hoặc nhắn Zalo 0975 563 290. Car Match sẽ kiểm tra xe còn phù hợp, báo giá thuê, điều kiện cọc, phí giao nhận nếu có và các lưu ý trước khi nhận xe.</p>
        <div class="cm-static-fallback-links">
          <a href="${escapeHtml(plannerHref)}">Mở form lập kế hoạch</a>
          <a href="${escapeHtml(destinationHref)}">Xem hướng dẫn đi ${escapeHtml(name)}</a>
          <a href="/xe">Xem danh sách xe tự lái</a>
          <a href="/di-dau">Các tuyến gần Hà Nội</a>
        </div>
      </section>
      <section class="cm-static-fallback-section" aria-labelledby="planner-faq">
        <h2 id="planner-faq">Câu hỏi thường gặp khi lập kế hoạch đi ${escapeHtml(name)}</h2>
        <div class="cm-static-fallback-faq">
          <details><summary>Chi phí trên trang có phải báo giá cuối cùng không?</summary><p>Không. Chi phí chỉ giúp khách hình dung ngân sách. Giá cuối cùng phụ thuộc mẫu xe, ngày thuê, thời gian nhận trả, khu vực giao nhận và lịch xe thật.</p></details>
          <details><summary>Car Match có tư vấn xe theo số người không?</summary><p>Có. Khi khách gửi số người, hành lý, điểm đến và thời gian thuê, Car Match sẽ gợi ý nhóm xe phù hợp thay vì chỉ báo một mẫu xe cố định.</p></details>
          <details><summary>Có thể nhận xe tại chung cư trước khi đi ${escapeHtml(name)} không?</summary><p>Có thể nếu lịch xe và khu vực nhận xe phù hợp. Car Match hỗ trợ giao nhận tại sảnh chung cư hoặc điểm hẹn tại Hà Nội trong khung vận hành 7h-22h.</p></details>
        </div>
      </section>`;
}

function renderSpaShell(baseHtml, meta, vehicles = []) {
  let html = baseHtml;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = escapeHtml(meta.canonical);
  const rawImage = meta.image || brandSocialImage;
  const image = escapeHtml(rawImage);
  const usesBrandSocialImage = rawImage === brandSocialImage;
  const imageAlt = escapeHtml(usesBrandSocialImage ? 'Car Match - thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư' : meta.title);
  const preloadImage = escapeHtml(meta.preloadImage || '/brand/carmatch-lockup-navy.png');
  const robots = meta.noIndex
    ? 'noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = replaceOrInsertHead(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`);
  html = replaceOrInsertHead(html, /<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${robots}" />`);
  html = replaceOrInsertHead(html, /<meta name="referrer" content="[^"]*"\s*\/>/, '<meta name="referrer" content="strict-origin-when-cross-origin" />');
  html = replaceOrInsertHead(html, /<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceOrInsertHead(html, /<link rel="alternate" hreflang="vi-VN" href="[^"]*"\s*\/>/, `<link rel="alternate" hreflang="vi-VN" href="${canonical}" />`);
  html = replaceOrInsertHead(html, /<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/>/, `<link rel="alternate" hreflang="x-default" href="${canonical}" />`);
  html = replaceOrInsertHead(html, /<link rel="preload" as="image" href="[^"]*"\s*\/>/, `<link rel="preload" as="image" href="${preloadImage}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:type" content="[^"]*"\s*\/>/, '<meta property="og:type" content="website" />');
  html = replaceOrInsertHead(html, /<meta property="og:site_name" content="[^"]*"\s*\/>/, '<meta property="og:site_name" content="Car Match" />');
  html = replaceOrInsertHead(html, /<meta property="og:locale" content="[^"]*"\s*\/>/, '<meta property="og:locale" content="vi_VN" />');
  html = replaceOrInsertHead(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${image}" />`);
  html = replaceOrInsertHead(html, /<meta property="og:image:alt" content="[^"]*"\s*\/>/, `<meta property="og:image:alt" content="${imageAlt}" />`);
  if (usesBrandSocialImage) {
    html = replaceOrInsertHead(html, /<meta property="og:image:width" content="[^"]*"\s*\/>/, '<meta property="og:image:width" content="1200" />');
    html = replaceOrInsertHead(html, /<meta property="og:image:height" content="[^"]*"\s*\/>/, '<meta property="og:image:height" content="630" />');
    html = replaceOrInsertHead(html, /<meta property="og:image:type" content="[^"]*"\s*\/>/, '<meta property="og:image:type" content="image/png" />');
  } else {
    html = html
      .replace(/\s*<meta property="og:image:width" content="[^"]*"\s*\/>/, '')
      .replace(/\s*<meta property="og:image:height" content="[^"]*"\s*\/>/, '')
      .replace(/\s*<meta property="og:image:type" content="[^"]*"\s*\/>/, '');
  }
  html = replaceOrInsertHead(html, /<meta name="twitter:card" content="[^"]*"\s*\/>/, '<meta name="twitter:card" content="summary_large_image" />');
  html = replaceOrInsertHead(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`);
  html = replaceOrInsertHead(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`);
  html = replaceOrInsertHead(html, /<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${image}" />`);
  html = replaceOrInsertHead(html, /<meta name="twitter:image:alt" content="[^"]*"\s*\/>/, `<meta name="twitter:image:alt" content="${imageAlt}" />`);
  if (meta.structuredData) {
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>`,
    );
  }

  if (meta.path === '/') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, prerenderedHomeRoot || rootStaticShell(vehicles));
  } else if (meta.path === '/xe') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, fleetStaticShell(vehicles));
  } else if (meta.path === '/thue-xe-thang') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, monthlyStaticShell(vehicles));
  } else if (meta.path === '/lien-he') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, contactStaticShell());
  } else if (meta.path === '/gioi-thieu') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, aboutStaticShell());
  } else if (meta.path === '/chinh-sach') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, policyStaticShell());
  } else if (meta.path === '/faq') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, faqStaticShell());
  } else if (meta.path === '/hop-tac') {
    html = moveStylesheetsBeforeModuleScripts(html);
    html = replaceOrInsertHead(html, /<style data-critical-home>[\s\S]*?<\/style>/, rootCriticalCss());
    html = html.replace(/<div id="root"><\/div>/, partnerStaticShell());
  } else if (meta.staticH1 || meta.staticLead) {
    html = html.replace(/<style data-critical-home>[\s\S]*?<\/style>/, '');
    html = html.replace(
      '</head>',
      `<style data-static-fallback>
        .cm-static-fallback{background:#f8fafc;color:#0f172a;font-family:"Be Vietnam Pro",Inter,Arial,sans-serif;min-height:62vh;padding:84px 20px}
        .cm-static-fallback-inner{margin:0 auto;max-width:920px}
        .cm-static-fallback-eyebrow,.cm-static-fallback-kicker{color:#11163e;font-size:12px;font-weight:950;letter-spacing:.14em;margin:0 0 14px;text-transform:uppercase}
        .cm-static-fallback h1{font-size:clamp(36px,6vw,64px);letter-spacing:0;line-height:1.02;margin:0 0 18px}
        .cm-static-fallback h2{color:#111827;font-size:clamp(24px,4vw,34px);line-height:1.18;margin:0 0 14px}
        .cm-static-fallback p,.cm-static-fallback li,.cm-static-fallback dd{color:#475569;font-size:17px;font-weight:650;line-height:1.72;margin:0;max-width:760px}
        .cm-static-fallback-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
        .cm-static-fallback-btn{align-items:center;border-radius:999px;display:inline-flex;font-weight:900;justify-content:center;padding:13px 18px;text-decoration:none}
        .cm-static-fallback-btn.primary{background:#11163e;color:white}
        .cm-static-fallback-btn.secondary{background:white;border:1px solid #cbd5e1;color:#0f172a}
        .cm-static-fallback-section{margin:26px auto 0;max-width:1080px}
        .cm-static-fallback-grid{display:grid;gap:18px;grid-template-columns:repeat(2,minmax(0,1fr))}
        .cm-static-fallback-section article,.cm-static-fallback-faq details{background:white;border:1px solid #e2e8f0;border-radius:8px;padding:22px}
        .cm-static-fallback-facts{display:grid;gap:10px;margin:0}
        .cm-static-fallback-facts div{border-bottom:1px solid #e5e7eb;padding-bottom:10px}
        .cm-static-fallback-facts dt{color:#64748b;font-size:12px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}
        .cm-static-fallback-facts dd{color:#111827;font-weight:900;margin:3px 0 0}
        .cm-static-fallback-list{margin:0;padding-left:22px}
        .cm-static-fallback-list li+li{margin-top:8px}
        .cm-static-fallback-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
        .cm-static-fallback-links a{background:#eef2ff;border:1px solid #dbe3ff;border-radius:999px;color:#11163e;font-size:13px;font-weight:900;padding:9px 12px;text-decoration:none}
        .cm-static-fallback-faq{display:grid;gap:10px}
        .cm-static-fallback-faq summary{color:#111827;cursor:pointer;font-size:17px;font-weight:950}
        .cm-static-fallback-faq p{font-size:15px;margin-top:10px}
        @media(max-width:760px){.cm-static-fallback{padding:52px 16px}.cm-static-fallback-grid{grid-template-columns:1fr}.cm-static-fallback-actions{flex-direction:column}.cm-static-fallback-btn{width:100%}}
      </style>
  </head>`,
    );
    html = html.replace(/<div id="root"><\/div>/, staticFallbackRoot(meta));
  } else {
    html = html.replace(/<style data-critical-home>[\s\S]*?<\/style>/, '');
    html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<script/, '<div id="root"></div>\n    <script');
  }

  return html;
}

async function writeSpaShell(baseHtml, meta, vehicles = []) {
  const routePath = meta.path === '/' ? '' : meta.path.replace(/^\/+/, '');
  const outputDir = path.join(distDir, routePath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), renderSpaShell(baseHtml, meta, vehicles), 'utf8');
}

async function writeHtmlRoute(routePath, html) {
  const cleanPath = routePath === '/' ? '' : routePath.replace(/^\/+/, '');
  const outputDir = path.join(distDir, cleanPath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  if (cleanPath) {
    const cleanUrlFile = path.join(distDir, `${cleanPath}.html`);
    await mkdir(path.dirname(cleanUrlFile), { recursive: true });
    await writeFile(cleanUrlFile, html, 'utf8');
  }
}

async function writeStaticRouteShells(vehicles) {
  const baseHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
  await writeFile(path.join(distDir, 'static-shell.css'), minifyCss(staticShellCss()), 'utf8');
  prerenderedHomeRoot = '';
  prerenderedFleetRoot = '';
  prerenderedMonthlyRoot = '';
  prerenderedContactRoot = '';

  try {
    prerenderedHomeRoot = await renderReactHomeRoot(vehicles);
  } catch (error) {
    console.warn(`Skipped React home prerender: ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const meta of routeMeta) {
    const isPlannerDetail = String(meta.path || '').startsWith('/lap-ke-hoach-chuyen-di/');
    const plannerSlug = isPlannerDetail ? String(meta.path).split('/').filter(Boolean).pop() : '';
    await writeSpaShell(baseHtml, {
      ...meta,
      staticH1: staticH1FromTitle(meta.title),
      staticLead: meta.description,
      ...(isPlannerDetail ? {
        staticExtraHtml: plannerDetailStaticHtml(meta),
        staticPrimaryHref: `${meta.path}?diem-den=${plannerSlug}#trip-form`,
        staticPrimaryLabel: 'Mở form lập kế hoạch',
        staticSecondaryHref: 'https://zalo.me/0975563290',
        staticSecondaryLabel: 'Nhắn Zalo kiểm tra xe',
      } : {}),
      structuredData: routeStructuredData(meta, vehicles),
    }, vehicles);
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
      staticH1: `Thuê ${name} tự lái tại Hà Nội`,
      staticLead: vehicleDescription(vehicle),
      staticExtraHtml: vehicleStaticDetailHtml(vehicle),
      staticPrimaryHref: 'https://zalo.me/0975563290',
      staticPrimaryLabel: 'Hỏi xe qua Zalo',
      staticSecondaryHref: '/xe',
      staticSecondaryLabel: 'Xem xe khác',
      structuredData: vehicleStructuredData(vehicle),
    });
  }

  const reservedVehicleSlugs = new Set(vehicles.map((vehicle) => vehicle.slug));
  const writtenAliases = new Set();
  for (const vehicle of vehicles) {
    const aliases = Array.isArray(vehicle.slugAliases) ? vehicle.slugAliases : [];
    for (const alias of aliases) {
      if (!alias || reservedVehicleSlugs.has(alias) || writtenAliases.has(alias)) continue;
      writtenAliases.add(alias);
      const name = getVehicleName(vehicle);
      await writeSpaShell(baseHtml, {
        path: `/xe/${alias}`,
        title: `Thuê ${name} Tự Lái Hà Nội | Car Match`,
        description: vehicleDescription(vehicle),
        canonical: `${siteUrl}/xe/${vehicle.slug}`,
        image: getVehicleImage(vehicle),
        staticH1: `Thuê ${name} tự lái tại Hà Nội`,
        staticLead: vehicleDescription(vehicle),
        staticExtraHtml: vehicleStaticDetailHtml(vehicle),
        staticPrimaryHref: 'https://zalo.me/0975563290',
        staticPrimaryLabel: 'Hỏi xe qua Zalo',
        staticSecondaryHref: '/xe',
        staticSecondaryLabel: 'Xem xe khác',
        structuredData: vehicleStructuredData(vehicle),
      });
    }
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

function layout({ title, description, canonical, image, type = 'article', body, structuredData, publishedAt }) {
  const ogImage = image || brandSocialImage;
  const socialImageMeta = ogImage === brandSocialImage
    ? '<meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:type" content="image/png" />'
    : '';
  const articleMeta = type === 'article' && publishedAt
    ? `<meta property="article:published_time" content="${escapeHtml(publishedAt)}" />
    <meta property="article:modified_time" content="${escapeHtml(publishedAt)}" />
    <meta property="article:publisher" content="https://www.facebook.com/carmatchvn" />`
    : '';

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#11163e" />
    <meta name="robots" content="index, follow" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="vi-VN" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:site_name" content="Car Match" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="vi_VN" />
    ${articleMeta}
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(type === 'website' ? 'Car Match - thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư' : title)}" />
    ${socialImageMeta}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(type === 'website' ? 'Car Match - thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư' : title)}" />
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
      .article img { border-radius: 8px; height: auto; max-width: 100%; }
      .button { background: #11163e; border-radius: 999px; color: #fff; display: inline-flex; margin-top: 8px; padding: 13px 22px; }
      .cta-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
      .button.secondary { background: #fff; border: 1px solid #cbd5e1; color: #11163e; }
      .empty-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; grid-column: 1 / -1; padding: 24px; }
      .empty-panel p { font-size: 16px; margin: 0; }
      .blog-index-main { max-width: 1180px; padding-top: 56px; }
      .blog-index-hero { border-bottom: 1px solid #e5e7eb; display: grid; gap: 28px; grid-template-columns: minmax(0, 1fr) 320px; margin-bottom: 32px; padding-bottom: 34px; }
      .blog-index-hero h1 { font-size: clamp(36px, 6vw, 66px); line-height: 1.02; margin: 12px 0 18px; max-width: 820px; }
      .blog-index-hero p:not(.eyebrow) { max-width: 760px; margin: 0; }
      .blog-topic-panel { align-self: end; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; }
      .blog-topic-title { color: #111827; font-size: 13px; font-weight: 900; letter-spacing: .08em; line-height: 1.2; margin: 0 0 12px; text-transform: uppercase; }
      .blog-topic-list { display: flex; flex-wrap: wrap; gap: 8px; }
      .blog-topic-list a { background: #eef2ff; border: 1px solid #dbe3ff; border-radius: 999px; font-size: 13px; padding: 8px 10px; white-space: nowrap; }
      .blog-grid { display: grid; gap: 22px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 0; }
      .blog-card { display: grid; grid-template-rows: auto 1fr; overflow: hidden; transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease; }
      .blog-card:hover { border-color: #cbd5e1; box-shadow: 0 18px 38px rgba(15,23,42,.08); transform: translateY(-2px); }
      .blog-thumb { aspect-ratio: 16 / 9; background: #eef2f7; overflow: hidden; width: 100%; }
      .blog-thumb img { display: block; height: 100%; object-fit: cover; width: 100%; }
      .blog-card .card-body { display: flex; flex-direction: column; gap: 12px; padding: 22px; }
      .pill { align-self: flex-start; background: #eef2ff; border: 1px solid #dbe3ff; border-radius: 999px; color: #11163e; font-size: 12px; font-weight: 900; padding: 5px 10px; }
      .blog-card h2 { font-size: 22px; line-height: 1.25; margin: 0; }
      .blog-card p { font-size: 15px; line-height: 1.65; margin: 0; }
      .blog-card p:not(.meta) { -webkit-box-orient: vertical; -webkit-line-clamp: 3; display: -webkit-box; overflow: hidden; }
      .blog-card .meta { margin-top: auto; text-transform: none; letter-spacing: 0; }
      .hub-section { margin-top: 46px; }
      .hub-heading { max-width: 760px; }
      .hub-heading h2, .hub-split h2, .hub-cta h2 { font-size: clamp(26px, 4vw, 38px); line-height: 1.14; margin: 10px 0 12px; }
      .guide-grid, .faq-grid { display: grid; gap: 18px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 22px; }
      .guide-card, .faq-card, .hub-cta { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 22px; }
      .guide-card h3, .faq-card h3 { font-size: 20px; line-height: 1.25; margin: 0 0 10px; }
      .guide-card p, .faq-card p, .hub-cta p, .step-list li { font-size: 16px; line-height: 1.72; }
      .guide-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      .guide-links a { background: #f8fafc; border: 1px solid #dbe3ff; border-radius: 999px; font-size: 13px; padding: 8px 10px; }
      .hub-split { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1.4fr) minmax(280px, .6fr); }
      .step-list { margin: 18px 0 0; padding-left: 24px; }
      .step-list li + li { margin-top: 10px; }
      .hub-cta { background: #eef0f8; border-color: #d4d8ef; position: sticky; top: 92px; }
      .hub-cta .button { align-items: center; border: 1px solid #11163e; justify-content: center; }
      .hub-cta .button.secondary { border-color: #cbd5e1; }
      .cm-static-mobile-conversion { display: none; }
      @media (max-width: 920px) { .blog-index-hero, .guide-grid, .faq-grid, .hub-split { grid-template-columns: 1fr; } .blog-topic-panel, .hub-cta { position: static; } }
      @media (max-width: 900px) { .nav { padding: 0 16px; } .navlinks a:nth-child(2), .navlinks a:nth-child(3), .navlinks a:nth-child(4) { display: none; } .nav-cta { display: none; } }
      @media (max-width: 700px) { .blog-grid { grid-template-columns: 1fr; } .blog-card h2 { font-size: 20px; } }
      @media (max-width: 640px) { body { padding-bottom: 96px; } main { padding: 44px 16px 64px; } .blog-index-main { padding-top: 34px; } p, li { font-size: 16px; } .article { border-radius: 0; margin-left: -16px; margin-right: -16px; } .article h1 { font-size: clamp(31px, 9vw, 36px); line-height: 1.08; } .article h2 { font-size: 25px; } .article h3 { font-size: 20px; } .article p, .article li { line-height: 1.72; } .brand img { height: 32px; } .navlinks { gap: 16px; margin-left: auto; } .navlinks a { display: none; } .navlinks a:first-child, .navlinks a:last-child { display: inline-flex; } .blog-index-hero { display: block; margin-bottom: 24px; padding-bottom: 28px; } .blog-index-hero h1 { font-size: clamp(34px, 11vw, 42px); } .blog-topic-panel { margin-top: 20px; padding: 16px; } .blog-topic-list { gap: 7px; } .blog-topic-list a { font-size: 12px; padding: 7px 9px; } .blog-grid { gap: 18px; } .blog-card .card-body { gap: 10px; padding: 18px; } .blog-card h2 { font-size: 19px; } .blog-card p { font-size: 14.5px; line-height: 1.55; } .blog-card .meta { font-size: 12.5px; } .hub-section { margin-top: 34px; } .guide-grid, .faq-grid { gap: 12px; } .guide-card, .faq-card, .hub-cta { padding: 18px; } .cta { border-radius: 8px; padding: 22px 18px; } .cta h2 { font-size: 24px; } .cta-actions { display: grid; } .cta .button { justify-content: center; margin-top: 0; } .cm-static-mobile-conversion { background: rgba(255,255,255,.97); border-top: 1px solid #dbe4ef; bottom: 0; box-shadow: 0 -14px 34px rgba(15,23,42,.12); display: block; left: 0; padding: 8px 12px max(8px, env(safe-area-inset-bottom)); position: fixed; right: 0; z-index: 90; } .cm-static-mobile-conversion-row { display: grid; gap: 8px; grid-template-columns: 1fr 1.25fr; } .cm-static-mobile-conversion a { align-items: center; border: 1px solid #dbe4ef; border-radius: 8px; color: #11163e; display: flex; font-size: 14px; font-weight: 950; height: 48px; justify-content: center; } .cm-static-mobile-conversion a.primary { background: #11163e; border-color: #11163e; color: #fff; } .cm-static-mobile-conversion p { color: #64748b; font-size: 11px; font-weight: 850; line-height: 1.2; margin: 5px 0 0; text-align: center; } }
    </style>
  </head>
  <body>
    <header class="topbar">
      <nav class="nav" aria-label="Điều hướng chính">
        <a class="brand" href="/" aria-label="Car Match">
          <img src="/brand/carmatch-lockup-navy.png" alt="Car Match" width="288" height="66" decoding="async" />
        </a>
        <div class="nav-center">
          <div class="navlinks">
            <a href="/xe">Thuê xe tự lái</a>
            <a href="/di-dau">Đi đâu</a>
            <a href="/lap-ke-hoach-chuyen-di">Lập chuyến đi</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/hop-tac">Hợp tác chủ xe</a>
            <a href="/gioi-thieu">Giới thiệu</a>
            <a href="/lien-he">Liên hệ</a>
            <a class="active" href="/blog">Blog</a>
          </div>
          <a class="nav-cta" href="https://zalo.me/0975563290" rel="me noopener noreferrer">Đặt xe qua Zalo</a>
        </div>
      </nav>
    </header>
    ${normalizeBrandText(body)}
    ${staticMobileConversionBar(type === 'website' ? 'blog_index' : 'blog_post', 'Hỏi thuê xe')}
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
  return post.mainImageUrl || brandSocialImage;
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
    body: `<main class="blog-index-main">
      <section class="blog-index-hero">
        <div>
          <p class="eyebrow">Blog Car Match</p>
          <h1>Kinh nghiệm thuê xe tự lái Hà Nội</h1>
          <p>${escapeHtml(blogMeta.description)}</p>
        </div>
        <aside class="blog-topic-panel" aria-label="Chủ đề nổi bật">
          <p class="blog-topic-title">Tìm nhanh</p>
          <div class="blog-topic-list">
            <a href="/xe">Danh sách xe</a>
            <a href="/thue-xe-thang">Thuê xe tháng</a>
            <a href="/di-dau">Lịch trình đi chơi</a>
            <a href="/faq">Câu hỏi thường gặp</a>
          </div>
        </aside>
      </section>
      <section class="blog-grid" aria-label="Danh sách bài viết">
        ${posts.length ? posts.map((post) => `<a class="card blog-card" href="/blog/${escapeHtml(post.slug.current)}">
          ${post.mainImageUrl ? `<div class="blog-thumb"><img src="${escapeHtml(optimizedStaticImageUrl(post.mainImageUrl, 720, 62))}" srcset="${escapeHtml(optimizedStaticImageSrcSet(post.mainImageUrl, [480, 720, 960], 62))}" sizes="(min-width: 1024px) 50vw, 100vw" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async" width="720" height="405" /></div>` : ''}
          <div class="card-body">
            ${(post.categories || []).length ? `<span class="pill">${escapeHtml(post.categories[0])}</span>` : ''}
            <h2>${escapeHtml(post.title)}</h2>
            <p>${escapeHtml(post.excerpt || '')}</p>
            <p class="meta">${escapeHtml(post.author || 'Car Match')}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''}</p>
          </div>
        </a>`).join('\n') : '<div class="empty-panel"><p>Các bài viết chuyên sâu đang được Car Match biên tập và sẽ xuất hiện tại đây khi được đăng chính thức. Trong lúc chờ bài mới, bạn có thể xem nhanh các hướng dẫn nền tảng bên dưới.</p></div>'}
      </section>
      ${renderBlogHubContent()}
    </main>`,
    structuredData: [
      organizationData(),
      webSiteData(),
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        '@id': `${blogMeta.canonical}#blog`,
        name: blogMeta.title,
        description: blogMeta.description,
        url: blogMeta.canonical,
        inLanguage: 'vi-VN',
        publisher: publisherData(),
        blogPost: posts.map((post) => ({
          '@type': 'BlogPosting',
          headline: post.title,
          description: postDescription(post),
          url: postUrl(post),
          image: [postImage(post)],
          datePublished: post.publishedAt,
          dateModified: post.publishedAt,
          author: publisherData(),
          publisher: publisherData(),
        })),
      },
      breadcrumbData([
        { name: 'Trang chủ', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${blogMeta.canonical}#faq`,
        mainEntity: blogHubFaqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  });
}

function renderPost(post, contentIndex) {
  const title = postTitleOverrides[post.slug.current] || `${post.seoTitle || post.title} | Car Match`;
  const description = postDescription(post);
  const canonical = postUrl(post);
  const image = postImage(post);
  const bodyHtml = post.bodyHtml ? optimizeStaticBodyImages(normalizeCustomerText(post.bodyHtml), post.title) : '';
  const hasInlineBodyImages = /<img\b/i.test(bodyHtml);

  return layout({
    title,
    description,
    canonical,
    image,
    publishedAt: post.publishedAt,
    body: `<main>
      <article class="article">
        ${(post.categories || []).length ? `<p class="eyebrow">${escapeHtml(post.categories.join(' / '))}</p>` : ''}
        <h1>${escapeHtml(post.title)}</h1>
        <p class="meta">${escapeHtml(postAuthor(post))}${post.publishedAt ? ` · ${escapeHtml(formatDate(post.publishedAt))}` : ''}</p>
        ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
        ${post.mainImageUrl && !hasInlineBodyImages ? `<img class="hero" src="${escapeHtml(optimizedStaticImageUrl(post.mainImageUrl, 1200, 68))}" srcset="${escapeHtml(optimizedStaticImageSrcSet(post.mainImageUrl, [720, 960, 1200, 1600], 68))}" sizes="(min-width: 1024px) 760px, 100vw" alt="${escapeHtml(post.title)}" loading="eager" decoding="async" fetchpriority="high" width="1200" height="675" />` : ''}
        ${bodyHtml || renderPortableText(post.body)}
        ${renderInternalLinks(post, contentIndex)}
        ${renderPostCta(post)}
      </article>
    </main>`,
    structuredData: [
      organizationData(),
      webSiteData(),
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        headline: post.title,
        description,
        url: canonical,
        mainEntityOfPage: canonical,
        isPartOf: { '@id': `${siteUrl}/#website` },
        image: [image],
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: publisherData(),
        publisher: publisherData(),
        inLanguage: 'vi-VN',
      },
      breadcrumbData([
        { name: 'Trang chủ', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug.current}` },
      ]),
    ],
  });
}

function renderSitemap(posts, vehicles) {
  const urls = [
    ...routeMeta.map((meta) => ({
      loc: meta.canonical,
      priority: meta.priority,
      changefreq: meta.changefreq,
      lastmod: meta.lastmod || homeLastModified,
    })),
    ...generatedTripDestinations.map((destination) => ({
      loc: `${siteUrl}/di-dau/${destination.slug}`,
      priority: '0.78',
      changefreq: 'weekly',
    })),
    ...fallbackTravelCollections.map((collection) => ({
      loc: `${siteUrl}/di-dau/chu-de/${collection.slug}`,
      priority: '0.76',
      changefreq: 'weekly',
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
  const uniqueUrls = [...new Map(urls.map((url) => [url.loc, url])).values()];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((url) => `  <url>
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
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="vi-VN" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Car Match" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(heroImage)}" />
    <meta property="og:image:alt" content="Thuê xe tự lái Hà Nội tại Car Match" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(heroImage)}" />
    <meta name="twitter:image:alt" content="Thuê xe tự lái Hà Nội tại Car Match" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="preload" as="image" href="/brand/carmatch-lockup-navy.png" />
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
        <a class="brand" href="/"><img src="/brand/carmatch-lockup-navy.png" alt="Car Match" width="288" height="66" decoding="async" /></a>
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
            <img src="${escapeHtml(optimizedStaticImageUrl(heroImage, 960, 68))}" alt="Thuê xe tự lái Hà Nội cho cư dân chung cư và gia đình trẻ" loading="eager" decoding="async" fetchpriority="high" width="960" height="640" />
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
    <footer><img src="/brand/carmatch-lockup-white.png" alt="Car Match" width="288" height="66" decoding="async" style="height:38px;width:auto" /><p>Thuê xe tự lái Hà Nội · giao xe tận sảnh chung cư/khu đô thị</p></footer>
  </body>
</html>`;
}

function spaAssetTags() {
  if (!spaBaseHtml) return '';
  return (
    spaBaseHtml.match(/<script type="module"[\s\S]*?<\/script>|<link rel="stylesheet"[\s\S]*?>/g) || []
  ).join('\n    ');
}

function renderSeoLandingLayout({ title, description, canonical, structuredData, active = '', body }) {
  const normalizedTitle = normalizeBrandText(title);
  const normalizedDescription = normalizeBrandText(description);
  const normalizedStructuredData = normalizeBrandText(JSON.stringify(structuredData));
  const appAssets = spaAssetTags();
  const rootAttributes = appAssets ? ' id="root" data-static-shell="seo-landing"' : '';

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f8fafc" />
    <meta name="robots" content="index, follow" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <title>${escapeHtml(normalizedTitle)}</title>
    <meta name="description" content="${escapeHtml(normalizedDescription)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="vi-VN" href="${escapeHtml(canonical)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Car Match" />
    <meta property="og:title" content="${escapeHtml(normalizedTitle)}" />
    <meta property="og:description" content="${escapeHtml(normalizedDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(brandSocialImage)}" />
    <meta property="og:image:alt" content="Car Match - thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(normalizedTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(normalizedDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(brandSocialImage)}" />
    <meta name="twitter:image:alt" content="Car Match - thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư" />
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
    ${appAssets}
  </head>
  <body>
    <div${rootAttributes}>
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" href="/"><img src="/brand/carmatch-lockup-navy.png" alt="Car Match" width="288" height="66" decoding="async" /></a>
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
    <footer><img src="/brand/carmatch-lockup-white.png" alt="Car Match" width="288" height="66" decoding="async" style="height:38px;width:auto" /><p>Car Match · thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư/khu đô thị</p></footer>
    </div>
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
          ${destinations[0]?.imageUrl ? `<img src="${escapeHtml(optimizedStaticImageUrl(destinations[0].imageUrl, 960, 68))}" alt="Đi ${escapeHtml(destinations[0].name)} bằng xe tự lái" loading="eager" decoding="async" fetchpriority="high" width="960" height="640" />` : `<div style="min-height:440px;background:linear-gradient(135deg,#0f766e,#0f172a)"></div>`}
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
            ${destination.imageUrl ? `<img class="route-card-image" src="${escapeHtml(optimizedStaticImageUrl(destination.imageUrl, 720, 62))}" alt="Đi ${escapeHtml(destination.name)} bằng xe tự lái" loading="lazy" decoding="async" width="720" height="480" />` : `<span class="route-card-image"></span>`}
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
            <a href="/di-dau/chu-de/xe-7-cho-di-tinh">Thuê xe 7 chỗ</a>
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
  if (destination.slug === 'trang-an-tam-coc') {
    return 'Đi Tràng An/Tam Cốc Tự Lái | Car Match';
  }
  return destination.seoTitle || `Đi ${destination.name} Tự Lái - Lịch Trình & Chi Phí | Car Match`;
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
  const plannerHref = tripPlannerHref(destination);

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
            <a class="btn primary" href="${escapeHtml(plannerHref)}">Tính chi phí tuyến này</a>
            <a class="btn secondary" href="https://zalo.me/0975563290">Nhắn Zalo đặt xe đi ${escapeHtml(destination.name)}</a>
            <a class="btn secondary" href="/xe">Xem xe phù hợp</a>
          </div>
          <div class="metric-grid">
            <div class="metric"><strong>${roundTripKm} km</strong><span>ước tính hai chiều</span></div>
            <div class="metric"><strong>${escapeHtml(destination.duration || 'Theo lịch')}</strong><span>thời gian nên đi</span></div>
            <div class="metric"><strong>${formatVnd(mobilityEstimate)}</strong><span>xăng/sạc + phí đường</span></div>
          </div>
        </div>
        <aside class="panel">
          ${destination.imageUrl ? `<img class="panel-image" src="${escapeHtml(optimizedStaticImageUrl(destination.imageUrl, 960, 68))}" alt="Đi ${escapeHtml(destination.name)} bằng xe tự lái" loading="eager" decoding="async" fetchpriority="high" width="960" height="640" />` : ''}
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
              <a href="/di-dau/chu-de/xe-7-cho-di-tinh">Thuê xe 7 chỗ</a>
              <a href="${escapeHtml(plannerHref)}">Lập kế hoạch tuyến này</a>
            </div>
          </div>
          <aside class="card dark">
            <h2>Muốn Car Match kiểm tra xe trống?</h2>
            <p>Gửi ngày đi, số người, điểm nhận xe và nhu cầu hành lý. Car Match kiểm tra lịch xe thật rồi báo phương án phù hợp.</p>
            <div class="actions">
              <a class="btn primary" href="https://zalo.me/0975563290">Nhắn Zalo</a>
              <a class="btn secondary" href="${escapeHtml(plannerHref)}">Tính chuyến đi</a>
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
              <a href="/di-dau/chu-de/xe-7-cho-di-tinh">Thuê xe 7 chỗ</a>
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
  const travelDestinations = mergeBySlug(destinations, fallbackTripDestinations);
  generatedTripDestinations = travelDestinations;
  const baseHtml = await readFile(path.join(distDir, 'index.html'), 'utf8');
  spaBaseHtml = baseHtml;
  const contentIndex = {
    destinationNames: new Map(travelDestinations.map((destination) => [destination.slug, destination.name])),
    postTitles: new Map(posts.map((post) => [post.slug.current, post.title])),
  };

  await writeStaticRouteShells(vehicles);
  await writeStaticVehicleData(vehicles);
  await writeStaticBlogData(posts);

  await mkdir(path.join(distDir, 'thue-xe-tu-lai-ha-noi'), { recursive: true });
  await writeFile(path.join(distDir, 'thue-xe-tu-lai-ha-noi', 'index.html'), renderHanoiLanding(), 'utf8');

  await writeHtmlRoute('/di-dau', renderGoWhereLanding());
  await writeHtmlRoute('/lap-ke-hoach-chuyen-di', renderTripPlannerLanding());

  for (const destination of travelDestinations) {
    await writeHtmlRoute(`/di-dau/${destination.slug}`, renderDestinationLanding(destination));
  }

  for (const collection of fallbackTravelCollections) {
    await writeHtmlRoute(`/di-dau/chu-de/${collection.slug}`, renderCollectionLanding(collection));
  }

  await writeHtmlRoute('/blog', renderBlogIndex(posts));

  for (const post of posts) {
    await writeHtmlRoute(`/blog/${post.slug.current}`, renderPost(post, contentIndex));
  }

  await writeFile(path.join(distDir, 'sitemap.xml'), renderSitemap(posts, vehicles), 'utf8');
  await writeFile(
    path.join(distDir, 'robots.txt'),
    [
      'User-agent: *',
      'Allow: /',
      'Allow: /blog',
      '',
      'User-agent: GPTBot',
      'Allow: /',
      '',
      'User-agent: OAI-SearchBot',
      'Allow: /',
      '',
      'User-agent: ChatGPT-User',
      'Allow: /',
      '',
      'User-agent: ClaudeBot',
      'Allow: /',
      '',
      'User-agent: PerplexityBot',
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
