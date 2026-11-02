import 'server-only';
import type { Root } from 'fumadocs-core/page-tree';
import { componentContent } from 'fumadocs-mdx:collections/server';
import { source } from './source';
import { componentGroups, componentDocUrl } from './component-docs';

const tree = source.getPageTree();

const catalog = tree.children.find(
  (node) => node.type === 'page' && node.url === '/docs/components'
);

const guides = tree.children.find(
  (node) => node.type === 'folder' && node.name === 'Guides'
);

export const docsTree: Root = {
  ...tree,
  children: [
    {
      type: 'folder',
      name: 'Get started',
      children: tree.children.filter(
        (node) => node !== catalog && node !== guides
      ),
    },
    ...(guides ? [guides] : []),
    {
      type: 'folder',
      name: 'Components',
      children: [
        ...(catalog ? [{ ...catalog, name: 'All Components' }] : []),
        ...componentGroups.map((group) => ({
          type: 'folder' as const,
          name: group.title,
          children: group.components.map((doc) => {
            const content = componentContent.find(
              (entry) => entry.info.path === `${doc.name}.mdx`
            );

            if (!content)
              throw new Error(`Missing MDX documentation for ${doc.name}.`);

            return {
              type: 'page' as const,
              name: content.title,
              description: content.description,
              url: componentDocUrl('base-ui', doc.name),
            };
          }),
        })),
      ],
    },
  ],
};
