// Check the oldest version in each `compatibleDependencies` range.
//
// The CLI keeps an app's existing dependency when its range is inside the
// compatible range. This check installs the lowest version of each range and
// type-checks every named import that the templates take from that package.
// It also checks that the version accepts the framework versions that
// uitheme-web supports. The check downloads packages, so it needs network
// access.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const templates = join(root, 'packages/ui-theme-registry/src/templates');

const evidence = join(root, 'test-results/registry-minimum-dependencies');

const cliRequire = createRequire(
  join(root, 'packages/ui-theme-cli/package.json')
);

const semver = cliRequire('semver');

const tsc = join(
  dirname(cliRequire.resolve('typescript/package.json')),
  'bin/tsc'
);

// Framework versions that the package must accept, from the uitheme-web peer
// ranges.
const frameworks = {
  react: { peer: 'react', versions: ['18.0.0', '19.0.0'] },
  vue: { peer: 'vue', versions: ['3.5.0'] },
};

const temporary = realpathSync(
  mkdtempSync(join(tmpdir(), 'uitheme-minimum-dependencies-'))
);

function sources(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sources(join(folder, entry.name))
      : [join(folder, entry.name)]
  );
}

function namedImports(folder, name) {
  const pattern = new RegExp(
    `import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${name.replace('/', '\\/')}['"]`,
    'g'
  );

  const names = new Set();

  for (const file of sources(folder).filter((path) =>
    /\.(tsx?|vue)$/.test(path)
  ))
    for (const match of readFileSync(file, 'utf8').matchAll(pattern))
      for (const part of match[1].split(','))
        if (part.trim()) names.add(part.trim().split(/\s+as\s+/)[0]);

  return [...names].sort();
}

rmSync(evidence, { recursive: true, force: true });

mkdirSync(evidence, { recursive: true });

const results = [];

try {
  for (const framework of readdirSync(templates)) {
    for (const base of readdirSync(join(templates, framework))) {
      const folder = join(templates, framework, base);

      const metadata = JSON.parse(
        readFileSync(join(folder, 'metadata.json'), 'utf8')
      );

      for (const [name, range] of Object.entries(
        metadata.compatibleDependencies ?? {}
      )) {
        const version = semver.minVersion(range).version;
        const label = `${framework}-${base}-${name.replace('/', '-')}`;
        const imports = namedImports(folder, name);

        assert.ok(imports.length, `${label}: no imports from ${name}`);
        console.log(`Checking ${name}@${version} for ${framework}/${base}...`);

        const app = join(temporary, label);
        mkdirSync(app, { recursive: true });
        writeFileSync(
          join(app, 'package.json'),
          JSON.stringify({ name: 'minimum', private: true, type: 'module' })
        );
        execFileSync(
          'npm',
          [
            'install',
            '--no-audit',
            '--no-fund',
            '--ignore-scripts',
            '--legacy-peer-deps',
            `${name}@${version}`,
          ],
          { cwd: app, stdio: 'pipe' }
        );

        const manifest = JSON.parse(
          readFileSync(join(app, 'node_modules', name, 'package.json'), 'utf8')
        );

        const { peer, versions } = frameworks[framework];
        const peerRange = manifest.peerDependencies?.[peer];

        for (const supported of versions)
          assert.ok(
            peerRange && semver.satisfies(supported, peerRange),
            `${label}: ${name}@${version} does not accept ${peer}@${supported} (${peerRange})`
          );

        writeFileSync(
          join(app, 'check.ts'),
          `import { ${imports.join(', ')} } from '${name}';\n\nexport const used = [${imports.join(', ')}];\n`
        );
        writeFileSync(
          join(app, 'tsconfig.json'),
          JSON.stringify({
            compilerOptions: {
              module: 'esnext',
              moduleResolution: 'bundler',
              target: 'es2022',
              strict: true,
              noEmit: true,
              skipLibCheck: true,
            },
            files: ['check.ts'],
          })
        );

        try {
          execFileSync(process.execPath, [tsc, '-p', app], { stdio: 'pipe' });
        } catch (error) {
          writeFileSync(join(evidence, `${label}.log`), String(error.stdout));
          assert.fail(
            `${label}: ${name}@${version} lacks an import; see ${evidence}/${label}.log`
          );
        }

        results.push({ framework, base, name, range, version, imports });
      }
    }
  }

  assert.ok(results.length, 'No compatible dependency ranges to check');
  writeFileSync(
    join(evidence, 'summary.json'),
    `${JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2)}\n`
  );
  console.log(
    `All ${results.length} minimum versions passed. Evidence: ${evidence}`
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
