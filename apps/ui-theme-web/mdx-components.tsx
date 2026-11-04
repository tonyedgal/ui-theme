import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Card, type CardProps } from 'fumadocs-ui/components/card';
import { cn } from '@/lib/utils';
import type { MDXComponents } from 'mdx/types';
import { MdxPre, ScrollableTable } from '@/components/docs/prose';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: MdxPre,
    table: ScrollableTable,
    Card: ({ className, ...props }: CardProps) => (
      <Card
        {...props}
        className={cn(
          'not-prose font-normal no-underline [&>p]:text-xs [&>p]:font-light [&>p]:leading-5',
          className
        )}
      />
    ),
    ...components,
  };
}
