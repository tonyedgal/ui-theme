/**
 * The component bases (primitive libraries) that UI-Theme controls are built
 * on. This list is the single source of truth: the registry build, the CLI,
 * the repository scripts and the website all derive from it.
 *
 * A base and a framework are separate dimensions. One base can support more
 * than one framework; never infer the framework from a base id.
 */

import type { Framework } from './types.ts';

export type RegistryFramework = 'react' | 'vue';

/** Registry frameworks in the order in which the registry emits them. */
export const registryFrameworks = ['react', 'vue'] as const;

export const frameworkLabels: Record<RegistryFramework, string> = {
  react: 'React',
  vue: 'Vue',
};

export interface BaseFrameworkSupport {
  /** The template folder, relative to the registry `src/templates` folder. */
  templates: string;
  /** The primitive packages that the templates import. */
  packages: readonly string[];
  /**
   * More package names that show the base is installed. A name that ends in
   * `/` matches every package in that scope. `packages` also detect the base.
   */
  detect?: readonly string[];
  /** Absent when no shadcn style selects this base. */
  shadcn?: {
    /** Full shadcn style names that select this base. */
    styles?: readonly string[];
    /** Prefix of shadcn style names that select this base, such as `base-`. */
    prefix?: string;
    /** Select this base for a shadcn style that no base claims. */
    fallback?: boolean;
  };
  /** Requirements for the app, such as a minimum framework version. */
  requires?: {
    /** A package of the app, such as `react`. */
    package: string;
    /** The semver range the installed package must satisfy. */
    range: string;
    /** A note for the user when the requirement is not met. */
    note: string;
  };
}

export interface BaseDefinition {
  id: string;
  /** The product name, such as `Radix UI`. */
  displayName: string;
  /** A short name for tight labels, such as `Radix`. */
  shortName: string;
  frameworks: Partial<Record<RegistryFramework, BaseFrameworkSupport>>;
}

const builtInBases = [
  {
    id: 'base-ui',
    displayName: 'Base UI',
    shortName: 'Base UI',
    frameworks: {
      react: {
        templates: 'react/base-ui',
        packages: ['@base-ui/react'],
        detect: ['@base-ui-components/react'],
        shadcn: { prefix: 'base-' },
      },
    },
  },
  {
    id: 'radix',
    displayName: 'Radix UI',
    shortName: 'Radix',
    frameworks: {
      react: {
        templates: 'react/radix',
        packages: ['radix-ui'],
        detect: ['@radix-ui/'],
        shadcn: {
          // When an app on Tailwind 4 selects new-york, shadcn installs the
          // files from new-york-v4.
          styles: ['new-york', 'new-york-v4', 'default'],
          prefix: 'radix-',
          fallback: true,
        },
      },
    },
  },
  {
    id: 'reka',
    displayName: 'Reka UI',
    shortName: 'Reka',
    frameworks: {
      vue: {
        templates: 'vue/reka',
        packages: ['reka-ui'],
      },
    },
  },
] as const satisfies readonly BaseDefinition[];

export type Base = (typeof builtInBases)[number]['id'];

let activeBases: readonly BaseDefinition[] = builtInBases;

/** The bases in manifest order. The first base of a framework is its default. */
export function baseManifest(): readonly BaseDefinition[] {
  return activeBases;
}

/**
 * Replace the manifest, for tests only. Returns a function that restores the
 * previous manifest.
 */
export function setBaseManifest(bases: readonly BaseDefinition[]): () => void {
  const previous = activeBases;
  activeBases = bases;

  return () => {
    activeBases = previous;
  };
}

// SAFETY: every id comes from the active manifest. `Base` names the built-in
// ids; only a test manifest adds others.
const baseId = (base: BaseDefinition) => base.id as Base;

export function baseIds(): Base[] {
  return activeBases.map(baseId);
}

export function findBase(id: string): BaseDefinition | undefined {
  return activeBases.find((base) => base.id === id);
}

/** The bases that support a framework, in manifest order. */
export function basesFor(framework: RegistryFramework): Base[] {
  return baseVariants()
    .filter((variant) => variant.framework === framework)
    .map((variant) => variant.base);
}

export function supportsFramework(
  base: string,
  framework: RegistryFramework
): boolean {
  return Boolean(findBase(base)?.frameworks[framework]);
}

/** Every base and framework pair, in registry order. */
export function baseVariants(bases = activeBases): {
  framework: RegistryFramework;
  base: Base;
  support: BaseFrameworkSupport;
}[] {
  return bases.flatMap((base) =>
    registryFrameworks.flatMap((framework) => {
      const support = base.frameworks[framework];

      return support ? [{ framework, base: baseId(base), support }] : [];
    })
  );
}

/** `--base a`, `--base a or --base b`, `--base a, --base b or --base c` */
export function baseFlagHint(framework: RegistryFramework): string {
  const flags = basesFor(framework).map((base) => `--base ${base}`);

  return flags.length < 2
    ? flags.join('')
    : `${flags.slice(0, -1).join(', ')} or ${flags.at(-1)}`;
}

// Choose the base from the primitives that the app already installs. When the
// app has more than one or none, a shadcn style selects the base: a style that
// a base names or prefixes, else the fallback base. React Aria styles
// (`aria-*`) select nothing. Without either signal, use the framework default.
export function detectBase(
  framework: RegistryFramework,
  dependencies: Record<string, string>,
  style: string | undefined
): Base {
  const names = Object.keys(dependencies);

  const candidates = baseVariants().filter(
    (variant) => variant.framework === framework
  );

  const installed = candidates.filter(({ support }) =>
    [...support.packages, ...(support.detect ?? [])].some((pattern) =>
      pattern.endsWith('/')
        ? names.some((name) => name.startsWith(pattern))
        : names.includes(pattern)
    )
  );

  if (installed.length === 1) return installed[0].base;

  if (style && !style.startsWith('aria-')) {
    const styled =
      candidates.find(({ support }) =>
        support.shadcn?.styles?.includes(style)
      ) ??
      candidates.find(
        ({ support }) =>
          support.shadcn?.prefix && style.startsWith(support.shadcn.prefix)
      ) ??
      candidates.find(({ support }) => support.shadcn?.fallback);

    if (styled) return styled.base;
  }

  return candidates[0].base;
}

/** The registry framework of an app framework. */
export function registryFramework(framework: Framework): RegistryFramework {
  return framework === 'nuxt' || framework === 'vite-vue' ? 'vue' : 'react';
}
