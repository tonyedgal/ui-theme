import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRegistryClient,
  defaultOrigin,
  resolveRegistryOrigin,
  satisfiesRelease,
} from '../src/registry.ts';

const revision = 'a'.repeat(64),
  origin = 'https://www.ui-theme.dev/r';

const variant = {
  framework: 'react',
  base: 'base-ui',
  tailwind: 4,
  language: 'ts',
} as const;

const url = (name: string) =>
  `${origin}/v1/${revision}/react/base-ui/tw4/ts/${name}.json`;

const item = (name: string, deps: string[] = []) => ({
  name,
  type: 'registry:ui',
  title: name,
  description: name,
  dependencies: [],
  registryDependencies: deps,
  files: [
    {
      path: `${name}.tsx`,
      target: `components/${name}.tsx`,
      content: 'export {}',
      type: 'registry:ui',
    },
  ],
  meta: {
    uiTheme: {
      schemaVersion: 1,
      revision,
      component: name,
      ...variant,
      webVersion: '^2.0.0',
      cliVersion: '^1.0.0',
    },
  },
});

test('pins manifest once, resolves dependencies, rejects cycles and unsafe file paths', async () => {
  let manifestCalls = 0;
  const records: Record<string, ReturnType<typeof item>> = {};

  const client = createRegistryClient({
    http: async (u) => ({
      ok: true,
      status: 200,
      json: async () =>
        u.endsWith('manifest.json')
          ? (manifestCalls++,
            {
              schemaVersion: 1,
              stable: {
                revision,
                index: `${origin}/v1/${revision}/registry.json`,
                webVersion: '^2.0.0',
                cliVersion: '^1.0.0',
              },
            })
          : records[u],
    }),
  });

  records[url('a')] = item('a', [url('b')]);
  records[url('b')] = item('b');
  assert.deepEqual(
    (await client.resolve(['a'], variant)).items.map((i) => i.name),
    ['b', 'a']
  );
  assert.equal(manifestCalls, 1);
  records[url('b')] = item('b', [url('a')]);
  await assert.rejects(client.resolve(['a'], variant), /cycle/i);
  records[url('a')] = item('a');
  records[url('a')].files[0].target = '../escape';
  await assert.rejects(client.resolve(['a'], variant), /path/i);
});

test('rejects foreign revision graph and incompatible version before exposing any file', async () => {
  const records: Record<string, ReturnType<typeof item>> = {};

  const manifest = {
    schemaVersion: 1,
    stable: {
      revision,
      index: `${origin}/v1/${revision}/registry.json`,
      webVersion: '^2.0.0',
      cliVersion: '^1.0.0',
    },
  };

  const http = async (u: string) => ({
    ok: true,
    status: 200,
    json: async () => (u.endsWith('manifest.json') ? manifest : records[u]),
  });

  records[url('a')] = item('a', [
    `${origin}/v1/${'b'.repeat(64)}/react/base-ui/tw4/ts/b.json`,
  ]);
  await assert.rejects(
    createRegistryClient({ http }).resolve(['a'], variant),
    /unpinned/i
  );
  await assert.rejects(
    createRegistryClient({ http, cliVersion: '2.0.0' }).resolve(['a'], variant),
    /compatibility/i
  );
  records[url('a')] = item('a');

  const invalid = {
    ...item('a'),
    meta: { uiTheme: { ...item('a').meta.uiTheme, base: 'radix' } },
  };

  Object.assign(records[url('a')], invalid);
  await assert.rejects(
    createRegistryClient({ http }).resolve(['a'], variant),
    /mismatch/i
  );
});

test('historical revision never reads moving manifest and validates pinned index', async () => {
  const calls: string[] = [];
  const historical = 'b'.repeat(64);
  const record = item('a');
  record.meta.uiTheme.revision = historical;

  const client = createRegistryClient({
    revision: historical,
    http: async (u) => {
      calls.push(u);

      return {
        ok: true,
        status: 200,
        json: async () =>
          u.endsWith('registry.json')
            ? {
                name: 'uitheme',
                homepage: 'https://www.ui-theme.dev',
                items: [record],
              }
            : record,
      };
    },
  });

  assert.equal(
    (await client.resolve(['a'], variant)).manifest.stable.revision,
    historical
  );
  assert.ok(!calls.some((u) => u.endsWith('manifest.json')));
});

