import { siteConfig } from '@/data/siteConfig';
import { Product } from '@/types/product';
import { BlogPost } from '@/data/blog-posts';

/**
 * Organization schema using siteConfig company info.
 */
export function getOrganizationSchema() {
  const socialLinks = [
    siteConfig.social.facebook,
    siteConfig.social.instagram,
    siteConfig.social.linkedin,
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.company,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/logo.png`,
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.phone,
        contactType: 'sales',
        email: siteConfig.email,
        availableLanguage: 'English',
        areaServed: 'US',
      },
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.phone,
        contactType: 'customer service',
        email: siteConfig.email,
        availableLanguage: 'English',
        areaServed: 'US',
      },
    ],
    knowsAbout: [
      'Tin tacker signs',
      'Embossed aluminum signs',
      'Custom metal signs',
      'Promotional signage',
      'Brewery signs',
      'Bar signs',
    ],
    ...(socialLinks.length > 0 ? { sameAs: socialLinks } : {}),
  };
}

/**
 * LocalBusiness schema for local search visibility.
 */
export function getLocalBusinessSchema() {
  const socialLinks = [
    siteConfig.social.facebook,
    siteConfig.social.instagram,
    siteConfig.social.linkedin,
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Manufacturer'],
    '@id': `${siteConfig.url}/#localbusiness`,
    name: siteConfig.company,
    alternateName: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    image: `${siteConfig.url}/logo.png`,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude,
    },
    hasMap: `https://www.google.com/maps?q=${siteConfig.geo.latitude},${siteConfig.geo.longitude}`,
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card, Check, Wire Transfer',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
    areaServed: {
      '@type': 'Country',
      name: 'US',
    },
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Product',
        name: 'Custom Embossed Aluminum Tin Tacker Signs',
        category: 'Signs & Displays',
      },
    },
    ...(socialLinks.length > 0 ? { sameAs: socialLinks } : {}),
  };
}

/**
 * Product schema with aggregated pricing offers.
 * Prices in the data are stored in cents; converted to dollars here.
 */
export function getProductSchema(product: Product) {
  const lowestPrice = Math.min(...product.pricingTiers.map((t) => t.pricePerUnit)) / 100;
  const highestPrice = Math.max(...product.pricingTiers.map((t) => t.pricePerUnit)) / 100;
  const shapeLabel = product.shape.replace(/-/g, ' ');

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteConfig.url}/products/${product.slug}#product`,
    name: product.name,
    description: product.longDescription,
    url: `${siteConfig.url}/products/${product.slug}`,
    sku: product.id,
    category: 'Tin Tacker Signs',
    image: product.images.map((img) =>
      img.startsWith('http') ? img : `${siteConfig.url}${img}`
    ),
    brand: {
      '@type': 'Brand',
      name: siteConfig.company,
    },
    manufacturer: {
      '@type': 'Organization',
      '@id': `${siteConfig.url}/#organization`,
      name: siteConfig.company,
    },
    material: product.metadata.material,
    countryOfOrigin: {
      '@type': 'Country',
      name: 'US',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Shape',
        value: shapeLabel,
      },
      {
        '@type': 'PropertyValue',
        name: 'Dimensions',
        value: product.dimensions.displaySize,
      },
      {
        '@type': 'PropertyValue',
        name: 'Print Method',
        value: product.metadata.printMethod,
      },
      {
        '@type': 'PropertyValue',
        name: 'Mounting Holes',
        value: String(product.metadata.mountingHoles),
      },
      {
        '@type': 'PropertyValue',
        name: 'Minimum Order',
        value: `${product.minimumOrder} units`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Lead Time',
        value: `${product.leadTimeDays} business days`,
      },
    ],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: lowestPrice.toFixed(2),
      highPrice: highestPrice.toFixed(2),
      offerCount: product.pricingTiers.length,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.company,
      },
    },
  };
}

/**
 * FAQPage schema from an array of question/answer pairs.
 */
export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * BreadcrumbList schema from an array of breadcrumb items.
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * BlogPosting schema for individual blog posts.
 */
export function getBlogPostSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: post.coverImage.startsWith('http')
      ? post.coverImage
      : `${siteConfig.url}${post.coverImage}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.company,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.slug}`,
    },
    wordCount: post.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
    keywords: post.tags.join(', '),
  };
}

/**
 * Blog schema for the blog index page.
 */
export function getBlogListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${siteConfig.name} Blog`,
    description:
      'Tips, guides, and insights about custom embossed aluminum tin tacker signs for breweries, bars, brands, and promotional products distributors.',
    url: `${siteConfig.url}/blog`,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.company,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
  };
}

/**
 * WebSite schema with SearchAction for sitelinks search box.
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.company,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
