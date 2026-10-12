import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core/index.ts',
    expo: 'src/expo.tsx',
    reanimated: 'src/reanimated.ts',
    transitions: 'src/screen-transitions.tsx',
    nativewind: 'src/nativewind.tsx',
    uniwind: 'src/uniwind.tsx',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  external: [
    'react',
    'react/jsx-runtime',
    'react-native',
    '@expo/ui',
    'react-native-reanimated',
    'react-native-worklets',
    '@shopify/react-native-skia',
    'uitheme-rn',
    'nativewind',
    'uniwind',
  ],
});
