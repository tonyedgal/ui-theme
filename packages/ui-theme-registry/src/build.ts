import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import type { RegistryFile } from '../../ui-theme-cli/src/types.ts';
import { transform } from '@unovue/detypes';

const controls = [
  'theme-toggle',
  'icon-theme-toggle',
  'theme-switcher',
  'theme-selector',
  'color-theme-selector',
  'theme-disclosure',
  'color-theme-disclosure',
];

const variants = [
  ['react', 'base-ui'],
  ['react', 'radix'],
  ['vue', 'reka'],
] as const;

interface SourceFile {
  source: string;
  path: string;
  target?: string;
  type?: string;
}

interface Metadata {
  dependencies?: string[];
  components: Record<
    string,
    {
      title: string;
      description: string;
      dependencies?: string[];
      registryDependencies?: string[];
      files: SourceFile[];
    }
  >;
}

const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

function safe(path: string) {
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    /^[a-z]:/i.test(path) ||
    path.split('/').some((p) => p === '..' || p === '.' || !p)
  )
    throw new Error(`Unsafe source path: ${path}`);
}

export async function javascriptSource(
  content: string,
  path: string
): Promise<string> {
  if (path.endsWith('.vue'))
    return transform(content, path, { prettierOptions: null });

  return ts.transpileModule(content, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
    },
    fileName: path,
  }).outputText;
}

