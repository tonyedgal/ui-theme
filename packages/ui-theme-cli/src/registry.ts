/* eslint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters -- parse untrusted JSON and HTTP input at this boundary */
import semver from 'semver';
import { isRecord } from './config.ts';
import type {
  HttpClient,
  RegistryFile,
  RegistryGraph,
  RegistryIndex,
  RegistryItem,
  RegistryManifest,
  RegistryVariant,
} from './types.ts';

/**
 * Check a version against a release range. A prerelease counts as the release
 * it leads to, so `2.0.0-rc.1` satisfies `^2.0.0`.
 */
export function satisfiesRelease(version: string, range: string): boolean {
  const parsed = semver.parse(version);

  return (
    !!parsed &&
    semver.satisfies(`${parsed.major}.${parsed.minor}.${parsed.patch}`, range)
  );
}

/** A CLI built from source before its first release has version 0.0.0. */
export const unreleasedVersion = '0.0.0';

export const defaultOrigin = 'https://www.ui-theme.dev/r';

const localHosts = ['localhost', '127.0.0.1', '[::1]'];

/**
 * Select the registry origin. The `--registry` flag wins over the
 * `UITHEME_REGISTRY_URL` variable, and both win over the hosted registry.
 * Plain HTTP is accepted only for a registry on this machine.
 */
