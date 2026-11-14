import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const directive = /^["']use client["'];?\r?\n/;

const withDirective = ['react/index', 'next/index'];

const withoutDirective = [
  'tanstack/index',
  'core/index',
  'server/index',
  'vue/index',
  'vue/bootstrap',
  'nuxt',
];

const hasDirective = (file) =>
  directive.test(readFileSync(new URL(file, `file://${root}/`), 'utf8'));

for (const entry of withDirective) {
  for (const ext of ['js', 'cjs']) {
    const file = `dist/${entry}.${ext}`;
    assert.ok(hasDirective(file), `${file} must start with "use client"`);
  }
}

for (const entry of withoutDirective) {
  for (const ext of entry === 'nuxt' ? ['js'] : ['js', 'cjs']) {
    const file = `dist/${entry}.${ext}`;
    assert.ok(!hasDirective(file), `${file} must not start with "use client"`);
  }
}

console.log('"use client" is on the react and next entries only.');
