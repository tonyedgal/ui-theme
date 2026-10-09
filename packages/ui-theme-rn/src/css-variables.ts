import { z } from 'zod';
import type { ThemeColors } from './palettes';

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

const cssColor = z.string().trim().min(1);

export function toThemeVariables(colors: ThemeColors) {
  const read = (key: keyof ThemeColors) => {
    const result = cssColor.safeParse(colors[key]);

    if (!result.success)
      throw new Error(
        `CSS styling requires a string color for ${key}. Use native styles for platform color objects.`
      );

    return result.data;
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
    const result = cssColor.safeParse(values[index]);

    if (!result.success)
      throw new Error(
        `Missing CSS color ${themeVariableNames[key]}. Define all seven semantic variables in the selected theme.`
      );

    return result.data;
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
