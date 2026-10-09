import { useEffect, useMemo, useState } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { cubicBezier } from 'react-native-reanimated';
import type { CSSTransitionProperties } from 'react-native-reanimated';
import { useReducedMotion, useUITheme } from 'uitheme-rn';

const easeOut = cubicBezier(0.23, 1, 0.32, 1);

export interface ThemeTransitionStyles {
  view: CSSTransitionProperties<ViewStyle>;
  text: CSSTransitionProperties<TextStyle>;
}

/** Apply to Reanimated components alongside the current theme colors. */
export function useThemeTransition(): ThemeTransitionStyles {
  const { isHydrated } = useUITheme();
  const reducedMotion = useReducedMotion();
  const [restored, setRestored] = useState(false);

  // Arm after the restored colors commit. This also skips the first mount.
  useEffect(() => {
    if (!isHydrated) return;

    const frame = requestAnimationFrame(() => setRestored(true));

    return () => cancelAnimationFrame(frame);
  }, [isHydrated]);

  return useMemo(() => {
    const enabled = restored && !reducedMotion;

    const settings = {
      transitionDuration: enabled ? 180 : 0,
      transitionTimingFunction: easeOut,
    };

    return {
      view: {
        ...settings,
        transitionProperty: enabled
          ? ['backgroundColor', 'borderColor']
          : 'none',
      },
      text: {
        ...settings,
        transitionProperty: enabled
          ? ['color', 'backgroundColor', 'borderColor']
          : 'none',
      },
    } satisfies ThemeTransitionStyles;
  }, [restored, reducedMotion]);
}