async function allSources(
  root: string,
  prefix = ''
): Promise<[string, string][]> {
  const result: [string, string][] = [];

  for (const entry of (
    await readdir(join(root, prefix), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(prefix, entry.name);

    if (entry.isDirectory()) result.push(...(await allSources(root, path)));
    else
      result.push([
        path.replaceAll('\\', '/'),
        await readFile(join(root, path), 'utf8'),
      ]);
  }

  return result;
}

async function immutableFiles(
  sourceDir: string,
  outDir: string
): Promise<void> {
  let files: [string, string][];

  try {
    files = await allSources(sourceDir);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return;
    throw error;
  }

  for (const [local, content] of files) {
    const path = join(outDir, local);

    try {
      if ((await readFile(path, 'utf8')) !== content)
        throw new Error(`Immutable registry collision: ${local}`);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !('code' in error) ||
        error.code !== 'ENOENT'
      )
        throw error;
    }
  }

  for (const [local, content] of files) {
    const path = join(outDir, local);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
}

export async function snapshotRegistry(
  options: { outDir?: string; releaseDir?: string } = {}
) {
  const outDir =
    options.outDir ?? fileURLToPath(new URL('../dist', import.meta.url));

  const releaseDir =
    options.releaseDir ??
    fileURLToPath(new URL('../releases', import.meta.url));

  const manifest = JSON.parse(
    await readFile(join(outDir, 'manifest.json'), 'utf8')
  );

  const revision = manifest.stable?.revision;

  if (
    manifest.schemaVersion !== 1 ||
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- validate the snapshot manifest at its file boundary
    typeof revision !== 'string' ||
    !/^[a-f0-9]{64}$/.test(revision)
  )
    throw new Error('Invalid registry manifest for snapshot');
  await readFile(join(outDir, `v1/${revision}/registry.json`), 'utf8');
  await immutableFiles(
    join(outDir, 'v1', revision),
    join(releaseDir, 'v1', revision)
  );

  return revision;
}

export async function buildRegistry(
  options: {
    sourceDir?: string;
    outDir?: string;
    origin?: string;
    releaseDir?: string;
  } = {}
) {
  const sourceDir =
      options.sourceDir ??
      fileURLToPath(new URL('./templates', import.meta.url)),
    outDir =
      options.outDir ?? fileURLToPath(new URL('../dist', import.meta.url)),
    origin = (options.origin ?? 'https://www.ui-theme.dev/r').replace(
      /\/$/,
      ''
    );

  const sources = await allSources(sourceDir);

  const pendingRevision = '__revision__';

  const records: {
    path: string;
    item: import('../../ui-theme-cli/src/types.ts').RegistryItem;
  }[] = [];

  for (const [framework, base] of variants) {
    const root = `${framework}/${base}`,
      metaSource = sources.find(
        ([path]) => path === `${root}/metadata.json`
      )?.[1];

    if (!metaSource) throw new Error(`Missing template metadata: ${root}`);
    const metadata: Metadata = JSON.parse(metaSource);

    for (const component of controls) {
      const meta = metadata.components?.[component];

      if (!meta?.files?.length || !meta.title || !meta.description)
        throw new Error(`Incomplete template: ${root}/${component}`);

      for (const tailwind of [3, 4] as const)
        for (const language of ['ts', 'js'] as const) {
          const url = (name: string) =>
            `${origin}/v1/${pendingRevision}/${root}/tw${tailwind}/${language}/${name}.json`;

          const files = await Promise.all(
            meta.files.map(async (file) => {
              safe(file.source);
              safe(file.path);

              if (file.target) safe(file.target);

              let content = sources.find(
                ([path]) => path === `${root}/${file.source}`
              )?.[1];

              if (content === undefined || !content.trim())
                throw new Error(
                  `Missing template source: ${root}/${file.source}`
                );
              content = content.replaceAll(
                '{{tailwindMajor}}',
                String(tailwind)
              );

              const rename = (path: string) =>
                language === 'js'
                  ? path.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js')
                  : path;

              if (language === 'js')
                content = await javascriptSource(
                  content,
                  join(sourceDir, root, file.source)
                );

              if (/\{\{\w+\}\}/.test(content))
                throw new Error('Unresolved registry template substitution');

              const output: RegistryFile = {
                path: rename(file.path),
                content,
                type: file.type ?? 'registry:ui',
              };

              if (file.target) output.target = rename(file.target);

              return output;
            })
          );

          const dependencies = [
            ...new Set(
              [
                ...(metadata.dependencies ?? []),
                ...(meta.dependencies ?? []),
              ].map((dep) =>
                dep.replaceAll(
                  '{{tailwindMergeVersion}}',
                  tailwind === 3 ? '^2.6.0' : '^3.0.0'
                )
              )
            ),
          ];

          const item: import('../../ui-theme-cli/src/types.ts').RegistryItem = {
            name: component,
            type: 'registry:ui',
            title: meta.title,
            description: meta.description,
            dependencies,
            registryDependencies: (meta.registryDependencies ?? []).map(url),
            files,
            meta: {
              uiTheme: {
                schemaVersion: 1,
                revision: pendingRevision,
                component,
                framework,
                base,
                tailwind,
                language,
                webVersion: '^2.0.0',
                cliVersion: '^1.0.0',
              },
            },
          };

          records.push({
            path: `${root}/tw${tailwind}/${language}/${component}.json`,
            item,
          });
        }
    }
  }

  const revision = digest(
    JSON.stringify({ schemaVersion: 1, origin, records })
  );

  for (const record of records) {
    record.path = `v1/${revision}/${record.path}`;
    record.item.meta.uiTheme.revision = revision;
    record.item.registryDependencies = record.item.registryDependencies.map(
      (url) => url.replace(`/v1/${pendingRevision}/`, `/v1/${revision}/`)
    );
  }

  const releaseDir =
    options.releaseDir ??
    fileURLToPath(new URL('../releases', import.meta.url));

  await immutableFiles(join(releaseDir, 'v1'), join(outDir, 'v1'));

  const index = {
    name: 'uitheme',
    homepage: 'https://www.ui-theme.dev',
    items: records.map((r) => r.item),
  };

  const manifest = {
    schemaVersion: 1,
    stable: {
      revision,
      index: `${origin}/v1/${revision}/registry.json`,
      webVersion: '^2.0.0',
      cliVersion: '^1.0.0',
    },
  };

  const output = [
    ...records,
    { path: `v1/${revision}/registry.json`, item: index },
    { path: 'manifest.json', item: manifest },
  ];

  for (const record of output) {
    const path = join(outDir, record.path);
    await mkdir(dirname(path), { recursive: true });
    const serialized = `${JSON.stringify(record.item, null, 2)}\n`;

    if (record.path !== 'manifest.json') {
      try {
        const previous = await readFile(path, 'utf8');

        if (previous !== serialized)
          throw new Error(`Immutable registry collision: ${record.path}`);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !('code' in error) ||
          error.code !== 'ENOENT'
        )
          throw error;
      }
    }

    await writeFile(path, serialized);
  }

  return { revision, manifest, index, files: output.map((r) => r.path) };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  buildRegistry()
    .then(async (result) => {
      if (process.argv.includes('--snapshot')) await snapshotRegistry();
      console.log(
        `Built ${result.index.items.length} registry items at ${result.revision}`
      );
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
