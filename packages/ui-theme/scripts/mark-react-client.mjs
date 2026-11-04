import { readFile, writeFile } from 'node:fs/promises';

for (const file of [
  'dist/react/index.js',
  'dist/react/index.cjs',
  'dist/next/index.js',
  'dist/next/index.cjs',
]) {
  const source = await readFile(file, 'utf8');
  await writeFile(file, '"use client";\n' + source);
}
