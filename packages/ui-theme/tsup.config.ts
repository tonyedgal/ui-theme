import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'core/index': 'src/core/index.ts',
    'react/index': 'src/react/index.ts',
    'next/index': 'src/next/index.ts',
    'server/index': 'src/server/index.ts',
    'tanstack/index': 'src/tanstack/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: false,
  treeshake: true,
  minify: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
