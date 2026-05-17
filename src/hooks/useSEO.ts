import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://carmatch.vn';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

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
    const fullTitle = title.includes('CarMatch') ? title : `${title} | CarMatch`;
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', ogImage ?? DEFAULT_IMAGE, 'property');
    setMeta('og:url', canonical ?? (BASE_URL + window.location.pathname), 'property');

    // Twitter
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage ?? DEFAULT_IMAGE);

    // Canonical
    if (canonical) setLink('canonical', canonical);

    // Reset on unmount
    return () => {
      document.title = 'CarMatch — Thuê Xe Tự Lái Hà Nội | Giá Từ 800K/Ngày';
      setMeta('description', 'CarMatch - Thuê xe tự lái Hà Nội. 20+ mẫu xe: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 800K/ngày. Giao xe tận nơi.');
    };
  }, [title, description, canonical, ogImage, noIndex]);
}
