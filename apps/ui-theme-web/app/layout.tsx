import { DocsProviders } from '@/components/docs/providers';
import { SiteHeader } from '@/components/site-header';
import { docsTree } from '@/lib/docs-tree';
import {
  siteAuthor,
  siteDescription,
  siteKeywords,
  siteName,
  siteTitle,
  siteUrl,
} from '@/lib/site';
import type { Metadata, Viewport } from 'next';
import './global.css';
import { Outfit, Geist_Mono } from 'next/font/google';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: `%s · ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: siteAuthor.name, url: siteAuthor.url }],
  creator: siteAuthor.name,
  publisher: siteAuthor.name,
  category: 'technology',
  alternates: { canonical: '/' },
  icons: {
    icon: [
      {
        url: '/brand/symbol-black-on-white-square.webp',
        type: 'image/webp',
        sizes: '1024x1024',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/brand/symbol-white-on-black-square.webp',
        type: 'image/webp',
        sizes: '1024x1024',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: { url: '/brand/symbol-black-on-white-180.png', sizes: '180x180' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    creator: siteAuthor.twitter,
    site: siteAuthor.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

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
