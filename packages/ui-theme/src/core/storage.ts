import { Theme, ColorTheme } from './types';
import { STORAGE_KEY, COLOR_STORAGE_KEY } from './constants';

const isBrowser = typeof window !== 'undefined';

/**
 * Gets the stored theme from localStorage
 * @param key - Storage key for the theme
 * @param validThemes - Array of valid theme values
 * @param defaultTheme - Default theme if stored value is invalid
 * @returns The stored theme or default
 */
export const getStoredTheme = (
  key: string = STORAGE_KEY,
  validThemes: Theme[] = ['light', 'dark', 'system'],
  defaultTheme: Theme = 'system'
): Theme => {
  if (!isBrowser) return defaultTheme;

  const saved = localStorage.getItem(key) as Theme | null;
  return saved && validThemes.includes(saved) ? saved : defaultTheme;
};

/**
 * Stores theme in localStorage
 * @param theme - Theme to store
 * @param key - Storage key for the theme
 */
export const setStoredTheme = (
  theme: Theme,
  key: string = STORAGE_KEY
): void => {
  if (!isBrowser) return;
  localStorage.setItem(key, theme);
};

/**
 * Gets the stored color theme from localStorage
 * @param key - Storage key for the color theme
 * @param validColorThemes - Array of valid color theme values
 * @param defaultColorTheme - Default color theme if stored value is invalid
 * @returns The stored color theme or default
 */
export const getStoredColorTheme = (
  key: string = COLOR_STORAGE_KEY,
  validColorThemes: ColorTheme[] = ['default'],
  defaultColorTheme: ColorTheme = 'default'
): ColorTheme => {
  if (!isBrowser) return defaultColorTheme;

  const saved = localStorage.getItem(key);
  return saved && validColorThemes.includes(saved) ? saved : defaultColorTheme;
};

/**
 * Stores color theme in localStorage
 * @param colorTheme - Color theme to store
 * @param key - Storage key for the color theme
 */
export const setStoredColorTheme = (
  colorTheme: ColorTheme,
  key: string = COLOR_STORAGE_KEY
): void => {
  if (!isBrowser) return;
  localStorage.setItem(key, colorTheme);
};
