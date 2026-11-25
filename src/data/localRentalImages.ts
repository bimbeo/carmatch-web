export const LOCAL_RENTAL_MOBILE_HERO_MEDIA = '(max-width: 639px)';
export const LOCAL_RENTAL_MOBILE_HERO_SIZES = 'calc(100vw - 40px)';
export const LOCAL_RENTAL_MOBILE_HERO_WIDTHS = [480, 720, 960];

export function localRentalMobileHeroUrl(coverUrl: string, width: number) {
  return coverUrl.replace(/\.webp$/, `-hero-${width}.webp`);
}

export function localRentalMobileHeroSrcSet(coverUrl: string) {
  if (!/^\/generated\/vehicle-covers\/[^/]+\.webp$/.test(coverUrl)) return undefined;
  return LOCAL_RENTAL_MOBILE_HERO_WIDTHS
    .map((width) => `${localRentalMobileHeroUrl(coverUrl, width)} ${width}w`)
    .join(', ');
}
