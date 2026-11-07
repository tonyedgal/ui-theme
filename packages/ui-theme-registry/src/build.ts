import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
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
  // Ranges that existing app dependencies may satisfy instead of the install
  // spec. Each range is the oldest version that has every import the controls
  // use. `pnpm test:registry:minimum` checks it.
  compatibleDependencies?: Record<string, string>;
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

/**
 * shadcn installs from `{origin}/{style}/{name}.json`, where `style` comes
 * from the app's `components.json`. Each served style maps to one React base.
 * React Aria styles (`aria-*`) are not served, because no Aria templates
 * exist. When shadcn adds a style, add its name here.
 */
const shadcnStyleNames = [
  'vega',
  'nova',
  'maia',
  'lyra',
  'mira',
  'luma',
  'rhea',
  'sera',
];

export const shadcnStyles = new Map<string, 'radix' | 'base-ui'>([
  ['new-york', 'radix'],
  // When an app on Tailwind 4 selects new-york, shadcn installs the files from
  // new-york-v4.
  ['new-york-v4', 'radix'],
  ['default', 'radix'],
  ...shadcnStyleNames.map((name): [string, 'radix'] => [
    `radix-${name}`,
    'radix',
  ]),
  ...shadcnStyleNames.map((name): [string, 'base-ui'] => [
    `base-${name}`,
    'base-ui',
  ]),
]);

const installationDocs = 'https://www.ui-theme.dev/docs/installation';

const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

// `@scope/name@^1.0.0` -> `@scope/name`
function packageName(spec: string) {
  const at = spec.indexOf('@', 1);

  return at === -1 ? spec : spec.slice(0, at);
}

// Keep only the ranges for packages that this item installs.
function compatibleRanges(metadata: Metadata, dependencies: string[]) {
  const names = new Set(dependencies.map(packageName));

  const ranges = Object.entries(metadata.compatibleDependencies ?? {}).filter(
    ([name]) => names.has(name)
  );

  return ranges.length
    ? { compatibleDependencies: Object.fromEntries(ranges) }
    : {};
}

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
                ...compatibleRanges(metadata, dependencies),
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

  const styleFiles = await writeShadcnStyles(outDir, origin, records);

  return {
    revision,
    manifest,
    index,
    files: [...output.map((r) => r.path), ...styleFiles],
  };
}

/**
 * Write the shadcn layer: one TypeScript, Tailwind 4 file per style and
 * component, and a `registry.json` index per style for `shadcn search`. These
 * files follow the stable revision. They are rebuilt on every build and are
 * never frozen in `releases/`.
 */
async function writeShadcnStyles(
  outDir: string,
  origin: string,
  records: {
    path: string;
    item: import('../../ui-theme-cli/src/types.ts').RegistryItem;
  }[]
) {
  const written: string[] = [];

  for (const [style, base] of shadcnStyles) {
    await rm(join(outDir, style), { recursive: true, force: true });
    await mkdir(join(outDir, style), { recursive: true });

    const indexItems = [];

    for (const { item } of records) {
      const meta = item.meta.uiTheme;

      if (
        meta.framework !== 'react' ||
        meta.base !== base ||
        meta.tailwind !== 4 ||
        meta.language !== 'ts'
      )
        continue;

      const dependencies = item.registryDependencies.map(
        (url) => `${origin}/${style}/${url.split('/').at(-1)}`
      );

      const path = `${style}/${item.name}.json`;

      const entry = {
        name: item.name,
        type: item.type,
        title: item.title,
        description: item.description,
        // shadcn overwrites an app's declared version with every versioned
        // spec, so shared libraries use bare names. The controls need the v2
        // runtime, so uitheme-web keeps its range.
        dependencies: [
          ...item.dependencies.map((spec) => packageName(spec)),
          'uitheme-web@^2.0.0',
        ],
        registryDependencies: ['utils', ...dependencies],
        files: item.files,
        docs: `${item.title} needs the UI-Theme provider in your app. See ${installationDocs}.`,
        meta: item.meta,
      };

      const record = {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        ...entry,
      };

      await writeFile(
        join(outDir, path),
        `${JSON.stringify(record, null, 2)}\n`
      );
      written.push(path);

      // the directory requires an index without file content
      indexItems.push({
        ...entry,
        files: entry.files.map(({ path, type }) => ({ path, type })),
      });
    }

    const indexPath = `${style}/registry.json`;

    await writeFile(
      join(outDir, indexPath),
      `${JSON.stringify(
        {
          $schema: 'https://ui.shadcn.com/schema/registry.json',
          name: 'uitheme',
          homepage: 'https://www.ui-theme.dev',
          items: indexItems,
        },
        null,
        2
      )}\n`
    );
    written.push(indexPath);
  }

  return written;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  (async () => {
    const at = process.argv.indexOf('--origin'),
      origin = at === -1 ? undefined : process.argv[at + 1],
      snapshot = process.argv.includes('--snapshot');

    if (at !== -1 && (!origin || origin.startsWith('--')))
      throw new Error('Missing value for --origin');

    // A snapshot is the published record, so it must use the hosted origin.
    if (origin && snapshot)
      throw new Error('--snapshot cannot be combined with --origin');

    const result = await buildRegistry({ origin });

    if (snapshot) await snapshotRegistry();

    return result;
  })()
    .then((result) => {
      console.log(
        `Built ${result.index.items.length} registry items at ${result.revision}`
      );
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
