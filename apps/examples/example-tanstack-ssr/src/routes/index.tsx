import { Link, createFileRoute } from '@tanstack/react-router';

import { ThemePalette } from '#/components/theme/ThemePalette';
import { ThemeStudio } from '#/components/theme/ThemeStudio';
import { Button } from '#/components/ui/button';
import ThemeSection from '#/components/ThemeSection';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <section className="relative flex h-svh flex-col items-center justify-center gap-6 px-4 text-center sm:px-6 lg:px-8">
      <section className="relative flex flex-col items-center gap-6 px-7 py-4">
        <div className="border-b">
          <h1 className="pb-3 text-5xl leading-tight font-semibold tracking-tighter">
            UI THEME
          </h1>
        </div>
        <p className="text-md text-center max-w-2xl text-muted-foreground text-balance">
          Example Tanstack SSR with UI Theme. This example demonstrates how to
          use the UI Theme library in a server-side rendered application built
          with Tanstack Start.
        </p>
        <section className="mt-8">
          <ThemeSection />
        </section>
        <section className="flex items-center justify-center gap-4 mt-8">
          <Button size="lg">Primary</Button>
          <Button variant="secondary" size="lg">
            Secondary
          </Button>
        </section>
      </section>
    </section>
  );
}
