import type { MetadataRoute } from 'next';
import { siteDescription, siteName } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfcfc',
    theme_color: '#fcfcfc',
    icons: [
      {
        src: '/brand/symbol-black-on-white-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/symbol-black-on-white-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
