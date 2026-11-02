import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const app = fileURLToPath(new URL('../', import.meta.url));

const source = fileURLToPath(
  new URL('../../../packages/ui-theme-registry/dist/', import.meta.url)
);

const manifest = JSON.parse(
  await readFile(join(source, 'manifest.json'), 'utf8')
);

const revision = manifest.stable?.revision;

if (manifest.schemaVersion !== 1 || !/^[a-f0-9]+$/.test(revision)) {
  throw new Error(
    'Build the registry before staging the website. Invalid registry manifest.'
  );
}

const index = JSON.parse(
  await readFile(join(source, `v1/${revision}/registry.json`), 'utf8')
);

const records = [];

for (const item of index.items) {
  const meta = item.meta.uiTheme;

  if (meta.revision !== revision)
    throw new Error('Registry revision mismatch.');
  const path = `v1/${revision}/${meta.framework}/${meta.base}/tw${meta.tailwind}/${meta.language}/${meta.component}.json`;
  const record = JSON.parse(await readFile(join(source, path), 'utf8'));
  records.push({
    ...meta,
    files: record.files,
    dependencies: record.dependencies,
    registryDependencies: record.registryDependencies ?? [],
  });
}

for (const record of records) {
  const files = new Map(record.files.map((file) => [file.path, file]));
  const visited = new Set();

  function collect(entry) {
    if (visited.has(entry.component)) return;
    visited.add(entry.component);

    for (const url of entry.registryDependencies) {
      const name = url
        .split('/')
        .at(-1)
        .replace(/\.json$/, '');

      const dependency = records.find(
        (item) =>
          item.component === name &&
          item.base === entry.base &&
          item.framework === entry.framework &&
          item.tailwind === entry.tailwind &&
          item.language === entry.language
      );

      if (!dependency) throw new Error(`Missing registry dependency: ${name}`);

      for (const file of dependency.files) {
        const existing = files.get(file.path);

        if (existing && existing.content !== file.content)
          throw new Error(`Conflicting registry source: ${file.path}`);
        files.set(file.path, file);
      }

      collect(dependency);
    }
  }

  collect(record);
  record.files = [...files.values()];
}

const target = join(app, 'public/r');

await mkdir(target, { recursive: true });

await cp(join(source, 'v1'), join(target, 'v1'), { recursive: true });

await cp(join(source, 'manifest.json'), join(target, 'manifest.json'));

await mkdir(join(app, '.generated'), { recursive: true });

await writeFile(
  join(app, '.generated/registry.json'),
  JSON.stringify({ revision, records })
);

console.log(`Staged registry ${revision} (${records.length} items).`);
