import { expect, test } from 'vitest';
import { getThemeLogoOptions } from '../src/core/logo';

test('JavaScript callers must supply a complete destination logo pair', () => {
  expect(() => getThemeLogoOptions({ logoLight: '/light.svg' })).toThrow(
    'must both be provided'
  );
  expect(() => getThemeLogoOptions({ logoDark: '/dark.svg' })).toThrow(
    'must both be provided'
  );
  expect(() =>
    getThemeLogoOptions({
      logo: '/logo.svg',
      logoLight: '/light.svg',
      logoDark: '/dark.svg',
    })
  ).toThrow('not both');
});
