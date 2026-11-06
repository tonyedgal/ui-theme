// Check that the shadcn CLI can read the registry layer for each shadcn style.
//
// The check builds the registry into a temporary folder with a local origin,
// serves it, and runs `shadcn add --dry-run` in a small React app with
// Tailwind 4. A dry run writes no files and installs no packages. shadcn still
// fetches its own `utils` item from ui.shadcn.com, so the check needs network
// access.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  buildRegistry,
  shadcnStyles,
} from '../packages/ui-theme-registry/src/build.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const temporary = realpathSync(
  mkdtempSync(join(tmpdir(), 'uitheme-registry-shadcn-'))
);

const evidence = join(root, 'test-results/registry-shadcn');

const registryRequire = createRequire(
  join(root, 'packages/ui-theme-registry/package.json')
);

// Styles that the registry does not serve. shadcn must report them as missing.
const unservedStyles = ['aria-nova'];

// When an app on Tailwind 4 selects new-york, shadcn reads the new-york folder
// first and then installs the files from new-york-v4.
const installedStyle = (style) =>
  style === 'new-york' ? 'new-york-v4' : style;

const baseDependencies = { radix: 'radix-ui', 'base-ui': '@base-ui/react' };

let server;

let requests = [];

rmSync(evidence, { recursive: true, force: true });

mkdirSync(evidence, { recursive: true });

function write(folder, name, content) {
  const path = join(folder, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function manifestAt(path) {
  const file = join(path, 'package.json');

  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
}

// shadcn does not export its package.json, so find the package folder from its
// main entry. The pinned version declares one bin path as a string.
function shadcnBin() {
  let path = dirname(registryRequire.resolve('shadcn'));

  while (manifestAt(path).name !== 'shadcn') {
    const parent = dirname(path);
    assert.notEqual(parent, path, 'Cannot find shadcn');
    path = parent;
  }

  const manifest = manifestAt(path);

  return { path: join(path, manifest.bin), version: manifest.version };
}

// The server is in this process, so shadcn must run asynchronously.
async function shadcnAdd(app, bin, names, label) {
  try {
    const { stdout, stderr } = await promisify(execFile)(
      process.execPath,
      [
        bin,
        'add',
        ...names.map((name) => `@uitheme/${name}`),
        '--dry-run',
        '--cwd',
        app,
      ],
      {
        encoding: 'utf8',
        timeout: 120_000,
        env: { ...process.env, CI: '1' },
      }
    );

    write(evidence, `${label}.log`, stdout + stderr);

    return { ok: true, output: stdout + stderr };
  } catch (error) {
    const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
    write(evidence, `${label}.log`, output);

    return { ok: false, output };
  }
}

function writeApp(app, style, origin) {
  write(
    app,
    'package.json',
    JSON.stringify({
      name: 'shadcn-consumer',
      private: true,
      type: 'module',
      dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
      devDependencies: {
        tailwindcss: '^4.0.0',
        typescript: '^5.0.0',
        vite: '^7.0.0',
      },
    })
  );
  write(
    app,
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } },
    })
  );
  write(app, 'vite.config.ts', 'export default {};\n');
  write(app, 'src/index.css', '@import "tailwindcss";\n');
  write(
    app,
    'components.json',
    JSON.stringify({
      $schema: 'https://ui.shadcn.com/schema.json',
      style,
      rsc: false,
      tsx: true,
      tailwind: {
        config: '',
        css: 'src/index.css',
        baseColor: 'neutral',
        cssVariables: true,
      },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
      iconLibrary: 'lucide',
      registries: { '@uitheme': `${origin}/{style}/{name}.json` },
    })
  );
}

try {
  const registryDirectory = join(temporary, 'registry');

  server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://local').pathname;
    requests.push(pathname);

    try {
      const path = resolve(
        registryDirectory,
        `.${pathname.replace(/^\/r/, '')}`
      );

      assert.ok(path.startsWith(`${registryDirectory}/`));
      response.setHeader('content-type', 'application/json');
      response.end(readFileSync(path));
    } catch {
      response.writeHead(404);
      response.end('{}');
    }
  });

  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveReady);
  });

  const origin = `http://127.0.0.1:${server.address().port}/r`;

  const registry = await buildRegistry({
    outDir: registryDirectory,
    origin,
    releaseDir: join(temporary, 'no-releases'),
  });

  const shadcn = shadcnBin();
  console.log(`Using shadcn ${shadcn.version}.`);

  const results = [];

  for (const [style, base] of shadcnStyles) {
    const label = `shadcn-${style}`;
    console.log(`Checking ${label}...`);

    const items = registry.index.items.filter((item) => {
      const meta = item.meta.uiTheme;

      return (
        meta.framework === 'react' &&
        meta.base === base &&
        meta.tailwind === 4 &&
        meta.language === 'ts'
      );
    });

    assert.equal(items.length, 7, `${label}: expected 7 controls`);

    const app = join(temporary, label);
    writeApp(app, style, origin);
    requests = [];

    const names = items.map((item) => item.name);
    const result = await shadcnAdd(app, shadcn.path, names, label);

    assert.ok(result.ok, `${label} failed; see ${evidence}/${label}.log`);

    // shadcn must read only the selected folder and the folder it installs.
    const folder = installedStyle(style);

    for (const request of requests)
      assert.ok(
        [style, folder].includes(request.split('/')[2]),
        `${label}: unexpected request ${request}`
      );

    for (const name of names)
      assert.ok(
        requests.includes(`/r/${folder}/${name}.json`),
        `${label}: shadcn did not read ${name}`
      );

    for (const item of items)
      for (const file of item.files)
        assert.match(
          result.output,
          new RegExp(`src/components/ui/${file.path.replaceAll('.', '\\.')}`),
          `${label}: missing ${file.path}`
        );

    assert.match(result.output, /src\/lib\/utils\.ts/, `${label}: no utils`);
    assert.match(
      result.output,
      /uitheme-web@\^2\.0\.0/,
      `${label}: no uitheme-web`
    );

    for (const [dependencyBase, dependency] of Object.entries(baseDependencies))
      assert.equal(
        result.output.includes(`+ ${dependency}`),
        dependencyBase === base,
        `${label}: wrong primitive dependency ${dependency}`
      );

    results.push({ style, base, folder, controls: names });
  }

  for (const style of unservedStyles) {
    const label = `shadcn-${style}-unserved`;
    console.log(`Checking ${label}...`);

    const app = join(temporary, label);
    writeApp(app, style, origin);

    const result = await shadcnAdd(app, shadcn.path, ['theme-toggle'], label);

    assert.ok(!result.ok, `${label}: shadcn should report a missing item`);
    assert.match(result.output, /was not found/, `${label}: unclear error`);
  }

  write(
    evidence,
    'summary.json',
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        shadcn: shadcn.version,
        revision: registry.revision,
        unservedStyles,
        results,
      },
      null,
      2
    )
  );
  console.log(
    `All ${results.length} shadcn styles passed. Evidence: ${evidence}`
  );
} finally {
  if (server) await new Promise((resolveClosed) => server.close(resolveClosed));
  rmSync(temporary, { recursive: true, force: true });
}
