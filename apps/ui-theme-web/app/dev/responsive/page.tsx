import { notFound } from 'next/navigation';

export default async function ResponsivePage({
  searchParams,
}: PageProps<'/dev/responsive'>) {
  if (process.env.NODE_ENV !== 'development') return notFound();

  const params = await searchParams;

  if (params.surface === 'tables') {
    const { DocsTablePreview } =
      await import('@/components/dev/docs-table-preview');

    return (
      <DocsTablePreview
        data={String(params.data ?? 'demo')}
        largeText={params.text === '200'}
      />
    );
  }

  const { ResponsivePreview } =
    await import('@/components/dev/responsive-preview');

  return (
    <ResponsivePreview
      key={String(params.data)}
      data={String(params.data ?? 'demo')}
      largeText={params.text === '200'}
    />
  );
}
