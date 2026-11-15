import '../app/global.css';
import './preview.css';
import { createApp } from 'vue';
import { createUITheme } from 'uitheme-web/vue';
import {
  readPreviewTheme,
  type PreviewMessage,
  type PreviewState,
} from '../lib/vue-preview-protocol';
import App from './app.vue';
import { createBridge } from './bridge';

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

const bridge = createBridge(initial, post);

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

createApp(App, { bridge, post, params: Object.fromEntries(params) })
  .use(
    createUITheme({
      colorThemes: palettes,
      defaultTheme: initial.theme,
      defaultColorTheme: initial.colorTheme,
      storage: false,
      onThemeChange: bridge.themeChanged,
      onColorThemeChange: bridge.colorThemeChanged,
    })
  )
  .mount('#app');
