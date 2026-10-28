import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
} from '@/lib/component-docs';

export function ComponentCatalog() {
  return (
    <div className="not-prose my-8 divide-y border-y">
      {componentDocs.map((doc) => (
        <div key={doc.name} className="space-y-3 py-6">
          <Link
            href={componentDocUrl('base-ui', doc.name)}
            prefetch={false}
            className="group inline-flex items-center gap-2 text-base font-medium"
          >
            {doc.title}
            <ArrowUpRight
              className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
              aria-hidden="true"
            />
          </Link>
          <p className="text-sm text-muted-foreground">{doc.description}</p>
          <div className="flex flex-wrap gap-5">
            {componentBases.map((base) => (
              <Link
                key={base.name}
                prefetch={false}
                href={componentDocUrl(base.name, doc.name)}
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {base.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
