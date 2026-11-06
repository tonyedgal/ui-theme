export const siteUrl = 'https://www.ui-theme.dev';

export const siteName = 'UI-Theme';

export const siteTitle =
  'UI-Theme — Dark mode, theme toggles, and transitions for React and Vue';

export const siteDescription =
  'Open-source theming library and shadcn registry. Add light and dark mode, animated theme transitions, and color palettes to React, Next.js, Vue, Nuxt, and React Native.';

export const siteKeywords = [
  'UI-Theme',
  'uitheme',
  'ui theme',
  'uitheme-web',
  'theming library',
  'theme library',
  'theme switcher',
  'theme toggle',
  'dark mode',
  'light mode',
  'dark mode toggle',
  'light dark mode',
  'system theme',
  'prefers-color-scheme',
  'theme transition',
  'animated theme transition',
  'view transitions API',
  'dark mode animation',
  'color themes',
  'color palette switcher',
  'CSS variables theme',
  'design tokens',
  'shadcn',
  'shadcn/ui',
  'shadcn dark mode',
  'shadcn theme',
  'shadcn registry',
  'shadcn theme toggle',
  'next-themes alternative',
  'React dark mode',
  'React theme provider',
  'Next.js dark mode',
  'Next.js theme',
  'TanStack Start dark mode',
  'Vue dark mode',
  'Vue theme',
  'Nuxt dark mode',
  'Nuxt color mode',
  'React Native dark mode',
  'Expo dark mode',
  'NativeWind dark mode',
  'Tailwind CSS dark mode',
  'Radix UI',
  'Base UI',
  'Reka UI',
];

export const siteAuthor = {
  name: 'Spaceman',
  url: 'https://spaceman.sh',
  twitter: '@TonyEdgal',
  github: 'https://github.com/tonyedgal',
};

export const siteRepository = 'https://github.com/tonyedgal/ui-theme';

export function absoluteUrl(path = '/') {
  return new URL(path, siteUrl).toString();
}
