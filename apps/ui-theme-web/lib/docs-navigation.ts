import type { Root } from 'fumadocs-core/page-tree';
import { componentDocUrl, type ComponentBase } from './component-docs';

export interface NavigationPage {
  title: string;
  href: string;
  description?: string;
  group?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationPage[];
}

export function getDocsNavigation(
  tree: Root,
  base: ComponentBase = 'base-ui'
): NavigationSection[] {
  function pages(nodes: Root['children'], group?: string): NavigationPage[] {
    return nodes.flatMap((node) => {
      if (node.type === 'folder')
        return pages(node.children, String(node.name));

      if (node.type !== 'page') return [];

      return [
        {
          title: String(node.name),
          href: node.url.startsWith('/docs/components/base-ui/')
            ? componentDocUrl(base, node.url.split('/').at(-1)!)
            : node.url,
          description: node.description ? String(node.description) : undefined,
          group,
        },
      ];
    });
  }

  return tree.children.flatMap((section) =>
    section.type === 'folder'
      ? [{ title: String(section.name), items: pages(section.children) }]
      : []
  );
}

export function getDocsPagination(
  sections: NavigationSection[],
  pathname: string,
  query?: URLSearchParams
) {
  const pages = sections.flatMap((section) => section.items);
  const index = pages.findIndex((page) => page.href === pathname);

  const link = (page?: NavigationPage) =>
    page && {
      ...page,
      href:
        query && page.href.startsWith('/docs/components/')
          ? `${page.href}?${query}`
          : page.href,
    };

  return index < 0
    ? {}
    : { previous: link(pages[index - 1]), next: link(pages[index + 1]) };
}
