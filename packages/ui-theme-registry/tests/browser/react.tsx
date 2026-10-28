import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  UIThemeProvider,
  NextUIThemeProvider,
  ViteUIThemeProvider,
  TanStackUIThemeProvider,
  ThemeAnimationType,
  useUITheme,
} from 'uitheme-web/react';
import * as base from '../../src/templates/react/base-ui/theme-toggle';
import { AppearanceSelector as BaseAppearance } from '../../src/templates/react/base-ui/appearance-selector';
import { ColorThemeSelector as BasePalette } from '../../src/templates/react/base-ui/color-theme-selector';
import { TransitionSettings as BaseSettings } from '../../src/templates/react/base-ui/transition-settings';
import { ThemeToggle as RadixToggle } from '../../src/templates/react/radix/theme-toggle';
import { AppearanceSelector as RadixAppearance } from '../../src/templates/react/radix/appearance-selector';
import { ColorThemeSelector as RadixPalette } from '../../src/templates/react/radix/color-theme-selector';
import { TransitionSettings as RadixSettings } from '../../src/templates/react/radix/transition-settings';

const params = new URLSearchParams(location.search);

const radix = params.get('base') === 'radix';

const Provider =
  {
    next: NextUIThemeProvider,
    vite: ViteUIThemeProvider,
    tanstack: TanStackUIThemeProvider,
  }[params.get('provider') ?? ''] ?? UIThemeProvider;

const Toggle = radix ? RadixToggle : base.ThemeToggle;

const Appearance = radix ? RadixAppearance : BaseAppearance;

const Palette = radix ? RadixPalette : BasePalette;

const Settings = radix ? RadixSettings : BaseSettings;

function Controls() {
  const state = useUITheme();

  const [settings, setSettings] = useState({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 400,
  });

  return (
    <>
      <Toggle />
      <Appearance />
      <Palette />
      <Settings value={settings} onValueChange={setSettings} />
      <output id="state">
        {state.theme}/{state.colorTheme}/{settings.duration}
      </output>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <Provider
    defaultTheme="light"
    colorThemes={['default', 'ocean']}
    duration={0}
  >
    <Controls />
  </Provider>
);
