'use client';

import * as React from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface SnippetProps extends React.ComponentProps<typeof Tabs> {
  children: React.ReactNode;
}

function Snippet({ className, children, ...props }: SnippetProps) {
  return (
    <Tabs
      className={cn(
        'w-full rounded-md border bg-card overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </Tabs>
  );
}

function SnippetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b bg-muted/50 px-3 py-2',
        className
      )}
      {...props}
    />
  );
}

function SnippetTabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn('h-auto bg-transparent p-0 gap-1', className)}
      {...props}
    />
  );
}

function SnippetTabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        'h-7 rounded-sm px-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm',
        className
      )}
      {...props}
    />
  );
}

interface SnippetCopyButtonProps extends React.ComponentProps<typeof Button> {
  value: string;
  onCopy?: () => void;
  onError?: () => void;
}

function SnippetCopyButton({
  value,
  onCopy,
  onError,
  className,
  ...props
}: SnippetCopyButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      onError?.();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-7 w-7', className)}
      onClick={handleCopy}
      {...props}
    >
      {isCopied ? (
        <CheckIcon className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
}

function SnippetTabsContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsContent>) {
  return (
    <TabsContent className={cn('mt-0', className)} {...props}>
      <pre className="overflow-x-auto p-4">
        <code className="text-sm font-mono text-foreground">{children}</code>
      </pre>
    </TabsContent>
  );
}

export {
  Snippet,
  SnippetHeader,
  SnippetTabsList,
  SnippetTabsTrigger,
  SnippetCopyButton,
  SnippetTabsContent,
};
