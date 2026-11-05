import type * as React from 'react';
import { useId } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type PreviewCardProps = Omit<
  React.ComponentProps<'article'>,
  'children' | 'title'
> & {
  title: string;
  href: string;
  children: React.ReactNode;
};

function PreviewCard({
  title,
  href,
  children,
  className,
  ...props
}: PreviewCardProps) {
  const titleId = useId();

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'group relative flex aspect-square min-h-0 flex-col gap-1.5 overflow-hidden rounded-[min(calc(var(--radius)*100),calc(var(--radius)+6px))] border border-border bg-card p-[5px] [-webkit-tap-highlight-color:transparent] transition-[border-color,box-shadow,scale] duration-150 ease-out has-[a[id]:active]:scale-[0.985] hover:border-[var(--border-strong,var(--border))] hover:shadow-[var(--shadow-lift,var(--shadow-md))] has-[a[id]:focus-visible]:outline-2 has-[a[id]:focus-visible]:outline-offset-2 has-[a[id]:focus-visible]:outline-ring motion-reduce:transition-none',
        className
      )}
      {...props}
    >
      <div className="relative min-h-0 flex-1">
        <div
          role="group"
          aria-label={`${title} preview`}
          className="absolute inset-0 z-10 grid place-items-center overflow-hidden rounded-(--radius) border border-border bg-[var(--inset,var(--muted))] [clip-path:polygon(0_0,calc(100%_-_26px)_0,100%_26px,100%_100%,0_100%)]"
        >
          {children}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 z-20 size-[26px] rounded-bl-(--radius) bg-[linear-gradient(225deg,transparent_50%,var(--border-strong,var(--border))_50%)]"
        />
      </div>

      <div className="flex items-center px-2 pt-1.5 pb-2">
        <h3 className="mr-auto text-[15px] font-medium">
          <Link
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            href={href}
            id={titleId}
            prefetch={false}
          >
            {title}
          </Link>
        </h3>
        <span
          aria-hidden="true"
          className="font-mono text-[14px] font-medium text-[color:var(--primary-ink,var(--foreground))]"
        >
          →
        </span>
      </div>
    </article>
  );
}

export { PreviewCard };
