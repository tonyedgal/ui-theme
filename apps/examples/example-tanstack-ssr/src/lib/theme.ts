import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';
import {
  buildServerThemeData,
  STORAGE_KEY,
  COLOR_STORAGE_KEY,
  type ServerThemeData,
} from '@ui-theme/web/tanstack';

export const getThemeServerFn = createServerFn().handler(
  (): ServerThemeData =>
    buildServerThemeData(getCookie(STORAGE_KEY), getCookie(COLOR_STORAGE_KEY))
);

export const setThemeServerFn = createServerFn()
  .inputValidator(z.string())
  .handler(({ data }) => {
    setCookie(STORAGE_KEY, data);
  });

export const setColorThemeServerFn = createServerFn()
  .inputValidator(z.string())
  .handler(({ data }) => {
    setCookie(COLOR_STORAGE_KEY, data);
  });
