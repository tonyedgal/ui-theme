'use client';

import { getThemeLogoOptions } from '../../core/logo';

import React, { useRef } from 'react';
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
  clipPathDirection,
  animationPosition,
  logo,
  logoLight,
  logoDark,
  logoWidth,
  logoHeight,
  gradientWidth,
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
    clipPathDirection,
    animationPosition,
    ...getThemeLogoOptions({ logo, logoLight, logoDark }),
    logoWidth,
    logoHeight,
    gradientWidth,
    duration,
    themes,
    colorThemes,
    ...(currentColorTheme !== undefined && { colorTheme: currentColorTheme }),
    onColorThemeChange,
  });

  const isControlled = contextTheme !== null;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keyboardInteraction = useRef(false);
  const { colorTheme, switchColorTheme } =
    isControlled && contextTheme
      ? {
          colorTheme: contextTheme.colorTheme,
          switchColorTheme: contextTheme.switchColorTheme,
        }
      : standaloneHook;

  const handleColorThemeChange = (newColorTheme: string) => {
    void switchColorTheme(newColorTheme as ColorTheme, {
      element: triggerRef.current,
      animationOff: keyboardInteraction.current,
    });
    if (isControlled) onColorThemeChange?.(newColorTheme as ColorTheme);
  };

  if (colorThemes.length <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-2 ${className || ''}`}
      onKeyDownCapture={() => {
        keyboardInteraction.current = true;
      }}
      onPointerDownCapture={() => {
        keyboardInteraction.current = false;
      }}
    >
      <UISelect value={colorTheme} onValueChange={handleColorThemeChange}>
        <UISelectTrigger ref={triggerRef} className="capitalize">
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
