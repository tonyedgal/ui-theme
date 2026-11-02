import { componentSections } from './component-sections';

type Node = {
  type: string;
  depth?: number;
  value?: string;
  name?: string | null;
  children?: Node[];
};

const requiredBlocks = new Map(
  Object.entries({
    preview: 'RegistryLivePreview',
    examples: 'RegistryExamples',
    installation: 'RegistryInstallation',
    usage: 'RegistryUsage',
    'api-reference': 'RegistryApi',
    source: 'RegistrySource',
  })
);

function text(node: Node): string {
  return node.value ?? node.children?.map(text).join('') ?? '';
}

function meaningful(node: Node): boolean {
  if (['mdxjsEsm', 'mdxFlowExpression'].includes(node.type)) return false;

  return node.type === 'mdxJsxFlowElement' || text(node).trim().length > 0;
}

export function remarkComponentSections() {
  return (tree: Node, file: { path?: string }) => {
    const nodes = tree.children ?? [];

    const headings = nodes.filter(
      (node) => node.type === 'heading' && node.depth === 2
    );

    const actual = headings.map(text);

    const expected = componentSections
      .filter(
        (section) => section.id !== 'credits' || actual.includes('Credits')
      )
      .map((section) => section.title);

    const fail = (message: string): never => {
      throw new Error(`${file.path ?? 'Component documentation'}: ${message}`);
    };

    if (nodes.some((node) => node.type === 'heading' && node.depth === 1)) {
      fail('Use the frontmatter title instead of an H1.');
    }

    if (actual.join('\n') !== expected.join('\n')) {
      fail(
        `Required H2 sections, once each and in order: ${expected.join(' → ')}. Found: ${actual.join(' → ')}.`
      );
    }

    for (const [index, heading] of headings.entries()) {
      const start = nodes.indexOf(heading) + 1;

      const end = headings[index + 1]
        ? nodes.indexOf(headings[index + 1])
        : nodes.length;

      const body = nodes
        .slice(start, end)
        .filter((node) => !['mdxjsEsm', 'heading'].includes(node.type));

      const section = componentSections[index];

      if (!body.some(meaningful))
        fail(`Section "${section.title}" must contain content.`);
      const block = requiredBlocks.get(section.id);

      if (
        block &&
        body.filter(
          (node) => node.type === 'mdxJsxFlowElement' && node.name === block
        ).length !== 1
      ) {
        fail(
          `Section "${section.title}" must contain exactly one <${block} />.`
        );
      }
    }
  };
}
