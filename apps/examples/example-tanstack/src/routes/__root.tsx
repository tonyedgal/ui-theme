import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  TanStackStartThemeScript,
  TanStackUIThemeProvider,
} from '@ui-theme/web/react';
import { COLOR_THEMES } from '../components/theme/theme-data';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Tanstack Example',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <TanStackStartThemeScript defaultTheme="system" systemThemeMode="css" />
        <HeadContent />
      </head>
      <body className="wrap-anywhere font-sans antialiased selection:bg-[rgba(79,184,178,0.24)]">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <TanStackUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={[...COLOR_THEMES]}
      systemThemeMode="css"
    >
      <Outlet />
    </TanStackUIThemeProvider>
  );
}