export function resolveRegistryOrigin(
  sources: { flag?: string; env?: string } = {}
): string {
  const value = sources.flag || sources.env;

  if (!value) return defaultOrigin;

  const name = sources.flag ? '--registry' : 'UITHEME_REGISTRY_URL';

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid ${name}: ${value} is not a URL`);
  }

  const local =
    localHosts.includes(url.hostname) || url.hostname.endsWith('.localhost');

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))
    throw new Error(
      `Invalid ${name}: use https, or http for localhost (${value})`
    );

  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      `Invalid ${name}: remove credentials, query and fragment (${value})`
    );

  return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
}

const validRevision = (value: unknown): value is string =>
  typeof value === 'string' && /^\w[\w-]{7,127}$/.test(value);

const strings = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === 'string' && !!item);

export function assertSafePath(path: string): void {
  if (
    typeof path !== 'string' ||
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    /^[a-z]:/i.test(path) ||
    path.split('/').some((part) => part === '..' || part === '.' || !part) ||
    Array.from(path).some((char) => char.charCodeAt(0) < 32)
  )
    throw new Error(`Unsafe registry path: ${path}`);
}

function validateVariant(value: unknown): RegistryVariant {
  if (
    !isRecord(value) ||
    !['react', 'vue'].includes(String(value.framework)) ||
    !['base-ui', 'radix', 'reka'].includes(String(value.base)) ||
    ![3, 4].includes(Number(value.tailwind)) ||
    typeof value.tailwind !== 'number' ||
    !['ts', 'js'].includes(String(value.language))
  )
    throw new Error('Invalid registry variant');

  if (value.framework === 'vue' ? value.base !== 'reka' : value.base === 'reka')
    throw new Error('Incompatible registry base');

  return {
    framework: value.framework === 'react' ? 'react' : 'vue',
    base:
      value.base === 'base-ui'
        ? 'base-ui'
        : value.base === 'radix'
          ? 'radix'
          : 'reka',
    tailwind: value.tailwind === 3 ? 3 : 4,
    language: value.language === 'ts' ? 'ts' : 'js',
  };
}

export function createRegistryClient(
  options: {
    http?: HttpClient;
    origin?: string;
    cliVersion?: string;
    webVersion?: string;
    revision?: string;
    timeoutMs?: number;
  } = {}
) {
  const origin = (options.origin ?? defaultOrigin).replace(/\/$/, ''),
    timeoutMs = options.timeoutMs ?? 15000;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0)
    throw new Error('Invalid registry timeout');

  if (options.revision !== undefined && !validRevision(options.revision))
    throw new Error('Invalid registry revision');

  const http =
    options.http ??
    ((url: string) => fetch(url, { signal: AbortSignal.timeout(timeoutMs) }));

  // eslint-disable-next-line anti-slop/no-unknown-returns -- the caller immediately parses the HTTP payload
  const request = async (url: string): Promise<unknown> => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        (async () => {
          const response = await http(url);

          if (!response.ok)
            throw new Error(
              `Registry request failed (${response.status}): ${url}`
            );

          return response.json();
        })(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Registry request timed out: ${url}`)),
            timeoutMs
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const compatible = (value: unknown) => {
    if (
      !isRecord(value) ||
      typeof value.webVersion !== 'string' ||
      typeof value.cliVersion !== 'string' ||
      !semver.validRange(value.webVersion) ||
      !semver.validRange(value.cliVersion) ||
      !satisfiesRelease(options.webVersion ?? '2.0.0', value.webVersion) ||
      (options.cliVersion !== unreleasedVersion &&
        !satisfiesRelease(options.cliVersion ?? '1.0.0', value.cliVersion))
    )
      throw new Error('Registry version compatibility check failed');

    return { webVersion: value.webVersion, cliVersion: value.cliVersion };
  };

  const itemUrl = (
    revision: string,
    variant: RegistryVariant,
    component: string
  ) =>
    `${origin}/v1/${revision}/${variant.framework}/${variant.base}/tw${variant.tailwind}/${variant.language}/${component}.json`;

  const validate = (
    value: unknown,
    revision: string,
    expected?: RegistryVariant
  ): RegistryItem => {
    if (
      !isRecord(value) ||
      typeof value.name !== 'string' ||
      !/^[-a-z0-9]+$/.test(value.name) ||
      value.type !== 'registry:ui' ||
      typeof value.title !== 'string' ||
      typeof value.description !== 'string' ||
      !strings(value.dependencies) ||
      !strings(value.registryDependencies) ||
      !Array.isArray(value.files) ||
      !value.files.length ||
      !isRecord(value.meta) ||
      !isRecord(value.meta.uiTheme)
    )
      throw new Error('Invalid registry item');

    const meta = value.meta.uiTheme,
      variant = validateVariant(meta);

    if (
      meta.schemaVersion !== 1 ||
      meta.revision !== revision ||
      typeof meta.component !== 'string' ||
      !/^[a-z][a-z0-9-]*$/.test(meta.component) ||
      meta.component !== value.name
    )
      throw new Error('Invalid registry item metadata');

    if (expected)
      for (const key of ['framework', 'base', 'tailwind', 'language'] as const)
        if (variant[key] !== expected[key])
          throw new Error(`Registry variant mismatch: ${key}`);
    compatible(meta);

    const declared = strings(value.dependencies) ? value.dependencies : [];

    let compatibleDependencies: Record<string, string> | undefined;

    if (meta.compatibleDependencies !== undefined) {
      if (!isRecord(meta.compatibleDependencies))
        throw new Error('Invalid registry compatible dependencies');
      compatibleDependencies = {};

      for (const [name, range] of Object.entries(meta.compatibleDependencies)) {
        if (
          typeof range !== 'string' ||
          !semver.validRange(range) ||
          !declared.some((spec) => spec === name || spec.startsWith(`${name}@`))
        )
          throw new Error('Invalid registry compatible dependencies');
        compatibleDependencies[name] = range;
      }
    }

    const seen = new Set<string>();
    const files: RegistryFile[] = [];

    for (const file of value.files) {
      if (
        !isRecord(file) ||
        typeof file.path !== 'string' ||
        typeof file.content !== 'string' ||
        !['registry:ui', 'registry:lib'].includes(String(file.type)) ||
        (file.target !== undefined && typeof file.target !== 'string')
      )
        throw new Error('Invalid registry file');
      assertSafePath(file.path);

      if (typeof file.target === 'string') assertSafePath(file.target);
      const target = String(file.target ?? file.path);

      if (seen.has(target)) throw new Error('Duplicate registry file path');
      seen.add(target);

      const parsed: RegistryFile = {
        path: file.path,
        content: file.content,
        type: String(file.type),
      };

      if (typeof file.target === 'string') parsed.target = file.target;
      files.push(parsed);
    }

    const uiTheme: RegistryItem['meta']['uiTheme'] = {
      ...variant,
      schemaVersion: 1,
      revision,
      component: meta.component,
      ...compatible(meta),
    };

    if (compatibleDependencies)
      uiTheme.compatibleDependencies = compatibleDependencies;

    return {
      name: value.name,
      type: value.type,
      title: value.title,
      description: value.description,
      dependencies: value.dependencies,
      registryDependencies: value.registryDependencies,
      files,
      meta: { uiTheme },
    };
  };

  const validateIndex = (value: unknown, revision: string): RegistryIndex => {
    if (
      !isRecord(value) ||
      value.name !== 'uitheme' ||
      typeof value.homepage !== 'string' ||
      !Array.isArray(value.items) ||
      !value.items.length
    )
      throw new Error('Invalid registry index');
    const seen = new Set<string>();

    const items: RegistryItem[] = [];

    for (const raw of value.items) {
      const item = validate(raw, revision),
        key = itemUrl(revision, item.meta.uiTheme, item.meta.uiTheme.component);

      if (seen.has(key)) throw new Error('Duplicate registry index item');
      seen.add(key);
      items.push(item);
    }

    return { name: 'uitheme', homepage: value.homepage, items };
  };

  let pinned: Promise<RegistryManifest> | undefined,
    indexCache: Promise<RegistryIndex> | undefined;

  const manifest = (): Promise<RegistryManifest> =>
    (pinned ??= (async () => {
      if (options.revision) {
        const revision = options.revision,
          index = `${origin}/v1/${revision}/registry.json`;

        indexCache = request(index).then((value) =>
          validateIndex(value, revision)
        );
        const records = await indexCache;
        const meta = records.items[0].meta.uiTheme;

        for (const item of records.items)
          if (
            item.meta.uiTheme.webVersion !== meta.webVersion ||
            item.meta.uiTheme.cliVersion !== meta.cliVersion
          )
            throw new Error('Inconsistent registry version metadata');

        return {
          schemaVersion: 1,
          stable: { revision, index, ...compatible(meta) },
        };
      }

      const value = await request(`${origin}/manifest.json`);

      if (
        !isRecord(value) ||
        value.schemaVersion !== 1 ||
        !isRecord(value.stable) ||
        !validRevision(value.stable.revision) ||
        value.stable.index !==
          `${origin}/v1/${value.stable.revision}/registry.json`
      )
        throw new Error('Invalid or unpinned registry manifest');
      compatible(value.stable);

      return {
        schemaVersion: 1,
        stable: {
          revision: value.stable.revision,
          index: String(value.stable.index),
          ...compatible(value.stable),
        },
      };
    })());

  const index = async () => {
    const pin = await manifest();

    return (indexCache ??= request(pin.stable.index).then((value) =>
      validateIndex(value, pin.stable.revision)
    ));
  };

  const list = async (variant: RegistryVariant): Promise<RegistryItem[]> => {
    validateVariant(variant);

    return (await index()).items.filter((item) =>
      (['framework', 'base', 'tailwind', 'language'] as const).every(
        (key) => item.meta.uiTheme[key] === variant[key]
      )
    );
  };

  const resolveGraph = async (
    components: string[],
    variant: RegistryVariant
  ): Promise<RegistryGraph> => {
    validateVariant(variant);

    const pin = await manifest(),
      visiting = new Set<string>(),
      done = new Set<string>(),
      items: RegistryItem[] = [];

    const visit = async (url: string): Promise<void> => {
      if (done.has(url)) return;

      if (visiting.has(url)) throw new Error('Registry dependency cycle');
      const expectedPrefix = `${origin}/v1/${pin.stable.revision}/${variant.framework}/${variant.base}/tw${variant.tailwind}/${variant.language}/`;

      if (
        !url.startsWith(expectedPrefix) ||
        !url.endsWith('.json') ||
        !/^[a-z][a-z0-9-]*\.json$/.test(url.slice(expectedPrefix.length))
      )
        throw new Error('Unpinned registry dependency URL');
      visiting.add(url);
      const item = validate(await request(url), pin.stable.revision, variant);

      if (
        url !==
        itemUrl(pin.stable.revision, variant, item.meta.uiTheme.component)
      )
        throw new Error('Registry component URL mismatch');

      if (
        item.meta.uiTheme.webVersion !== pin.stable.webVersion ||
        item.meta.uiTheme.cliVersion !== pin.stable.cliVersion
      )
        throw new Error('Registry manifest version metadata mismatch');

      for (const dependency of item.registryDependencies)
        await visit(dependency);
      visiting.delete(url);
      done.add(url);
      items.push(item);
    };

    for (const component of components) {
      if (!/^[a-z][a-z0-9-]*$/.test(component))
        throw new Error('Invalid component name');
      await visit(itemUrl(pin.stable.revision, variant, component));
    }

    const targets = new Map<string, string>();

    for (const item of items)
      for (const file of item.files) {
        const target = file.target ?? file.path,
          previous = targets.get(target);

        if (previous !== undefined && previous !== file.content)
          throw new Error(`Conflicting registry file: ${target}`);
        targets.set(target, file.content);
      }

    return { manifest: pin, items };
  };

  return { manifest, list, resolve: resolveGraph };
}
