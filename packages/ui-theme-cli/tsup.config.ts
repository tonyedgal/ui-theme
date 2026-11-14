import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  splitting: true,
  noExternal: ['@babel/parser', 'get-tsconfig'],
  banner: { js: '#!/usr/bin/env node' },
});
