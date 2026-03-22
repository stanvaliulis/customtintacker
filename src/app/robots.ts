import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/cart',
          '/cart/',
          '/checkout',
          '/checkout/',
          '/wholesale',
          '/wholesale/',
        ],
      },
    ],
    sitemap: 'https://customtintackers.com/sitemap.xml',
  };
}
