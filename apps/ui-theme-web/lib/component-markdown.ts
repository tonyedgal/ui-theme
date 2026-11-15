import { componentApi, componentBaseFacts } from './component-guides';
import {
  componentBase,
  componentUsage,
  componentExamples,
  type ComponentBase,
  type ComponentDoc,
  type ComponentSource,
} from './component-docs';
import { shadcnCommand } from './docs-commands';

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
  const command = `npx uitheme-cli add ${doc.name} --base ${componentBase(base).base} --tailwind ${tailwind} --language ${language}`;
  const entry = componentBase(base);
  const vue = entry.framework === 'vue';
  const facts = componentBaseFacts(doc, base);
  const usageSource = componentUsage(doc, base);

  const usage =
    language === 'js' ? usageSource.replace(' lang="ts"', '') : usageSource;

  const api = componentApi(doc, base);

  const fragments = new Map(
    Object.entries({
      RegistryLivePreview:
        'Use the live preview to try the control with your theme provider.',
      RegistryExamples: componentExamples(doc)
        .map((example) => {
          const source = componentUsage(doc, base, example);

          const code =
            language === 'js' ? source.replace(' lang="ts"', '') : source;

          return `### ${example.title}\n\n${example.description}\n\n\`\`\`${vue ? 'vue' : language === 'js' ? 'jsx' : 'tsx'}\n${code}\n\`\`\``;
        })
        .join('\n\n'),
      RegistryInstallation: `\`\`\`sh\n${command}\n\`\`\``,
      RegistryBaseInstallation: facts.installation
        .map((fact) => `- ${fact}`)
        .join('\n'),
      RegistryBaseAccessibility: facts.accessibility
        .map((fact) => `- ${fact}`)
        .join('\n'),
      RegistryShadcnInstallation: `\`\`\`sh\n${shadcnCommand(doc.name)}\n\`\`\``,
      RegistryUsage: `\`\`\`${vue ? 'vue' : language === 'js' ? 'jsx' : 'tsx'}\n${usage}\n\`\`\``,
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
      (framework === 'Vue') === vue ? body : ''
  );

  const shadcnMarkdown = visibleMarkdown.replace(
    /<RegistryShadcn>\s*([\s\S]*?)\s*<\/RegistryShadcn>/g,
    (_, body: string) => (entry.shadcn ? body : '')
  );

  const markdown = `# ${doc.title}\n\n${doc.description}\n\n${shadcnMarkdown.replace(/<([A-Za-z]+)\s*\/>/g, (match, name: string) => fragments.get(name) ?? match)}`;

  return markdown;
}
