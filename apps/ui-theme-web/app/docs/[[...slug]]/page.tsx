import { cn } from '@/lib/utils';
import { docsTree } from '@/lib/docs-tree';
import { getDocsNavigation, getDocsPagination } from '@/lib/docs-navigation';
import { getPageImage, source } from '@/lib/source';
import { DocsPage } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { Prose } from '@/components/docs/prose';
import { CopyPageButton } from '@/components/docs/copy-page-button';
import { DocsPagination, PaginationArrows } from '@/components/docs/pagination';
import { TableOfContents } from '@/components/docs/table-of-contents';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = page.data.body;
  const isCatalog = page.url === '/docs/components';

  const { previous: previousLink, next: nextLink } = getDocsPagination(
    getDocsNavigation(docsTree),
    page.url
  );

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      className={cn(
        'gap-12 px-8 pt-6 pb-12 md:px-8 md:pt-6 xl:px-12 xl:pt-6',
        page.data.full ? 'max-w-6xl' : 'max-w-3xl'
      )}
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      tableOfContent={{ component: <TableOfContents items={page.data.toc} /> }}
      tableOfContentPopover={{ enabled: false }}
    >
      <header>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg md:text-xl lg:text-2xl">
            {page.data.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            {!isCatalog && <CopyPageButton markdownUrl={`${page.url}.mdx`} />}
            <PaginationArrows previous={previousLink} next={nextLink} />
          </div>
        </div>
        <p className="mt-4 text-base text-pretty text-muted-foreground lg:text-balance">
          {page.data.description}
        </p>
      </header>
      <Prose>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </Prose>
      <DocsPagination previous={previousLink} next={nextLink} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
