import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) visit(path);
    else if (entry.name.endsWith('.d.ts')) {
      const source = readFileSync(path, 'utf8');

      const updated = source.replace(
        /((?:from\s+|import\s*\(\s*|import\s*)['"])(\.[^'"]+)(['"])/g,
        (match, prefix, specifier, quote) => {
          if (specifier.endsWith('.js')) return match;
          const target = resolve(dirname(path), specifier);

          if (existsSync(`${target}.d.ts`))
            return `${prefix}${specifier}.js${quote}`;

          if (existsSync(join(target, 'index.d.ts')))
            return `${prefix}${specifier}/index.js${quote}`;
          throw new Error(
            `Unresolved declaration import ${specifier} in ${path}`
          );
        }
      );

      writeFileSync(path, updated);
    }
  }
}

visit('dist/types');
