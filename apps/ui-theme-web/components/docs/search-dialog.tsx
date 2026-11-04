'use client';

import { Search, X } from 'lucide-react';
import { useDocsSearch } from 'fumadocs-core/search/client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
  type SearchItemType,
} from 'fumadocs-ui/components/dialog/search';
import { componentDocs } from '@/lib/component-docs';
import { useSearchViewport } from '@/hooks/use-search-viewport';

function hideSearchKeyboard(element: HTMLElement) {
  element
    .closest('[role="dialog"]')
    ?.querySelector<HTMLButtonElement>('[data-search-close]')
    ?.focus({ preventScroll: true });
}

export function DocsSearchDialog(props: SharedProps) {
  const viewportRef = useSearchViewport();
  const { search, setSearch, query } = useDocsSearch({ type: 'fetch' });

  const components: SearchItemType[] = search.trim()
    ? componentDocs
        .filter((doc) =>
          `${doc.title} ${doc.description}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .map((doc) => ({
          id: doc.name,
          type: 'page',
          content: doc.title,
          url: `/docs/components/base-ui/${doc.name}`,
        }))
    : [];

  const items = (
    query.data === 'empty' ? components : [...components, ...(query.data ?? [])]
  ).slice(0, 25);

  return (
    <SearchDialog
      {...props}
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
    >
      <SearchDialogOverlay
        className="bg-overlay/10 backdrop-blur-sm"
        onPointerDown={() => props.onOpenChange(false)}
      />
      <SearchDialogContent
        ref={viewportRef}
        className="docs-search-dialog flex max-w-md flex-col overflow-y-auto overscroll-contain rounded-xl border bg-popover p-0 shadow-xl"
      >
        <SearchDialogHeader
          data-search-header
          className="shrink-0 gap-3 border-b px-3 [&_input]:min-w-0 [&_input]:text-base"
        >
          <Search
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <SearchDialogInput
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.nativeEvent.isComposing &&
                event.currentTarget.closest('[data-search-compact]')
              ) {
                event.preventDefault();
                event.stopPropagation();
                hideSearchKeyboard(event.currentTarget);
              }
            }}
          />
          <button
            type="button"
            data-search-dismiss-keyboard
            aria-label="Hide keyboard"
            onClick={(event) => hideSearchKeyboard(event.currentTarget)}
            className="hidden min-h-11 items-center justify-center rounded-md px-2 text-sm font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            Done
          </button>
          <SearchDialogClose
            data-search-close
            className="rounded border bg-muted px-1.5 py-1 text-[10px] text-muted-foreground"
          >
            <span className="[@media(pointer:coarse)]:hidden">ESC</span>
            <X
              aria-hidden="true"
              className="hidden size-4 [@media(pointer:coarse)]:block"
            />
          </SearchDialogClose>
        </SearchDialogHeader>
        <SearchDialogList
          items={items}
          data-search-results
          className="flex min-h-0 max-h-[60dvh] flex-col overscroll-contain p-0 [&_button]:rounded-none [&_button]:border-b [&_button]:px-4 [&_button]:py-3 [&_button]:text-sm"
          Empty={() => (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search.trim() ? 'No results found' : 'Type to search...'}
            </p>
          )}
        />
      </SearchDialogContent>
    </SearchDialog>
  );
}
