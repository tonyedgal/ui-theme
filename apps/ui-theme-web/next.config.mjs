import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs/components/:base/disclosure',
        destination: '/docs/components',
        permanent: true,
      },
      {
        source: '/docs/components/:base/transition-settings',
        destination: '/docs/components/:base/theme-toggle#examples',
        permanent: true,
      },
      ...[
        '/docs/components/:base/appearance-selector',
        '/docs/components/:base/appearance-selector.mdx',
        '/llms.mdx/docs/components/:base/appearance-selector',
      ].map((source) => ({
        source,
        destination: source.replace('appearance-selector', 'theme-selector'),
        permanent: true,
      })),
      ...['uitheme.dev', 'www.uitheme.dev', 'ui-theme.dev'].map((host) => ({
        source: '/r/:path*',
        has: [{ type: 'host', value: host.replaceAll('.', '\\.') }],
        destination: 'https://www.ui-theme.dev/r/:path*',
        permanent: true,
      })),
    ];
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
};

export default withMDX(config);
