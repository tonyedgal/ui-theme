'use client';

import {
  Snippet,
  SnippetCopyButton,
  SnippetHeader,
  SnippetTabsContent,
  SnippetTabsList,
  SnippetTabsTrigger,
} from '@/components/ui/shadcn-io/snippet';
import { BoxIcon } from 'lucide-react';
import { useState } from 'react';

const commands = [
  {
    label: 'pnpm',
    icon: BoxIcon,
    code: 'pnpm install @ui-theme/web',
  },
  {
    label: 'npm',
    icon: BoxIcon,
    code: 'npm install @ui-theme/web',
  },
  {
    label: 'yarn',
    icon: BoxIcon,
    code: 'yarn add @ui-theme/web',
  },
];

const InstallSnippet = () => {
  const [value, setValue] = useState(commands[0].label);
  const activeCommand = commands.find((command) => command.label === value);
  return (
    <main className="flex items-center justify-center">
      <Snippet onValueChange={setValue} value={value} className="max-w-xl">
        <SnippetHeader>
          <SnippetTabsList>
            {commands.map((command) => (
              <SnippetTabsTrigger key={command.label} value={command.label}>
                <command.icon size={14} />
                <span>{command.label}</span>
              </SnippetTabsTrigger>
            ))}
          </SnippetTabsList>
          {activeCommand && (
            <SnippetCopyButton
              onCopy={() =>
                console.log(`Copied "${activeCommand.code}" to clipboard`)
              }
              onError={() =>
                console.error(
                  `Failed to copy "${activeCommand.code}" to clipboard`
                )
              }
              value={activeCommand.code}
            />
          )}
        </SnippetHeader>
        {commands.map((command) => (
          <SnippetTabsContent key={command.label} value={command.label}>
            {command.code}
          </SnippetTabsContent>
        ))}
      </Snippet>
    </main>
  );
};
export default InstallSnippet;
