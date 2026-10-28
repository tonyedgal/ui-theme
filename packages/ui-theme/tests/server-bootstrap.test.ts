import { describe, expect, it } from 'vitest';
import { runInNewContext } from 'node:vm';
import { getThemeScript } from '../src/server';

function execute(
  options = {},
  stored: Record<string, string> = {},
  dark = false
) {
  const classes = new Set(['unrelated']);
  const style = { colorScheme: '' };
  runInNewContext(getThemeScript(options), {
    document: {
      documentElement: {
        style,
        classList: {
          toggle(name: string, enabled: boolean) {
            if (enabled) classes.add(name);
            else classes.delete(name);
          },
        },
      },
    },
    localStorage: {
      getItem(key: string) {
        return stored[key] ?? null;
      },
    },
    matchMedia: () => ({ matches: dark }),
  });

  return { classes, style };
}

describe('shared server bootstrap', () => {
  it('restores valid preferences before framework hydration without removing unrelated classes', () => {
    const { classes, style } = execute(
      { colorThemes: ['default', 'rose'] },
      { theme: 'dark', 'color-theme': 'rose' }
    );

    expect([...classes]).toEqual(['unrelated', 'dark', 'theme-rose']);
    expect(style.colorScheme).toBe('dark');
  });
  it('rejects undeclared stored values and resolves the selected system appearance', () => {
    const { classes, style } = execute(
      {
        defaultTheme: 'system',
        colorThemes: ['rose'],
        defaultColorTheme: 'rose',
      },
      { theme: 'invalid', 'color-theme': 'missing' },
      true
    );

    expect(classes.has('dark')).toBe(true);
    expect(classes.has('theme-rose')).toBe(true);
    expect(style.colorScheme).toBe('dark');
  });
  it('honors explicit storage disabling and safely serializes inline script values', () => {
    expect(
      execute(
        { storage: false, defaultTheme: 'light' },
        { theme: 'dark' },
        true
      ).classes.has('dark')
    ).toBe(false);

    const source = getThemeScript({
      colorThemes: ['</script>'],
      defaultColorTheme: '</script>',
    });

    expect(source).not.toContain('</script>');
    expect(
      execute({
        colorThemes: ['</script>'],
        defaultColorTheme: '</script>',
      }).classes.has('theme-</script>')
    ).toBe(true);
  });
  it('rejects configurations that cannot produce valid theme class tokens', () => {
    expect(() =>
      getThemeScript({
        colorThemes: ['two words'],
        defaultColorTheme: 'two words',
      })
    ).toThrow();
    expect(() =>
      getThemeScript({ themes: ['light'], defaultTheme: 'dark' })
    ).toThrow();
  });
});
