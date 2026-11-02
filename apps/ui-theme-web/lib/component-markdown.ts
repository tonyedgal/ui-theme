import { componentApi } from './component-guides';
import {
  componentUsage,
  componentExamples,
  type ComponentBase,
  type ComponentDoc,
  type ComponentSource,
} from './component-docs';

export function componentMarkdown({
  doc,
  base,
  tailwind,
  language,
  markdownSource,
  selected,
}: {
  doc: ComponentDoc;
  base: ComponentBase;
  tailwind: string;
  language: string;
  markdownSource: string;
  selected?: ComponentSource;
}) {
  const command = `npx uitheme-cli add ${doc.name} --base ${base} --tailwind ${tailwind} --language ${language}`;
  const usageSource = componentUsage(doc, base);

  const usage =
    language === 'js' ? usageSource.replace(' lang="ts"', '') : usageSource;

  const api = componentApi(doc, base);

  const fragments = new Map(
    Object.entries({
      RegistryLivePreview:
        base === 'reka'
          ? 'Install the Vue source in your app to preview it with your theme provider.'
          : 'Use the live preview to try the control with your theme provider.',
      RegistryExamples: componentExamples(doc)
        .map((example) => {
          const source = componentUsage(doc, base, example);

          const code =
            language === 'js' ? source.replace(' lang="ts"', '') : source;

          return `### ${example.title}\n\n${example.description}\n\n\`\`\`${base === 'reka' ? 'vue' : language === 'js' ? 'jsx' : 'tsx'}\n${code}\n\`\`\``;
        })
        .join('\n\n'),
      RegistryInstallation: `\`\`\`sh\n${command}\n\`\`\``,
      RegistryUsage: `\`\`\`${base === 'reka' ? 'vue' : language === 'js' ? 'jsx' : 'tsx'}\n${usage}\n\`\`\``,
      RegistryApi: `| Prop | Type | Behavior |\n| --- | --- | --- |\n${api.map((row) => `| ${row.name} | ${row.type} | ${row.description} |`).join('\n')}`,
      RegistryAgentCopy: '',
      RegistrySource:
        selected?.files
          .map((file) => `### ${file.path}\n\n\`\`\`\n${file.content}\n\`\`\``)
          .join('\n\n') ?? '',
    })
  );

  const visibleMarkdown = markdownSource.replace(
    /<Registry(React|Vue)>\s*([\s\S]*?)\s*<\/Registry\1>/g,
    (_, framework: string, body: string) =>
      (framework === 'Vue') === (base === 'reka') ? body : ''
  );

  const markdown = `# ${doc.title}\n\n${doc.description}\n\n${visibleMarkdown.replace(/<([A-Za-z]+)\s*\/>/g, (match, name: string) => fragments.get(name) ?? match)}`;

  return markdown;
}
