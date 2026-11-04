import { docsTree } from '@/lib/docs-tree';
import { DocsShell } from '@/components/docs-shell';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return <DocsShell tree={docsTree}>{children}</DocsShell>;
}
