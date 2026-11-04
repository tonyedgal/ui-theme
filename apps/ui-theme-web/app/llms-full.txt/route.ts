import { getLLMPage, getLLMPages } from '@/lib/llm-docs';

export const revalidate = false;

export async function GET() {
  const pages = await Promise.all(
    getLLMPages().map((page) => getLLMPage(page.href))
  );

  return new Response(pages.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
