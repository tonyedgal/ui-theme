import {
  UIThemeSelector,
  UIThemeSwitcher,
  useTanStackUITheme,
} from '@ui-theme/web/react';

const ThemeSection = () => {
  const {
    theme: currentTheme,
    colorTheme: currentColorTheme,
    setTheme,
    setColorTheme,
  } = useTanStackUITheme();

  return (
    <section className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-2 md:p-6 lg:grid-cols-3">
      <div className="flex items-center justify-between gap-2 md:justify-start">
        <label className="text-xs font-medium sm:text-sm">Default Style:</label>
        <UIThemeSwitcher
          themes={['light', 'dark', 'system']}
          currentTheme={currentTheme}
          onThemeChange={setTheme}
        />
      </div>

      <div className="flex items-center justify-between gap-2 md:justify-start">
        <label className="text-xs font-medium sm:text-sm">
          Light/Dark Only:
        </label>
        <UIThemeSwitcher
          themes={['light', 'dark']}
          currentTheme={currentTheme}
          onThemeChange={setTheme}
        />
      </div>

      <div className="flex items-center justify-between gap-2 md:col-span-2 md:justify-start lg:col-span-1">
        <label className="text-xs font-medium sm:text-sm">
          Theme Selector:
        </label>
        <UIThemeSelector
          colorThemes={[
            'default',
            'caffeine',
            'mono',
            'supabase',
            'mocha',
            'perpetuity',
          ]}
          currentColorTheme={currentColorTheme}
          onColorThemeChange={setColorTheme}
        />
      </div>
    </section>
  );
};

export default ThemeSection;
