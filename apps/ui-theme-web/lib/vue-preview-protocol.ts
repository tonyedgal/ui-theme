import { z } from 'zod';

export const vuePreviewPath = '/vue-preview/index.html';

const themeSchema = z.enum(['light', 'dark', 'system']);

const messageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('uitheme-preview:ready') }),
  z.object({
    type: z.literal('uitheme-preview:state'),
    theme: themeSchema,
    colorTheme: z.string(),
  }),
  z.object({
    type: z.literal('uitheme-preview:height'),
    height: z.number().finite(),
  }),
]);

export type PreviewTheme = z.infer<typeof themeSchema>;

export type PreviewMessage = z.infer<typeof messageSchema>;

export interface PreviewState {
  theme: PreviewTheme;
  colorTheme: string;
}

export function readPreviewTheme(value: string | null): PreviewTheme {
  const parsed = themeSchema.safeParse(value);

  return parsed.success ? parsed.data : 'system';
}

export function readPreviewMessage(data: MessageEvent['data']) {
  const parsed = messageSchema.safeParse(data);

  return parsed.success ? parsed.data : null;
}

export function vuePreviewUrl(options: {
  base: string;
  component: string;
  example: string;
  state: PreviewState;
  palettes: readonly string[];
}) {
  const query = new URLSearchParams({
    base: options.base,
    component: options.component,
    example: options.example,
    theme: options.state.theme,
    color: options.state.colorTheme,
    palettes: options.palettes.join(','),
  });

  return `${vuePreviewPath}?${query}`;
}

// shown under every Vue preview and repeated in the Markdown copy
export const vuePreviewNote =
  'This preview runs in an iframe. The theme transition stays in the preview frame. In your app, the transition covers the full page.';
