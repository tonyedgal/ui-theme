import { useState } from "react"
import {
  ThemeAnimationType,
  UIThemeSwitcher,
  type SlideDirection,
  useTanStackUITheme,
  useTheme,
} from "@ui-theme/web/react"

import { Button } from "#/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"

import { SLIDE_DIRECTIONS, THEME_SWATCHES } from "./theme-data"

export function ThemeStudio({ serverNote }: { serverNote: string }) {
  const [slideDirection, setSlideDirection] =
    useState<SlideDirection>("left")
  const { theme, colorTheme, setTheme, setColorTheme } = useTanStackUITheme()

  const { ref, toggleTheme } = useTheme({
    theme,
    colorTheme,
    themes: ["light", "dark", "system"],
    colorThemes: THEME_SWATCHES.map((item) => item.value),
    animationType: ThemeAnimationType.SLIDE,
    duration: 900,
    slideDirection,
    systemThemeMode: "css",
    onThemeChange: setTheme,
    onColorThemeChange: setColorTheme,
  })

  return (
    <section id="theme-studio" aria-labelledby="theme-studio-title">
      <div className="grid gap-5">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <p className="island-kicker">Theme Controls</p>
          <h2
            id="theme-studio-title"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Theme Lab
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:mx-0">
            The switchers stay in the TanStack app, but the animation and color
            handling run through the UI Theme package.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="control-panel">
            <p className="control-label">Default Style</p>
            <UIThemeSwitcher themes={["light", "dark", "system"]} />
          </div>

          <div className="control-panel">
            <p className="control-label">Light / Dark</p>
            <UIThemeSwitcher themes={["light", "dark"]} />
          </div>

          <div className="control-panel">
            <label className="control-label" htmlFor="color-theme-select">
              Color Theme
            </label>
            <Select value={colorTheme} onValueChange={setColorTheme}>
              <SelectTrigger
                id="color-theme-select"
                className="min-w-full justify-between capitalize"
              >
                <SelectValue placeholder="Choose a color theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {THEME_SWATCHES.map((themeOption) => (
                    <SelectItem key={themeOption.value} value={themeOption.value}>
                      {themeOption.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="control-panel">
            <div className="flex items-center justify-between gap-3">
              <label className="control-label" htmlFor="slide-style-select">
                Slide Style
              </label>
              <Button
                ref={ref}
                type="button"
                variant="outline"
                onClick={() => {
                  void toggleTheme()
                }}
              >
                Preview
              </Button>
            </div>
            <Select
              value={slideDirection}
              onValueChange={(value) => setSlideDirection(value as SlideDirection)}
            >
              <SelectTrigger
                id="slide-style-select"
                className="min-w-full justify-between"
              >
                <SelectValue placeholder="Choose a slide direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SLIDE_DIRECTIONS.map((direction) => (
                    <SelectItem key={direction.value} value={direction.value}>
                      {direction.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground sm:text-left">
          {serverNote}
        </p>
      </div>
    </section>
  )
}
