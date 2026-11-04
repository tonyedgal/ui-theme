import { DocsProviders } from '@/components/docs/providers';
import { SiteHeader } from '@/components/site-header';
import { docsTree } from '@/lib/docs-tree';
import type { Viewport } from 'next';
import './global.css';
import { Outfit, Geist_Mono } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const docsMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-docs-mono',
  preload: false,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfc' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${docsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-svh flex-col">
        <DocsProviders>
          <SiteHeader tree={docsTree} />
          {children}
        </DocsProviders>
      </body>
    </html>
  );
}
