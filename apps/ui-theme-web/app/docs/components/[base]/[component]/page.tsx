import { docsTree } from '@/lib/docs-tree';
import { getDocsNavigation } from '@/lib/docs-navigation';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsPage } from 'fumadocs-ui/layouts/docs/page';
import {
  RegistryPreview,
  RegistryLivePreview,
  RegistryExamples,
  RegistryInstallation,
  RegistryShadcnInstallation,
  RegistryUsage,
  RegistryApi,
  RegistryReact,
  RegistryVue,
  RegistryAgentCopy,
  RegistrySource,
} from '@/components/registry-preview';
import { componentContent } from 'fumadocs-mdx:collections/server';
import { getMDXComponents } from '@/mdx-components';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
} from '@/lib/component-docs';
import registry from '@/.generated/registry.json';
import { highlightCode } from '@/lib/highlight-code';
import { componentUsage, componentExamples } from '@/lib/component-docs';
import {
  packageManagers,
  packageCommand,
  shadcnCommand,
} from '@/lib/docs-commands';
import { TableOfContents } from '@/components/docs/table-of-contents';

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

  const content = componentContent.find(
    (entry) => entry.info.path === `${doc.name}.mdx`
  );

  if (!content) throw new Error(`Missing MDX documentation for ${doc.name}.`);

  return {
    base,
    doc: { ...doc, title: content.title, description: content.description },
    content,
  };
}

export async function generateMetadata({
  params,
}: PageProps<'/docs/components/[base]/[component]'>): Promise<Metadata> {
  const { base, doc } = await resolveDoc(params);

  const title = `${doc.title} · ${base.title}`;
  const url = componentDocUrl(base.name, doc.name);

  return {
    title,
    description: doc.description,
    keywords: [
      doc.title,
      `${doc.title} ${base.title}`,
      `${base.framework === 'vue' ? 'Vue' : 'React'} ${doc.title}`,
      `shadcn ${doc.title}`,
      'dark mode',
      'theme toggle',
      'theme transition',
    ],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: 'UI-Theme',
      title,
      description: doc.description,
    },
  };
}

export default async function Page({
  params,
}: PageProps<'/docs/components/[base]/[component]'>) {
  const { base, doc, content } = await resolveDoc(params);
  const MDX = content.body;

  const markdown = (await content.getText('raw')).replace(
    /^---[\s\S]*?---\s*/,
    ''
  );

  const records = await Promise.all(
    registry.records
      .filter(
        (record) => record.base === base.name && record.component === doc.name
      )
      .map(async (record) => ({
        ...record,
        files: await Promise.all(
          record.files.map(async (file) => ({
            ...file,
            html: await highlightCode(file.content, file.path.split('.').pop()),
          }))
        ),
      }))
  );

  const usageHtml = Object.fromEntries(
    await Promise.all(
      ['ts', 'js'].flatMap((language) =>
        [undefined, ...componentExamples(doc)].map(async (example) => {
          const source = componentUsage(doc, base.name, example);

          return [
            `${language}:${example?.id ?? 'default'}`,
            await highlightCode(
              language === 'js' ? source.replace(' lang="ts"', '') : source,
              base.name === 'reka' ? 'vue' : language === 'js' ? 'jsx' : 'tsx'
            ),
          ];
        })
      )
    )
  );

  const shadcnCommands = Object.fromEntries(
    await Promise.all(
      packageManagers.map(async (pm) => [
        pm,
        await highlightCode(
          packageCommand(shadcnCommand(doc.name), pm),
          'bash'
        ),
      ])
    )
  );

  const commands = Object.fromEntries(
    await Promise.all(
      records.map(async (record) => {
        const command = `npx uitheme-cli add ${doc.name} --base ${base.name} --tailwind ${record.tailwind} --language ${record.language}`;

        return [
          `${record.tailwind}:${record.language}`,
          Object.fromEntries(
            await Promise.all(
              packageManagers.map(async (pm) => [
                pm,
                await highlightCode(packageCommand(command, pm), 'bash'),
              ])
            )
          ),
        ];
      })
    )
  );

  const toc = content.toc;

  return (
    <DocsPage
      id="main-content"
      tabIndex={-1}
      className="max-w-3xl gap-12 px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pt-6 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-8 md:pt-6 xl:px-12 xl:pt-6"
      breadcrumb={{ enabled: false }}
      footer={{ enabled: false }}
      toc={toc}
      tableOfContent={{ component: <TableOfContents items={toc} /> }}
      tableOfContentPopover={{ enabled: false }}
    >
      <RegistryPreview
        navigation={getDocsNavigation(docsTree, base.name)}
        base={base.name}
        component={doc.name}
        title={doc.title}
        description={doc.description}
        records={records}
        usageHtml={usageHtml}
        commands={commands}
        shadcnCommands={shadcnCommands}
        markdown={markdown}
      >
        <MDX
          components={getMDXComponents({
            RegistryLivePreview,
            RegistryExamples,
            RegistryInstallation,
            RegistryShadcnInstallation,
            RegistryUsage,
            RegistryApi,
            RegistryReact,
            RegistryVue,
            RegistryAgentCopy,
            RegistrySource,
          })}
        />
      </RegistryPreview>
    </DocsPage>
  );
}
