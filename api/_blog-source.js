import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const sanityClient = createSanityClient({
  projectId: 'zwazjo4q',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

const postsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  "modifiedAt": _updatedAt,
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->title,
  author
}`;

const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  "modifiedAt": _updatedAt,
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
    modifiedAt: row.updated_at || row.published_at || row.created_at,
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

async function fetchSupabasePosts() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, main_image_url, author, category_slug, tags, content_html, seo_title, seo_description, canonical_url, cta_enabled, cta_title, cta_description, cta_primary_label, cta_primary_url, cta_zalo_label, cta_zalo_url, related_destination_slugs, related_vehicle_links, related_post_slugs, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Supabase blog fetch skipped:', error.message);
    return null;
  }
  if (!data?.length) return null;
  return data.map(mapSupabasePost);
}

async function fetchSupabasePost(slug) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, main_image_url, author, category_slug, tags, content_html, seo_title, seo_description, canonical_url, cta_enabled, cta_title, cta_description, cta_primary_label, cta_primary_url, cta_zalo_label, cta_zalo_url, related_destination_slugs, related_vehicle_links, related_post_slugs, status, published_at, created_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) {
    console.warn('Supabase blog post fetch skipped:', error.message);
    return null;
  }
  if (!data) return null;

  const post = mapSupabasePost(data);
  const destinationSlugs = post.relatedDestinationSlugs || [];
  const relatedPostSlugs = post.relatedPostSlugs || [];
  const [destinationRes, relatedPostRes] = await Promise.all([
    destinationSlugs.length
      ? supabase.from('travel_destinations').select('slug, name').in('slug', destinationSlugs)
      : Promise.resolve({ data: [] }),
    relatedPostSlugs.length
      ? supabase.from('blog_posts').select('slug, title').in('slug', relatedPostSlugs).eq('status', 'published')
      : Promise.resolve({ data: [] }),
  ]);

  return {
    ...post,
    relatedDestinations: destinationRes.data || [],
    relatedPosts: relatedPostRes.data || [],
  };
}

export async function fetchPosts() {
  const supabasePosts = await fetchSupabasePosts();
  if (supabasePosts) return supabasePosts;
  return sanityClient.fetch(postsQuery);
}

export async function fetchPostBySlug(slug) {
  const supabasePost = await fetchSupabasePost(slug);
  if (supabasePost) return supabasePost;
  return sanityClient.fetch(postBySlugQuery, { slug });
}
