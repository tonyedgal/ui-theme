import {
  chmod,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { writeFileAtomic } from '../src/config';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

it('keeps the previous file whole when a write is interrupted', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uitheme-write-'));
  roots.push(root);
  const path = join(root, 'theme.ts');
  await writeFile(path, 'before');

  await expect(
    writeFileAtomic(path, 'after', async () => {
      throw new Error('interrupted');
    })
  ).rejects.toThrow('interrupted');

  expect(await readFile(path, 'utf8')).toBe('before');
  expect(await readdir(root)).toEqual(['theme.ts']);
});

it('replaces the file and keeps its permissions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'uitheme-write-'));
  roots.push(root);
  const path = join(root, 'run.sh');
  await writeFile(path, 'before');
  await chmod(path, 0o755);

  await writeFileAtomic(path, 'after');

  expect(await readFile(path, 'utf8')).toBe('after');

  // Windows has no permission bits
  if (process.platform !== 'win32')
    expect((await stat(path)).mode & 0o777).toBe(0o755);
  expect(await readdir(root)).toEqual(['run.sh']);
});
