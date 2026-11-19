import type { MetadataRoute } from 'next';
import { componentContent } from 'fumadocs-mdx:collections/server';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
} from '@/lib/component-docs';
import { absoluteUrl } from '@/lib/site';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = source.getPages().map((page) => ({
    url: absoluteUrl(page.url),
    lastModified: page.data.lastModified,
  }));

  const components = componentBases.flatMap((base) =>
    componentDocs.map((doc) => ({
      url: absoluteUrl(componentDocUrl(base.name, doc.name)),
      lastModified: componentContent.find(
        (entry) => entry.info.path === `${doc.name}.mdx`
      )?.lastModified,
    }))
  );

  return [
    { url: absoluteUrl('/') },
    ...docs,
    ...components,
    { url: absoluteUrl('/llms.txt') },
    { url: absoluteUrl('/llms-full.txt') },
  ];
}
