export interface SeoSchemaConfig {
  siteUrl: string;
  brandName?: string;
  logoUrl?: string;
  iconUrl?: string;
  socialProfiles?: string[];
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

const defaultConfig: SeoSchemaConfig = {
  siteUrl: 'https://www.carmatch.vn',
  brandName: 'Car Match',
  logoUrl: 'https://www.carmatch.vn/brand/carmatch-lockup-navy.png',
  iconUrl: 'https://www.carmatch.vn/brand/carmatch-logo-stacked-navy.png',
  socialProfiles: [
    'https://zalo.me/0975563290',
    'https://www.facebook.com/carmatchvn',
    'https://www.instagram.com/carmatchvn/',
  ],
  telephone: '+84975563290',
  email: 'info@carmatch.vn',
  address: {
    streetAddress: '38 Sunrise H, The Manor Central Park, Định Công',
    addressLocality: 'Hà Nội',
    postalCode: '10000',
    addressCountry: 'VN',
  },
};

function cfg(config: SeoSchemaConfig = defaultConfig): Required<SeoSchemaConfig> {
  return {
    ...defaultConfig,
    ...config,
    address: {
      ...defaultConfig.address,
      ...config.address,
    },
  } as Required<SeoSchemaConfig>;
}

function pageUrl(config: SeoSchemaConfig, path: string): string {
  const c = cfg(config);
  if (/^https?:\/\//i.test(path)) return path;
  return `${c.siteUrl}${path === '/' ? '' : path}`;
}

export function safeJsonLdStringify(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildPublisherSchema(config?: SeoSchemaConfig) {
  const c = cfg(config);
  return {
    '@type': 'Organization',
    '@id': `${c.siteUrl}/#organization`,
    name: c.brandName,
    url: c.siteUrl,
    sameAs: c.socialProfiles,
    logo: {
      '@type': 'ImageObject',
      url: c.iconUrl,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: c.telephone,
      contactType: 'customer support',
      areaServed: 'VN',
      availableLanguage: ['vi'],
    },
  };
}

export function buildOrganizationSchema(config?: SeoSchemaConfig) {
  const c = cfg(config);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${c.siteUrl}/#organization`,
    name: c.brandName,
    url: c.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: c.iconUrl,
      width: 512,
      height: 512,
    },
    image: c.logoUrl,
    email: c.email,
    telephone: c.telephone,
    sameAs: c.socialProfiles,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: c.telephone,
        contactType: 'customer support',
        areaServed: 'VN',
        availableLanguage: ['vi'],
      },
    ],
  };
}

export function buildWebSiteSchema(config?: SeoSchemaConfig) {
  const c = cfg(config);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${c.siteUrl}/#website`,
    name: c.brandName,
    url: c.siteUrl,
    inLanguage: 'vi-VN',
    publisher: buildPublisherSchema(c),
  };
}

export function buildLocalBusinessSchema(config?: SeoSchemaConfig) {
  const c = cfg(config);
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    '@id': `${c.siteUrl}/#localbusiness`,
    name: `${c.brandName} - The Manor Central Park`,
    alternateName: c.brandName,
    description: 'Dịch vụ thuê xe tự lái tại Hà Nội, giao xe tận sảnh chung cư và khu đô thị.',
    url: c.siteUrl,
    telephone: c.telephone,
    email: c.email,
    image: c.iconUrl,
    logo: c.iconUrl,
    hasMap:
      'https://www.google.com/maps/search/?api=1&query=Car%20Match%20The%20Manor%20Central%20Park%2038%20Sunrise%20H%20Ha%20Noi',
    address: {
      '@type': 'PostalAddress',
      ...c.address,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '07:00',
      closes: '22:00',
    },
    priceRange: '600.000đ - 25.000.000đ',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Chuyển khoản, Tiền mặt',
    areaServed: [
      { '@type': 'Place', name: 'Vinhomes Ocean Park, Gia Lâm, Hà Nội' },
      { '@type': 'Place', name: 'Vinhomes Smart City, Nam Từ Liêm, Hà Nội' },
      { '@type': 'Place', name: 'Vinhomes Times City, Hai Bà Trưng, Hà Nội' },
      { '@type': 'Place', name: 'Ecopark, Văn Giang, Hưng Yên' },
      { '@type': 'Place', name: 'The Manor Central Park, Định Công, Hà Nội' },
    ],
    sameAs: c.socialProfiles,
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[], config?: SeoSchemaConfig) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: pageUrl(config || defaultConfig, item.path),
    })),
  };
}

