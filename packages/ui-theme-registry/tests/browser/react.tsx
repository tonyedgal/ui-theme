import { createRoot } from 'react-dom/client';
import {
  UIThemeProvider,
  NextUIThemeProvider,
  ViteUIThemeProvider,
  TanStackUIThemeProvider,
  useUITheme,
} from 'uitheme-web/react';
import { ThemeToggle as BaseToggle } from '../../src/templates/react/base-ui/theme-toggle';
import { ThemeSelector as BaseAppearance } from '../../src/templates/react/base-ui/theme-selector';
import { ColorThemeSelector as BasePalette } from '../../src/templates/react/base-ui/color-theme-selector';
import { IconThemeToggle as BaseIconToggle } from '../../src/templates/react/base-ui/icon-theme-toggle';
import { TactileThemeToggle as BaseTactile } from '../../src/templates/react/base-ui/tactile-theme-toggle';
import { ThemeSwitcher as BaseSwitcher } from '../../src/templates/react/base-ui/theme-switcher';
import { ThemeDisclosure as BaseDisclosure } from '../../src/templates/react/base-ui/theme-disclosure';
import { ColorThemeDisclosure as BaseColorDisclosure } from '../../src/templates/react/base-ui/color-theme-disclosure';
import { ThemeToggle as RadixToggle } from '../../src/templates/react/radix/theme-toggle';
import { ThemeSelector as RadixAppearance } from '../../src/templates/react/radix/theme-selector';
import { ColorThemeSelector as RadixPalette } from '../../src/templates/react/radix/color-theme-selector';
import { IconThemeToggle as RadixIconToggle } from '../../src/templates/react/radix/icon-theme-toggle';
import { TactileThemeToggle as RadixTactile } from '../../src/templates/react/radix/tactile-theme-toggle';
import { ThemeSwitcher as RadixSwitcher } from '../../src/templates/react/radix/theme-switcher';
import { ThemeDisclosure as RadixDisclosure } from '../../src/templates/react/radix/theme-disclosure';
import { ColorThemeDisclosure as RadixColorDisclosure } from '../../src/templates/react/radix/color-theme-disclosure';
import { ThemeToggle as SdkToggle } from '../../src/templates/react/ui-sdk/theme-toggle';
import { ThemeSelector as SdkAppearance } from '../../src/templates/react/ui-sdk/theme-selector';
import { ColorThemeSelector as SdkPalette } from '../../src/templates/react/ui-sdk/color-theme-selector';
import { IconThemeToggle as SdkIconToggle } from '../../src/templates/react/ui-sdk/icon-theme-toggle';
import { TactileThemeToggle as SdkTactile } from '../../src/templates/react/ui-sdk/tactile-theme-toggle';
import { ThemeSwitcher as SdkSwitcher } from '../../src/templates/react/ui-sdk/theme-switcher';
import { ThemeDisclosure as SdkDisclosure } from '../../src/templates/react/ui-sdk/theme-disclosure';
import { ColorThemeDisclosure as SdkColorDisclosure } from '../../src/templates/react/ui-sdk/color-theme-disclosure';

const params = new URLSearchParams(location.search);

const Provider =
  {
    next: NextUIThemeProvider,
    vite: ViteUIThemeProvider,
    tanstack: TanStackUIThemeProvider,
  }[params.get('provider') ?? ''] ?? UIThemeProvider;

const sets = {
  'base-ui': {
    Toggle: BaseToggle,
    Appearance: BaseAppearance,
    Palette: BasePalette,
    IconToggle: BaseIconToggle,
    Tactile: BaseTactile,
    Switcher: BaseSwitcher,
    Disclosure: BaseDisclosure,
    ColorDisclosure: BaseColorDisclosure,
  },
  radix: {
    Toggle: RadixToggle,
    Appearance: RadixAppearance,
    Palette: RadixPalette,
    IconToggle: RadixIconToggle,
    Tactile: RadixTactile,
    Switcher: RadixSwitcher,
    Disclosure: RadixDisclosure,
    ColorDisclosure: RadixColorDisclosure,
  },
  'ui-sdk': {
    Toggle: SdkToggle,
    Appearance: SdkAppearance,
    Palette: SdkPalette,
    IconToggle: SdkIconToggle,
    Tactile: SdkTactile,
    Switcher: SdkSwitcher,
    Disclosure: SdkDisclosure,
    ColorDisclosure: SdkColorDisclosure,
  },
};

const {
  Toggle,
  Appearance,
  Palette,
  IconToggle,
  Tactile,
  Switcher,
  Disclosure,
  ColorDisclosure,
} =
  new Map(Object.entries(sets)).get(params.get('base') ?? 'base-ui') ??
  sets['base-ui'];

function Controls() {
  const state = useUITheme();

  return (
    <>
      <Toggle />
      <Appearance />
      <Palette />
      <IconToggle />
      <Tactile />
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
