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
  });
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
