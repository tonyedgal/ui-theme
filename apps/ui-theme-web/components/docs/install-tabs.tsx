'use client';

import { useState } from 'react';
import { Terminal } from 'lucide-react';
import {
  packageManagers,
  packageCommand,
  type PackageManager,
} from '@/lib/docs-commands';
import { DocsTabs } from './docs-tabs';
import { CodeBlock } from './code-block';
import { CopyButton } from './copy-button';

export function InstallTabs({
  command,
  highlighted = {},
  testId = 'install-command',
}: {
  command: string;
  highlighted?: Partial<Record<PackageManager, string>>;
  testId?: string;
}) {
  const [manager, setManager] = useState<PackageManager>('npx');

  return (
    <div
      data-testid={testId}
      className="not-prose overflow-hidden rounded-lg border"
    >
      <DocsTabs
        compact
        leading={
          <Terminal
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        }
        label="Package manager"
        value={manager}
        onValueChange={(value) => {
          const next = packageManagers.find((manager) => manager === value);

          if (next) setManager(next);
        }}
        toolbar={
          <CopyButton
            label="Copy command"
            value={packageCommand(command, manager)}
          />
        }
        tabs={packageManagers.map((pm) => ({
          id: pm,
          label: pm,
          content: (
            <CodeBlock
              code={packageCommand(command, pm)}
              html={highlighted[pm]}
              showCopy={false}
              className="rounded-none"
            />
          ),
        }))}
      />
    </div>
  );
}
