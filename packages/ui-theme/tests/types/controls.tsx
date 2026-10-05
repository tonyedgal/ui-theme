import {
  UIThemeProvider,
  NextUIThemeProvider,
  ViteUIThemeProvider,
  TanStackUIThemeProvider,
  UIThemeSwitcher,
  UIThemeSelector,
} from 'uitheme-web/react';

const logos = {
  logoLight: '/light.svg',
  logoDark: '/dark.svg',
  logoWidth: 'auto' as const,
  logoHeight: 120,
};

export const providers = [
  <UIThemeProvider key="UIThemeProvider" {...logos}>
    {null}
  </UIThemeProvider>,
  <NextUIThemeProvider key="NextUIThemeProvider" {...logos}>
    {null}
  </NextUIThemeProvider>,
  <ViteUIThemeProvider key="ViteUIThemeProvider" {...logos}>
    {null}
  </ViteUIThemeProvider>,
  <TanStackUIThemeProvider
    key="TanStackUIThemeProvider"
    {...logos}
    onServerError={(error) => console.error(error)}
  >
    {null}
  </TanStackUIThemeProvider>,
];

export const controls = [
  <UIThemeSwitcher key="UIThemeSwitcher" {...logos} />,
  <UIThemeSelector key="UIThemeSelector" {...logos} />,
];

export const missingProviderLogo = (
  // @ts-expect-error Providers require both assets.
  <UIThemeProvider logoLight="/light.svg">{null}</UIThemeProvider>
);

// @ts-expect-error Controls require both assets.
export const missingControlLogo = <UIThemeSwitcher logoDark="/dark.svg" />;
