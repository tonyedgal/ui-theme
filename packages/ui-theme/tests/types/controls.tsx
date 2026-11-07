import {
  UIThemeProvider,
  NextUIThemeProvider,
  ViteUIThemeProvider,
  TanStackUIThemeProvider,
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

export const missingProviderLogo = (
  // @ts-expect-error Providers require both assets.
  <UIThemeProvider logoLight="/light.svg">{null}</UIThemeProvider>
);

export const providerAnimationNames = [
  <UIThemeProvider key="UIThemeProvider" animationType="slide">
    {null}
  </UIThemeProvider>,
  <NextUIThemeProvider key="NextUIThemeProvider" animationType="blur-circle">
    {null}
  </NextUIThemeProvider>,
  <ViteUIThemeProvider key="ViteUIThemeProvider" animationType="clip-path">
    {null}
  </ViteUIThemeProvider>,
  <TanStackUIThemeProvider
    key="TanStackUIThemeProvider"
    animationType="triangle"
    onServerError={(error) => console.error(error)}
  >
    {null}
  </TanStackUIThemeProvider>,
];

export const unknownProviderAnimation = (
  // @ts-expect-error Providers accept only the built-in animation names.
  <UIThemeProvider animationType="spin">{null}</UIThemeProvider>
);
