import { useCallback } from 'react';
import { createStyle } from '../../core/style';

/**
 * Switch off every CSS transition. The returned function restores them right
 * after the next frame of style work, so a change to the theme shows at once.
 */
export const freezeTransitions = (nonce?: string) => {
  const css = createStyle(nonce);
  css.textContent = `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`;
  document.head.appendChild(css);

  window.getComputedStyle(document.body);

  return () => {
    setTimeout(() => {
      css.remove();
    }, 1);
  };
};

/**
 * Wrap a setter so that it freezes CSS transitions while it applies the
 * change. With `enabled` false, the setter is returned unchanged.
 */
export const useTransitionFreeze = (enabled: boolean, nonce?: string) =>
  useCallback(
    <Args extends unknown[]>(set: (...args: Args) => void) =>
      enabled
        ? (...args: Args) => {
            const restore = freezeTransitions(nonce);

            try {
              set(...args);
            } finally {
              restore();
            }
          }
        : set,
    [enabled, nonce]
  );
