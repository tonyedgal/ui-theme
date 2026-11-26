import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { createStyle } from '../../core/style';

export const freezeTransitions = (nonce?: string) => {
  const css = createStyle(nonce);
  css.textContent = `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`;
  document.head.appendChild(css);

  return () => {
    // the read forces a style recalc while transitions are still disabled.
    void window.getComputedStyle(document.body).opacity;
    css.remove();
  };
};

export const useTransitionFreeze = (enabled: boolean, nonce?: string) =>
  useCallback(
    <Args extends unknown[]>(set: (...args: Args) => void) =>
      enabled
        ? (...args: Args) => {
            const restore = freezeTransitions(nonce);

            try {
              flushSync(() => set(...args));
            } finally {
              restore();
            }
          }
        : set,
    [enabled, nonce]
  );
