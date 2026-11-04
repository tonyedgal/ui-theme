import { useEffect, useRef } from 'react';

const swatches = [
  'blue',
  'green',
  'violet',
  'rose',
  'amber',
  'orange',
  'cyan',
  'indigo',
  'lime',
  'fuchsia',
];

const readingDelays = [0, 700, 1400, 2200, 2650];

export function useThemeTagline(replayKey: string | undefined) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current;

    if (!root || !replayKey) return;

    const html = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const easing = getComputedStyle(root)
      .getPropertyValue('--ease-theme-in-out')
      .trim();

    const layers = [
      ...root.querySelectorAll<HTMLElement | SVGSVGElement>(
        '[data-reveal][data-active="true"]'
      ),
    ];

    let animations: Animation[] = [];

    const cancel = () => {
      animations.forEach((animation) => animation.cancel());
      animations = [];
    };

    const play = (motion: boolean) => {
      observer.disconnect();
      cancel();

      const colors = [...swatches];

      for (let index = colors.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1));
        [colors[index], colors[swap]] = [colors[swap]!, colors[index]!];
      }

      root
        .querySelectorAll<HTMLElement>('[data-swatch]')
        .forEach((layer, index) => {
          layer.dataset.swatch = colors[index];
        });

      animations = layers.map((layer, index) =>
        layer.animate(
          [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
          {
            id: `theme-tagline-${index}`,
            duration: motion ? (index === 3 ? 350 : 650) : 0,
            delay: motion ? readingDelays[index] : 0,
            easing: easing || 'ease-in-out',
            fill: 'both',
          }
        )
      );
    };

    const observer = new MutationObserver(() => {
      if (!html.hasAttribute('data-ui-theme-transition'))
        play(!reducedMotion.matches);
    });

    const settle = () => play(false);

    reducedMotion.addEventListener('change', settle);

    if (html.hasAttribute('data-ui-theme-transition')) {
      observer.observe(html, {
        attributes: true,
        attributeFilter: ['data-ui-theme-transition'],
      });
    } else {
      play(!reducedMotion.matches);
    }

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', settle);
      cancel();
    };
  }, [replayKey]);

  return ref;
}
