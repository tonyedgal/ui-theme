import CornerBrackets from '@/components/shared/CornerBrackets';
import InstallSnippet from '@/components/shared/InstallSnippet';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Clock05Icon,
  Doc01Icon,
  GithubIcon,
  NpmIcon,
  CircleArrowRightDoubleIcon,
} from '@hugeicons/core-free-icons';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col text-center">
      <div className="flex flex-1 flex-col items-center pt-[15vh] sm:pt-[20vh] md:pt-[20vh]">
        <Link
          href="#link"
          className="hover:bg-background mb-4 dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-2 rounded-full border p-1 pl-3 shadow-md shadow-zinc-950/5 transition-colors duration-300 sm:gap-4 sm:pl-4 dark:border-t-white/5 dark:shadow-zinc-950"
        >
          <span className="text-foreground text-xs sm:text-sm">
            Docs coming soon!
          </span>
          <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>
          <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
              <span className="flex size-6">
                <HugeiconsIcon
                  icon={Clock05Icon}
                  className="m-auto size-3"
                  aria-hidden="true"
                />
              </span>
              <span className="flex size-6">
                <HugeiconsIcon
                  icon={Doc01Icon}
                  className="m-auto size-3"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
        </Link>

        <section className="relative flex w-full max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center sm:gap-6 sm:px-6 lg:px-8">
          <section className="relative flex flex-col gap-4 p-8 sm:gap-6">
            <CornerBrackets />
            <div className="border-b">
              <Reveal slideDirection="top-blur" width="100%">
                <h1 className="text-balance pb-2 text-3xl font-semibold leading-tight tracking-tighter sm:pb-3 sm:text-4xl md:text-5xl lg:text-6xl">
                  Theme the Web
                </h1>
              </Reveal>
            </div>
            <Reveal slideDirection="top-blur" delay={0.25}>
              <p className="text-pretty font-light mx-auto max-w-xs text-sm text-muted-foreground sm:max-w-md sm:text-base md:max-w-2xl md:text-lg">
                UI Framework agnostic theming library with built-in support for
                multiple-themes and animated transitions with the View
                Transitions API.
              </p>
            </Reveal>
          </section>

          <Reveal slideDirection="top-blur" delay={0.5}>
            <section className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Button variant="outline" size="default" asChild>
                <a
                  href="https://github.com/tonyedgal/ui-theme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-40 sm:min-w-0"
                >
                  <HugeiconsIcon icon={GithubIcon} aria-hidden="true" />
                  <span>View on GitHub</span>
                </a>
              </Button>
              <Button variant="outline" size="default" asChild>
                <a
                  href="https://www.npmjs.com/package/@ui-theme/web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-40 sm:min-w-0"
                >
                  <HugeiconsIcon icon={NpmIcon} aria-hidden="true" />
                  <span>View on NPM</span>
                </a>
              </Button>
            </section>
          </Reveal>

          <Reveal
            width="100%"
            slideDirection="bottom-blur"
            delay={0.75}
            className="w-full px-2 sm:px-0"
          >
            <InstallSnippet />
          </Reveal>
          <Reveal
            width="100%"
            slideDirection="bottom-blur"
            delay={0.75}
            className="w-full px-2 sm:px-0"
          >
            <div className="mt-10 flex flex-wrap justify-center items-center gap-6">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={CircleArrowRightDoubleIcon}
                  aria-hidden="true"
                />
                <span>Light-Dark mode</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={CircleArrowRightDoubleIcon}
                  aria-hidden="true"
                />
                <span>UI Colours</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={CircleArrowRightDoubleIcon}
                  aria-hidden="true"
                />
                <span>Multiple Fonts</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={CircleArrowRightDoubleIcon}
                  aria-hidden="true"
                />
                <span>Animated transitions</span>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
