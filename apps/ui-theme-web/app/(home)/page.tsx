import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CopyButton } from '@/components/docs/copy-button';
import { LandingControls } from '@/components/landing-controls';
import { ThemeTagline } from '@/components/theme-tagline';

export const metadata: Metadata = {
  title: 'UI-Theme — The library for theming the web',
  description:
    'A theming library and registry for React, Vue, and React Native. Add color palettes, animated transitions, and controls you can make your own.',
};

export default function HomePage() {
  return (
    <>
      <main id="main-content" tabIndex={-1}>
        <section
          aria-labelledby="home-title"
          className="flex min-h-[calc(100svh-var(--site-header-height))] flex-col items-center justify-center px-6 pt-16 pb-24 text-center"
        >
          <div className="w-52 sm:w-60">
            <Image
              src="/brand/wordmark-black-transparent.webp"
              alt="UI-Theme"
              width={1200}
              height={260}
              sizes="(min-width: 640px) 240px, 208px"
              className="h-auto w-full dark:hidden"
            />
            <Image
              src="/brand/wordmark-white-transparent.webp"
              alt="UI-Theme"
              width={1200}
              height={260}
              sizes="(min-width: 640px) 240px, 208px"
              className="hidden h-auto w-full dark:block"
            />
          </div>
          <h1
            id="home-title"
            className="mt-7 max-w-sm text-xl leading-7 font-normal text-balance tracking-tight"
          >
            The library for theming the web.
          </h1>
          <ThemeTagline />
          <p className="mt-4 max-w-80 text-[13px] leading-6 font-normal text-pretty text-muted-foreground">
            A theming library and registry for React, Vue, and React Native.
            <br />
            Add color palettes, animated transitions, and controls you can make
            your own.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/installation"
              prefetch={false}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
            >
              Get started
            </Link>
            <Link
              href="/docs/components"
              prefetch={false}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
            >
              Browse components
            </Link>
          </div>
          <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-md bg-muted/60 py-1 pr-1 pl-3">
            <code className="min-w-0 font-mono text-[11px] text-muted-foreground sm:text-xs">
              npm install uitheme-web@latest
            </code>
            <CopyButton
              value="npm install uitheme-web@latest"
              label="Copy install command"
            />
          </div>
        </section>
        <section
          aria-labelledby="controls-title"
          className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:px-8"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="controls-title"
                className="text-lg font-medium tracking-tight"
              >
                Theme controls
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This page is the preview. Try a control.
              </p>
            </div>
            <Link
              href="/docs/components"
              prefetch={false}
              className="rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              All components <span aria-hidden="true">→</span>
            </Link>
          </div>
          <LandingControls />
        </section>
      </main>
      <footer className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 px-6 pb-8 text-xs text-muted-foreground">
        <span>UI-Theme.</span>
        <span>Open source.</span>
        <a
          href="https://github.com/tonyedgal/ui-theme"
          target="_blank"
          rel="noreferrer"
          className="rounded-sm text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          GitHub
        </a>
        <span aria-hidden="true">·</span>
        <Link
          href="/docs/llms"
          prefetch={false}
          className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          LLMs
        </Link>
      </footer>
    </>
  );
}
