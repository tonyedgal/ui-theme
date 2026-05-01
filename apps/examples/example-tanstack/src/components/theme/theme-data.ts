import type { SlideDirection } from "@ui-theme/web/react"

export const COLOR_THEMES = [
  "default",
  "caffeine",
  "mono",
  "supabase",
  "mocha",
  "perpetuity",
] as const

type ThemeValue = (typeof COLOR_THEMES)[number]

type ThemePreviewColors = {
  primary: string
  secondary: string
  accent: string
  foreground: string
}

export type ThemeSwatch = {
  label: string
  value: ThemeValue
  colors: {
    light: ThemePreviewColors
    dark: ThemePreviewColors
  }
}

export const THEME_SWATCHES: ThemeSwatch[] = [
  {
    label: "Northern Lights",
    value: "default",
    colors: {
      light: {
        primary: "#34a85a",
        secondary: "#6495ed",
        accent: "#66d9ef",
        foreground: "#ffffff",
      },
      dark: {
        primary: "#34a85a",
        secondary: "#4682b4",
        accent: "#6495ed",
        foreground: "#ffffff",
      },
    },
  },
  {
    label: "Caffeine",
    value: "caffeine",
    colors: {
      light: {
        primary: "#644a40",
        secondary: "#ffdfb5",
        accent: "#e8e8e8",
        foreground: "#ffffff",
      },
      dark: {
        primary: "#ffe0c2",
        secondary: "#393028",
        accent: "#2a2a2a",
        foreground: "#081a1b",
      },
    },
  },
  {
    label: "Mono",
    value: "mono",
    colors: {
      light: {
        primary: "#737373",
        secondary: "#f5f5f5",
        accent: "#f5f5f5",
        foreground: "#fafafa",
      },
      dark: {
        primary: "#737373",
        secondary: "#262626",
        accent: "#404040",
        foreground: "#fafafa",
      },
    },
  },
  {
    label: "Supabase",
    value: "supabase",
    colors: {
      light: {
        primary: "#72e3ad",
        secondary: "#fdfdfd",
        accent: "#ededed",
        foreground: "#1e2723",
      },
      dark: {
        primary: "#006239",
        secondary: "#242424",
        accent: "#313131",
        foreground: "#dde8e3",
      },
    },
  },
  {
    label: "Mocha",
    value: "mocha",
    colors: {
      light: {
        primary: "#a37764",
        secondary: "#baab92",
        accent: "#e4c7b8",
        foreground: "#ffffff",
      },
      dark: {
        primary: "#c39e88",
        secondary: "#8a655a",
        accent: "#baab92",
        foreground: "#2d2521",
      },
    },
  },
  {
    label: "Perpetuity",
    value: "perpetuity",
    colors: {
      light: {
        primary: "#06858e",
        secondary: "#d9eaea",
        accent: "#c9e5e7",
        foreground: "#ffffff",
      },
      dark: {
        primary: "#4de8e8",
        secondary: "#164955",
        accent: "#164955",
        foreground: "#0a1a20",
      },
    },
  },
]

export const SLIDE_DIRECTIONS: Array<{
  label: string
  value: SlideDirection
}> = [
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
  { label: "Top Left", value: "top-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Right", value: "bottom-right" },
]
