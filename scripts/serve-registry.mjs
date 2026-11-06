// Serve a local registry build for the CLI and shadcn, and rebuild it when the
// registry source changes. The build goes to a temporary folder, so the
// registry `dist` folder that the website stages does not change.
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  watch,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildRegistry } from '../packages/ui-theme-registry/src/build.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const { values } = parseArgs({
  options: { port: { type: 'string', default: '4000' } },
});

const port = Number(values.port);

if (!Number.isInteger(port) || port < 1 || port > 65_535)
  throw new Error(`Invalid --port: ${values.port}`);

const origin = `http://127.0.0.1:${port}/r`;

const temporary = realpathSync(
  mkdtempSync(join(tmpdir(), 'uitheme-registry-dev-'))
);

const outDir = join(temporary, 'r');

const source = join(root, 'packages/ui-theme-registry/src');

async function build() {
  const started = Date.now();

  try {
    await buildRegistry({
      outDir,
      origin,
      releaseDir: join(temporary, 'no-releases'),
    });
    console.log(`Built the registry in ${Date.now() - started} ms.`);
  } catch (error) {
    console.error(`The registry build failed: ${error.message}`);
  }
}

await build();

const server = createServer((request, response) => {
  const pathname = new URL(request.url, origin).pathname;
  const path = resolve(outDir, `.${pathname.replace(/^\/r/, '')}`);

  try {
    if (!pathname.startsWith('/r/') || !path.startsWith(`${outDir}/`))
      throw new Error('Outside the registry');

    response.setHeader('content-type', 'application/json');
    response.end(readFileSync(path));
  } catch {
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end('{"error":"Not found"}');
  }
});

await new Promise((resolveReady, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', resolveReady);
});

let timer;

const watcher = watch(source, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(build, 200);
});

console.log(`
Registry: ${origin}

CLI, in your app folder:
  UITHEME_REGISTRY_URL=${origin} node ${join(root, 'packages/ui-theme-cli/dist/index.js')} add theme-toggle

shadcn, in components.json:
  "registries": { "@uitheme": "${origin}/{style}/{name}.json" }

The registry rebuilds when files in packages/ui-theme-registry/src change.
Press Ctrl+C to stop.
`);

function stop() {
  watcher.close();
  server.close();
  rmSync(temporary, { recursive: true, force: true });
  process.exit(0);
}

process.on('SIGINT', stop);

process.on('SIGTERM', stop);
