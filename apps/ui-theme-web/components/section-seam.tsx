import { cn } from '@/lib/utils';

export function SectionSeam({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative h-(--seam-size) w-full flex-none [--dither-color:var(--foreground)] [--seam-size:32px]',
        className
      )}
    >
      <div className="absolute inset-0 bg-[image:repeating-conic-gradient(var(--dither-color)_0_25%,transparent_0_50%)] bg-size-[8px_8px] bg-position-[0_0]" />
      <div className="absolute inset-0 top-1/2 bg-[image:repeating-conic-gradient(var(--dither-color)_0_25%,transparent_0_50%)] bg-size-[16px_16px] bg-position-[4px_0] opacity-60" />
    </div>
  );
}