export function buildImageObjectSchema(url: string, name?: string, width?: number, height?: number) {
  return {
    '@type': 'ImageObject',
    url,
    ...(name ? { name } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

export function buildWebPageSchema(
  meta: { title: string; description: string; canonical: string },
  options: { type?: string; fields?: Record<string, unknown> } = {},
  config?: SeoSchemaConfig,
) {
  const c = cfg(config);
  return {
    '@context': 'https://schema.org',
    '@type': options.type || 'WebPage',
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
    inLanguage: 'vi-VN',
    isPartOf: {
      '@type': 'WebSite',
      name: c.brandName,
      url: c.siteUrl,
    },
    publisher: buildPublisherSchema(c),
    ...options.fields,
  };
}

export function buildServiceSchema(
  meta: { title: string; description: string; canonical: string },
  options: {
    serviceType: string;
    name?: string;
    areaServed?: unknown;
    offers?: unknown;
    fields?: Record<string, unknown>;
  },
  config?: SeoSchemaConfig,
) {
  return buildWebPageSchema(
    meta,
    {
      type: 'Service',
      fields: {
        serviceType: options.serviceType,
        name: options.name || meta.title,
        provider: buildPublisherSchema(config),
        areaServed: options.areaServed,
        offers: options.offers,
        ...options.fields,
      },
    },
    config,
  );
}

export function buildFAQSchema(
  meta: { title: string; canonical: string },
  items: FaqItem[],
  config?: SeoSchemaConfig,
  id?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(id ? { '@id': id } : {}),
    name: meta.title,
    url: meta.canonical,
    inLanguage: 'vi-VN',
    publisher: buildPublisherSchema(config),
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBlogPostingSchema(
  meta: {
    title: string;
    description: string;
    canonical: string;
    image: string;
    publishedAt?: string;
    modifiedAt?: string;
    authorName?: string;
  },
  config?: SeoSchemaConfig,
) {
  const publisher = buildPublisherSchema(config);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${meta.canonical}#article`,
    headline: meta.title,
    description: meta.description,
    url: meta.canonical,
    mainEntityOfPage: meta.canonical,
    isPartOf: { '@id': `${cfg(config).siteUrl}/#website` },
    image: [meta.image],
    datePublished: meta.publishedAt,
    dateModified: meta.modifiedAt || meta.publishedAt,
    author: meta.authorName ? { '@type': 'Person', name: meta.authorName } : publisher,
    publisher,
    inLanguage: 'vi-VN',
  };
}

export function buildProductCarSchema(
  meta: {
    name: string;
    description: string;
    canonical: string;
    image: string;
    brand?: string;
    category?: string;
    price?: number;
    availability?: string;
    shippingDetails?: unknown;
    returnPolicy?: unknown;
  },
  config?: SeoSchemaConfig,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: meta.name,
    description: meta.description,
    image: [meta.image],
    brand: meta.brand ? { '@type': 'Brand', name: meta.brand } : undefined,
    category: meta.category || 'Xe tự lái',
    url: meta.canonical,
    offers: {
      '@type': 'Offer',
      url: meta.canonical,
      priceCurrency: 'VND',
      price: meta.price || undefined,
      availability: meta.availability || 'https://schema.org/LimitedAvailability',
      seller: buildPublisherSchema(config),
      shippingDetails: meta.shippingDetails,
      hasMerchantReturnPolicy: meta.returnPolicy,
    },
  };
}
