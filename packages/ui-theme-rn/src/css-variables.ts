import type { ThemeColors } from './palettes';
import { isCssColor } from './validators';

/** Tailwind semantic names, shared by both optional styling adapters. */
export const themeVariableNames = {
  background: '--color-background',
  surface: '--color-card',
  text: '--color-foreground',
  secondaryText: '--color-muted-foreground',
  separator: '--color-border',
  accent: '--color-primary',
  onAccent: '--color-primary-foreground',
} as const;

export function toThemeVariables(colors: ThemeColors) {
  const read = (key: keyof ThemeColors) => {
    const color = colors[key];

    if (!isCssColor(color))
      throw new Error(
        `CSS styling requires a string color for ${key}. Use native styles for platform color objects.`
      );

    return color.trim();
  };

  return {
    '--background': read('background'),
    '--card': read('surface'),
    '--foreground': read('text'),
    '--muted-foreground': read('secondaryText'),
    '--border': read('separator'),
    '--primary': read('accent'),
    '--primary-foreground': read('onAccent'),
    '--color-background': read('background'),
    '--color-card': read('surface'),
    '--color-foreground': read('text'),
    '--color-muted-foreground': read('secondaryText'),
    '--color-border': read('separator'),
    '--color-primary': read('accent'),
    '--color-primary-foreground': read('onAccent'),
  };
}

export function colorsFromVariables(values: readonly unknown[]): ThemeColors {
  const read = (index: number, key: keyof ThemeColors) => {
    const color = values[index];

    if (!isCssColor(color))
      throw new Error(
        `Missing CSS color ${themeVariableNames[key]}. Define all seven semantic variables in the selected theme.`
      );

    return color.trim();
  };

  return {
    background: read(0, 'background'),
    surface: read(1, 'surface'),
    text: read(2, 'text'),
    secondaryText: read(3, 'secondaryText'),
    separator: read(4, 'separator'),
    accent: read(5, 'accent'),
    onAccent: read(6, 'onAccent'),
  };
}
