import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  readConfig,
  relativeProjectPath,
  validateConfig,
  writeFileAtomic,
} from '../src/config';
import { registryDestination, serializeConfig } from '../src/install/index';
import { displayPath, isInside, samePath, stripWildcard } from '../src/paths';
import { aliasDirectory, aliasPath } from '../src/project';
import type { ProjectProfile } from '../src/types';

const flavors = [
  {
    name: 'posix',
    api: path.posix,
    root: '/Users/tony/Documents/ui-theme',
    spaced: '/Users/tony/My Documents/ui theme',
    other: '/mnt/other/app',
  },
  {
    name: 'win32',
    api: path.win32,
    root: 'C:\\Users\\tony\\Documents\\ui-theme',
    spaced: 'C:\\Users\\tony\\My Documents\\ui theme',
    other: 'D:\\app',
  },
] as const;

describe.each(flavors)('paths on $name', ({ api, root, spaced, other }) => {
  const join = (base: string, ...parts: string[]) => api.join(base, ...parts);

  it.each([
    ['the root itself', () => root, true],
    ['a child', () => join(root, 'src', 'a.ts'), true],
    ['a sibling with the same prefix', () => `${root}-two`, false],
    ['the parent', () => api.dirname(root), false],
    ['a name that starts with two dots', () => join(root, '..foo', 'a'), true],
    ['an escape through dots', () => join(root, '..', 'x'), false],
    ['another root', () => other, false],
  ])('isInside: %s', (_, target, expected) => {
    expect(isInside(root, target(), api)).toBe(expected);
  });

  it('handles spaces', () => {
    expect(isInside(spaced, join(spaced, 'src', 'a b.ts'), api)).toBe(true);
    expect(isInside(spaced, root, api)).toBe(false);
  });

  it('samePath compares resolved paths', () => {
    expect(samePath(root, join(root, 'src', '..'), api)).toBe(true);
    expect(samePath(root, join(root, 'src'), api)).toBe(false);
  });

  it('strips a trailing wildcard in the native form', () => {
    expect(stripWildcard(join(root, 'src', '*'), api)).toBe(join(root, 'src'));
    expect(stripWildcard(api.resolve(root, './*'), api)).toBe(root);
    expect(stripWildcard(join(root, 'src'), api)).toBe(join(root, 'src'));
  });

  it('relativeProjectPath refuses an escape and writes "/"', () => {
    expect(
      relativeProjectPath(root, join(root, 'src', 'a.css'), root, api)
    ).toBe('src/a.css');
    expect(() =>
      relativeProjectPath(root, join(root, '..', 'a.css'), root, api)
    ).toThrow(/outside the approved workspace/);
    expect(() => relativeProjectPath(root, other, root, api)).toThrow(
      /outside the approved workspace/
    );
  });
});

describe('windows only path rules', () => {
  const win = path.win32;

  it('ignores drive letter and name case', () => {
    expect(
      isInside(
        'c:\\users\\TONY\\documents',
        'C:\\Users\\tony\\Documents\\a',
        win
      )
    ).toBe(true);
    expect(samePath('c:\\Users\\tony', 'C:\\USERS\\Tony\\', win)).toBe(true);
  });

  it('accepts both separators', () => {
    expect(isInside('C:\\a\\b', 'C:/a/b/c', win)).toBe(true);
    expect(isInside('C:\\a\\b', 'C:/a/c', win)).toBe(false);
  });

  it('refuses a different drive', () => {
    expect(isInside('C:\\a', 'D:\\a\\b', win)).toBe(false);
    expect(isInside('C:\\a', 'D:\\', win)).toBe(false);
  });

  it('handles UNC paths', () => {
    expect(
      isInside('\\\\srv\\share\\app', '\\\\srv\\share\\app\\src', win)
    ).toBe(true);
    expect(
      isInside('\\\\SRV\\Share\\app', '\\\\srv\\share\\APP\\src', win)
    ).toBe(true);
    expect(isInside('\\\\srv\\share\\app', '\\\\srv\\other\\app', win)).toBe(
      false
    );
    expect(isInside('C:\\app', '\\\\srv\\share\\app', win)).toBe(false);
  });

  it('a backslash is not a separator on posix', () => {
    expect(stripWildcard('/a/src\\*', path.posix)).toBe('/a/src\\*');
  });
});

