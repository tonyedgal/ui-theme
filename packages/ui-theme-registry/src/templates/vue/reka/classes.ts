import { twMerge } from 'tailwind-merge';

export type ControlClasses = Partial<
  Record<
    'root' | 'trigger' | 'content' | 'item' | 'label' | 'track' | 'thumb',
    string
  >
>;

export function mergeClass(base: string, custom?: string) {
  return twMerge(base, custom);
}

export function mergeClasses(
  base: string,
  custom?: string,
  classes?: ControlClasses,
  slot?: keyof ControlClasses
) {
  return twMerge(base, custom, slot ? classes?.[slot] : undefined);
}
