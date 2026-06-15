export function optimizedImageUrl(src: string, width: number, quality = 65): string {
  try {
    const url = new URL(src);

    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(quality));
      return url.toString();
    }

    if (
      url.hostname.endsWith('.supabase.co') &&
      url.pathname.includes('/storage/v1/object/public/')
    ) {
      url.pathname = url.pathname.replace(
        '/storage/v1/object/public/',
        '/storage/v1/render/image/public/',
      );
      url.searchParams.set('width', String(width));
      url.searchParams.set('quality', String(quality));
      url.searchParams.set('resize', 'contain');
      url.searchParams.set('format', 'webp');
      return url.toString();
    }

    if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/upload/')) {
      url.pathname = url.pathname.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
      return url.toString();
    }

    if (
      url.hostname === 'commons.wikimedia.org' &&
      url.pathname.includes('/wiki/Special:Redirect/file/')
    ) {
      url.searchParams.set('width', String(width));
      return url.toString();
    }
  } catch {
    return src;
  }

  return src;
}

export function optimizedImageSrcSet(
  src: string,
  widths: number[],
  quality = 65,
): string {
  return widths
    .map((width) => `${optimizedImageUrl(src, width, quality)} ${width}w`)
    .join(', ');
}
