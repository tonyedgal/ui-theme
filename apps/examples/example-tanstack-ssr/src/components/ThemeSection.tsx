import {
  UIThemeSwitcher,
  UIThemeSelector,
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
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6 rounded-lg border border-border bg-background">
      <div className="flex gap-2 items-center justify-between md:justify-start">
        <label className="text-xs sm:text-sm font-medium">Default Style:</label>
        <UIThemeSwitcher
          themes={['light', 'dark', 'system']}
          currentTheme={currentTheme}
          onThemeChange={setTheme}
        />
      </div>

      <div className="flex gap-2 items-center justify-between md:justify-start">
        <label className="text-xs sm:text-sm font-medium">
          Light/Dark Only:
        </label>
        <UIThemeSwitcher
          themes={['light', 'dark']}
          currentTheme={currentTheme}
          onThemeChange={setTheme}
        />
      </div>

      <div className="flex gap-2 items-center justify-between md:justify-start md:col-span-2 lg:col-span-1">
        <label className="text-xs sm:text-sm font-medium">
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
