import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { displayPath } from '../paths.ts';
import type { ProjectProfile } from '../types.ts';
import type { SetupKind } from '../install/messages.ts';
import { targetFor } from './targets.ts';

export interface Evidence {
  file: string;
  line: number;
  note: string;
}

export interface ThemeSetup {
  kind: SetupKind;
  files: string[];
  evidence: Evidence[];
  library?: string;
  packages?: string[];
}

export interface SourceFile {
  path: string;
  content: string;
}

const skipped = new Set([
  'node_modules',
  '.next',
  '.nuxt',
  '.output',
  '.git',
  '.turbo',
  '.vercel',
  'dist',
  'build',
  'out',
  'coverage',
]);

const sourcePattern = /\.(?:[cm]?[jt]s|[jt]sx|vue)$/;

export async function sourcePaths(
  root: string,
  pattern = sourcePattern
): Promise<string[]> {
  const found: string[] = [];

  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(root, entry.name);

    if (entry.isDirectory()) {
      if (!skipped.has(entry.name))
        found.push(...(await sourcePaths(path, pattern)));
    } else if (pattern.test(entry.name)) found.push(path);
  }

  return found;
}

async function readSources(cwd: string): Promise<SourceFile[]> {
  const paths = await sourcePaths(cwd);

  for (const html of ['index.html', 'public/index.html'])
    paths.push(join(cwd, html));

  const files: SourceFile[] = [];

  for (const path of paths)
    try {
      files.push({ path, content: await readFile(path, 'utf8') });
    } catch {
      continue;
    }

  return files;
}

async function dependencies(cwd: string): Promise<Set<string>> {
  try {
    // SAFETY: package.json fields are read with optional fallbacks below
    const manifest = JSON.parse(
      await readFile(join(cwd, 'package.json'), 'utf8')
    ) as Record<string, Record<string, string> | undefined>;

    return new Set(
      ['dependencies', 'devDependencies', 'optionalDependencies'].flatMap(
        (field) => Object.keys(manifest[field] ?? {})
      )
    );
  } catch {
    return new Set();
  }
}

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function matches(
  cwd: string,
  file: SourceFile,
  pattern: RegExp,
  note: string
): Evidence[] {
  const found: Evidence[] = [];

  for (const match of file.content.matchAll(new RegExp(pattern, 'g')))
    found.push({
      file: displayPath(cwd, file.path),
      line: lineOf(file.content, match.index),
      note,
    });

  return found;
}

const importOf = (module: string) =>
  new RegExp(
    `(?:from\\s*|import\\s*\\(\\s*|require\\s*\\(\\s*)['"]${module.replace(/[/.]/g, '\\$&')}(?:/[^'"]*)?['"]`
  );

interface Library {
  name: string;
  packages: string[];
  usage?: RegExp;
}

