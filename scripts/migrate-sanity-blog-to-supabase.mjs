import { createClient as createSanityClient } from '@sanity/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const sanity = createSanityClient({
  projectId: 'zwazjo4q',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

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

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    if (!listType || !listItems.length) return;
    const tag = listType === 'number' ? 'ol' : 'ul';
    html.push(`<${tag}>${listItems.map((item) => `<li>${item}</li>`).join('')}</${tag}>`);
    listType = null;
    listItems = [];
  };

  for (const block of blocks) {
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
    if (block.style === 'h2') html.push(`<h2>${content}</h2>`);
    else if (block.style === 'h3') html.push(`<h3>${content}</h3>`);
    else if (block.style === 'blockquote') html.push(`<blockquote><p>${content}</p></blockquote>`);
    else html.push(`<p>${content}</p>`);
  }

  flushList();
  return html.join('\n');
}

function toTipTapDocFromHtml(html) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: html ? 'Bài đã được migrate từ Sanity. Nội dung HTML nằm trong trường content_html.' : '' }],
      },
    ],
  };
}

async function main() {
  const posts = await sanity.fetch(postsQuery);
  if (!posts.length) {
    console.log('No Sanity posts found.');
    return;
  }

  const categoryTitles = [...new Set(posts.flatMap((post) => post.categories || []).filter(Boolean))];
  const categoryRows = categoryTitles.map((title, index) => ({
    slug: slugify(title),
    title,
    status: 'published',
    sort_order: 100 + index,
  }));

  if (categoryRows.length) {
    const { error } = await supabase.from('blog_categories').upsert(categoryRows, { onConflict: 'slug' });
    if (error) throw error;
  }

  const rows = posts.map((post) => {
    const contentHtml = renderPortableText(post.body || []);
    return {
      slug: post.slug.current,
      title: post.title,
      excerpt: post.excerpt || null,
      main_image_url: post.mainImageUrl || null,
      author: post.author || 'CarMatch',
      category_slug: post.categories?.[0] ? slugify(post.categories[0]) : null,
      tags: post.categories || [],
      content_html: contentHtml,
      content_json: toTipTapDocFromHtml(contentHtml),
      seo_title: post.seoTitle || null,
      seo_description: post.seoDescription || null,
      status: 'published',
      published_at: post.publishedAt || new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('blog_posts').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;

  console.log(`Migrated ${rows.length} Sanity posts to Supabase blog_posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
