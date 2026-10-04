'use client';

import { useRef } from 'react';
import { useTheme } from '../hooks/use-theme';
import { useSharedThemeContext } from './shared-theme-context';
import type { UseThemeReturn } from '../types';
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
const UIThemeSelectorView = ({
  state,
  isControlled,
  colorThemes = ['default'],
  onColorThemeChange,
  className,
  placeholder = 'Choose a color theme',
}: UIThemeSelectorProps & { state: UseThemeReturn; isControlled: boolean }) => {
  const { colorTheme, switchColorTheme } = state;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keyboardInteraction = useRef(false);

  const handleColorThemeChange = (newColorTheme: string) => {
    void switchColorTheme(newColorTheme, {
      element: triggerRef.current,
      animationOff: keyboardInteraction.current,
    });

    if (isControlled) onColorThemeChange?.(newColorTheme);
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
        <UISelectContent
          onKeyDownCapture={() => {
            keyboardInteraction.current = true;
          }}
          onPointerDownCapture={() => {
            keyboardInteraction.current = false;
          }}
        >
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

const UIThemeSelectorStandalone = (props: UIThemeSelectorProps) => {
  const state = useTheme({ ...props, colorTheme: props.currentColorTheme });

  return <UIThemeSelectorView {...props} state={state} isControlled={false} />;
};

export const UIThemeSelector = (props: UIThemeSelectorProps) => {
  const state = useSharedThemeContext();

  return state ? (
    <UIThemeSelectorView {...props} state={state} isControlled={true} />
  ) : (
    <UIThemeSelectorStandalone {...props} />
  );
};
