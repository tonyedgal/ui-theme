import { useTanStackUITheme } from "@ui-theme/web/react"

import { cn } from "#/lib/utils"

import { THEME_SWATCHES } from "./theme-data"

export function ThemePalette() {
  const { resolvedTheme, createColorThemeToggle, isColorThemeActive } =
    useTanStackUITheme()

  return (
    <section aria-labelledby="theme-palette-title" className="grid gap-5">
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <p className="island-kicker">Color Themes</p>
        <h2
          id="theme-palette-title"
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Palette Grid
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:mx-0">
          The alternate UI Theme color systems are ported in as direct
          selectable palettes instead of a marquee strip.
        </p>
      </div>

      <div className="theme-palette-grid">
        {THEME_SWATCHES.map((theme) => {
          const colors =
            resolvedTheme === "dark" ? theme.colors.dark : theme.colors.light

          return (
            <button
              key={theme.value}
              type="button"
              aria-pressed={isColorThemeActive(theme.value)}
              className={cn(
                "theme-tile",
                isColorThemeActive(theme.value) && "theme-tile-active"
              )}
              onClick={createColorThemeToggle(theme.value)}
            >
              <span
                className="theme-tile-chip"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
                  color: colors.foreground,
                }}
              >
                {theme.label}
              </span>
              <span className="theme-tile-swatches" aria-hidden="true">
                <span
                  className="theme-tile-swatch"
                  style={{ backgroundColor: colors.primary }}
                />
                <span
                  className="theme-tile-swatch"
                  style={{ backgroundColor: colors.secondary }}
                />
                <span
                  className="theme-tile-swatch"
                  style={{ backgroundColor: colors.accent }}
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {theme.value}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
