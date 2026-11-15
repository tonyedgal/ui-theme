import nodePath from 'node:path';

/** A `node:path` implementation. Tests pass `path.win32` on any OS. */
export type PathApi = typeof nodePath;

/**
 * Two paths name the same place. On Windows the drive letter and the names
 * compare without case, and `/` equals `\`.
 */
export function samePath(
  a: string,
  b: string,
  path: PathApi = nodePath
): boolean {
  return path.relative(path.resolve(a), path.resolve(b)) === '';
}

/**
 * `target` is `root` or lies below it. A relative path that starts with `..`
 * as a real name, such as `..foo`, stays inside. A target on another drive
 * or share is outside.
 */
export function isInside(
  root: string,
  target: string,
  path: PathApi = nodePath
): boolean {
  const local = path.relative(path.resolve(root), path.resolve(target));

  return (
    local === '' ||
    (local !== '..' &&
      !local.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(local))
  );
}

/**
 * Remove a trailing `/*` from a tsconfig `paths` target that `path.resolve`
 * already wrote with native separators.
 */
export function stripWildcard(
  target: string,
  path: PathApi = nodePath
): string {
  return target.replace(path.sep === '\\' ? /[\\/]\*$/ : /\/\*$/, '');
}

/**
 * A path for a message: relative to the project root and written with `/` on
 * every OS. A target outside the root keeps its own form.
 */
export function displayPath(
  root: string,
  target: string,
  path: PathApi = nodePath
): string {
  if (!isInside(root, target, path)) return target;

  return path
    .relative(path.resolve(root), path.resolve(target))
    .replaceAll('\\', '/');
}
