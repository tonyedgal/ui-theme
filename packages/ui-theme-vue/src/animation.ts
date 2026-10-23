import {
  DEFAULT_BLUR_AMOUNT,
  DEFAULT_DURATION,
  DEFAULT_EASING,
  DEFAULT_STYLE_ID,
  ThemeAnimationType,
  getAnimationPosition,
  getSlideFromCoords,
  type AnimationConfig,
} from './core';
import type { ThemeTrigger, TransitionOptions } from './types';

export function transitionInput(input?: ThemeTrigger) {
  if (input === true || input === false) return { animationOff: input };

  if (input && 'currentTarget' in input) {
    return {
      element:
        input.currentTarget instanceof Element ? input.currentTarget : null,
      animationOff: input.detail === 0,
    };
  }

  return input ?? {};
}

export function animationConfig(
  settings: TransitionOptions,
  input: ThemeTrigger | undefined,
  fallback: Element | null,
  currentTheme: 'light' | 'dark'
): AnimationConfig | null {
  if (typeof window === 'undefined') return null;
  const options = transitionInput(input);
  const duration = settings.duration ?? DEFAULT_DURATION;

  if (options.animationOff || !Number.isFinite(duration) || duration <= 0)
    return null;
  const animationType = settings.animationType ?? ThemeAnimationType.CIRCLE;
  const rect = (options.element ?? fallback)?.getBoundingClientRect();

  const origin =
    animationType === ThemeAnimationType.SVG_LOGO
      ? getAnimationPosition('center')
      : (options.origin ??
        (settings.animationPosition && settings.animationPosition !== 'trigger'
          ? getAnimationPosition(settings.animationPosition)
          : rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : getAnimationPosition('center')));

  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y)) return null;

  const from =
    settings.slideFromX !== undefined && settings.slideFromY !== undefined
      ? { a: settings.slideFromX, b: settings.slideFromY }
      : getSlideFromCoords(settings.slideDirection ?? 'left');

  const coordinates =
    animationType === ThemeAnimationType.SLIDE
      ? { ...from, x: settings.slideToX ?? 0, y: settings.slideToY ?? 0 }
      : origin;

  return {
    ...settings,
    ...coordinates,
    animationType,
    duration,
    easing: settings.easing ?? DEFAULT_EASING,
    blurAmount: settings.blurAmount ?? DEFAULT_BLUR_AMOUNT,
    styleId: settings.styleId ?? DEFAULT_STYLE_ID,
    logo:
      settings.logoLight !== undefined
        ? currentTheme === 'light'
          ? settings.logoLight
          : settings.logoDark
        : settings.logo,
  };
}
