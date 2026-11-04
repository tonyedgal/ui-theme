'use client';

import { Search } from 'lucide-react';
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

export function DocsSearchDialog(props: SharedProps) {
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
      <SearchDialogOverlay className="bg-overlay/10 backdrop-blur-sm" />
      <SearchDialogContent className="top-[20vh] md:top-[20vh] max-w-md overflow-hidden rounded-xl border bg-popover p-0 shadow-xl">
        <SearchDialogHeader className="gap-3 border-b px-3">
          <Search
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <SearchDialogInput
            placeholder="Search documentation..."
            className="h-12 text-sm"
          />
          <SearchDialogClose className="rounded border bg-muted px-1.5 py-1 text-[10px] text-muted-foreground">
            ESC
          </SearchDialogClose>
        </SearchDialogHeader>
        <SearchDialogList
          items={items}
          className="max-h-[50vh] p-0 [&_button]:rounded-none [&_button]:border-b [&_button]:px-4 [&_button]:py-3 [&_button]:text-sm"
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
