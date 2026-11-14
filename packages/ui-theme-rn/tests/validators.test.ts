/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { colorsFromVariables, toThemeVariables } from '../src/css-variables';
import {
  createThemeStore,
  isStoredRecord,
  type StoredRecord,
  parseStoredPreferences,
} from '../src/core/store';
import manifest from '../package.json';
import { assertDomElement, isCssColor } from '../src/validators';

const colorThemes = ['default', 'mint'];

describe('stored preferences validator', () => {
  // a storage round trip, like the real read path
  function parse(
    value: StoredRecord | StoredRecord[] | string | number | boolean | null
  ) {
    const record = JSON.parse(JSON.stringify(value));

    return isStoredRecord(record)
      ? parseStoredPreferences(record, colorThemes)
      : undefined;
  }

  it('accepts a full valid object', () => {
    expect(parse({ version: 1, theme: 'dark', colorTheme: 'mint' })).toEqual({
      version: 1,
      theme: 'dark',
      colorTheme: 'mint',
    });
  });

  it('accepts a version-only object with both fields unset', () => {
    const result = parse({ version: 1 });
    expect(result).toBeDefined();
    expect(result?.theme).toBeUndefined();
    expect(result?.colorTheme).toBeUndefined();
  });

  it.each([null, 1, 'text', true, [], [{ version: 1 }]])(
    'rejects the non-object value %j',
    (value) => {
      expect(parse(value)).toBeUndefined();
    }
  );

  it.each([{}, { version: 2 }, { version: '1' }, { version: null }])(
    'rejects the wrong version %j',
    (value) => {
      expect(parse(value)).toBeUndefined();
    }
  );

  it.each(['bad', 3, null, ''])('drops the invalid theme %j', (theme) => {
    expect(parse({ version: 1, theme, colorTheme: 'mint' })).toMatchObject({
      theme: undefined,
      colorTheme: 'mint',
    });
  });

  it.each(['unknown', 5, null, ''])(
    'drops the invalid colorTheme %j',
    (colorTheme) => {
      expect(parse({ version: 1, theme: 'light', colorTheme })).toMatchObject({
        theme: 'light',
        colorTheme: undefined,
      });
    }
  );

  it('ignores unknown keys', () => {
    expect(
      parse(Object.assign({ version: 1 }, { extra: true }))
    ).not.toHaveProperty('extra');
  });
});

describe('corrupt stored preferences', () => {
  async function hydrate(stored: string) {
    const onStorageError = vi.fn();

    const store = createThemeStore({
      colorThemes,
      defaultTheme: 'light',
      storage: { getItem: () => stored, setItem: () => undefined },
      onStorageError,
    });

    await store.hydrate();

    return { store, onStorageError };
  }

  it.each([
    ['wrong version', JSON.stringify({ version: 2, theme: 'dark' })],
    ['an array', '[1]'],
    ['null', 'null'],
  ])('keeps the defaults for %s', async (_name, stored) => {
    const { store } = await hydrate(stored);
    expect(store.getSnapshot()).toMatchObject({
      theme: 'light',
      colorTheme: 'default',
      isHydrated: true,
    });
  });

  it('falls back per field when one field is invalid', async () => {
    const { store } = await hydrate(
      JSON.stringify({ version: 1, theme: 'nope', colorTheme: 'mint' })
    );

    expect(store.getSnapshot()).toMatchObject({
      theme: 'light',
      colorTheme: 'mint',
    });
  });

  it('reports malformed JSON through onStorageError and still hydrates', async () => {
    const { store, onStorageError } = await hydrate('{not json');
    expect(onStorageError).toHaveBeenCalledOnce();
    expect(store.getSnapshot().isHydrated).toBe(true);
  });
});

describe('isCssColor', () => {
  it.each(['red', '  rgb(0 0 0) \n'])('accepts %j', (input) => {
    expect(isCssColor(input)).toBe(true);
  });

  it.each(['', '   ', '\n\t', '\u00a0'])('rejects blank %j', (input) => {
    expect(isCssColor(input)).toBe(false);
  });

  it.each([null, undefined, 1, {}, [], { semantics: 'platform color' }])(
    'rejects the non-string %j',
    (input) => {
      expect(isCssColor(input)).toBe(false);
    }
  );

  it('keeps the thrown errors of the CSS helpers', () => {
    const colors = {
      background: '#fff',
      surface: '#fff',
      text: '#000',
      secondaryText: '#555',
      separator: '#ccc',
      accent: '#00f',
      onAccent: '#fff',
    };

    expect(toThemeVariables(colors)['--primary']).toBe('#00f');
    expect(() => toThemeVariables({ ...colors, text: '  ' })).toThrow(
      /string color for text/
    );
    const platformColor = Object.assign({}, colors, { accent: {} });
    expect(() => toThemeVariables(platformColor)).toThrow(
      /string color for accent/
    );
    expect(() =>
      colorsFromVariables(['#fff', '', '#000', '', '', '', ''])
    ).toThrow(/Missing CSS color --color-card/);
  });
});

describe('assertDomElement', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws a TypeError, not a ReferenceError, when no global Element exists', () => {
    expect('Element' in globalThis).toBe(false);
    expect(() => assertDomElement({})).toThrow(TypeError);
  });

  it('returns an instance of the global Element', () => {
    class FakeElement {}

    vi.stubGlobal('Element', FakeElement);
    const node = new FakeElement();
    expect(() => assertDomElement(node)).not.toThrow();
  });

  it.each([null, undefined, 1, 'div', {}, []])(
    'rejects %j when Element exists',
    (value) => {
      vi.stubGlobal('Element', class FakeElement {});
      expect(() => assertDomElement(value)).toThrow(TypeError);
    }
  );
});

describe('package dependencies', () => {
  const root = join(import.meta.dirname, '..');

  it('does not declare zod as a dependency', () => {
    expect(manifest).not.toHaveProperty('dependencies.zod');
  });

  it('does not import zod from src', () => {
    const files: string[] = [];

    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);

        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx)$/.test(name)) files.push(path);
      }
    };

    walk(join(root, 'src'));
    expect(files.length).toBeGreaterThan(0);

    const importsZod =
      /(from\s+|import\s*\(?\s*|require\(\s*)['"]zod(\/[^'"]*)?['"]/;

    expect(
      files.filter((f) => importsZod.test(readFileSync(f, 'utf8')))
    ).toEqual([]);
  });
});
