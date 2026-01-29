import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import DotBackground from '@/components/backgrounds/DotBackground';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()}>
      <DotBackground className="mask-b-from-20%" />
      {children}
    </HomeLayout>
  );
}
