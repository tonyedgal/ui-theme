import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { RegistryPreview } from '@/components/registry-preview';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
} from '@/lib/component-docs';
import registry from '@/.generated/registry.json';
import { componentSections } from '@/lib/component-guides';

export const dynamicParams = false;

export function generateStaticParams() {
  return componentBases.flatMap((base) =>
    componentDocs.map((component) => ({
      base: base.name,
      component: component.name,
    }))
  );
}

async function resolveDoc(
  params: PageProps<'/docs/components/[base]/[component]'>['params']
) {
  const values = await params;
  const base = componentBases.find((item) => item.name === values.base);
  const doc = componentDocs.find((item) => item.name === values.component);

  if (!base || !doc) notFound();

  return { base, doc };
}

export async function generateMetadata({
  params,
}: PageProps<'/docs/components/[base]/[component]'>): Promise<Metadata> {
  const { base, doc } = await resolveDoc(params);

  return {
    title: `${doc.title} · ${base.title}`,
    description: doc.description,
    alternates: { canonical: componentDocUrl(base.name, doc.name) },
  };
}

export default async function Page({
  params,
}: PageProps<'/docs/components/[base]/[component]'>) {
  const { base, doc } = await resolveDoc(params);

  return (
    <DocsPage
      className="max-w-3xl gap-8 xl:pt-10"
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      toc={componentSections.map(({ id, title }) => ({
        title,
        url: `#${id}`,
        depth: 2,
      }))}
    >
      <header className="space-y-3">
        <DocsTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {doc.title}
        </DocsTitle>
        <DocsDescription className="mb-0 text-base leading-relaxed">
          {doc.description}
        </DocsDescription>
      </header>
      <RegistryPreview
        base={base.name}
        component={doc.name}
        revision={registry.revision}
        records={registry.records.filter(
          (record) => record.base === base.name && record.component === doc.name
        )}
      />
    </DocsPage>
  );
}
