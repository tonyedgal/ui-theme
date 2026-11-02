import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  componentBases,
  componentGroups,
  componentDocUrl,
} from '@/lib/component-docs';

export function ComponentCatalog() {
  return (
    <nav aria-label="Component catalog" className="not-prose space-y-10">
      {componentGroups.map((group) => (
        <section key={group.name} aria-labelledby={`category-${group.name}`}>
          <h2
            id={`category-${group.name}`}
            className="text-xl font-semibold tracking-tight"
          >
            {group.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {group.description}
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.components.map((doc) => (
              <li
                key={doc.name}
                className="group flex min-w-0 flex-col rounded-[var(--radius)] border border-border bg-card transition-colors hover:border-ring/50 motion-reduce:transition-none"
              >
                <Link
                  href={componentDocUrl('base-ui', doc.name)}
                  prefetch={false}
                  className="flex-1 rounded-[var(--radius)] p-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <h3 className="flex items-start justify-between gap-3 text-base leading-6 font-medium text-card-foreground">
                    {doc.title}
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="mt-3 text-xs font-light leading-5 text-muted-foreground">
                    {doc.description}
                  </p>
                </Link>
                <div className="flex flex-wrap gap-x-3 gap-y-2 px-5 pb-5">
                  {componentBases.map((base) => (
                    <Link
                      key={base.name}
                      prefetch={false}
                      href={componentDocUrl(base.name, doc.name)}
                      aria-label={`${doc.title} for ${base.title}`}
                      className="rounded-sm text-xs font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {base.title}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
