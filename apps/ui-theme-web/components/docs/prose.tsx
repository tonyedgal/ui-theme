import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';

export function Prose({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'min-w-0 text-sm leading-[1.75] text-muted-foreground [&_:where(h1,h2,h3,h4):not(:where(.not-prose,.not-prose_*))]:scroll-mt-24 [&_:where(h1,h2,h3,h4,strong):not(:where(.not-prose,.not-prose_*))]:font-semibold [&_:where(h1,h2,h3,h4,strong):not(:where(.not-prose,.not-prose_*))]:text-foreground [&_h1:not(:where(.not-prose,.not-prose_*))]:mt-16 [&_h1:not(:where(.not-prose,.not-prose_*))]:text-2xl [&_h2:not(:where(.not-prose,.not-prose_*))]:mt-14 [&_h2:not(:where(.not-prose,.not-prose_*))]:text-xl [&_h2:not(:where(.not-prose,.not-prose_*))]:leading-[1.35] [&_h2:not(:where(.not-prose,.not-prose_*))]:tracking-tight [&_h3:not(:where(.not-prose,.not-prose_*))]:mt-12 [&_h3:not(:where(.not-prose,.not-prose_*))]:text-lg [&_h4:not(:where(.not-prose,.not-prose_*))]:mt-10 [&_h4:not(:where(.not-prose,.not-prose_*))]:text-base [&_:where(p,ul,ol,figure,table,blockquote):not(:where(.not-prose,.not-prose_*))]:mt-5 [&_p:not(:where(.not-prose,.not-prose_*)):not(:last-child)]:mb-5 [&_ul:not(:where(.not-prose,.not-prose_*))]:list-disc [&_ol:not(:where(.not-prose,.not-prose_*))]:list-decimal [&_:where(ul,ol):not(:where(.not-prose,.not-prose_*))]:pl-6 [&_li:not(:where(.not-prose,.not-prose_*))]:pl-2 [&_li+li:not(:where(.not-prose,.not-prose_*))]:mt-3 [&_a:not(:where(.not-prose,.not-prose_*))]:font-medium [&_a:not(:where(.not-prose,.not-prose_*))]:text-foreground [&_a:not(:where(.not-prose,.not-prose_*))]:underline [&_a:not(:where(.not-prose,.not-prose_*))]:underline-offset-3 [&_code:not(:where(.not-prose,.not-prose_*))]:rounded [&_code:not(:where(.not-prose,.not-prose_*))]:bg-muted/50 [&_code:not(:where(.not-prose,.not-prose_*))]:px-1 [&_code:not(:where(.not-prose,.not-prose_*))]:font-[family-name:var(--theme-font-mono)] [&_code:not(:where(.not-prose,.not-prose_*))]:text-[13px] [&_code:not(:where(.not-prose,.not-prose_*))]:text-foreground [&_table:not(:where(.not-prose,.not-prose_*))]:w-full [&_table:not(:where(.not-prose,.not-prose_*))]:text-[13px] [&_tr:not(:where(.not-prose,.not-prose_*))]:border-b [&_:where(th,td):not(:where(.not-prose,.not-prose_*))]:p-3 [&_th:not(:where(.not-prose,.not-prose_*))]:text-left [&_blockquote:not(:where(.not-prose,.not-prose_*))]:border-l-2 [&_blockquote:not(:where(.not-prose,.not-prose_*))]:pl-5 [&_hr]:my-12 [&_hr]:border-border [&>:first-child]:mt-0',
        className
      )}
    />
  );
}

function nodeText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? nodeText(child.props.children)
        : String(child)
    )
    .join('');
}

export function MdxPre({ children, title, ...props }: ComponentProps<'pre'>) {
  return (
    <div className="not-prose my-5">
      <CodeBlock code={nodeText(children)} title={title}>
        <pre {...props}>{children}</pre>
      </CodeBlock>
    </div>
  );
}

export function DocsBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

export function DocsKbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex size-4.5 items-center justify-center rounded-xs border bg-muted text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
