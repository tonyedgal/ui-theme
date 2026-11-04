import { useCallback } from 'react';

export function useSearchViewport() {
  return useCallback((element: HTMLDivElement | null) => {
    const viewport = window.visualViewport;

    if (!element || !viewport) return;

    let layoutWidth = window.innerWidth;
    let rotating = false;

    const update = () => {
      const input = element.querySelector('input');

      if (window.innerWidth !== layoutWidth) rotating = true;
      layoutWidth = window.innerWidth;

      if (Math.abs(viewport.width - layoutWidth) < 2 && viewport.scale === 1) {
        if (
          rotating &&
          viewport.height < 100 &&
          document.activeElement === input
        ) {
          element
            .querySelector<HTMLButtonElement>('[data-search-close]')
            ?.focus({ preventScroll: true });
        }

        rotating = false;
      }

      const keyboardOpen =
        viewport.scale === 1 &&
        document.documentElement.clientHeight - viewport.height > 80;

      element.toggleAttribute(
        'data-search-compact',
        keyboardOpen && viewport.height < 160
      );
      element.toggleAttribute(
        'data-search-input-only',
        keyboardOpen && viewport.height < 96
      );

      element.style.setProperty(
        '--search-viewport-height',
        `${viewport.height}px`
      );
      element.style.setProperty(
        '--search-viewport-top',
        `${viewport.offsetTop}px`
      );
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
}
