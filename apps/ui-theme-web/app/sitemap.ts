import type { MetadataRoute } from 'next';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
} from '@/lib/component-docs';
import { absoluteUrl } from '@/lib/site';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const docs = source.getPages().map((page) => ({
    url: absoluteUrl(page.url),
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 0.9 : 0.8,
  }));

  const components = componentBases.flatMap((base) =>
    componentDocs.map((doc) => ({
      url: absoluteUrl(componentDocUrl(base.name, doc.name)),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...docs,
    ...components,
    { url: absoluteUrl('/llms.txt'), lastModified, priority: 0.3 },
    { url: absoluteUrl('/llms-full.txt'), lastModified, priority: 0.3 },
  ];
}
