import { absoluteUrl, siteAuthor, siteName, siteUrl } from '@/lib/site';

export interface Breadcrumb {
  name: string;
  path: string;
}

export function docsArticleData({
  path,
  title,
  description,
  image,
  lastModified,
  breadcrumbs,
}: {
  path: string;
  title: string;
  description?: string;
  image: string;
  lastModified?: Date;
  breadcrumbs: Breadcrumb[];
}) {
  const url = absoluteUrl(path);

  const author = {
    '@type': 'Person',
    '@id': `${siteUrl}/#author`,
    name: siteAuthor.name,
    url: siteAuthor.url,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        headline: title,
        description,
        url,
        image: absoluteUrl(image),
        inLanguage: 'en',
        dateModified: lastModified?.toISOString(),
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': `${siteUrl}/#library` },
        author,
        publisher: author,
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [{ name: siteName, path: '/' }, ...breadcrumbs].map(
          (crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: absoluteUrl(crumb.path),
          })
        ),
      },
    ],
  };
}
