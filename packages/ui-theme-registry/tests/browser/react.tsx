import { createRoot } from 'react-dom/client';
import {
  UIThemeProvider,
  NextUIThemeProvider,
  ViteUIThemeProvider,
  TanStackUIThemeProvider,
  useUITheme,
} from 'uitheme-web/react';
import * as base from '../../src/templates/react/base-ui/theme-toggle';
import { ThemeSelector as BaseAppearance } from '../../src/templates/react/base-ui/theme-selector';
import { ColorThemeSelector as BasePalette } from '../../src/templates/react/base-ui/color-theme-selector';
import { ThemeToggle as RadixToggle } from '../../src/templates/react/radix/theme-toggle';
import { ThemeSelector as RadixAppearance } from '../../src/templates/react/radix/theme-selector';
import { ColorThemeSelector as RadixPalette } from '../../src/templates/react/radix/color-theme-selector';

import { ThemeDisclosure as BaseDisclosure } from '../../src/templates/react/base-ui/theme-disclosure';
import { ThemeDisclosure as RadixDisclosure } from '../../src/templates/react/radix/theme-disclosure';
import { ColorThemeDisclosure as BaseColorDisclosure } from '../../src/templates/react/base-ui/color-theme-disclosure';
import { ColorThemeDisclosure as RadixColorDisclosure } from '../../src/templates/react/radix/color-theme-disclosure';

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

import { ThemeSwitcher as BaseSwitcher } from '../../src/templates/react/base-ui/theme-switcher';
import { ThemeSwitcher as RadixSwitcher } from '../../src/templates/react/radix/theme-switcher';
import { IconThemeToggle as BaseIconToggle } from '../../src/templates/react/base-ui/icon-theme-toggle';
import { IconThemeToggle as RadixIconToggle } from '../../src/templates/react/radix/icon-theme-toggle';

const Switcher = radix ? RadixSwitcher : BaseSwitcher;

const IconToggle = radix ? RadixIconToggle : BaseIconToggle;

const Disclosure = radix ? RadixDisclosure : BaseDisclosure;

const ColorDisclosure = radix ? RadixColorDisclosure : BaseColorDisclosure;

function Controls() {
  const state = useUITheme();

  return (
    <>
      <Toggle />
      <Appearance />
      <Palette />
      <IconToggle />
      <Switcher />
      <Disclosure label="Inline theme" direction="up" />
      <ColorDisclosure label="Inline color theme" />
      <output id="state">
        {state.theme}/{state.colorTheme}
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
