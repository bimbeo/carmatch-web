import { fetchPostBySlug } from '../_blog-source.js';

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }
  try {
    const post = await fetchPostBySlug(Array.isArray(slug) ? slug[0] : slug);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(post);
  } catch (error) {
    console.error('Blog fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
}
