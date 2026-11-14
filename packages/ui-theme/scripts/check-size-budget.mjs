import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));

// gzip bytes of each entry plus the chunks it imports, set to measured size + 5%
const budgets = {
  'dist/core/index.js': 7726,
  'dist/core/index.cjs': 7835,
  'dist/react/index.js': 10797,
  'dist/react/index.cjs': 10889,
  'dist/next/index.js': 8867,
  'dist/next/index.cjs': 8937,
  'dist/server/index.js': 940,
  'dist/server/index.cjs': 944,
  'dist/tanstack/index.js': 2867,
  'dist/tanstack/index.cjs': 2933,
  'dist/vue/index.js': 2127,
  'dist/vue/index.cjs': 2182,
  'dist/vue/bootstrap.js': 901,
  'dist/vue/bootstrap.cjs': 928,
  'dist/nuxt.js': 1443,
};

const closure = (entry) => {
  const files = new Set();

  const visit = (file) => {
    if (files.has(file)) return;
    files.add(file);
    const source = readFileSync(file, 'utf8');

    for (const match of source.matchAll(
      /(?:from\s*|import\s*|require\()\s*['"](\.[^'"]+)['"]/g
    )) {
      visit(resolve(dirname(file), match[1]));
    }
  };

  visit(entry);

  return [...files];
};

let failed = false;

for (const [entry, budget] of Object.entries(budgets)) {
  const files = closure(resolve(root, entry));

  const size = gzipSync(
    Buffer.concat(files.map((file) => readFileSync(file))),
    { level: 9 }
  ).length;

  const ok = size <= budget;
  failed ||= !ok;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${entry}: ${size} / ${budget} gzip bytes (${files.length} files)`
  );
}

if (failed) {
  console.error('An entry grew beyond its size budget.');
  process.exit(1);
}
