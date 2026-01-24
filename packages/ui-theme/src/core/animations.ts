import { AnimationConfig, SlideDirection } from './types';
import { DEFAULT_STYLE_ID } from './constants';

const isBrowser = typeof window !== 'undefined';

/**
 * Checks if the current display is high resolution
 */
const getIsHighResolution = (): boolean => {
  if (!isBrowser) return false;
  return window.innerWidth >= 3000 || window.innerHeight >= 2000;
};

/**
 * Injects base styles required for view transitions
 */
export const injectBaseStyles = (): void => {
  if (!isBrowser) return;

  const styleId = 'ui-theme-base-style';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  const isHighResolution = getIsHighResolution();

  style.textContent = `
    ::view-transition-old(root),
    ::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
      ${isHighResolution ? 'transform: translateZ(0);' : ''}
    }
    
    ${
      isHighResolution
        ? `
    ::view-transition-group(root),
    ::view-transition-image-pair(root),
    ::view-transition-old(root),
    ::view-transition-new(root) {
      backface-visibility: hidden;
      perspective: 1000px;
      transform: translate3d(0, 0, 0);
    }
    `
        : ''
    }
  `;
  document.head.appendChild(style);
};

/**
 * Creates an SVG blur circle mask for animations
 * @param blur - Blur amount for the gaussian filter
 * @returns Data URI string for the SVG mask
 */
export const createBlurCircleMask = (blur: number): string => {
  const isHighResolution = getIsHighResolution();
  const blurFilter = `<filter id="blur"><feGaussianBlur stdDeviation="${blur}" /></filter>`;
  const circleRadius = isHighResolution ? 20 : 25;

  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100"><defs>${blurFilter}</defs><circle cx="0" cy="0" r="${circleRadius}" fill="white" filter="url(%23blur)"/></svg>')`;
};

/**
 * Gets the system theme preference
 * @returns 'light' or 'dark' based on system preference
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  if (!isBrowser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

/**
 * Resolves a theme value to its actual light/dark value
 * @param theme - Theme to resolve ('light', 'dark', or 'system')
 * @returns Resolved theme ('light' or 'dark')
 */
export const resolveTheme = (theme: string): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme === 'dark' ? 'dark' : 'light';
};

/**
 * Checks if the browser supports View Transitions API
 * @returns true if view transitions are supported
 */
export const supportsViewTransitions = (): boolean => {
  return isBrowser && 'startViewTransition' in document;
};

/**
 * Checks if user prefers reduced motion
 * @returns true if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return (
    isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

/**
 * Converts a slide direction to from coordinates
 * @param direction - Slide direction
 * @returns Object with a (x) and b (y) coordinates
 */
export const getSlideFromCoords = (
  direction: SlideDirection
): { a: number; b: number } => {
  switch (direction) {
    case 'left':
      return { a: -100, b: 0 };
    case 'right':
      return { a: 100, b: 0 };
    case 'top':
      return { a: 0, b: -100 };
    case 'bottom':
      return { a: 0, b: 100 };
    case 'top-left':
      return { a: -100, b: -100 };
    case 'top-right':
      return { a: 100, b: -100 };
    case 'bottom-left':
      return { a: -100, b: 100 };
    case 'bottom-right':
      return { a: 100, b: 100 };
    default:
      return { a: -100, b: 0 };
  }
};

/**
 * Creates a circle expanding animation for theme transitions
 * @param config - Animation configuration
 */
export const createCircleAnimation = (config: AnimationConfig): void => {
  const { x, y, duration, easing } = config;

  const topLeft = Math.hypot(x, y);
  const topRight = Math.hypot(window.innerWidth - x, y);
  const bottomLeft = Math.hypot(x, window.innerHeight - y);
  const bottomRight = Math.hypot(window.innerWidth - x, window.innerHeight - y);
  const maxRadius = Math.max(topLeft, topRight, bottomLeft, bottomRight);

  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${maxRadius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration,
      easing,
      pseudoElement: '::view-transition-new(root)',
    }
  );
};

/**
 * Creates a slide animation for theme transitions
 * @param config - Animation configuration
 */
