import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Custom Tin Tackers — Embossed Aluminum Signs Made in USA',
    short_name: 'Custom Tin Tackers',
    description:
      'Custom embossed aluminum tin tacker signs made in the USA by Interstate Graphics. Premium signs for breweries, bars, restaurants, and brands.',
    start_url: '/',
    display: 'standalone',
    background_color: '#111827',
    theme_color: '#111827',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
