'use client';

import React from 'react';
import { ColorTheme } from '../../core/types';
import { useTheme } from '../hooks/use-theme';
import { useUITheme, UIThemeContextType } from './UIThemeProvider';
import { UIThemeSelectorProps } from '../types';
import {
  UISelect,
  UISelectContent,
  UISelectItem,
  UISelectTrigger,
  UISelectValue,
} from './ui/UISelect';

/**
 * UI Theme Selector - A dropdown selector for color themes
 *
 * Can work both with UIThemeProvider context or standalone.
 * When used with UIThemeProvider, it automatically syncs theme state.
 */
export const UIThemeSelector: React.FC<UIThemeSelectorProps> = ({
  themes = ['light', 'dark', 'system'],
  colorThemes = ['default'],
  currentColorTheme,
  onColorThemeChange,
  animationType,
  duration,
  className,
  placeholder = 'Choose a color theme',
}) => {
  let contextTheme: UIThemeContextType | null = null;
  try {
    contextTheme = useUITheme();
  } catch {
    // Context not available, use standalone mode
  }

  const standaloneHook = useTheme({
    animationType,
    duration,
    themes,
    colorThemes,
    ...(currentColorTheme !== undefined && { colorTheme: currentColorTheme }),
    onColorThemeChange,
  });

  const isControlled = contextTheme !== null;
  const { colorTheme, setColorTheme } =
    isControlled && contextTheme
      ? {
          colorTheme: contextTheme.colorTheme,
          setColorTheme: contextTheme.setColorTheme,
        }
      : standaloneHook;

  const handleColorThemeChange = (newColorTheme: string) => {
    setColorTheme(newColorTheme as ColorTheme);
    if (onColorThemeChange) {
      onColorThemeChange(newColorTheme as ColorTheme);
    }
  };

  if (colorThemes.length <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <UISelect value={colorTheme} onValueChange={handleColorThemeChange}>
        <UISelectTrigger className="capitalize">
          <UISelectValue placeholder={placeholder} />
        </UISelectTrigger>
        <UISelectContent>
          {colorThemes.map((theme) => (
            <UISelectItem key={theme} className="capitalize" value={theme}>
              {theme}
            </UISelectItem>
          ))}
        </UISelectContent>
      </UISelect>
    </div>
  );
};
