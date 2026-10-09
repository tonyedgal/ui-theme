import { readFile, writeFile } from 'node:fs/promises';

// This source has flat theme selectors. Match only those blocks and OKLCH colors;
// leave the web app's layout, fonts, shadows, and animations in its stylesheet.
const examples = new URL('../', import.meta.url);

const source = await readFile(
  new URL('example-next/app/globals.css', examples),
  'utf8'
);

const palettes = [
  'default',
  'supabase',
  'mono',
  'caffeine',
  'mocha',
  'perpetuity',
];

const blocks = new Map();

for (const match of source.matchAll(
  /(?:^|\n)(:root|\.dark|\.theme-[\w-]+(?:\.dark)?)\s*\{([^}]+)\}/g
)) {
  const colors = [...match[2].matchAll(/--([\w-]+):\s*(oklch\([^;]+\));/g)];

  if (colors.length)
    blocks.set(
      match[1],
      colors.map((color) => [color[1], color[2]])
    );
}

const variants = palettes.flatMap((palette) =>
  ['light', 'dark'].map((mode) => {
    const selector =
      palette === 'default'
        ? mode === 'light'
          ? ':root'
          : '.dark'
        : `.theme-${palette}${mode === 'dark' ? '.dark' : ''}`;

    const colors = blocks.get(selector);

    if (!colors || colors.length !== 32)
      throw new Error(`Expected 32 color tokens in ${selector}`);

    return { name: `${palette}-${mode}`, colors };
  })
);

const aliases = variants[0].colors
  .map(([name]) => `  --color-${name}: var(--${name});`)
  .join('\n');

const declarations = (colors) =>
  colors
    .flatMap(([name, value]) => [
      `    --${name}: ${value};`,
      `    --color-${name}: var(--${name});`,
    ])
    .join('\n');

const banner =
  '/* Generated from example-next/app/globals.css. Run pnpm sync:colors. */\n';

for (const engine of ['nativewind', 'uniwind']) {
  const imports =
    engine === 'nativewind'
      ? '@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/preflight.css" layer(base);\n@import "tailwindcss/utilities.css";\n@import "nativewind/theme";'
      : '@import "tailwindcss";\n@import "uniwind";';

  let css = `${banner}${imports}\n\n@theme inline static {\n${aliases}\n}\n\n`;

  if (engine === 'nativewind') {
    css += `:root {\n${declarations(variants[0].colors)}\n}\n\n`;
    css += variants
      .map(({ name, colors }) => `.${name} {\n${declarations(colors)}\n}`)
      .join('\n\n');
  } else {
    css += '@layer theme {\n  :root {\n';
    css += variants
      .map(
        ({ name, colors }) =>
          `    @variant ${name} {\n${declarations(colors)}\n    }`
      )
      .join('\n');
    css += `\n    @variant light {\n${declarations(variants[0].colors)}\n    }\n    @variant dark {\n${declarations(variants[1].colors)}\n    }\n  }\n}`;
  }

  await writeFile(
    new URL(`example-${engine}/src/global.css`, examples),
    `${css}\n`
  );
  const manifest = `import type { ThemeStyleScopes } from 'uitheme-rn/${engine}';\n\nexport const palettes = {\n${palettes.map((name) => `  ${name}: { label: '${name === 'default' ? 'Default' : name[0].toUpperCase() + name.slice(1)}' },`).join('\n')}\n};\n\nexport const scopes: ThemeStyleScopes = {\n${palettes.map((name) => `  ${name}: { light: '${name}-light', dark: '${name}-dark' },`).join('\n')}\n};\n`;
  await writeFile(
    new URL(`example-${engine}/src/theme.ts`, examples),
    manifest
  );
}

await writeFile(
  new URL('example-nativewind/metro.config.cjs', examples),
  `const { getDefaultConfig } = require('expo/metro-config');\nconst { withNativewind } = require('nativewind/metro');\nmodule.exports = withNativewind(getDefaultConfig(__dirname), {\n  inlineVariables: { exclude: ${JSON.stringify(variants[0].colors.flatMap(([name]) => [`--${name}`, `--color-${name}`]))} },\n});\n`
);

await writeFile(
  new URL('example-uniwind/metro.config.cjs', examples),
  `const { getDefaultConfig } = require('expo/metro-config');\nconst { withUniwindConfig } = require('uniwind/metro');\nmodule.exports = withUniwindConfig(getDefaultConfig(__dirname), {\n  cssEntryFile: './src/global.css',\n  dtsFile: './src/uniwind-types.d.ts',\n  extraThemes: ${JSON.stringify(variants.map(({ name }) => name))},\n});\n`
);

console.log(
  'Synced 32 color tokens across 12 palette/mode combinations for both engines.'
);
