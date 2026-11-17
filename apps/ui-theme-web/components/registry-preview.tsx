'use client';

import { ColorThemeDisclosure as RadixColorThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/radix/color-theme-disclosure';
import { ThemeDisclosure as RadixThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-disclosure';
import { ColorThemeDisclosure as BaseColorThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/color-theme-disclosure';
import { ThemeDisclosure as BaseThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-disclosure';
import { ThemeToggle as UISDKThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/theme-toggle';
import { IconThemeToggle as UISDKIconThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/icon-theme-toggle';
import { TactileThemeToggle as UISDKTactileThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/tactile-theme-toggle';
import { ThemeSwitcher as UISDKThemeSwitcher } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/theme-switcher';
import { ThemeSelector as UISDKThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/theme-selector';
import { ColorThemeSelector as UISDKColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/color-theme-selector';
import { ThemeDisclosure as UISDKThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/theme-disclosure';
import { ColorThemeDisclosure as UISDKColorThemeDisclosure } from '../../../packages/ui-theme-registry/src/templates/react/ui-sdk/color-theme-disclosure';
import {
  createContext,
  type CSSProperties,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useNextUITheme } from 'uitheme-web/next';
import { ThemeAnimationType } from 'uitheme-web/react';
import {
  readPreviewMessage,
  vuePreviewNote,
  vuePreviewUrl,
  type PreviewMessage,
  type PreviewState,
} from '@/lib/vue-preview-protocol';
import { SourceDisclosure } from './docs/source-disclosure';
import {
  getDocsPagination,
  type NavigationSection,
} from '@/lib/docs-navigation';
import {
  componentBase,
  componentBases,
  componentDocs,
  componentDocUrl,
  componentUsage,
  componentExamples,
  type ComponentBase,
  type ComponentBaseEntry,
  type ComponentDoc,
  type ComponentSource,
  type ComponentExample,
} from '@/lib/component-docs';
import { ThemeToggle as BaseThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-toggle';
import { IconThemeToggle as BaseIconThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/icon-theme-toggle';
import { TactileThemeToggle as BaseTactileThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/tactile-theme-toggle';
import { ThemeSwitcher as BaseThemeSwitcher } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-switcher';
import { ThemeSelector as BaseThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/theme-selector';
import { ColorThemeSelector as BaseColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/base-ui/color-theme-selector';
import { ThemeToggle as RadixThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-toggle';
import { IconThemeToggle as RadixIconThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/radix/icon-theme-toggle';
import { TactileThemeToggle as RadixTactileThemeToggle } from '../../../packages/ui-theme-registry/src/templates/react/radix/tactile-theme-toggle';
import { ThemeSwitcher as RadixThemeSwitcher } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-switcher';
import { ThemeSelector as RadixThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/radix/theme-selector';
import { ColorThemeSelector as RadixColorThemeSelector } from '../../../packages/ui-theme-registry/src/templates/react/radix/color-theme-selector';
import { componentMarkdown } from '@/lib/component-markdown';
import { componentApi, componentBaseFacts } from '@/lib/component-guides';
import { Prose, ScrollableTable } from './docs/prose';
import { CopyButton as CopyText } from './docs/copy-button';
import { CopyPageButton } from './docs/copy-page-button';
import { CodeBlock } from './docs/code-block';
import { ComponentPreview } from './docs/component-preview';
import { InstallTabs } from './docs/install-tabs';
import { DocsSelect } from './docs/select';
import { DocsPagination, PaginationArrows } from './docs/pagination';
import { shadcnCommand, type PackageManager } from '@/lib/docs-commands';
import './registry-preview.css';

// The live preview controls of each React base, keyed by base id.
const reactPreviews = {
  'base-ui': {
    ThemeToggle: BaseThemeToggle,
    ThemeSelector: BaseThemeSelector,
    ColorThemeSelector: BaseColorThemeSelector,
    IconThemeToggle: BaseIconThemeToggle,
    TactileThemeToggle: BaseTactileThemeToggle,
    ThemeSwitcher: BaseThemeSwitcher,
    ThemeDisclosure: BaseThemeDisclosure,
    ColorThemeDisclosure: BaseColorThemeDisclosure,
  },
  radix: {
    ThemeToggle: RadixThemeToggle,
    ThemeSelector: RadixThemeSelector,
    ColorThemeSelector: RadixColorThemeSelector,
    IconThemeToggle: RadixIconThemeToggle,
    TactileThemeToggle: RadixTactileThemeToggle,
    ThemeSwitcher: RadixThemeSwitcher,
    ThemeDisclosure: RadixThemeDisclosure,
    ColorThemeDisclosure: RadixColorThemeDisclosure,
  },
  'ui-sdk': {
    ThemeToggle: UISDKThemeToggle,
    IconThemeToggle: UISDKIconThemeToggle,
    TactileThemeToggle: UISDKTactileThemeToggle,
    ThemeSwitcher: UISDKThemeSwitcher,
    ThemeSelector: UISDKThemeSelector,
    ColorThemeSelector: UISDKColorThemeSelector,
    ThemeDisclosure: UISDKThemeDisclosure,
    ColorThemeDisclosure: UISDKColorThemeDisclosure,
  },
} satisfies Record<
  string,
  {
    ThemeToggle: typeof BaseThemeToggle;
    ThemeSelector: typeof BaseThemeSelector;
    ColorThemeSelector: typeof BaseColorThemeSelector;
    IconThemeToggle: typeof BaseIconThemeToggle;
    TactileThemeToggle: typeof BaseTactileThemeToggle;
    ThemeSwitcher: typeof BaseThemeSwitcher;
    ThemeDisclosure: typeof BaseThemeDisclosure;
    ColorThemeDisclosure: typeof BaseColorThemeDisclosure;
  }
>;

// Vue pages render their controls in an iframe, so they never use these controls.
function reactPreview(entry: ComponentBaseEntry) {
  const key = entry.framework === 'vue' ? 'base-ui' : entry.base;

  const preview = new Map(Object.entries(reactPreviews)).get(key);

  if (!preview) throw new Error(`Missing React preview for ${entry.base}.`);

  return preview;
}

function VueFrame({
  base,
  component,
  example,
  title,
  reserved,
}: {
  base: string;
  component: string;
  example: string;
  title: string;
  reserved: number;
}) {
  const { theme, colorTheme, colorThemes } = useNextUITheme();

  const holder = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const latest = useRef<PreviewState>({ theme, colorTheme });
  const [start, setStart] = useState<PreviewState>();
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    latest.current = { theme, colorTheme };
  });

  useEffect(() => {
    const node = holder.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setStart((current) => current ?? { ...latest.current });
        observer.disconnect();
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function send(message: PreviewMessage) {
      frame.current?.contentWindow?.postMessage(
        message,
        window.location.origin
      );
    }

    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;

      const message = readPreviewMessage(event.data);

      if (message?.type === 'uitheme-preview:height')
        setHeight(Math.max(1, message.height));

      if (message?.type === 'uitheme-preview:ready') {
        ready.current = true;
        send({ type: 'uitheme-preview:state', ...latest.current });
      }
    }

    window.addEventListener('message', receive);

    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    if (ready.current)
      frame.current?.contentWindow?.postMessage(
        { type: 'uitheme-preview:state', theme, colorTheme },
        window.location.origin
      );
  }, [theme, colorTheme]);

  return (
    <div ref={holder} className="w-full">
      <iframe
        ref={frame}
        title={title}
        src={
          start
            ? vuePreviewUrl({
                base,
                component,
                example,
                state: start,
                palettes: colorThemes,
              })
            : undefined
        }
        // SAFETY: CSSProperties has no index for custom properties; --reserved is a string length.
        style={{ height, '--reserved': `${reserved}px` } as CSSProperties}
        className="block h-[max(7.5rem,calc(var(--reserved)+2rem))] w-full rounded-[calc(var(--radius-lg)-1px)] border-0 bg-background sm:h-[max(7.5rem,calc(var(--reserved)+4rem))] lg:h-[max(7.5rem,calc(var(--reserved)+10rem))]"
      />
    </div>
  );
}

interface RegistryPreviewProps {
  component: ComponentDoc['name'];
  navigation: NavigationSection[];
  base: ComponentBase;
  title: string;
  description: string;
  records: ComponentSource[];
  usageHtml: Record<string, string>;
  commands: Record<string, Partial<Record<PackageManager, string>>>;
  shadcnCommands: Partial<Record<PackageManager, string>>;
  children: ReactNode;
  markdown: string;
}

function RegistryContent({
  base,
  component,
  records,
  usageHtml,
  commands,
  shadcnCommands,
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

  const command = `npx uitheme-cli add ${component} --base ${componentBase(base).base} --tailwind ${tailwind} --language ${language}`;
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

  const entry = componentBase(base);

  const {
    ThemeToggle,
    ThemeSelector,
    ColorThemeSelector,
    IconThemeToggle,
    TactileThemeToggle,
    ThemeSwitcher,
    ThemeDisclosure,
    ColorThemeDisclosure,
  } = reactPreview(entry);

  const api = componentApi(doc, base);
  const facts = componentBaseFacts(doc, base);

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

    return entry.framework === 'vue' ? (
      <VueFrame
        base={entry.name}
        component={component}
        example={example?.id ?? 'default'}
        title={`${previewName} (${entry.label}) live preview`}
        // the control area plus the 30px swatch strip the frame draws below it
        reserved={
          doc.category === 'disclosures'
            ? 414
            : doc.category === 'selectors'
              ? 286
              : 70
        }
      />
    ) : (
      <div
        role="region"
        aria-label={`${previewName} (${entry.label})`}
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
          {component === 'tactile-theme-toggle' && (
            <div className="flex justify-center">
              <TactileThemeToggle {...transition} />
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="min-w-0 max-w-full text-base font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-lg md:text-xl lg:text-2xl">
            {doc.title}
          </h1>
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
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
                flush={entry.framework === 'vue'}
                note={entry.framework === 'vue' ? vuePreviewNote : undefined}
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
                      flush={entry.framework === 'vue'}
                      note={
                        entry.framework === 'vue' ? vuePreviewNote : undefined
                      }
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
                <DocsSelect
                  label="Tailwind version"
                  value={tailwind}
                  onValueChange={(next) => changeVariant('tailwind', next)}
                  options={[
                    { value: '4', label: '4' },
                    { value: '3', label: '3.4' },
                  ]}
                />
                <DocsSelect
                  label="Source language"
                  value={language}
                  onValueChange={(next) => changeVariant('language', next)}
                  options={[
                    { value: 'ts', label: 'TypeScript' },
                    { value: 'js', label: 'JavaScript' },
                  ]}
                />
              </div>
              <InstallTabs
                command={command}
                highlighted={commands[`${tailwind}:${language}`]}
              />
            </div>
          ),
          shadcnInstallation: (
            <InstallTabs
              command={shadcnCommand(component)}
              highlighted={shadcnCommands}
              testId="shadcn-install-command"
            />
          ),
          usage: (
            <div className="not-prose">
              {' '}
              <CodeBlock
                code={usage}
                html={usageHtml[`${language}:default`]}
                title={
                  entry.framework === 'vue'
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
          facts,
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

function subscribeSearch(callback: () => void) {
  window.addEventListener('docs-navigation-change', callback);
  window.addEventListener('popstate', callback);

  return () => {
    window.removeEventListener('docs-navigation-change', callback);
    window.removeEventListener('popstate', callback);
  };
}

export function RegistryPreview(props: RegistryPreviewProps) {
  const search = useSyncExternalStore(
    subscribeSearch,
    () => window.location.search,
    () => ''
  );

  const params = new URLSearchParams(search);

  return (
    <RegistryContent
      {...props}
      tailwind={params.get('tailwind') === '3' ? '3' : '4'}
      language={params.get('language') === 'js' ? 'js' : 'ts'}
    />
  );
}

interface RegistryBlockValues {
  live: ReactNode;
  examples: ReactNode;
  installation: ReactNode;
  shadcnInstallation: ReactNode;
  usage: ReactNode;
  source: ReactNode;
  api: ReturnType<typeof componentApi>;
  base: ComponentBase;
  agentNotes: string;
  facts: ReturnType<typeof componentBaseFacts>;
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

export function RegistryShadcnInstallation() {
  return useRegistryBlocks().shadcnInstallation;
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
    <ScrollableTable className="min-w-[40rem]">
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
    </ScrollableTable>
  );
}

export function RegistryReact({ children }: { children: ReactNode }) {
  return componentBase(useRegistryBlocks().base).framework === 'vue'
    ? null
    : children;
}

export function RegistryVue({ children }: { children: ReactNode }) {
  return componentBase(useRegistryBlocks().base).framework === 'vue'
    ? children
    : null;
}

export function RegistryShadcn({ children }: { children: ReactNode }) {
  return componentBase(useRegistryBlocks().base).shadcn ? children : null;
}

function BaseFacts({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          {item
            .split('`')
            .map((part, index) =>
              index % 2 ? <code key={index}>{part}</code> : part
            )}
        </li>
      ))}
    </ul>
  );
}

export function RegistryBaseInstallation() {
  return <BaseFacts items={useRegistryBlocks().facts.installation} />;
}

export function RegistryBaseAccessibility() {
  return <BaseFacts items={useRegistryBlocks().facts.accessibility} />;
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
