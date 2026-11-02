export const packageManagers = ['npx', 'bun', 'pnpm', 'yarn'] as const;

export type PackageManager = (typeof packageManagers)[number];

export function packageCommand(command: string, manager: PackageManager) {
  const runners = {
    npx: 'npx',
    bun: 'bunx',
    pnpm: 'pnpm dlx',
    yarn: 'yarn dlx',
  };

  return command.replace(/^npx /, `${runners[manager]} `);
}
