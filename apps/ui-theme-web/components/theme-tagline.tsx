'use client';

import { useUITheme } from 'uitheme-web/react';
import { useThemeTagline } from '@/hooks/use-theme-tagline';

const words = ['Light,', 'dark,', 'and', 'everything', 'in', 'between.'];

export function ThemeTagline() {
  const { theme, resolvedTheme, mounted } = useUITheme();

  const ref = useThemeTagline(
    mounted ? `${theme}:${resolvedTheme}` : undefined
  );

  return (
    <p className="mt-5 max-w-lg text-base leading-8 font-normal text-balance text-foreground">
      <span className="sr-only">Light, dark, and everything in between.</span>
      <span ref={ref} aria-hidden="true">
        {words.map((word, index) => {
          if (word === 'and') return <span key={word}> and</span>;

          const mode = index === 0 ? 'light' : index === 1 ? 'dark' : undefined;
          const selected = mode === resolvedTheme;

          return (
            <span key={word}>
              {index > 0 && ' '}
              <span className="relative inline-block px-1 leading-6">
                {word}
                <span
                  data-reveal=""
                  data-active={mounted && !selected}
                  data-swatch={mode ? undefined : ''}
                  className={`pointer-events-none absolute inset-0 px-1 select-none [clip-path:inset(0_100%_0_0)] data-[active=false]:hidden forced-colors:hidden ${
                    mode === 'light'
                      ? 'bg-white text-black'
                      : mode === 'dark'
                        ? 'bg-black text-white'
                        : 'text-slate-950 data-[swatch=blue]:bg-blue-200 data-[swatch=green]:bg-green-200 data-[swatch=violet]:bg-violet-200 data-[swatch=rose]:bg-rose-200 data-[swatch=amber]:bg-amber-200 data-[swatch=orange]:bg-orange-200 data-[swatch=cyan]:bg-cyan-200 data-[swatch=indigo]:bg-indigo-200 data-[swatch=lime]:bg-lime-200 data-[swatch=fuchsia]:bg-fuchsia-200'
                  }`}
                >
                  {word}
                </span>
                {mode && (
                  <svg
                    data-reveal=""
                    data-active={mounted && selected}
                    viewBox="0 0 100 10"
                    fill="none"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-x-0 -bottom-1 h-2 w-full text-primary [clip-path:inset(0_100%_0_0)] data-[active=false]:hidden forced-colors:text-[CanvasText]"
                  >
                    <path
                      d="M3 6C23 2 63 2 97 5M7 8C37 5 64 5 87 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            </span>
          );
        })}
      </span>
    </p>
  );
}
