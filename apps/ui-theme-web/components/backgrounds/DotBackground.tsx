import { cn } from '@/lib/utils';

const DotBackground = ({ className }: React.ComponentProps<'div'>) => {
  return (
    <div className={cn('absolute inset-0', className)}>
      <div className="relative h-full w-full [&>div]:absolute [&>div]:h-full [&>div]:w-full [&>div]:bg-[radial-gradient(var(--border)_1px,transparent_1px)] [&>div]:[background-size:16px_16px]">
        <div></div>
      </div>
    </div>
  );
};

export default DotBackground;
