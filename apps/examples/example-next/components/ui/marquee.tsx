'use client';

import Marquee from 'react-fast-marquee';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeWrapperProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  pauseOnHover?: boolean;
}

function MarqueeWrapper({
  children,
  className,
  speed = 30,
  pauseOnHover = true,
}: MarqueeWrapperProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="pointer-events-none absolute left-0 z-10 h-full w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 z-10 h-full w-16 bg-gradient-to-l from-background to-transparent" />
      <Marquee speed={speed} pauseOnHover={pauseOnHover}>
        {children}
      </Marquee>
    </div>
  );
}

export { MarqueeWrapper };
