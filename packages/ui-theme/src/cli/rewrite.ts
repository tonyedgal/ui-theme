/**
 * Pure text rewrites for the `@ui-theme/web` to `uitheme-web` migration.
 *
 * Every function here takes a string and returns a string. None of them read
 * a file or hold state, so the rewrite rules can be checked without a project.
 */

/** The name the package was published under before the rename. */
export const OLD_NAME = '@ui-theme/web';

/** The name the package is published under now. */
export const NEW_NAME = 'uitheme-web';

/**
 * Matches a quoted module specifier that names the old package.
 *
 * The lookahead stops the match from swallowing a longer name such as
 * `@ui-theme/web-forms`. The subpath group keeps `/core`, `/react` and
 * `/tanstack` on the new name.
 */
const SPECIFIER = /(['"`])@ui-theme\/web(?![@\w-])(\/[^'"`\n]*)?\1/g;

/**
 * Matches the old package inside a node_modules path, which is how a Tailwind
 * `@source` directive points at the installed package.
 */
const NODE_MODULES_PATH = /node_modules\/@ui-theme\/web(?![\w-])/g;

/** Matches a dependency key in package.json, with its range in group one. */
const PACKAGE_JSON_ENTRY = /"@ui-theme\/web"\s*:\s*"([^"]*)"/g;

/**
 * Rewrites module specifiers, so `import` and `require` statements and
 * dynamic imports all move to the new name.
 */
export function rewriteModuleSpecifier(source: string): string {
  return source.replace(
    SPECIFIER,
    (_match, quote: string, subpath: string | undefined) =>
      `${quote}${NEW_NAME}${subpath ?? ''}${quote}`
  );
}

/**
 * Rewrites a node_modules path, so a Tailwind `@source` directive keeps
 * pointing at the installed package.
 */
export function rewriteNodeModulesPath(source: string): string {
  return source.replace(NODE_MODULES_PATH, `node_modules/${NEW_NAME}`);
}

/** Applies both source rewrites to a file body. */
export function rewriteSource(source: string): string {
  return rewriteNodeModulesPath(rewriteModuleSpecifier(source));
}

/**
 * Rewrites the dependency key in package.json.
 *
 * The range moves to the version of the package that is running the
 * migration, so the result installs. When the version cannot be read, the
 * original range is kept and the caller warns.
 */
export function rewritePackageJson(
  source: string,
  version: string | null
): { text: string; changed: boolean; keptRange: boolean } {
  let keptRange = false;

  const text = source.replace(PACKAGE_JSON_ENTRY, (_match, range: string) => {
    if (version === null) {
      keptRange = true;
      return `"${NEW_NAME}": "${range}"`;
    }
    return `"${NEW_NAME}": "^${version}"`;
  });

  return { text, changed: text !== source, keptRange };
}
