'use client';

import { useState } from 'react';
import { DocsSelect } from '@/components/docs/select';
import { DocsTabs } from '@/components/docs/docs-tabs';
import { DocsPagination } from '@/components/docs/pagination';
import { Prose, ScrollableTable } from '@/components/docs/prose';
import { CodeBlock } from '@/components/docs/code-block';
import { SourceDisclosure } from '@/components/docs/source-disclosure';

const cases = ['demo', 'worst', 'empty', 'one', 'many'];

const demo = ['TypeScript', 'JavaScript'];

const worst = [
  'TypeScript with framework-specific server rendering',
  'アクセシビリティとカラーテーマの設定',
  'Tiếng Việt — tuỳ chọn giao diện',
  '🎨 Theme preferences',
];

export function ResponsivePreview({
  data,
  largeText,
}: {
  data: string;
  largeText: boolean;
}) {
  const names =
    data === 'empty'
      ? []
      : data === 'one'
        ? ['UI']
        : data === 'many'
          ? Array.from(
              { length: 50 },
              (_, index) =>
                `Brand ${index + 1} — ${worst[index % worst.length]}`
            )
          : data === 'worst'
            ? worst
            : demo;

  const options = names.map((label, index) => ({
    value: String(index),
    label,
  }));

  const [selected, setSelected] = useState(options[0]?.value ?? '');

  const title =
    data === 'worst'
      ? 'Configure accessible appearance and color theme preferences for server-rendered applications'
      : 'Theme preferences';

  const filename =
    data === 'worst'
      ? 'apps/website/src/components/accessibility-and-color-theme-preferences/theme-selector.client.tsx'
      : 'theme-selector.tsx';

  const command =
    'npx uitheme-cli add color-theme-selector --base base-ui --cwd apps/customer-portal --dry-run';

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-8 pb-40"
    >
      {largeText && <style>{':root { font-size: 200%; }'}</style>}
      <h1 className="text-2xl font-semibold">Responsive preview</h1>
      <p>
        {names.length} {names.length === 1 ? 'option' : 'options'}. Fixture
        values enter through the existing component props.
      </p>
      <DocsSelect
        label={
          data === 'worst'
            ? 'Preferred source language and server-rendering integration'
            : 'Source language'
        }
        options={options}
        value={selected}
        onValueChange={setSelected}
      />
      <DocsTabs
        tabs={options.map((option) => ({
          id: option.value,
          label: option.label,
          content: <p className="py-4">{option.label}</p>,
        }))}
      />
      <Prose>
        <h2>{title}</h2>
        <p>
          {data === 'worst'
            ? 'Read https://ui-theme.dev/docs/guides/server-rendered-applications-with-custom-appearance-and-color-theme-preferences and use the TanStackUIThemeProvider export.'
            : 'Choose a theme for your application.'}
        </p>
        <ScrollableTable>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Behavior</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>animationType</code>
              </td>
              <td>
                <code>ThemeAnimationType</code>
              </td>
              <td>{title}</td>
            </tr>
          </tbody>
        </ScrollableTable>
      </Prose>
      <CodeBlock title={filename} code={command}>
        <pre>{command}</pre>
      </CodeBlock>
      <SourceDisclosure title={filename}>
        <CodeBlock code={command}>
          <pre>{command}</pre>
        </CodeBlock>
      </SourceDisclosure>
      <DocsPagination
        previous={
          data === 'empty'
            ? undefined
            : { href: '/docs/installation', title: 'Installation' }
        }
        next={
          data === 'empty' || data === 'one'
            ? undefined
            : { href: '/docs/components', title, description: title }
        }
      />
      <nav
        aria-label="Preview data"
        className="fixed bottom-3 left-1/2 z-80 flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap justify-center gap-1 rounded-lg border bg-muted p-1 font-sans text-[12px] shadow-md"
      >
        {cases.map((name) => (
          <a
            key={name}
            href={`?data=${name}${largeText ? '&text=200' : ''}`}
            aria-current={data === name ? 'page' : undefined}
            className="rounded px-2 py-2 text-muted-foreground aria-[current=page]:bg-background aria-[current=page]:text-foreground"
          >
            {name === 'demo'
              ? 'Demo data'
              : name === 'worst'
                ? 'Worst case'
                : name === 'many'
                  ? '50 options'
                  : name}
          </a>
        ))}
        <a
          href={`?data=${data}${largeText ? '' : '&text=200'}`}
          className="rounded px-2 py-2"
        >
          {largeText ? '100% text' : '200% text'}
        </a>
      </nav>
    </main>
  );
}
