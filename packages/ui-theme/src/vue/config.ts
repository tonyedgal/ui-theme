import { resolveThemeConfig } from '../core/config';

export const normalizeConfig = resolveThemeConfig;

export type ResolvedConfig = ReturnType<typeof normalizeConfig>;
