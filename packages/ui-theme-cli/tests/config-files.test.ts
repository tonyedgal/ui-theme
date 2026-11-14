import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { parseJsonc } from '../src/jsonc';
import { detectProject } from '../src/project';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function app(files: Record<string, string>) {
  const cwd = await mkdtemp(join(tmpdir(), 'uitheme-configs-'));
  roots.push(cwd);
  files = {
    'package.json': JSON.stringify({
      dependencies: { vite: '^7', react: '^19', tailwindcss: '^4' },
    }),
    'src/style.css': '@import "tailwindcss";',
    ...files,
  };

  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(cwd, path)), { recursive: true });
    await writeFile(join(cwd, path), content);
  }

  return cwd;
}

describe('JSONC', () => {
  it('keeps comment markers and closing brackets inside strings', () => {
    expect(
      parseJsonc(
        '{"url": "https://x.dev/*not*/", "glob": "src/**/*", "text": "a,]", "quote": "\\"//"}'
      )
    ).toEqual({
      url: 'https://x.dev/*not*/',
      glob: 'src/**/*',
      text: 'a,]',
      quote: '"//',
    });
  });

  it('removes line and block comments and trailing commas', () => {
    expect(
      parseJsonc(
        '{\n // line\n "a": [1, 2, /* two */ ],\n "b": { "c": true, } /* end */ ,\n}'
      )
    ).toEqual({ a: [1, 2], b: { c: true } });
  });

  it.each([
    ['a single-quoted string', "{'a': 1}"],
    ['a missing value', '{"a": }'],
    ['two commas', '[1,,]'],
    ['an unterminated comment', '{"a": 1 /* open'],
    ['an unterminated string', '{"a": "open}'],
  ])('rejects %s', (_, source) => {
    expect(() => parseJsonc(source)).toThrow(SyntaxError);
  });
});

describe('TypeScript configuration', () => {
  it('reads paths through references and extends, from the config that sets them', async () => {
    const cwd = await app({
      'tsconfig.json':
        '{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./packages/missing" }] }',
      'tsconfig.app.json':
        '{ "extends": ["./config/strict.json", "./config/paths.json"] }',
      'config/strict.json': '{ "compilerOptions": { "strict": true } }',
      'config/paths.json':
        '{ /* aliases */ "compilerOptions": { "paths": { "~/*": ["../src/*"], }, }, }',
    });

    const profile = await detectProject({ cwd });

    expect(profile.aliasPrefix).toBe('~');
    expect(profile.componentsDir).toBe(join(cwd, 'src/components/ui'));
  });

  it('lets the root config override a referenced alias', async () => {
    const cwd = await app({
      'tsconfig.json':
        '{ "compilerOptions": { "paths": { "@/*": ["./app/*"] } }, "references": [{ "path": "./web" }] }',
      'web/tsconfig.json':
        '{ "compilerOptions": { "paths": { "@/*": ["../src/*"] } } }',
    });

    expect((await detectProject({ cwd })).componentsDir).toBe(
      join(cwd, 'app/components/ui')
    );
  });

  it('reads jsconfig.json for a JavaScript app', async () => {
    const cwd = await app({
      'jsconfig.json':
        '{ "compilerOptions": { "baseUrl": ".", "paths": { "#/*": ["lib/*"] } } }',
    });

    const profile = await detectProject({ cwd });

    expect(profile.language).toBe('js');
    expect(profile.componentsDir).toBe(join(cwd, 'lib/components/ui'));
  });

  it('names the file when a configuration is not valid', async () => {
    const cwd = await app({ 'tsconfig.json': '{ "compilerOptions": ' });

    await expect(detectProject({ cwd })).rejects.toThrow(
      `Invalid TypeScript configuration: ${join(cwd, 'tsconfig.json')}`
    );
  });
});

describe('package', () => {
  it('does not depend on or import typescript at runtime', async () => {
    const manifest = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8')
    );

    expect(Object.keys(manifest.dependencies)).not.toContain('typescript');

    const source = new URL('../src/', import.meta.url);
    const files = await readdir(source, { recursive: true });

    for (const file of files.filter((name) => name.endsWith('.ts'))) {
      const text = await readFile(new URL(file, source), 'utf8');
      expect(text, file).not.toMatch(
        /(?:from|import\s*\(?)\s*['"]typescript['"]/
      );
    }
  });
});
