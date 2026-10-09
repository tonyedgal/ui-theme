const { getDefaultConfig } = require('expo/metro-config');

const { withUniwindConfig } = require('uniwind/metro');

module.exports = withUniwindConfig(getDefaultConfig(__dirname), {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
  extraThemes: [
    'default-light',
    'default-dark',
    'supabase-light',
    'supabase-dark',
    'mono-light',
    'mono-dark',
    'caffeine-light',
    'caffeine-dark',
    'mocha-light',
    'mocha-dark',
    'perpetuity-light',
    'perpetuity-dark',
  ],
});
