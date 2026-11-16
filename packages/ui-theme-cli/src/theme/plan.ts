import {
  ConversionRefusal,
  messages,
  type ExistingChoice,
  type SetupKind,
} from '../install/messages.ts';
import type { ProjectProfile } from '../types.ts';
import type { ThemeSetup } from './detect.ts';
import { planNextThemes } from './converters/next-themes.ts';
import { targetFor } from './targets.ts';
import { convertShadcn } from './converters/shadcn.ts';

export interface Conversion {
  files: { path: string; content: string }[];
  remove: string[];
}

type Converter = (
  profile: ProjectProfile,
  setup: ThemeSetup
) => Promise<Conversion>;

const converters: Partial<Record<SetupKind, Converter>> = {
  'next-themes': async (profile) => {
    const plan = await planNextThemes(profile);

    return {
      files: plan?.files ?? [],
      remove: plan?.remove ? ['next-themes'] : [],
    };
  },
  'shadcn-vite': convertShadcn,
  'shadcn-tanstack': convertShadcn,
};

export function choicesFor(
  setups: ThemeSetup[],
  profile: ProjectProfile
): ExistingChoice[] {
  if (setups.length !== 1) return ['manual'];
  const [setup] = setups;

  if (converters[setup.kind]) return ['convert', 'manual'];

  return setup.kind === 'custom' &&
    targetFor(profile.framework).kind === 'react'
    ? ['manual', 'alongside']
    : ['manual'];
}

export function labelFor(setups: ThemeSetup[]): string {
  return setups
    .map((setup) => messages.label(setup.kind, setup.library))
    .join(', ');
}

export function manualStep(setups: ThemeSetup[]): string {
  if (setups.length > 1)
    return messages.multiple(
      setups.map((setup) => messages.label(setup.kind, setup.library))
    );
  const [setup] = setups;

  return converters[setup.kind]
    ? messages.manual()
    : messages.noConverter(
        messages.label(setup.kind, setup.library),
        setup.kind
      );
}

export async function convert(
  profile: ProjectProfile,
  setup: ThemeSetup
): Promise<Conversion | ConversionRefusal> {
  try {
    return await converters[setup.kind]!(profile, setup);
  } catch (error) {
    if (error instanceof ConversionRefusal) return error;
    throw error;
  }
}