export const createSlideAnimation = (config: AnimationConfig): void => {
  const {
    a = -100,
    b = 0,
    x = 0,
    y = 0,
    duration,
    styleId = DEFAULT_STYLE_ID,
  } = config;

  const styleElement = document.createElement('style');
  styleElement.id = styleId;

  styleElement.textContent = `
    ::view-transition-old(root) {
      animation-delay: ${duration}ms;
    }
    
    ::view-transition-new(root) {
      animation: move-in ${duration}ms;
      animation-timing-function: cubic-bezier(0.66, 0, 0.34, 1);
    }
    
    @keyframes move-in {
      from {
        translate: ${a}% ${b}%;
      }
      to {
        translate: ${x}% ${y}%;
      }
    }
  `;

  document.head.appendChild(styleElement);

  setTimeout(() => {
    const el = document.getElementById(styleId);
    if (el) {
      el.remove();
    }
  }, duration);
};

/**
 * Creates a blur circle animation for theme transitions
 * @param config - Animation configuration
 */
export const createBlurCircleAnimation = (config: AnimationConfig): void => {
  const {
    x,
    y,
    duration,
    easing,
    blurAmount,
    styleId = DEFAULT_STYLE_ID,
  } = config;

  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  const isHighResolution = getIsHighResolution();
  const viewportSize = Math.max(window.innerWidth, window.innerHeight) + 200;
  const scaleFactor = isHighResolution ? 2.5 : 4;
  const optimalMaskSize = isHighResolution
    ? Math.min(viewportSize * scaleFactor, 5000)
    : viewportSize * scaleFactor;

  const topLeft = Math.hypot(x, y);
  const topRight = Math.hypot(window.innerWidth - x, y);
  const bottomLeft = Math.hypot(x, window.innerHeight - y);
  const bottomRight = Math.hypot(window.innerWidth - x, window.innerHeight - y);
  const maxRadius = Math.max(topLeft, topRight, bottomLeft, bottomRight);

  const styleElement = document.createElement('style');
  styleElement.id = styleId;

  const blurFactor = isHighResolution ? 1.5 : 1.2;
  const finalMaskSize = Math.max(optimalMaskSize, maxRadius * 2.5);

  styleElement.textContent = `
    ::view-transition-group(root) {
      animation-duration: ${duration}ms;
      animation-timing-function: ${
        isHighResolution
          ? 'cubic-bezier(0.2, 0, 0.2, 1)'
          : 'linear(' +
            '0 0%, 0.2342 12.49%, 0.4374 24.99%,' +
            '0.6093 37.49%, 0.6835 43.74%,' +
            '0.7499 49.99%, 0.8086 56.25%,' +
            '0.8593 62.5%, 0.9023 68.75%, 0.9375 75%,' +
            '0.9648 81.25%, 0.9844 87.5%,' +
            '0.9961 93.75%, 1 100%' +
            ')'
      };
      will-change: transform;
    }
    
    ::view-transition-new(root) {
      mask: ${createBlurCircleMask(blurAmount * blurFactor)} 0 0 / 100% 100% no-repeat;
      mask-position: ${x}px ${y}px;
      animation: ui-theme-mask-scale ${duration}ms ${easing};
      transform-origin: ${x}px ${y}px;
      will-change: mask-size, mask-position;
    }
    
    ::view-transition-old(root),
    .dark::view-transition-old(root) {
      animation: ui-theme-mask-scale ${duration}ms ${easing};
      transform-origin: ${x}px ${y}px;
      z-index: -1;
      will-change: mask-size, mask-position;
    }
    
    @keyframes ui-theme-mask-scale {
      0% {
        mask-size: 0px;
        mask-position: ${x}px ${y}px;
      }
      100% {
        mask-size: ${finalMaskSize}px;
        mask-position: ${x - finalMaskSize / 2}px ${y - finalMaskSize / 2}px;
      }
    }
  `;

  document.head.appendChild(styleElement);

  setTimeout(() => {
    const el = document.getElementById(styleId);
    if (el) {
      el.remove();
    }
  }, duration);
};
