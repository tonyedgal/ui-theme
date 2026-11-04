import { getLLMPage, getLLMPages } from '@/lib/llm-docs';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>
) {
  const { slug } = await params;

  const markdown = await getLLMPage(
    `/docs${slug?.length ? `/${slug.join('/')}` : ''}`
  );

  if (!markdown) notFound();

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

export function generateStaticParams() {
  return getLLMPages().map((page) => ({
    slug: page.href.slice('/docs'.length).split('/').filter(Boolean),
  }));
}