const libraries: Library[] = [
  { name: '@nuxtjs/color-mode', packages: ['@nuxtjs/color-mode'] },
  {
    name: 'useColorMode or useDark from @vueuse/core',
    packages: ['@vueuse/core'],
    usage: /\buse(?:ColorMode|Dark)\s*\(/,
  },
  { name: 'remix-themes', packages: ['remix-themes'] },
  { name: 'use-dark-mode', packages: ['use-dark-mode'] },
  { name: '@vueuse/color-scheme', packages: ['@vueuse/color-scheme'] },
  { name: 'theme-change', packages: ['theme-change'] },
  { name: 'mode-watcher', packages: ['mode-watcher'] },
];

const v1Packages = ['@ui-theme/web', 'uitheme-vue'];

const designSystems = [
  '@mui/material',
  '@mui/system',
  '@mui/joy',
  '@material-ui/core',
  '@chakra-ui/react',
  '@chakra-ui/system',
  '@mantine/core',
  'styled-components',
  '@emotion/react',
  '@fluentui/react',
  '@fluentui/react-components',
  'theme-ui',
  '@radix-ui/themes',
  'antd',
  'evergreen-ui',
  '@primer/react',
  'flowbite-react',
];

const nameSignal =
  /\b(?:ThemeProvider|ThemeContext|ColorModeProvider|DarkModeProvider)\b/;

const behaviourSignals: [RegExp, string][] = [
  [
    /(?:documentElement|document\.body|\broot)\.classList\.(?:add|toggle|remove)\(\s*['"`]?(?:dark|light)/,
    'sets the dark class on the document',
  ],
  [
    /setAttribute\(\s*['"]data-(?:theme|mode)['"]/,
    'sets a data-theme attribute',
  ],
  [
    /localStorage\.(?:getItem|setItem)\(\s*['"`][^'"`]*(?:theme|mode|dark)[^'"`]*['"`]/i,
    'stores a theme in localStorage',
  ],
  [/matchMedia\(\s*['"]\(prefers-color-scheme/, 'reads prefers-color-scheme'],
];

const ownModules = /['"](?:uitheme-web|uitheme-web\/[^'"]*)['"]/;

function shadcnKind(content: string): SetupKind | undefined {
  if (
    !/export\s+(?:function|const)\s+ThemeProvider\b/.test(content) ||
    !/export\s+(?:function|const)\s+useTheme\b/.test(content) ||
    !/createContext/.test(content) ||
    !/classList\.remove\(\s*['"]light['"]\s*,\s*['"]dark['"]\s*\)/.test(
      content
    ) ||
    !/localStorage\.setItem\(\s*storageKey/.test(content)
  )
    return;

  return /\bScriptOnce\b/.test(content) && /\bgetThemeScript\b/.test(content)
    ? 'shadcn-tanstack'
    : 'shadcn-vite';
}

export async function detectThemeSetup(
  profile: ProjectProfile
): Promise<ThemeSetup[]> {
  const cwd = profile.cwd,
    files = await readSources(cwd),
    declared = await dependencies(cwd),
    react = targetFor(profile.framework).kind === 'react',
    setups: ThemeSetup[] = [],
    claimed = new Set<string>();

  const v1 = files.flatMap((file) =>
    v1Packages.flatMap((module) =>
      matches(cwd, file, importOf(module), `imports ${module}`)
    )
  );

  const v1Declared = v1Packages.filter((name) => declared.has(name));

  if (v1.length || v1Declared.length)
    setups.push({
      kind: 'ui-theme-v1',
      files: [...new Set(v1.map((item) => item.file))],
      evidence: [
        ...v1Declared.map((name) => ({
          file: 'package.json',
          line: 1,
          note: `declares ${name}`,
        })),
        ...v1,
      ],
    });

  if (react) {
    const evidence = files.flatMap((file) =>
      matches(cwd, file, importOf('next-themes'), 'imports next-themes')
    );

    if (evidence.length || declared.has('next-themes')) {
      setups.push({
        kind: 'next-themes',
        files: [...new Set(evidence.map((item) => item.file))],
        evidence: evidence.length
          ? evidence
          : [{ file: 'package.json', line: 1, note: 'declares next-themes' }],
        packages: ['next-themes'],
      });
      evidence.forEach((item) => claimed.add(item.file));
    }

    for (const file of files) {
      const kind = shadcnKind(file.content);

      if (!kind) continue;
      const relative = displayPath(cwd, file.path);
      claimed.add(relative);
      setups.push({
        kind,
        files: [relative],
        evidence: [
          {
            file: relative,
            line: lineOf(
              file.content,
              file.content.search(/export\s+(?:function|const)\s+ThemeProvider/)
            ),
            note: 'exports the shadcn ThemeProvider and useTheme',
          },
        ],
      });
    }
  }

  for (const library of libraries) {
    if (!library.packages.some((name) => declared.has(name))) continue;

    const used = library.usage
      ? files.flatMap((file) =>
          matches(cwd, file, library.usage!, `calls ${library.name}`)
        )
      : files.flatMap((file) =>
          library.packages.flatMap((name) =>
            matches(cwd, file, importOf(name), `uses ${name}`)
          )
        );

    if (library.usage && !used.length) continue;
    setups.push({
      kind: 'library',
      library: library.name,
      files: [...new Set(used.map((item) => item.file))],
      evidence: [
        {
          file: 'package.json',
          line: 1,
          note: `declares ${library.packages.join(', ')}`,
        },
        ...used,
      ],
    });
    used.forEach((item) => claimed.add(item.file));
  }

  const custom: Evidence[] = [];

  for (const file of files) {
    const relative = displayPath(cwd, file.path);

    if (claimed.has(relative) || ownModules.test(file.content)) continue;

    if (designSystems.some((module) => importOf(module).test(file.content)))
      continue;

    const html = file.path.endsWith('.html'),
      named =
        html ||
        nameSignal.test(file.content) ||
        /theme-provider|theme-context/i.test(basename(file.path));

    if (!named) continue;

    const behaviour = behaviourSignals.flatMap(([pattern, note]) =>
      matches(cwd, file, pattern, note)
    );

    if (html && !/<script/i.test(file.content)) continue;

    if (behaviour.length) custom.push(...behaviour);
  }

  if (custom.length)
    setups.push({
      kind: 'custom',
      files: [...new Set(custom.map((item) => item.file))],
      evidence: custom,
    });

  return setups;
}
