import { fetchPostBySlug, fetchPosts } from './_blog-source.js';

export default async function handler(req, res) {
  try {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';

    if (slug) {
      const post = await fetchPostBySlug(slug);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(post);
    }

    const posts = await fetchPosts();
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Blog fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
