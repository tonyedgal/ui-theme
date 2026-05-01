import { useTanStackUITheme } from "@ui-theme/web/react"

import { Button } from "#/components/ui/button"

export default function ThemeToggle() {
  const { theme, resolvedTheme, switchTheme, ref } = useTanStackUITheme()

  function toggleMode() {
    const nextMode =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light"

    void switchTheme(nextMode)
  }

  const label =
    theme === "system"
      ? `Theme mode: system (${resolvedTheme}). Click to switch to light mode.`
      : `Theme mode: ${theme}. Click to switch mode.`

  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="rounded-full"
    >
      {theme === "system" ? `System · ${resolvedTheme}` : theme}
    </Button>
  )
}
