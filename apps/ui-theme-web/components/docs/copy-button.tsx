'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { cn } from '@/lib/utils';

function copyForLocalPreview(text: string) {
  const focus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  Object.assign(field.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    fontSize: '16px',
  });
  document.body.append(field);

  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);

    if (!document.execCommand('copy')) throw new Error('Copy unavailable');
  } finally {
    field.remove();

    if (focus instanceof HTMLElement) focus.focus({ preventScroll: true });
  }
}

export function CopyButton({
  value,
  loadValue,
  label = 'Copy code',
  iconOnly = true,
  className,
}: {
  value?: string;
  loadValue?: () => Promise<string>;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [error, setError] = useState(false);

  const [copied, copy] = useCopyButton(async () => {
    try {
      if (
        loadValue &&
        navigator.clipboard?.write &&
        typeof ClipboardItem !== 'undefined'
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': loadValue().then(
              (text) => new Blob([text], { type: 'text/plain' })
            ),
          }),
        ]);
      } else {
        const text = loadValue ? await loadValue() : (value ?? '');

        if (navigator.clipboard?.writeText)
          await navigator.clipboard.writeText(text);
        else if (process.env.NODE_ENV === 'development')
          copyForLocalPreview(text);
        else throw new Error('Copy unavailable');
      }

      setError(false);
    } catch {
      setError(true);

      return;
    }
  });

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <button
              type="button"
              aria-label={
                error ? `${label}: failed` : copied ? `${label}: copied` : label
              }
              onClick={copy}
              className={cn(
                'inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md p-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
                className
              )}
            />
          }
        >
          {copied && !error ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {!iconOnly && (
            <span>{error ? 'Copy failed' : copied ? 'Copied' : label}</span>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={6}>
            <Tooltip.Popup className="z-70 rounded-md bg-foreground px-2 py-1 text-xs text-background">
              {error
                ? 'Copy failed. Select and copy the code.'
                : copied
                  ? 'Copied'
                  : label}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
