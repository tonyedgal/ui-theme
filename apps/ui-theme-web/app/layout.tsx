import { DocsProviders } from '@/components/docs/providers';
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

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${docsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <DocsProviders>{children}</DocsProviders>
      </body>
    </html>
  );
}
