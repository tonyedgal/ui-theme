'use client';

import { ColorThemeDisclosure as RadixColorThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/radix/color-theme-disclosure';
import { ThemeDisclosure as RadixThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-disclosure';
import { ColorThemeDisclosure as BaseColorThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/color-theme-disclosure';
import { ThemeDisclosure as BaseThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-disclosure';
import { createContext, Suspense, useContext, type ReactNode } from 'react';
import Link from 'next/link';
import { ThemeAnimationType } from 'uitheme-web/react';
import { SourceDisclosure } from './docs/source-disclosure';
import {
  getDocsPagination,
  type NavigationSection,
} from '@/lib/docs-navigation';
import { useSearchParams } from 'next/navigation';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
  componentUsage,
  componentExamples,
  type ComponentBase,
  type ComponentDoc,
  type ComponentSource,
  type ComponentExample,
} from '@/lib/component-docs';
import { ThemeToggle as BaseThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-toggle';
import { IconThemeToggle as BaseIconThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/icon-theme-toggle';
import { ThemeSwitcher as BaseThemeSwitcher } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-switcher';
import { ThemeSelector as BaseThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-selector';
import { ColorThemeSelector as BaseColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/color-theme-selector';
import { ThemeToggle as RadixThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-toggle';
import { IconThemeToggle as RadixIconThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/radix/icon-theme-toggle';
import { ThemeSwitcher as RadixThemeSwitcher } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-switcher';
import { ThemeSelector as RadixThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-selector';
import { ColorThemeSelector as RadixColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/radix/color-theme-selector';
import { componentMarkdown } from '@/lib/component-markdown';
import { componentApi } from '@/lib/component-guides';
import { Prose } from './docs/prose';
import { CopyButton as CopyText } from './docs/copy-button';
import { CopyPageButton } from './docs/copy-page-button';
import { CodeBlock } from './docs/code-block';
import { ComponentPreview } from './docs/component-preview';
import { InstallTabs } from './docs/install-tabs';
import { DocsPagination, PaginationArrows } from './docs/pagination';
import type { PackageManager } from '@/lib/docs-commands';
import './registry-preview.css';

interface RegistryPreviewProps {
  component: ComponentDoc['name'];
  navigation: NavigationSection[];
  base: ComponentBase;
  title: string;
  description: string;
  records: ComponentSource[];
  usageHtml: Record<string, string>;
  commands: Record<string, Partial<Record<PackageManager, string>>>;
  children: ReactNode;
  markdown: string;
}

function RegistryContent({
  base,
  component,
  records,
  usageHtml,
  commands,
  children,
  markdown: authoredMarkdown,
  navigation,
  title,
  description,
  tailwind,
  language,
}: RegistryPreviewProps & { tailwind: string; language: string }) {
  const doc = {
    ...componentDocs.find((item) => item.name === component)!,
    title,
    description,
  };

  const selected = records.find(
    (record) =>
      String(record.tailwind) === tailwind && record.language === language
  );

  const sourceQuery = new URLSearchParams({ tailwind, language });

  const { previous, next } = getDocsPagination(
    navigation,
    componentDocUrl(base, component),
    sourceQuery
  );

  const command = `npx uitheme-cli add ${component} --base ${base} --tailwind ${tailwind} --language ${language}`;
  const usageSource = componentUsage(doc, base);

  const usage =
    language === 'js' ? usageSource.replace(' lang="ts"', '') : usageSource;

  function changeVariant(name: 'tailwind' | 'language', value: string) {
    const query = new URLSearchParams(window.location.search);
    query.set(name, value);
    window.history.replaceState(
      null,
      '',
      `?${query.toString()}${window.location.hash}`
    );
    window.dispatchEvent(new Event('docs-navigation-change'));
  }

  const ThemeToggle = base === 'radix' ? RadixThemeToggle : BaseThemeToggle;

  const ThemeSelector =
    base === 'radix' ? RadixThemeSelector : BaseThemeSelector;

  const ColorThemeSelector =
    base === 'radix' ? RadixColorThemeSelector : BaseColorThemeSelector;

  const IconThemeToggle =
    base === 'radix' ? RadixIconThemeToggle : BaseIconThemeToggle;

  const ThemeSwitcher =
    base === 'radix' ? RadixThemeSwitcher : BaseThemeSwitcher;

  const ThemeDisclosure =
    base === 'radix' ? RadixThemeDisclosure : BaseThemeDisclosure;

  const ColorThemeDisclosure =
    base === 'radix' ? RadixColorThemeDisclosure : BaseColorThemeDisclosure;

  const api = componentApi(doc, base);

  const markdown = componentMarkdown({
    doc,
    base,
    tailwind,
    language,
    markdownSource: authoredMarkdown,
    selected,
  });

  const agentNotes =
    markdown.split('## AI Agent notes\n')[1]?.split('\n## Source')[0]?.trim() ??
    '';

  function renderPreview(previewName: string, example?: ComponentExample) {
    const previewBorderStyle = example?.borderStyle ?? 'solid';
    const previewDisplay = example?.display ?? 'text';

    const transition = example?.animationType
      ? {
          animationType: ThemeAnimationType.SLIDE as const,
          duration: example.duration,
          slideDirection: example.slideDirection,
        }
      : {};

    return base === 'reka' ? (
      <div className="rounded-lg border border-border px-6 py-10 text-sm leading-[1.75] text-muted-foreground">
        This component uses Vue and Reka. Install the source below in your Vue
        or Nuxt app to try it with your theme provider.
      </div>
    ) : (
      <div
        role="region"
        aria-label={`${previewName} (${base === 'radix' ? 'Radix' : 'Base UI'})`}
        className="w-full"
      >
        <div
          className={`w-full max-w-sm${doc.category === 'disclosures' ? ` flex h-96 flex-col ${example?.direction === 'up' ? 'justify-end' : 'justify-start'}` : ''}`}
        >
          {component === 'theme-toggle' && (
            <div className="flex justify-center">
              <ThemeToggle
                {...transition}
                borderStyle={previewBorderStyle}

                display={previewDisplay}
              />
            </div>
          )}
          {component === 'theme-selector' && (
            <ThemeSelector
              {...transition}
              borderStyle={previewBorderStyle}

              display={previewDisplay}
            />
          )}
          {component === 'color-theme-selector' && (
            <ColorThemeSelector
              {...transition}
              borderStyle={previewBorderStyle}
            />
          )}
          {component === 'theme-disclosure' && (
            <ThemeDisclosure
              {...transition}
              display={previewDisplay}
              direction={example?.direction}
            />
          )}
          {component === 'color-theme-disclosure' && (
            <ColorThemeDisclosure
              {...transition}
              direction={example?.direction}
            />
          )}
          {component === 'icon-theme-toggle' && (
            <div className="flex justify-center">
              <IconThemeToggle
                {...transition}
                borderStyle={previewBorderStyle}
                effect={example?.effect}
              />
            </div>
          )}
          {component === 'theme-switcher' && (
            <div className="flex justify-center">
              <ThemeSwitcher {...transition} borderStyle={previewBorderStyle} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-12" aria-label="Registry components">
      <header>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-base font-semibold tracking-tight sm:text-lg md:text-xl lg:text-2xl">
            {doc.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <CopyPageButton markdown={markdown} />
            <PaginationArrows previous={previous} next={next} />
          </div>
        </div>
        <p className="mt-4 text-base text-pretty text-muted-foreground lg:text-balance">
          {doc.description}
        </p>
      </header>
      <div className="not-prose">
        <nav
          aria-label="Component base"
          className="flex flex-wrap items-center gap-1"
        >
          {componentBases.map((item) => (
            <Link
              key={item.name}
              href={`${componentDocUrl(item.name, component)}?${sourceQuery}`}
              prefetch={false}
              scroll={false}
              aria-current={base === item.name ? 'page' : undefined}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>

      <RegistryBlocks.Provider
        value={{
          live: (
            <div className="not-prose">
              {' '}
              <ComponentPreview
                code={usage}
                html={usageHtml[`${language}:default`]}
              >
                {renderPreview('Default preview')}
              </ComponentPreview>
            </div>
          ),
          examples: (
            <div className="not-prose space-y-10">
              {componentExamples(doc).map((example) => {
                const source = componentUsage(doc, base, example);

                const code =
                  language === 'js' ? source.replace(' lang="ts"', '') : source;

                return (
                  <section
                    key={example.title}
                    aria-label={example.title}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold tracking-tight">
                        {example.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {example.description}
                      </p>
                    </div>
                    <ComponentPreview
                      label={`${example.title} example`}
                      code={code}
                      html={usageHtml[`${language}:${example.id}`]}
                    >
                      {renderPreview(example.title, example)}
                    </ComponentPreview>
                  </section>
                );
              })}
            </div>
          ),
          installation: (
            <div className="not-prose space-y-4">
              {' '}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Tailwind version
                  <select
                    aria-label="Tailwind version"
                    value={tailwind}
                    onChange={(event) =>
                      changeVariant('tailwind', event.target.value)
                    }
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="4">4</option>
                    <option value="3">3.4</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Source language
                  <select
                    aria-label="Source language"
                    value={language}
                    onChange={(event) =>
                      changeVariant('language', event.target.value)
                    }
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="ts">TypeScript</option>
                    <option value="js">JavaScript</option>
                  </select>
                </label>
              </div>
              <InstallTabs
                command={command}
                highlighted={commands[`${tailwind}:${language}`]}
              />
            </div>
          ),
          usage: (
            <div className="not-prose">
              {' '}
              <CodeBlock
                code={usage}
                html={usageHtml[`${language}:default`]}
                title={
                  base === 'reka'
                    ? 'example.vue'
                    : language === 'js'
                      ? 'example.jsx'
                      : 'example.tsx'
                }
              />
            </div>
          ),
          source: (
            <div className="not-prose space-y-3">
              {' '}
              <div data-testid="registry-source" className="space-y-3">
                {selected?.files.map((file) => (
                  <SourceDisclosure
                    key={file.path}
                    defaultOpen={file.path === selected?.files[0]?.path}
                    title={
                      <span className="font-mono text-xs">{file.path}</span>
                    }
                    classes={{ content: 'p-0' }}
                  >
                    <CodeBlock
                      code={file.content}
                      html={file.html}
                      className="rounded-none"
                    />
                  </SourceDisclosure>
                ))}
              </div>
              <p className="break-words text-xs leading-[1.75] text-muted-foreground">
                Dependencies:{' '}
                {selected?.dependencies
                  .map((dependency) =>
                    dependency.replace(/^(@?[^@]+)@.*$/, '$1')
                  )
                  .join(', ')}
              </p>
            </div>
          ),
          api,
          base,
          agentNotes,
        }}
      >
        <Prose className="[&_h2:not(:where(.not-prose,.not-prose_*))]:mt-12 [&_h2_a]:no-underline">
          {children}
        </Prose>
      </RegistryBlocks.Provider>

      <DocsPagination previous={previous} next={next} />
    </div>
  );
}

function RegistryVariant(props: RegistryPreviewProps) {
  const params = useSearchParams();

  return (
    <RegistryContent
      {...props}
      tailwind={params.get('tailwind') === '3' ? '3' : '4'}
      language={params.get('language') === 'js' ? 'js' : 'ts'}
    />
  );
}

export function RegistryPreview(props: RegistryPreviewProps) {
  return (
    <Suspense
      fallback={<RegistryContent {...props} tailwind="4" language="ts" />}
    >
      <RegistryVariant {...props} />
    </Suspense>
  );
}

interface RegistryBlockValues {
  live: ReactNode;
  examples: ReactNode;
  installation: ReactNode;
  usage: ReactNode;
  source: ReactNode;
  api: ReturnType<typeof componentApi>;
  base: ComponentBase;
  agentNotes: string;
}

const RegistryBlocks = createContext<RegistryBlockValues | null>(null);

function useRegistryBlocks() {
  const value = useContext(RegistryBlocks);

  if (!value)
    throw new Error('Registry documentation blocks need RegistryPreview.');

  return value;
}

export function RegistryLivePreview() {
  return useRegistryBlocks().live;
}

export function RegistryExamples() {
  return useRegistryBlocks().examples;
}

export function RegistryInstallation() {
  return useRegistryBlocks().installation;
}

export function RegistryUsage() {
  return useRegistryBlocks().usage;
}

export function RegistrySource() {
  return useRegistryBlocks().source;
}

export function RegistryApi() {
  const { api } = useRegistryBlocks();

  return (
    <table>
      <thead>
        <tr>
          <th>Prop</th>
          <th>Type</th>
          <th>Behavior</th>
        </tr>
      </thead>
      <tbody>
        {api.map((row) => (
          <tr key={row.name}>
            <td>
              <code>{row.name}</code>
            </td>
            <td>
              <code>{row.type}</code>
            </td>
            <td>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RegistryReact({ children }: { children: ReactNode }) {
  return useRegistryBlocks().base === 'reka' ? null : children;
}

export function RegistryVue({ children }: { children: ReactNode }) {
  return useRegistryBlocks().base === 'reka' ? children : null;
}

export function RegistryAgentCopy() {
  return (
    <div className="not-prose mt-4">
      <CopyText
        label="Copy agent notes"
        value={useRegistryBlocks().agentNotes}
      />
    </div>
  );
}
