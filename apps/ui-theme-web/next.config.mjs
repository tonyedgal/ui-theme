import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return ['uitheme.dev', 'www.uitheme.dev', 'ui-theme.dev'].map((host) => ({
      source: '/r/:path*',
      has: [{ type: 'host', value: host.replaceAll('.', '\\.') }],
      destination: 'https://www.ui-theme.dev/r/:path*',
      permanent: true,
    }));
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
