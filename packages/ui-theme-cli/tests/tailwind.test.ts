import { describe, expect, it } from 'vitest';
import {
  transformTailwind3,
  transformTailwind4,
  transformVariables,
} from '../src/tailwind/index';

describe('Tailwind installation preserves existing application styling', () => {
  it('extends a TS 3.4 config without evaluating it or replacing plugins and unrelated theme values', () => {
    const original = `import plugin from 'tailwindcss/plugin';\nexport default { darkMode: 'class', content: ['./src/**/*.{ts,tsx}'], theme: { extend: { fontFamily: { sans: ['Inter'] }, colors: { brand: '#123', primary: 'var(--my-primary)' } } }, plugins: [plugin(() => { throw Error('must not execute') })] } satisfies Config;\n`;
    const result = transformTailwind3(original, 'hsl-channels');
    expect(result).toContain("primary: 'var(--my-primary)'");
    expect(result).toContain("brand: '#123'");
    expect(result).toContain("fontFamily: { sans: ['Inter'] }");
    expect(result).toContain(
      "plugins: [plugin(() => { throw Error('must not execute') })]"
    );
    expect(result).toContain('hsl(var(--background) / <alpha-value>)');
    expect(transformTailwind3(result, 'hsl-channels')).toBe(result);
  });
  it('preserves CJS configs and makes class dark mode explicit', () => {
    const result = transformTailwind3(
      `module.exports = { content: ['./src/**/*.jsx'], plugins: [require('plugin')] };`,
      'css'
    );

    expect(result).toContain('module.exports =');
    expect(result).toContain('var(--background)');
    expect(result).not.toContain('hsl(var(--background)');
    expect(result).toContain('darkMode: "class"');
  });
  it.each([
    `export default makeConfig();`,
    `export default { ...shared, theme: {} };`,
    `export default { theme: { extend: imported } };`,
    `export default { darkMode: 'media' };`,
    `export default { theme: { extend: { colors: imported } } };`,
  ])(
    'requires manual work for config that cannot be changed safely: %s',
    (source) => {
      expect(() => transformTailwind3(source, 'css')).toThrow(/manual/i);
    }
  );
  it('adds TW4 token mapping and a class variant while preserving imports, plugins, and custom rules', () => {
    const original = `@import "tailwindcss";\n@plugin "@tailwindcss/typography";\n@theme inline { --color-primary: var(--existing-primary); --font-sans: Inter; }\n:root { --primary: oklch(0.5 0.1 20); --brand: #f00; }\n.widget { color: red; }\n`;
    const result = transformTailwind4(original, 'css');
    expect(result).toContain('@import "tailwindcss";');
    expect(result).toContain('@plugin "@tailwindcss/typography";');
    expect(result).toContain('--color-primary: var(--existing-primary)');
    expect(result).toContain('--color-background: var(--background)');
    expect(result).toContain('--font-sans: Inter');
    expect(result).toContain('.widget { color: red; }');
    expect(result).toContain('@custom-variant dark (&:where(.dark, .dark *));');
    expect(transformTailwind4(result, 'css')).toBe(result);
  });
  it('does not wrap CSS function colors in hsl and does wrap channel values', () => {
    expect(
      transformTailwind4('@import "tailwindcss";', 'hsl-channels')
    ).toContain('--color-background: hsl(var(--background))');

    const source =
      ':root { --primary: 222 40% 50%; --custom: color(display-p3 1 0 0); }';

    const result = transformVariables(source, 'hsl-channels');
    expect(result).toContain('--primary: 222 40% 50%');
    expect(result).toContain('--custom: color(display-p3 1 0 0)');
    expect(result).toContain('--background: 0 0% 100%');
    expect(transformVariables(result, 'hsl-channels')).toBe(result);
  });
  it('maps mixed full CSS colors and HSL channels per token and rejects inconsistent token formats', () => {
    const source =
      ':root { --primary: oklch(0.5 0.1 20); --background: 0 0% 100%; }';

    const result = transformTailwind4(source, 'hsl-channels');
    expect(result).toContain('--color-primary: var(--primary)');
    expect(result).toContain('--color-background: hsl(var(--background))');
    expect(
      transformTailwind3('export default {}', 'hsl-channels', source)
    ).toContain('"primary": "var(--primary)"');
    expect(() =>
      transformTailwind4(
        ':root { --primary: red; } .dark { --primary: 0 0% 50%; }',
        'css'
      )
    ).toThrow(/manual/i);
  });
  it('rejects conflicting dark variants and invalid CSS before changes', () => {
    expect(() =>
      transformTailwind4(
        '@custom-variant dark (&:where(.night, .night *));',
        'css'
      )
    ).toThrow(/manual/i);
    expect(() => transformTailwind4(':root {', 'css')).toThrow();
  });
});
