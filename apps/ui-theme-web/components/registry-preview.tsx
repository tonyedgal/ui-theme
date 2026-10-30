'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import {
  componentBases,
  componentDocs,
  componentDocUrl,
  componentUsage,
  type ComponentBase,
  type ComponentDoc,
  type ComponentSource,
} from '@/lib/component-docs';
import {
  UIThemeProvider,
  DEFAULT_DURATION,
  ThemeAnimationType,
} from 'uitheme-web/react';
import { ThemeToggle as BaseThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-toggle';
import { AppearanceSelector as BaseAppearanceSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/appearance-selector';
import { ColorThemeSelector as BaseColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/color-theme-selector';
import { TransitionSettings as BaseTransitionSettings } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/transition-settings';
import { ThemeToggle as RadixThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-toggle';
import { AppearanceSelector as RadixAppearanceSelector } from '../../../packages/ui-theme-registry/src/templates/react/radix/appearance-selector';
import { ColorThemeSelector as RadixColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/radix/color-theme-selector';
import { TransitionSettings as RadixTransitionSettings } from '../../../packages/ui-theme-registry/src/templates/react/radix/transition-settings';
import {
  ComponentDecisions,
  ComponentReference,
  ComponentAgentNotes,
  ComponentCredits,
} from './component-guidance';
import {
  componentAgentNotes,
  componentGuidanceMarkdown,
} from '@/lib/component-guides';
import './registry-preview.css';

interface RegistryPreviewProps {
  base: ComponentBase;
  component: ComponentDoc['name'];
  revision: string;
  records: ComponentSource[];
}

const palettes = [
  'default',
  'caffeine',
  'mono',
  'supabase',
  'mocha',
  'perpetuity',
];

function CopyText({
  value,
  label = 'Copy',
}: {
  value: string;
  label?: string;
}) {
  const [copied, copy] = useCopyButton(() =>
    navigator.clipboard.writeText(value)
  );

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={copied ? `${label}: copied` : label}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? 'Copied' : label}
    </button>
  );
}

function RegistryContent({
  base,
  component,
  revision,
  records,
  tailwind,
  language,
}: RegistryPreviewProps & { tailwind: string; language: string }) {
  const [settings, setSettings] = useState({
    animationType: ThemeAnimationType.CIRCLE,
    duration: DEFAULT_DURATION,
  });

  const doc = componentDocs.find((item) => item.name === component)!;

  const selected = records.find(
    (record) =>
      String(record.tailwind) === tailwind && record.language === language
  );

  const activeIndex = componentDocs.findIndex(
    (item) => item.name === component
  );

  const previous = componentDocs[activeIndex - 1];
  const next = componentDocs[activeIndex + 1];
  const sourceQuery = new URLSearchParams({ tailwind, language });
  const command = `npx uitheme-cli add ${component} --base ${base} --tailwind ${tailwind} --language ${language}`;
  const usageSource = componentUsage(doc, base);

  const usage =
    language === 'js' ? usageSource.replace(' lang="ts"', '') : usageSource;

  const guidance = componentGuidanceMarkdown(doc, base);

  const markdown = [
    `# ${doc.title}`,
    doc.description,
    '## Preview',
    base === 'reka'
      ? 'Install the Vue source in your app to preview it with your theme provider.'
      : 'Use the existing live preview to try the control with your theme provider.',
    guidance.whenToUse,
    guidance.whenNotToUse,
    '## Installation',
    `\`\`\`sh\n${command}\n\`\`\``,
    '## Usage',
    `\`\`\`${base === 'reka' ? 'vue' : language === 'js' ? 'jsx' : 'tsx'}\n${usage}\n\`\`\``,
    guidance.apiReference,
    guidance.keyboard,
    guidance.accessibility,
    guidance.themeBehavior,
    guidance.agentNotes,
    '## Source',
    ...(selected?.files.map(
      (file) => `### ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\``
    ) ?? []),
    '## Customization',
    `Edit the installed source, pass ${base === 'reka' ? 'class' : 'className'} to style the root, or use the classes prop to style individual parts. Labels can be changed through props.`,
    `Registry revision: ${revision}`,
    guidance.credits,
  ].join('\n\n');

  function changeVariant(name: 'tailwind' | 'language', value: string) {
    const query = new URLSearchParams(window.location.search);
    query.set(name, value);
    window.history.replaceState(
      null,
      '',
      `?${query.toString()}${window.location.hash}`
    );
  }

  const ThemeToggle = base === 'radix' ? RadixThemeToggle : BaseThemeToggle;

  const AppearanceSelector =
    base === 'radix' ? RadixAppearanceSelector : BaseAppearanceSelector;

  const ColorThemeSelector =
    base === 'radix' ? RadixColorThemeSelector : BaseColorThemeSelector;

  const TransitionSettings =
    base === 'radix' ? RadixTransitionSettings : BaseTransitionSettings;

  return (
    <div className="space-y-10" aria-label="Registry components">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
        <nav
          aria-label="Component base"
          className="flex flex-wrap items-center gap-6"
        >
          {componentBases.map((item) => (
            <Link
              key={item.name}
              href={`${componentDocUrl(item.name, component)}?${sourceQuery}`}
              prefetch={false}
              scroll={false}
              aria-current={base === item.name ? 'page' : undefined}
              className="relative py-2 text-sm font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 after:bg-foreground after:opacity-0 hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:after:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <CopyText label="Copy page" value={markdown} />
      </div>

      <section aria-labelledby="preview" className="space-y-4">
        <h2
          id="preview"
          className="scroll-mt-24 text-xl font-semibold tracking-tight"
        >
          Preview
        </h2>
        {base === 'reka' ? (
          <div className="rounded-lg border border-border px-6 py-10 text-sm leading-relaxed text-muted-foreground">
            This component uses Vue and Reka. Install the source below in your
            Vue or Nuxt app to try it with your theme provider.
          </div>
        ) : (
          <UIThemeProvider
            colorThemes={palettes}
            animationType={settings.animationType}
            duration={settings.duration}
          >
            <div
              aria-label={`${base === 'radix' ? 'Radix' : 'Base UI'} live preview`}
              className="flex min-h-64 items-center justify-center rounded-lg border border-border bg-background p-8 sm:p-12"
            >
              <div className="w-full max-w-sm">
                {component === 'theme-toggle' && (
                  <div className="flex justify-center">
                    <ThemeToggle />
                  </div>
                )}
                {component === 'appearance-selector' && <AppearanceSelector />}
                {component === 'color-theme-selector' && <ColorThemeSelector />}
                {component === 'transition-settings' && (
                  <div className="space-y-6">
                    <TransitionSettings
                      value={settings}
                      onValueChange={setSettings}
                    />
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                      <span className="text-sm text-muted-foreground">
                        Try the transition
                      </span>
                      <ThemeToggle />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </UIThemeProvider>
        )}
      </section>

      <ComponentDecisions doc={doc} />

      <section aria-labelledby="installation" className="space-y-4">
        <h2
          id="installation"
          className="scroll-mt-24 text-xl font-semibold tracking-tight"
        >
          Installation
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Set up{' '}
          <Link
            href="/docs/installation"
            className="text-foreground underline underline-offset-4"
          >
            uitheme-web
          </Link>{' '}
          in an existing Tailwind app. Then install the component.
        </p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Tailwind version
            <select
              aria-label="Tailwind version"
              value={tailwind}
              onChange={(event) =>
                changeVariant('tailwind', event.target.value)
              }
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ts">TypeScript</option>
              <option value="js">JavaScript</option>
            </select>
          </label>
        </div>
        <div className="overflow-hidden rounded-lg border bg-muted/40">
          <div className="flex items-center justify-between border-b px-4 py-1.5">
            <span className="text-xs text-muted-foreground">Terminal</span>
            <CopyText value={command} label="Copy command" />
          </div>
          <pre
            data-testid="install-command"
            className="overflow-x-auto p-4 text-sm leading-relaxed"
          >
            <code>{command}</code>
          </pre>
        </div>
      </section>

      <section aria-labelledby="usage" className="space-y-4">
        <h2
          id="usage"
          className="scroll-mt-24 text-xl font-semibold tracking-tight"
        >
          Usage
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use the component inside your theme provider. Import paths follow your
          app’s component directory.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b px-4 py-1.5">
            <span className="font-mono text-xs text-muted-foreground">
              {base === 'reka'
                ? 'example.vue'
                : language === 'js'
                  ? 'example.jsx'
                  : 'example.tsx'}
            </span>
            <CopyText value={usage} label="Copy usage" />
          </div>
          <pre className="overflow-x-auto bg-muted/40 p-4 text-xs leading-6">
            <code>{usage}</code>
          </pre>
        </div>
      </section>

      <ComponentReference doc={doc} base={base} />
      <ComponentAgentNotes
        doc={doc}
        base={base}
        copyAction={
          <CopyText
            label="Copy agent notes"
            value={componentAgentNotes(doc, base)
              .map((note) => `- ${note}`)
              .join('\n')}
          />
        }
      />

      <section aria-labelledby="source" className="space-y-4">
        <h2
          id="source"
          className="scroll-mt-24 text-xl font-semibold tracking-tight"
        >
          Source
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These are the files the CLI installs. The component and its helper
          stay in your app.
        </p>
        <div data-testid="registry-source" className="space-y-3">
          {selected?.files.map((file) => (
            <details
              key={file.path}
              open={file.type === 'registry:ui'}
              className="overflow-hidden rounded-lg border"
            >
              <summary className="cursor-pointer px-4 py-3 font-mono text-xs">
                {file.path}
              </summary>
              <div className="flex justify-end border-t px-2 py-1">
                <CopyText value={file.content} label={`Copy ${file.path}`} />
              </div>
              <pre className="max-h-96 overflow-auto bg-muted/40 p-4 text-xs leading-6">
                <code>{file.content}</code>
              </pre>
            </details>
          ))}
        </div>
        <p className="break-words text-xs leading-relaxed text-muted-foreground">
          Dependencies: {selected?.dependencies.join(', ')}
        </p>
      </section>

      <section aria-labelledby="customization" className="space-y-4">
        <h2
          id="customization"
          className="scroll-mt-24 text-xl font-semibold tracking-tight"
        >
          Customization
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Edit the installed source, pass{' '}
          {base === 'reka' ? 'class' : 'className'} to style the root, or use
          the classes prop to style individual parts. Labels can be changed
          through props.
        </p>
        {component === 'transition-settings' && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Settings are controlled by your app. Pass the selected animationType
            and duration to the provider. Duration ranges from 0 to 2000 ms in
            steps of 50 ms.
          </p>
        )}
        <p className="break-all text-xs text-muted-foreground">
          Registry revision: <code>{revision}</code>
        </p>
      </section>

      <ComponentCredits doc={doc} base={base} />

      <nav
        aria-label="Component navigation"
        className="flex items-center justify-between gap-4 border-t pt-6 text-sm"
      >
        {previous ? (
          <Link
            prefetch={false}
            href={`${componentDocUrl(base, previous.name)}?${sourceQuery}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            prefetch={false}
            href={`${componentDocUrl(base, next.name)}?${sourceQuery}`}
            className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
          >
            {next.title} →
          </Link>
        )}
      </nav>
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
