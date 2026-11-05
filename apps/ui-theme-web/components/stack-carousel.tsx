import { logoPaths, type LogoKey } from '@/components/stack-logos';
import { LogosCarousel } from '@/components/ui/logos-carousel';
import { cn } from '@/lib/utils';

type StackItem = { name: string; logo?: LogoKey; planned?: boolean };

const brandColors: Partial<Record<LogoKey, string>> = {
  react: '#61DAFB',
  tailwind: '#06B6D4',
  vue: '#4FC08D',
  vite: '#9135FF',
  typescript: '#3178C6',
  css: '#663399',
  nuxt: '#00DC82',
  reka: '#16A353',
  svelte: '#FF3E00',
  astro: '#BC52EE',
  solid: '#2C4F7C',
};

const stacks: StackItem[][] = [
  [
    { name: 'React', logo: 'react' },
    { name: 'Next.js', logo: 'nextjs' },
    { name: 'Radix', logo: 'radix' },
    { name: 'Tailwind CSS', logo: 'tailwind' },
  ],
  [
    { name: 'Vue', logo: 'vue' },
    { name: 'Vite', logo: 'vite' },
    { name: 'TypeScript', logo: 'typescript' },
    { name: 'CSS', logo: 'css' },
  ],
  [
    { name: 'React', logo: 'react' },
    { name: 'TanStack Start', logo: 'tanstack' },
    { name: 'Base UI', logo: 'baseUi' },
    { name: 'Tailwind CSS', logo: 'tailwind' },
  ],
  [
    { name: 'React Native', logo: 'react' },
    { name: 'Expo', logo: 'expo' },
    { name: 'NativeWind' },
    { name: 'Uniwind' },
  ],
  [
    { name: 'Vue', logo: 'vue' },
    { name: 'Nuxt', logo: 'nuxt' },
    { name: 'Reka UI', logo: 'reka' },
    { name: 'Tailwind CSS', logo: 'tailwind' },
  ],
  [
    { name: 'React', logo: 'react' },
    { name: 'Vite', logo: 'vite' },
    { name: 'TypeScript', logo: 'typescript' },
    { name: 'CSS', logo: 'css' },
  ],
  [
    { name: 'Svelte', logo: 'svelte', planned: true },
    { name: 'Astro', logo: 'astro', planned: true },
    { name: 'Angular', logo: 'angular', planned: true },
    { name: 'Solid', logo: 'solid', planned: true },
  ],
];

const uniqueItems = Array.from(
  new Map(stacks.flat().map((item) => [item.name, item])).values()
);

function StackLogo({ item }: { item: StackItem }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center gap-2 px-2 py-5 text-foreground',
        item.planned && 'opacity-40 grayscale'
      )}
    >
      {item.logo ? (
        <svg
          viewBox="0 0 24 24"
          fill={brandColors[item.logo] ?? 'currentColor'}
          className="size-7 shrink-0"
        >
          <path d={logoPaths[item.logo]} />
        </svg>
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-[calc(var(--radius)*0.75)] bg-foreground font-mono text-[10px] font-semibold text-background">
          {item.name
            .split(/(?=[A-Z])/)
            .map((part) => part[0])
            .join('')}
        </span>
      )}
      <span className="line-clamp-2 max-w-full text-center text-xs wrap-anywhere leading-tight text-balance text-muted-foreground">
        {item.name}
      </span>
    </div>
  );
}

export function StackCarousel() {
  return (
    <section
      aria-labelledby="stack-title"
      className="mx-auto max-w-4xl px-6 pb-24 sm:px-8"
    >
      <div className="mb-8 text-center">
        <h2 id="stack-title" className="text-lg font-medium tracking-tight">
          Works with your stack
        </h2>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          React, Vue, and React Native today. Grayed-out frameworks are on the
          roadmap.
        </p>
      </div>

      <ul className="sr-only">
        {uniqueItems.map((item) => (
          <li key={item.name}>
            {item.name}
            {item.planned ? ' (planned)' : ''}
          </li>
        ))}
      </ul>

      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-[min(calc(var(--radius)*100),calc(var(--radius)+6px))] border border-border"
      >
        <LogosCarousel className="grid-cols-2 *:border-dashed *:border-border max-sm:*:odd:border-r max-sm:*:nth-[-n+2]:border-b sm:grid-cols-4 sm:*:not-last:border-r">
          {stacks.flat().map((item, index) => (
            <StackLogo key={`${item.name}-${index}`} item={item} />
          ))}
        </LogosCarousel>
      </div>
    </section>
  );
}
