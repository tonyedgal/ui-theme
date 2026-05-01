import { ThemeSection } from '@/components/theme/ThemeSection';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center text-foreground sm:px-6 lg:px-8">
      <section className="relative flex flex-col gap-6 px-7 py-4">
        <div className="border-b">
          <h1 className="pb-3 text-5xl leading-tight font-semibold tracking-tighter">
            UI THEME
          </h1>
        </div>
        <p className="text-md max-w-2xl text-muted-foreground">
          Example Next.js with UI Theme. This example demonstrates how to use
          the UI Theme library in a Next.js App Router application.
        </p>
        <section className="mt-8">
          <ThemeSection />
        </section>
        <section className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg">Primary</Button>
          <Button variant="secondary" size="lg">
            Secondary
          </Button>
        </section>
      </section>
    </section>
  );
}
