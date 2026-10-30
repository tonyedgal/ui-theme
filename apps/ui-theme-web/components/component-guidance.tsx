import type { ReactNode } from 'react';
import type { ComponentBase, ComponentDoc } from '@/lib/component-docs';
import {
  componentSections,
  componentGuides,
  componentApi,
  componentAgentNotes,
  primitiveCredits,
} from '@/lib/component-guides';

export function GuideSection({
  id,
  children,
}: {
  id: (typeof componentSections)[number]['id'];
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="scroll-mt-24 text-xl font-semibold tracking-tight">
        {componentSections.find((section) => section.id === id)?.title}
      </h2>
      {children}
    </section>
  );
}

function GuideList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li
          key={item}
          className="relative pl-4 before:absolute before:left-0 before:top-2.5 before:size-1 before:rounded-full before:bg-muted-foreground/60"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ComponentDecisions({ doc }: { doc: ComponentDoc }) {
  const guide = componentGuides[doc.name];

  return (
    <>
      <GuideSection id="when-to-use">
        <GuideList items={guide.whenToUse} />
      </GuideSection>
      <GuideSection id="when-not-to-use">
        <GuideList items={guide.whenNotToUse} />
      </GuideSection>
    </>
  );
}

export function ComponentReference({
  doc,
  base,
}: {
  doc: ComponentDoc;
  base: ComponentBase;
}) {
  const guide = componentGuides[doc.name];

  return (
    <>
      <GuideSection id="api-reference">
        <p className="text-sm leading-relaxed text-muted-foreground">
          These props belong to the installed local control. Configure theme
          options on the provider.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Prop</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Behavior</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {componentApi(doc, base).map((row) => (
                <tr key={row.name}>
                  <th
                    scope="row"
                    className="min-w-36 px-4 py-4 align-top font-mono text-xs font-normal"
                  >
                    {row.name}
                  </th>
                  <td className="min-w-32 px-4 py-4 align-top font-mono text-xs text-muted-foreground">
                    {row.type}
                  </td>
                  <td className="min-w-56 px-4 py-4 align-top text-xs leading-relaxed text-muted-foreground">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GuideSection>
      <GuideSection id="keyboard">
        <dl className="divide-y rounded-lg border px-4">
          {guide.keyboard.map((item) => (
            <div
              key={item.key}
              className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr]"
            >
              <dt>
                <kbd className="rounded border bg-muted/50 px-2 py-1 font-mono text-xs">
                  {item.key}
                </kbd>
              </dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">
                {item.action}
              </dd>
            </div>
          ))}
        </dl>
      </GuideSection>
      <GuideSection id="accessibility">
        <GuideList items={guide.accessibility} />
      </GuideSection>
      <GuideSection id="theme-behavior">
        <GuideList items={guide.themeBehavior} />
      </GuideSection>
    </>
  );
}

export function ComponentAgentNotes({
  doc,
  base,
  copyAction,
}: {
  doc: ComponentDoc;
  base: ComponentBase;
  copyAction: ReactNode;
}) {
  return (
    <section
      aria-labelledby="ai-agent-notes"
      className="space-y-4 rounded-xl border bg-muted/25 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="ai-agent-notes"
          className="scroll-mt-24 text-xl font-semibold tracking-tight"
        >
          AI Agent notes
        </h2>
        {copyAction}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        A short integration checklist for your coding agent.
      </p>
      <ol className="list-decimal space-y-3 pl-4 text-sm leading-relaxed text-muted-foreground">
        {componentAgentNotes(doc, base).map((note) => (
          <li key={note} className="pl-1">
            {note}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ComponentCredits({
  doc,
  base,
}: {
  doc: ComponentDoc;
  base: ComponentBase;
}) {
  const primitive = primitiveCredits[base];
  const inspirations = componentGuides[doc.name].inspiration ?? [];

  return (
    <GuideSection id="credits">
      <div className="divide-y border-y text-sm">
        <div className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]">
          <p className="font-medium">Implementation</p>
          <p className="leading-relaxed text-muted-foreground">
            UI-Theme runtime and local controls, built with{' '}
            <a
              className="text-foreground underline underline-offset-4"
              href={primitive.url}
              target="_blank"
              rel="noreferrer"
            >
              {primitive.name} primitives
            </a>
            . {primitive.contribution}
          </p>
        </div>
        {inspirations.length > 0 && (
          <div className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]">
            <p className="font-medium">Component inspiration</p>
            <ul className="space-y-3">
              {inspirations.map((credit) => (
                <li
                  key={credit.url}
                  className="leading-relaxed text-muted-foreground"
                >
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground underline underline-offset-4"
                  >
                    {credit.name}
                  </a>{' '}
                  — {credit.contribution}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GuideSection>
  );
}