describe('the owner layout on Windows', () => {
  const win = path.win32;
  const cwd = 'C:\\Users\\tony\\Documents\\ui-theme';

  // get-tsconfig keeps the wildcard and `resolve` writes native separators
  const target = (value: string) => win.resolve(cwd, value);

  it.each([
    ['./src/*', `${cwd}\\src`],
    ['./*', cwd],
    ['src/*', `${cwd}\\src`],
  ])('tsconfig "@/*": ["%s"]', (value, expected) => {
    expect(target(value)).toMatch(/\*$/);
    expect(aliasDirectory(cwd, cwd, target(value), win)).toBe(expected);
  });

  it('keeps the symlinked project path and resolves case-insensitively', () => {
    const real = 'c:\\users\\tony\\documents\\ui-theme';

    expect(aliasDirectory(cwd, real, `${real}\\src\\*`, win)).toBe(
      `${cwd}\\src`
    );
  });

  it('leaves a target on another drive alone', () => {
    expect(aliasDirectory(cwd, cwd, 'D:\\shared\\src\\*', win)).toBe(
      'D:\\shared\\src'
    );
  });

  it('reads no alias when tsconfig has none', () => {
    expect(aliasDirectory(cwd, cwd, undefined, win)).toBeUndefined();
  });

  it('maps components.json aliases.ui below the alias directory', () => {
    const src = aliasDirectory(cwd, cwd, target('./src/*'), win)!;

    expect(aliasPath('@/components/ui', '@', src, win)).toBe(
      `${cwd}\\src\\components\\ui`
    );
    expect(aliasPath('~/ui', '@', src, win)).toBe('~/ui');
  });

  it.each([
    ['./src/*', 'src/components/ui'],
    ['./*', 'components/ui'],
  ])(
    'plans every file inside the app and saves "/" paths (%s)',
    (value, ui) => {
      const directory = aliasDirectory(cwd, cwd, target(value), win)!;

      const componentsDir = win.resolve(
        cwd,
        aliasPath('@/components/ui', '@', directory, win)
      );

      const profile = {
        cwd,
        workspaceRoot: cwd,
        framework: 'next',
        frameworkVersion: '16',
        language: 'ts',
        packageManager: 'pnpm',
        tailwind: 4,
        cssFile: win.join(cwd, 'src', 'app', 'globals.css'),
        componentsDir,
        aliasPrefix: '@',
        base: 'base-ui',
        colorFormat: 'css',
        configFile: win.join(cwd, 'uitheme.json'),
      } satisfies ProjectProfile;

      for (const file of [
        'button.tsx',
        'ui/button.tsx',
        'components/ui/button.tsx',
      ]) {
        const destination = registryDestination(profile, file, win);

        expect(destination).not.toContain('*');
        expect(isInside(cwd, destination, win)).toBe(true);
        expect(destination).toBe(win.join(cwd, ...ui.split('/'), 'button.tsx'));
      }

      const saved = JSON.parse(serializeConfig(profile, {}, win));

      expect(saved.componentsDir).toBe(ui);
      expect(saved.cssFile).toBe('src/app/globals.css');
      expect(JSON.stringify(saved)).not.toContain('\\\\');
      expect(() => validateConfig(saved)).not.toThrow();
    }
  );
});

describe('uitheme.json', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  async function directory() {
    const root = await mkdtemp(path.join(tmpdir(), 'uitheme-win-'));
    roots.push(root);

    return root;
  }

  it('reads a file with a byte order mark', async () => {
    const root = await directory();

    await writeFile(
      path.join(root, 'uitheme.json'),
      '\uFEFF{"schemaVersion":1,"componentsDir":"src/components/ui"}'
    );

    expect((await readConfig(root))?.componentsDir).toBe('src/components/ui');
  });

  it('names the field and the reason for a backslash path', () => {
    expect(() =>
      validateConfig({ schemaVersion: 1, cssFile: 'src\\app\\globals.css' })
    ).toThrow(/cssFile must be a relative path that uses "\/"/);
    expect(() => validateConfig({ schemaVersion: 1, base: 'x' })).toThrow(
      /base must be one of/
    );
    expect(() => validateConfig({ schemaVersion: 2 })).toThrow(/schemaVersion/);
  });

  it('retries a busy rename and then succeeds', async () => {
    const root = await directory();
    const file = path.join(root, 'uitheme.json');
    await writeFile(file, 'before');
    let calls = 0;

    await writeFileAtomic(file, 'after', async (from, to) => {
      calls++;

      if (calls < 3) throw Object.assign(new Error('busy'), { code: 'EBUSY' });
      const { rename } = await import('node:fs/promises');
      await rename(from, to);
    });

    expect(calls).toBe(3);
    expect(await readFile(file, 'utf8')).toBe('after');
    expect(await readdir(root)).toEqual(['uitheme.json']);
  });

  it.each(['EPERM', 'EBUSY', 'EACCES'])(
    'writes the target directly when a rename keeps failing with %s',
    async (code) => {
      const root = await directory();
      const file = path.join(root, 'uitheme.json');
      await writeFile(file, 'before');
      let calls = 0;

      await writeFileAtomic(file, 'after', async () => {
        calls++;
        throw Object.assign(new Error('locked'), { code });
      });

      expect(calls).toBe(3);
      expect(await readFile(file, 'utf8')).toBe('after');
      expect(await readdir(root)).toEqual(['uitheme.json']);
    }
  );

  it('does not retry another error', async () => {
    const root = await directory();
    const file = path.join(root, 'uitheme.json');
    await writeFile(file, 'before');
    let calls = 0;

    await expect(
      writeFileAtomic(file, 'after', async () => {
        calls++;
        throw Object.assign(new Error('gone'), { code: 'ENOSPC' });
      })
    ).rejects.toThrow('gone');

    expect(calls).toBe(1);
    expect(await readFile(file, 'utf8')).toBe('before');
    expect(await readdir(root)).toEqual(['uitheme.json']);
  });
});

describe.each([
  [
    'posix',
    path.posix,
    '/home/tony/ui-theme',
    '/home/tony/ui-theme/src/main.js',
    '/etc/x',
  ],
  [
    'win32',
    path.win32,
    'C:\\Users\\tony\\ui-theme',
    'C:\\Users\\tony\\ui-theme\\src\\main.js',
    'D:\\x',
  ],
] as const)('displayPath on %s', (_, api, root, inside, outside) => {
  it('shows a project-relative path with "/"', () => {
    expect(displayPath(root, inside, api)).toBe('src/main.js');
  });

  it('keeps a path outside the project', () => {
    expect(displayPath(root, outside, api)).toBe(outside);
  });
});
