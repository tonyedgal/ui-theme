import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { readOptional } from '../install/index.ts';
import type { ProjectProfile } from '../types.ts';

export async function cliVersion(): Promise<string> {
  let current = dirname(fileURLToPath(import.meta.url));

  while (true) {
    const source = await readOptional(join(current, 'package.json'));

    if (source) {
      const pkg = JSON.parse(source);

      if (pkg.name === 'uitheme-cli' && semver.valid(pkg.version))
        return pkg.version;
    }

    const parent = dirname(current);

    if (parent === current)
      throw new Error('Cannot find uitheme-cli package version');
    current = parent;
  }
}

export async function installedWebVersion(
  profile: ProjectProfile
): Promise<string | undefined> {
  const require = createRequire(join(profile.cwd, 'package.json'));
  let resolved: string | undefined;

  try {
    resolved = require.resolve('uitheme-web/package.json');
  } catch {
    try {
      resolved = require.resolve('uitheme-web');
    } catch {
      resolved = undefined;
    }
  }

  if (resolved) {
    let current = dirname(resolved);

    while (true) {
      const source = await readOptional(join(current, 'package.json'));

      if (source) {
        const pkg = JSON.parse(source);

        if (pkg.name === 'uitheme-web' && semver.valid(pkg.version))
          return pkg.version;
      }

      const parent = dirname(current);

      if (parent === current) break;
      current = parent;
    }
  }

  const pkg = JSON.parse(
    (await readOptional(join(profile.cwd, 'package.json'))) ?? '{}'
  );

  const declared =
    pkg.dependencies?.['uitheme-web'] ?? pkg.devDependencies?.['uitheme-web'];

  if (!declared) return;

  if (!semver.validRange(declared))
    throw new Error(
      'Cannot verify uitheme-web compatibility from its declared version. Select a released version first.'
    );

  return semver.minVersion(declared)?.version;
}
