import DOMPurify from 'isomorphic-dompurify';

const BLOG_HTML_SANITIZE_CONFIG = {
  ADD_ATTR: ['target', 'rel', 'style', 'srcset', 'sizes', 'loading', 'decoding', 'fetchpriority', 'width', 'height', 'data-caption'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
};

export function sanitizeBlogHtml(value = '') {
  return DOMPurify.sanitize(String(value || ''), BLOG_HTML_SANITIZE_CONFIG);
}
