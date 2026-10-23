import { execFileSync } from 'node:child_process';

execFileSync('pnpm', ['exec', 'changeset', 'version'], { stdio: 'inherit' });

execFileSync('pnpm', ['install', '--lockfile-only'], { stdio: 'inherit' });
