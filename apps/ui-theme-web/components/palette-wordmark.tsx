'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type PalettePrimary = { light: string; dark: string };

const STEP_MS = 2200;

const PALETTE_SELECTOR = /^(?::root|\.theme-([\w-]+))(\.dark)?$|^\.dark$/;

function collectPrimaries(
  rules: CSSRuleList,
  light: Map<string, string>,
  dark: Map<string, string>
) {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSGroupingRule) {
      collectPrimaries(rule.cssRules, light, dark);
      continue;
    }

    if (!(rule instanceof CSSStyleRule)) continue;

    const primary = rule.style.getPropertyValue('--primary').trim();
    const match = PALETTE_SELECTOR.exec(rule.selectorText);

    if (!primary || !match) continue;

    const isDark = rule.selectorText === '.dark' || Boolean(match[2]);

    (isDark ? dark : light).set(match[1] ?? 'default', primary);
  }
}

function readPalettePrimaries(): PalettePrimary[] {
  const light = new Map<string, string>();
  const dark = new Map<string, string>();

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      collectPrimaries(sheet.cssRules, light, dark);
    } catch {
      continue;
    }
  }

  const unique = new Map<string, PalettePrimary>();

  for (const [key, value] of light) {
    const pair = { light: value, dark: dark.get(key) ?? value };

    unique.set(`${pair.light}|${pair.dark}`, pair);
  }

  return Array.from(unique.values());
}

export function PaletteWordmark({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    const palettes = readPalettePrimaries();

    if (!element || palettes.length < 2) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let index = -1;

    const timer = window.setInterval(() => {
      index = (index + 1) % palettes.length;
      element.style.setProperty('--wordmark-light', palettes[index].light);
      element.style.setProperty('--wordmark-dark', palettes[index].dark);
    }, STEP_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="UI-Theme"
      className={cn(
        'aspect-[7570/1642] w-full bg-(--wordmark-light,var(--primary)) [mask:url(/brand/wordmark-handwritten.svg)_center/contain_no-repeat] transition-[background-color] duration-700 ease-in-out motion-reduce:transition-none dark:bg-(--wordmark-dark,var(--primary))',
        className
      )}
    />
  );
}
