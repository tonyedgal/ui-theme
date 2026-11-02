import { z } from 'zod';
import { remarkComponentSections } from './lib/remark-component-sections';
import { codeThemes } from './lib/code-themes';
import {
  applyMdxPreset,
  defineConfig,
  defineCollections,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const componentContent = defineCollections({
  type: 'doc',
  dir: 'content/components',
  schema: frontmatterSchema.extend({ description: z.string().min(1) }),
  postprocess: { includeProcessedMarkdown: true },
  mdxOptions: applyMdxPreset({
    remarkPlugins: [remarkComponentSections],
    rehypeCodeOptions: {
      themes: codeThemes,
      defaultColor: false,
    },
  }),
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: codeThemes,
      defaultColor: false,
    },
  },
});
