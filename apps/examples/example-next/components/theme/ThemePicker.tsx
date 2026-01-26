'use client';

import { useNextUITheme } from '@ui-theme/web/react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { MarqueeWrapper } from '@/components/ui/marquee';

const themeColors = [
  {
    name: 'Northern Lights',
    colors: {
      light: {
        '--primary': '#34a85a',
        '--secondary': '#6495ed',
        '--accent': '#66d9ef',
        '--primary-foreground': '#ffffff',
      },
      dark: {
        '--primary': '#34a85a',
        '--secondary': '#4682b4',
        '--accent': '#6495ed',
        '--primary-foreground': '#ffffff',
      },
    },
    value: 'default',
  },
  {
    name: 'Caffeine',
    colors: {
      light: {
        '--primary': '#644a40',
        '--secondary': '#ffdfb5',
        '--accent': '#e8e8e8',
        '--primary-foreground': '#ffffff',
      },
      dark: {
        '--primary': '#ffe0c2',
        '--secondary': '#393028',
        '--accent': '#2a2a2a',
        '--primary-foreground': '#081a1b',
      },
    },
    value: 'caffeine',
  },
  {
    name: 'Mono',
    colors: {
      light: {
        '--primary': '#737373',
        '--secondary': '#f5f5f5',
        '--accent': '#f5f5f5',
        '--primary-foreground': '#fafafa',
      },
      dark: {
        '--primary': '#737373',
        '--secondary': '#262626',
        '--accent': '#404040',
        '--primary-foreground': '#fafafa',
      },
    },
    value: 'mono',
  },
  {
    name: 'Supabase',
    colors: {
      light: {
        '--primary': '#72e3ad',
        '--secondary': '#fdfdfd',
        '--accent': '#ededed',
        '--primary-foreground': '#1e2723',
      },
      dark: {
        '--primary': '#006239',
        '--secondary': '#242424',
        '--accent': '#313131',
        '--primary-foreground': '#dde8e3',
      },
    },
    value: 'supabase',
  },
  {
    name: 'Mocha',
    colors: {
      light: {
        '--primary': '#A37764',
        '--secondary': '#BAAB92',
        '--accent': '#E4C7B8',
        '--primary-foreground': '#FFFFFF',
      },
      dark: {
        '--primary': '#C39E88',
        '--secondary': '#8A655A',
        '--accent': '#BAAB92',
        '--primary-foreground': '#2d2521',
      },
    },
    value: 'mocha',
  },
  {
    name: 'Perpetuity',
    colors: {
      light: {
        '--primary': '#06858e',
        '--secondary': '#d9eaea',
        '--accent': '#c9e5e7',
        '--primary-foreground': '#ffffff',
      },
      dark: {
        '--primary': '#4de8e8',
        '--secondary': '#164955',
        '--accent': '#164955',
        '--primary-foreground': '#0a1a20',
      },
    },
    value: 'perpetuity',
  },
];

export function ThemePicker() {
  const { createColorThemeToggle } = useNextUITheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <MarqueeWrapper className="flex items-center">
      {themeColors.map((colorTheme) => {
        const colors = isDark
          ? colorTheme.colors.dark
          : colorTheme.colors.light;

        return (
          <Button
            key={colorTheme.value}
            onClick={createColorThemeToggle(colorTheme.value)}
            className="mx-5 w-50 border transition-colors"
            style={{
              backgroundColor: colors['--primary'],
              color: colors['--primary-foreground'],
            }}
          >
            <div
              style={{
                backgroundImage: `conic-gradient( ${colors['--primary']} 120deg, ${colors['--secondary']} 120deg 240deg, ${colors['--accent']} 240deg)`,
              }}
              className="mr-2 size-5 rounded-full border"
            ></div>
            {colorTheme.name}
          </Button>
        );
      })}
    </MarqueeWrapper>
  );
}
