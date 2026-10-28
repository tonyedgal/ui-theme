'use client';

import { useState } from 'react';
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
import registry from '../.generated/registry.json';
import './registry-preview.css';

type Framework = 'react' | 'vue';

type Base = 'base-ui' | 'radix' | 'reka';

const components = [
  'theme-toggle',
  'appearance-selector',
  'color-theme-selector',
  'transition-settings',
];

const palettes = [
  'default',
  'caffeine',
  'mono',
  'supabase',
  'mocha',
  'perpetuity',
];

export function RegistryPreview() {
  const [framework, setFramework] = useState<Framework>('react');
  const [base, setBase] = useState<Base>('base-ui');
  const [tailwind, setTailwind] = useState('4');
  const [language, setLanguage] = useState('ts');
  const [component, setComponent] = useState('theme-toggle');

  const [settings, setSettings] = useState({
    animationType: ThemeAnimationType.CIRCLE,
    duration: DEFAULT_DURATION,
  });

  const selected = registry.records.find(
    (record) =>
      record.framework === framework &&
      record.base === base &&
      String(record.tailwind) === tailwind &&
      record.language === language &&
      record.component === component
  );

  const ThemeToggle = base === 'radix' ? RadixThemeToggle : BaseThemeToggle;

  const AppearanceSelector =
    base === 'radix' ? RadixAppearanceSelector : BaseAppearanceSelector;

  const ColorThemeSelector =
    base === 'radix' ? RadixColorThemeSelector : BaseColorThemeSelector;

  const TransitionSettings =
    base === 'radix' ? RadixTransitionSettings : BaseTransitionSettings;

  const command = `npx uitheme-cli add ${component} --base ${base} --tailwind ${tailwind} --language ${language}`;

  return (
    <section
      className="not-prose my-6 space-y-6"
      aria-label="Registry components"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Framework
          <select
            className="rounded border bg-background p-2"
            value={framework}
            onChange={(event) => {
              const next = event.target.value === 'vue' ? 'vue' : 'react';
              setFramework(next);
              setBase(next === 'vue' ? 'reka' : 'base-ui');
            }}
          >
            <option value="react">React</option>
            <option value="vue">Vue</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Component base
          <select
            className="rounded border bg-background p-2"
            value={base}
            onChange={(event) => {
              const next = event.target.value;

              if (next === 'base-ui' || next === 'radix' || next === 'reka')
                setBase(next);
            }}
          >
            {framework === 'react' ? (
              <>
                <option value="base-ui">Base UI</option>
                <option value="radix">Radix</option>
              </>
            ) : (
              <option value="reka">Reka</option>
            )}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Tailwind version
          <select
            className="rounded border bg-background p-2"
            value={tailwind}
            onChange={(event) => setTailwind(event.target.value)}
          >
            <option value="4">4</option>
            <option value="3">3.4</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Source language
          <select
            className="rounded border bg-background p-2"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="ts">TypeScript</option>
            <option value="js">JavaScript</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm sm:col-span-2">
          Component
          <select
            className="rounded border bg-background p-2"
            value={component}
            onChange={(event) => setComponent(event.target.value)}
          >
            {components.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <pre
        data-testid="install-command"
        className="overflow-auto rounded border bg-muted p-4 text-sm"
      >
        <code>{command}</code>
      </pre>
      {framework === 'react' ? (
        <UIThemeProvider
          colorThemes={palettes}
          animationType={settings.animationType}
          duration={settings.duration}
        >
          <div
            className="grid items-start gap-6 rounded-lg border p-6 sm:grid-cols-2"
            aria-label={`${base === 'radix' ? 'Radix' : 'Base UI'} live preview`}
          >
            <ThemeToggle />
            <AppearanceSelector />
            <ColorThemeSelector />
            <TransitionSettings value={settings} onValueChange={setSettings} />
          </div>
        </UIThemeProvider>
      ) : (
        <p className="text-sm text-muted-foreground">
          Vue controls use Reka and the Vue provider. The source below is the
          installable Vue component. This React website previews React controls.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Revision <code>{registry.revision}</code>. The source and dependencies
        below come from the same built registry artifact as the installer.
      </p>
      <p className="text-sm">
        Dependencies: {selected?.dependencies.join(', ')}
      </p>
      <div data-testid="registry-source" className="space-y-4">
        {selected?.files.map((file) => (
          <details
            key={file.path}
            open={file.type === 'registry:ui'}
            className="rounded border"
          >
            <summary className="cursor-pointer p-3 font-mono text-sm">
              {file.path}
            </summary>
            <pre className="max-h-[32rem] overflow-auto border-t bg-muted p-4 text-xs">
              <code>{file.content}</code>
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}
