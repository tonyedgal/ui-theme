'use client';

import { ChevronDown, FileText, MessageSquare } from 'lucide-react';
import { Menu } from '@base-ui/react/menu';
import { CopyButton } from './copy-button';

export function CopyPageButton({
  markdown,
  markdownUrl,
}: {
  markdown?: string;
  markdownUrl?: string;
}) {
  const loadValue = async () => {
    const response = await fetch(markdownUrl!);

    if (!response.ok) throw new Error('Unable to load Markdown');

    return response.text();
  };

  const openMarkdown = async () => {
    if (markdownUrl) {
      window.open(markdownUrl, '_blank', 'noopener,noreferrer');

      return;
    }

    const file = new Blob([markdown ?? ''], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(file);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className="not-prose inline-flex shrink-0 items-center rounded-md border border-border bg-secondary">
      <CopyButton
        value={markdown}
        loadValue={markdownUrl ? loadValue : undefined}
        label="Copy page"
        iconOnly={false}
        className="rounded-r-none px-2.5 text-secondary-foreground [&_svg]:size-3"
      />
      <span className="h-4 w-px bg-border" />
      <Menu.Root>
        <Menu.Trigger
          aria-label="Page options"
          className="inline-flex size-7 items-center justify-center rounded-r-md text-secondary-foreground hover:bg-secondary-foreground/10"
        >
          <ChevronDown className="size-3" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={8}>
            <Menu.Popup className="z-70 w-48 rounded-lg border bg-popover py-1 shadow-lg outline-none">
              <Menu.Item
                onClick={() => void openMarkdown()}
                className="flex cursor-default items-center gap-3 px-3 py-2 text-sm text-muted-foreground outline-none data-highlighted:bg-muted data-highlighted:text-foreground"
              >
                <FileText className="size-4" aria-hidden="true" />
                View as Markdown
              </Menu.Item>
              {['Claude', 'ChatGPT', 'Cursor'].map((name) => (
                <Menu.Item
                  key={name}
                  onClick={() => {
                    const prompt = `Read ${new URL(markdownUrl ?? window.location.pathname, window.location.origin)}, I want to ask questions about it.`;

                    if (name === 'Cursor') {
                      window.location.href = `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(prompt)}`;

                      return;
                    }

                    window.open(
                      `${name === 'Claude' ? 'https://claude.ai/new' : 'https://chatgpt.com/'}?${new URLSearchParams({ q: prompt })}`,
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                  className="flex cursor-default items-center gap-3 px-3 py-2 text-sm text-muted-foreground outline-none data-highlighted:bg-muted data-highlighted:text-foreground"
                >
                  <MessageSquare className="size-4" aria-hidden="true" />
                  Open in {name}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
