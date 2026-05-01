import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { TanStackUIThemeProvider } from '@ui-theme/web/react';
import { COLOR_THEMES } from '../components/theme/theme-data';
import {
  getThemeServerFn,
  setThemeServerFn,
  setColorThemeServerFn,
} from '../lib/theme';

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
        title: 'Tanstack Example SSR',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  beforeLoad: async () => ({
    themeData: await getThemeServerFn(),
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { themeData } = Route.useRouteContext();
  const htmlClass = [
    themeData.theme,
    themeData.colorTheme !== 'default' ? `theme-${themeData.colorTheme}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
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
  const { themeData } = Route.useRouteContext();

  return (
    <TanStackUIThemeProvider
      defaultTheme="system"
      defaultColorTheme="default"
      themes={['light', 'dark', 'system']}
      colorThemes={[...COLOR_THEMES]}
      serverTheme={themeData.theme}
      serverColorTheme={themeData.colorTheme}
      systemThemeMode="css"
      onServerThemeChange={(theme) => setThemeServerFn({ data: theme })}
      onServerColorThemeChange={(colorTheme) =>
        setColorThemeServerFn({ data: colorTheme })
      }
    >
      <Outlet />
    </TanStackUIThemeProvider>
  );
}