test('request timeout rejects stalled injectable clients', async () => {
  await assert.rejects(
    createRegistryClient({
      timeoutMs: 5,
      http: () => new Promise(() => {}),
    }).manifest(),
    /timed out/i
  );
});

test('selects the registry origin from the flag, then the environment, then the hosted registry', () => {
  assert.equal(resolveRegistryOrigin(), defaultOrigin);
  assert.equal(resolveRegistryOrigin({ env: '' }), defaultOrigin);
  assert.equal(
    resolveRegistryOrigin({ env: 'https://registry.example.com/r/' }),
    'https://registry.example.com/r'
  );
  assert.equal(
    resolveRegistryOrigin({
      flag: 'http://localhost:4000/r',
      env: 'https://registry.example.com/r',
    }),
    'http://localhost:4000/r'
  );
  assert.equal(
    resolveRegistryOrigin({ flag: 'http://127.0.0.1:4000/r' }),
    'http://127.0.0.1:4000/r'
  );
  assert.equal(
    resolveRegistryOrigin({ flag: 'http://ui-theme.localhost/r' }),
    'http://ui-theme.localhost/r'
  );
});

test('rejects unsafe registry origins and names the source', () => {
  assert.throws(
    () => resolveRegistryOrigin({ flag: 'registry.example.com' }),
    /Invalid --registry/
  );
  assert.throws(
    () => resolveRegistryOrigin({ env: 'http://registry.example.com/r' }),
    /Invalid UITHEME_REGISTRY_URL: use https/
  );
  assert.throws(
    () => resolveRegistryOrigin({ flag: 'file:///tmp/r' }),
    /use https/
  );
  assert.throws(
    () => resolveRegistryOrigin({ flag: 'https://user:pass@example.com/r' }),
    /remove credentials/
  );
  assert.throws(
    () => resolveRegistryOrigin({ flag: 'https://example.com/r?token=1' }),
    /remove credentials/
  );
});

test('treats a prerelease as the release it leads to', () => {
  assert.equal(satisfiesRelease('2.0.0-rc.1', '^2.0.0'), true);
  assert.equal(satisfiesRelease('1.0.0-rc.0', '^1.0.0'), true);
  assert.equal(satisfiesRelease('2.3.1', '^2.0.0'), true);
  assert.equal(satisfiesRelease('1.2.0', '^2.0.0'), false);
  assert.equal(satisfiesRelease('3.0.0-rc.0', '^2.0.0'), false);
  assert.equal(satisfiesRelease('not-a-version', '^2.0.0'), false);
});

type CompatibleRanges = Record<string, string | number> | string[];

const withRanges = (ranges: CompatibleRanges) => {
  const record = item('a');

  return {
    ...record,
    dependencies: ['lucide-react@^1.61.0'],
    meta: {
      uiTheme: { ...record.meta.uiTheme, compatibleDependencies: ranges },
    },
  };
};

const rangeClient = (ranges: CompatibleRanges) =>
  createRegistryClient({
    http: async (u) => ({
      ok: true,
      status: 200,
      json: async () =>
        u.endsWith('manifest.json')
          ? {
              schemaVersion: 1,
              stable: {
                revision,
                index: `${origin}/v1/${revision}/registry.json`,
                webVersion: '^2.0.0',
                cliVersion: '^1.0.0',
              },
            }
          : withRanges(ranges),
    }),
  });

test('keeps valid compatible dependency ranges and rejects invalid ones', async () => {
  const resolved = await rangeClient({
    'lucide-react': '>=0.397.0 <2.0.0',
  }).resolve(['a'], variant);

  assert.deepEqual(resolved.items[0].meta.uiTheme.compatibleDependencies, {
    'lucide-react': '>=0.397.0 <2.0.0',
  });

  for (const ranges of [
    { 'lucide-react': 'not a range' },
    { 'lucide-react': 1 },
    { 'not-installed': '^1.0.0' },
    ['lucide-react'],
  ])
    await assert.rejects(
      rangeClient(ranges).resolve(['a'], variant),
      /compatible dependencies/,
      JSON.stringify(ranges)
    );
});
