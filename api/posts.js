import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'zwazjo4q',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
});

const postsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
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
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->title,
  author,
  body,
  seoTitle,
  seoDescription
}`;

export default async function handler(req, res) {
  try {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';

    if (slug) {
      const post = await client.fetch(postBySlugQuery, { slug });

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(post);
    }

    const posts = await client.fetch(postsQuery);
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Sanity fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
