import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'UI-Theme',
    },
    searchToggle: {
      enabled: false,
    },
    githubUrl: 'https://github.com/tonyedgal/ui-theme',
  };
}
