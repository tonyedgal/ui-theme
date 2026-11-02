import 'server-only';
import { cache } from 'react';
import { codeToHtml } from 'shiki';
import { codeThemes } from './code-themes';

export const highlightCode = cache(async (code: string, language = 'tsx') =>
  codeToHtml(code, {
    lang: language,
    themes: codeThemes,
    defaultColor: false,
  })
);
