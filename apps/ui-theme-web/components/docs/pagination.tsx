import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface DocsPageLink {
  href: string;
  title: string;
  description?: string;
}

export function PaginationArrows({
  previous,
  next,
}: {
  previous?: DocsPageLink;
  next?: DocsPageLink;
}) {
  return (
    <nav aria-label="Page shortcuts" className="flex items-center gap-1">
      {[
        { page: previous, Icon: ArrowLeft, label: 'Previous' },
        { page: next, Icon: ArrowRight, label: 'Next' },
      ].map(({ page, Icon, label }) =>
        page ? (
          <Link
            key={label}
            href={page.href}
            aria-label={`${label}: ${page.title}`}
            className="inline-flex size-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-muted"
          >
            <Icon className="size-3" aria-hidden="true" />
          </Link>
        ) : (
          <button
            key={label}
            type="button"
            disabled
            aria-label={`${label} page`}
            className="inline-flex size-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground opacity-50"
          >
            <Icon className="size-3" aria-hidden="true" />
          </button>
        )
      )}
    </nav>
  );
}

export function DocsPagination({
  previous,
  next,
}: {
  previous?: DocsPageLink;
  next?: DocsPageLink;
}) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Component navigation"
      className="not-prose mt-16! flex w-full min-w-0 items-center rounded-2xl bg-muted/50 p-1 text-sm"
    >
      {previous ? (
        <Link
          href={previous.href}
          className="group flex shrink-0 items-center gap-1.5 pr-6 pl-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" strokeWidth={3} aria-hidden="true" />
          <span className="font-medium tracking-tight">Previous</span>
          <span className="sr-only">: {previous.title}</span>
        </Link>
      ) : (
        <span className="px-3 text-muted-foreground opacity-50">Previous</span>
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex h-16 min-w-0 flex-1 items-center justify-end rounded-xl bg-background hover:ring-1 hover:ring-border"
        >
          <span className="flex min-w-0 flex-col items-end px-5">
            <span className="text-right font-semibold text-foreground">
              {next.title}
            </span>
            {next.description && (
              <span className="hidden max-w-72 truncate text-right text-muted-foreground lg:block">
                {next.description}
              </span>
            )}
          </span>
          <span className="h-8 w-px shrink-0 bg-border" />
          <span className="flex items-center gap-1.5 pr-3 pl-5 font-medium tracking-tight text-muted-foreground group-hover:text-foreground">
            Next
            <ArrowRight className="size-3" strokeWidth={3} aria-hidden="true" />
          </span>
        </Link>
      ) : (
        <span className="flex h-16 flex-1 items-center justify-end rounded-xl bg-background px-5 text-muted-foreground">
          You’re at the end
        </span>
      )}
    </nav>
  );
}
