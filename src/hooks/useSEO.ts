import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://www.carmatch.vn';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const BRAND_NAME_PATTERN = /\bcar\s*match\b/i;

export function withBrandName(title: string) {
  return BRAND_NAME_PATTERN.test(title) ? title : `${title} | Car Match`;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSEO({ title, description, canonical, ogImage, noIndex }: SEOProps) {
  useEffect(() => {
    const fullTitle = withBrandName(title);
    const canonicalUrl = canonical ?? (BASE_URL + window.location.pathname);
    document.title = fullTitle;

    setMeta('description', description);
    setMeta(
      'robots',
      noIndex
        ? 'noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    // Open Graph
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', ogImage ?? DEFAULT_IMAGE, 'property');
    setMeta('og:url', canonicalUrl, 'property');

    // Twitter
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage ?? DEFAULT_IMAGE);

    // Canonical
    setLink('canonical', canonicalUrl);

    // Reset on unmount
    return () => {
      document.title = 'Car Match — Thuê Xe Tự Lái Hà Nội | Từ 600K/Ngày';
      setMeta('description', 'Car Match - Thuê xe tự lái Hà Nội. 20+ mẫu xe: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 600K/ngày. Giao xe tận nơi.');
    };
  }, [title, description, canonical, ogImage, noIndex]);
}
