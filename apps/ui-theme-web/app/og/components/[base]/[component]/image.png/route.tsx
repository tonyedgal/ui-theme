import { componentContent } from 'fumadocs-mdx:collections/server';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';
import {
  componentBases,
  componentDocs,
  componentPageTitle,
} from '@/lib/component-docs';

export const revalidate = false;

export const dynamicParams = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/og/components/[base]/[component]/image.png'>
) {
  const values = await params;
  const base = componentBases.find((item) => item.name === values.base);

  const content = componentContent.find(
    (entry) => entry.info.path === `${values.component}.mdx`
  );

  if (!base || !content) notFound();

  return new ImageResponse(
    <DefaultImage
      title={componentPageTitle(base, content.title)}
      description={content.description}
      site="UI-Theme"
    />,
    { width: 1200, height: 630 }
  );
}

export function generateStaticParams() {
  return componentBases.flatMap((base) =>
    componentDocs.map((doc) => ({ base: base.name, component: doc.name }))
  );
}
