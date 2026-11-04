import { useEffect } from 'react';
import { useUITheme } from 'uitheme-web/react';

export function useBrowserThemeColor() {
  const { mounted, resolvedTheme, colorTheme } = useUITheme();

  useEffect(() => {
    if (!mounted) return;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');

    if (!context) return;

    context.fillStyle = getComputedStyle(document.body).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    const color = `#${[red!, green!, blue!].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;

    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', color);
    });
  }, [mounted, resolvedTheme, colorTheme]);
}
