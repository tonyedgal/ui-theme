'use client';

import { CornerBrackets } from '@/components/CornerBrackets';
import { Reveal } from '@/components/Reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstallSnippet } from '@/components/InstallSnippet';
import { ArrowDown } from 'lucide-react';

export function Hero() {
  const scrollToContent = () => {
    const element = document.getElementById('theme-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="text-center max-w-4xl mx-auto">
        <Reveal slideDirection="top" delay={0.1}>
          <Badge variant="outline" className="mb-6 text-sm px-4 py-1">
            Theme Animation Library
          </Badge>
        </Reveal>

        <Reveal slideDirection="top" delay={0.2}>
          <div className="relative inline-block mb-6">
            <CornerBrackets />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight px-8 py-4">
              UI Theme
            </h1>
          </div>
        </Reveal>

        <Reveal slideDirection="top" delay={0.3}>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A powerful theme switching library for React applications with
            beautiful animations. Supports multiple color themes and smooth
            transitions between light and dark modes.
          </p>
        </Reveal>

        <Reveal slideDirection="top" delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button size="lg" onClick={scrollToContent}>
              Get Started
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Reveal>

        <Reveal slideDirection="top" delay={0.5}>
          <InstallSnippet />
        </Reveal>
      </div>
    </section>
  );
}
