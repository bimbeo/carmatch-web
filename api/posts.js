import { fetchPostBySlug, fetchPosts } from './_blog-source.js';
import { renderBlogPage } from './_blog-renderer.js';

function setFreshCmsHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
}

export default async function handler(req, res) {
  try {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
    const format = typeof req.query.format === 'string' ? req.query.format : '';

    if (slug) {
      const post = await fetchPostBySlug(slug);

      if (!post) {
        if (format === 'html') return res.status(404).send('Không tìm thấy bài viết.');
        return res.status(404).json({ error: 'Post not found' });
      }

      setFreshCmsHeaders(res);
      if (format === 'html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderBlogPage(post));
      }
      return res.status(200).json(post);
    }

    const posts = await fetchPosts();
    setFreshCmsHeaders(res);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Blog fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
