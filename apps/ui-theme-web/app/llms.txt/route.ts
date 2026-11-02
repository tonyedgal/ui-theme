import { getLLMPages } from '@/lib/llm-docs';

export const revalidate = false;

export function GET() {
  const lines = [
    '# UI-Theme',
    '',
    '> Documentation for the UI-Theme runtime and local theme controls.',
    '',
    'Use the Markdown links below for individual guides. Component guides include installation commands, usage, API details, and source.',
    '',
    '## Documentation',
    '',
    ...getLLMPages().map(
      (page) =>
        `- [${page.title}](/llms.mdx${page.href}): ${page.description ?? ''}`
    ),
    '',
    '## Full documentation',
    '',
    '- [Complete text](/llms-full.txt): All guides and component variants in one file.',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
