'use client';

import type { ReactNode } from 'react';
import { DocsTabs } from './docs-tabs';
import { CopyButton } from './copy-button';
import { CodeBlock } from './code-block';

export function ComponentPreview({
  label = 'Component preview',
  children,
  code,
  html,
}: {
  label?: string;
  children: ReactNode;
  code: string;
  html?: string;
}) {
  return (
    <DocsTabs
      label={label}
      toolbar={
        <CopyButton
          label="Copy preview code"
          value={code}
          className="h-8 p-2 [&_svg]:size-4"
        />
      }
      tabs={[
        {
          id: 'preview',
          label: 'Preview',
          content: (
            <div className="min-h-30 min-w-0 overflow-x-auto rounded-lg border p-4 sm:p-8 lg:p-20">
              <div className="mx-auto flex w-full max-w-lg items-center justify-center">
                {children}
              </div>
            </div>
          ),
        },
        {
          id: 'code',
          label: 'Code',
          content: (
            <div className="max-h-100 overflow-auto rounded-lg border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CodeBlock
                code={code}
                html={html}
                showCopy={false}
                className="rounded-none font-medium"
              />
            </div>
          ),
        },
      ]}
    />
  );
}
