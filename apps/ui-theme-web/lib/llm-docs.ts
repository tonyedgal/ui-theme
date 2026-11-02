import 'server-only';
import { componentContent } from 'fumadocs-mdx:collections/server';
import registry from '@/.generated/registry.json';
import { docsTree } from './docs-tree';
import { getDocsNavigation } from './docs-navigation';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
} from './component-docs';
import { componentMarkdown } from './component-markdown';
import { getLLMText, source } from './source';

export function getLLMPages() {
  const sections = getDocsNavigation(docsTree);

  return [
    ...sections.flatMap((section) => section.items),
    ...componentBases
      .filter((base) => base.name !== 'base-ui')
      .flatMap((base) =>
        componentDocs.map((doc) => {
          const content = componentContent.find(
            (entry) => entry.info.path === `${doc.name}.mdx`
          );

          if (!content)
            throw new Error(`Missing MDX documentation for ${doc.name}.`);

          return {
            title: `${content.title} · ${base.title}`,
            description: content.description,
            href: componentDocUrl(base.name, doc.name),
          };
        })
      ),
  ];
}

export async function getLLMPage(href: string): Promise<string | undefined> {
  const page = source.getPages().find((entry) => entry.url === href);

  if (page) return getLLMText(page);

  const [, , , baseName, name] = href.split('/');
  const base = componentBases.find((entry) => entry.name === baseName);
  const doc = componentDocs.find((entry) => entry.name === name);

  if (!base || !doc || href !== componentDocUrl(base.name, doc.name)) return;

  const content = componentContent.find(
    (entry) => entry.info.path === `${doc.name}.mdx`
  );

  if (!content) throw new Error(`Missing MDX documentation for ${doc.name}.`);

  const selected = registry.records.find(
    (record) =>
      record.base === base.name &&
      record.component === doc.name &&
      record.tailwind === 4 &&
      record.language === 'ts'
  );

  return componentMarkdown({
    doc: {
      ...doc,
      title: `${content.title} · ${base.title}`,
      description: content.description,
    },
    base: base.name,
    language: 'ts',
    tailwind: '4',
    selected,
    markdownSource: (await content.getText('raw')).replace(
      /^---[\s\S]*?---\s*/,
      ''
    ),
  });
}
