'use client';

import type { ReactNode } from 'react';
import { CopyButton } from './copy-button';
import { cn } from '@/lib/utils';

export const codeStyles =
  'min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs leading-6 [&_pre]:m-0 [&_pre]:min-w-0 [&_pre]:overflow-x-auto [&_pre]:[scrollbar-width:none] [&_pre::-webkit-scrollbar]:hidden [&_pre]:p-4 [&_pre]:pr-12 [&_pre]:text-xs [&_pre]:leading-6 [&_code]:font-mono [&_code]:[counter-reset:line] [&_.line]:whitespace-pre [&_.line]:before:mr-6 [&_.line]:before:inline-block [&_.line]:before:w-2 [&_.line]:before:text-right [&_.line]:before:text-[var(--code-muted)] [&_.line]:before:content-[counter(line)] [&_.line]:before:[counter-increment:line]';

export function CodeBlock({
  code,
  html,
  children,
  title,
  showCopy = true,
  className,
}: {
  code: string;
  html?: string;
  children?: ReactNode;
  title?: string;
  showCopy?: boolean;
  className?: string;
}) {
  return (
    <figure
      data-docs-code
      className={cn(
        'not-prose relative w-full min-w-0 overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-lg bg-[var(--code-background)] text-[var(--code-foreground)] [color-scheme:var(--code-scheme)]',
        className
      )}
    >
      {title && (
        <figcaption className="flex min-h-10 items-center border-b border-[var(--code-border)] bg-[var(--code-background)] px-4 py-2 text-xs text-[var(--code-muted)]">
          {title}
        </figcaption>
      )}
      {showCopy && (
        <div
          className={cn('absolute right-3 z-10', title ? 'top-1.5' : 'top-3')}
        >
          <CopyButton
            value={code}
            className="text-[var(--code-muted)] hover:bg-[var(--code-hover)] hover:text-[var(--code-foreground)] focus-visible:outline-[var(--code-foreground)] [&_svg]:size-4"
          />
        </div>
      )}
      {html ? (
        <div
          className={codeStyles}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className={codeStyles}>
          {children ?? (
            <pre>
              <code>{code}</code>
            </pre>
          )}
        </div>
      )}
    </figure>
  );
}
