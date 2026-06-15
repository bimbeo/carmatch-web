import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://www.carmatch.vn';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const BRAND_NAME_PATTERN = /\bcar\s*match\b/i;

export function normalizeBrandName(value: string) {
  return value.replace(/\bCarMatch\b/g, 'Car Match');
}

export function withBrandName(title: string) {
  const normalizedTitle = normalizeBrandName(title);
  return BRAND_NAME_PATTERN.test(normalizedTitle) ? normalizedTitle : `${normalizedTitle} | Car Match`;
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

function removeMeta(name: string, attr: 'name' | 'property' = 'name') {
  document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)?.remove();
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

function setAlternateLink(hreflang: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSEO({ title, description, canonical, ogImage, noIndex }: SEOProps) {
  useEffect(() => {
    const fullTitle = withBrandName(title);
    const normalizedDescription = normalizeBrandName(description);
    const canonicalUrl = canonical ?? (BASE_URL + window.location.pathname);
    const resolvedOgImage = ogImage ?? DEFAULT_IMAGE;
    const usesDefaultOgImage = resolvedOgImage === DEFAULT_IMAGE;
    document.title = fullTitle;

    setMeta('description', normalizedDescription);
    setMeta(
      'robots',
      noIndex
        ? 'noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    // Open Graph
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', 'Car Match', 'property');
    setMeta('og:locale', 'vi_VN', 'property');
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', normalizedDescription, 'property');
    setMeta('og:image', resolvedOgImage, 'property');
    setMeta('og:image:alt', 'Car Match - thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư', 'property');
    if (usesDefaultOgImage) {
      setMeta('og:image:width', '1200', 'property');
      setMeta('og:image:height', '630', 'property');
      setMeta('og:image:type', 'image/png', 'property');
    } else {
      removeMeta('og:image:width', 'property');
      removeMeta('og:image:height', 'property');
      removeMeta('og:image:type', 'property');
    }
    setMeta('og:url', canonicalUrl, 'property');

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', normalizedDescription);
    setMeta('twitter:image', resolvedOgImage);
    setMeta('twitter:image:alt', 'Car Match - thuê xe tự lái Hà Nội, giao xe tận sảnh chung cư');

    // Canonical
    setLink('canonical', canonicalUrl);
    setAlternateLink('vi-VN', canonicalUrl);
    setAlternateLink('x-default', canonicalUrl);

    // Reset on unmount
    return () => {
      document.title = 'Car Match — Thuê Xe Tự Lái Hà Nội | Từ 600K/Ngày';
      setMeta('description', 'Car Match - Thuê xe tự lái Hà Nội. 20+ mẫu xe: VinFast VF8, VF6, Toyota Innova, Kia Carnival. Giá từ 600K/ngày. Giao xe tận nơi.');
    };
  }, [title, description, canonical, ogImage, noIndex]);
}
