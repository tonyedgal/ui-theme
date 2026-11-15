import '../app/global.css';
import { createApp } from 'vue';
import { createUITheme } from 'uitheme-web/vue';
import {
  readPreviewTheme,
  type PreviewMessage,
  type PreviewState,
} from '../lib/vue-preview-protocol';
import App from './app.vue';

const params = new URLSearchParams(location.search);

const palettes = (params.get('palettes') ?? 'default')
  .split(',')
  .filter(Boolean);

const requestedColor = params.get('color') ?? '';

const requestedTheme = params.get('theme');

const initial: PreviewState = {
  theme: readPreviewTheme(requestedTheme),
  colorTheme: palettes.includes(requestedColor) ? requestedColor : palettes[0],
};

const post = (message: PreviewMessage) =>
  window.parent.postMessage(message, location.origin);

// the frame padding follows the site's breakpoints, not this narrower viewport
const host = window.parent;

const widths = [
  [host.matchMedia('(min-width: 1024px)'), '5rem'],
  [host.matchMedia('(min-width: 640px)'), '2rem'],
] as const;

function syncPadding() {
  document.documentElement.style.setProperty(
    '--preview-padding',
    widths.find(([query]) => query.matches)?.[1] ?? '1rem'
  );
}

syncPadding();

for (const [query] of widths) query.addEventListener('change', syncPadding);

// the parent owns the next/font faces; copy them so the iframe matches the site
try {
  const faces = [...window.parent.document.styleSheets].flatMap((sheet) =>
    [...sheet.cssRules].flatMap((rule) =>
      rule.type === CSSRule.FONT_FACE_RULE
        ? [
            rule.cssText.replace(
              /url\((["']?)(.*?)\1\)/g,
              (_, quote: string, path: string) =>
                `url(${quote}${new URL(path, sheet.href ?? window.parent.location.href)}${quote})`
            ),
          ]
        : []
    )
  );

  const style = document.createElement('style');

  const root = window.parent.getComputedStyle(
    window.parent.document.documentElement
  );

  style.textContent = `${faces.join('\n')}\n:root{--font-outfit:${root.getPropertyValue('--font-outfit')};--font-docs-mono:${root.getPropertyValue('--font-docs-mono')}}`;
  document.head.append(style);
} catch {
  // the system fonts remain when the parent styles are unreadable
}

createApp(App, { post, params: Object.fromEntries(params) })
  .use(
    createUITheme({
      colorThemes: palettes,
      defaultTheme: initial.theme,
      defaultColorTheme: initial.colorTheme,
      storage: false,
    })
  )
  .mount('#app');
