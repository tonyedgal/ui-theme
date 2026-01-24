import { Hero } from '@/components/Hero';
import { ThemePicker } from '@/components/theme/ThemePicker';
import { ThemeSection } from '@/components/theme/ThemeSection';
import { HooksDemo } from '@/components/HooksDemo';
import { AnimatedCards } from '@/components/AnimatedCards';
import { BackgroundPattern } from '@/components/BackgroundPattern';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <BackgroundPattern />

      <Hero />

      <ThemePicker />

      <div id="theme-section">
        <ThemeSection />
      </div>

      <HooksDemo />

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Features</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Everything you need for beautiful theme switching in your React
            applications.
          </p>
          <AnimatedCards />
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>Built with ❤️ using UI Theme</p>
        </div>
      </footer>
    </div>
  );
}
