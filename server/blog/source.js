import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase blog source is not configured.');
  }
  return supabase;
}

function categoryLabel(slug = '') {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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

async function fetchSupabasePosts() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('blog_posts')
    .select('id, slug, title, excerpt, main_image_url, author, category_slug, tags, content_html, seo_title, seo_description, canonical_url, cta_enabled, cta_title, cta_description, cta_primary_label, cta_primary_url, cta_zalo_label, cta_zalo_url, related_destination_slugs, related_vehicle_links, related_post_slugs, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Supabase blog fetch failed: ${error.message}`);
  }
  return (data || []).map(mapSupabasePost);
}

async function fetchSupabasePost(slug) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('blog_posts')
    .select('id, slug, title, excerpt, main_image_url, author, category_slug, tags, content_html, seo_title, seo_description, canonical_url, cta_enabled, cta_title, cta_description, cta_primary_label, cta_primary_url, cta_zalo_label, cta_zalo_url, related_destination_slugs, related_vehicle_links, related_post_slugs, status, published_at, created_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase blog post fetch failed: ${error.message}`);
  }
  if (!data) return null;

  const post = mapSupabasePost(data);
  const destinationSlugs = post.relatedDestinationSlugs || [];
  const relatedPostSlugs = post.relatedPostSlugs || [];
  const [destinationRes, relatedPostRes] = await Promise.all([
    destinationSlugs.length
      ? client.from('travel_destinations').select('slug, name').in('slug', destinationSlugs)
      : Promise.resolve({ data: [] }),
    relatedPostSlugs.length
      ? client.from('blog_posts').select('slug, title').in('slug', relatedPostSlugs).eq('status', 'published')
      : Promise.resolve({ data: [] }),
  ]);

  return {
    ...post,
    relatedDestinations: destinationRes.data || [],
    relatedPosts: (relatedPostRes.data || []).map((relatedPost) => ({
      ...relatedPost,
      title: normalizeRequiredText(relatedPost.title),
    })),
  };
}

export async function fetchPosts() {
  return fetchSupabasePosts();
}

export async function fetchPostBySlug(slug) {
  return fetchSupabasePost(slug);
}
