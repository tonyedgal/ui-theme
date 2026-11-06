import type { MetadataRoute } from 'next';
import { absoluteUrl, siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Every crawler, search and AI alike, may read the site.
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dev/'] },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteUrl,
  };
}
