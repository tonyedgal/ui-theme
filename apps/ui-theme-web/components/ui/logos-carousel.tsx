'use client';

import { Children, memo, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  usePageInView,
  useReducedMotion,
} from 'motion/react';
import type { Transition } from 'motion/react';

import { cn } from '@/lib/utils';

const COLUMN_COUNT = 4;

const CYCLE_INTERVAL = 2400;

const STAGGER_DELAY = 0.125;

const TRANSITION_DURATION = 0.5;

const EASE_OUT_QUAD = [0.25, 0.46, 0.45, 0.94] as const;

export function LogosCarousel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const columns = useMemo(
    () => distributeLogos(Children.toArray(children)),
    [children]
  );

  const reduceMotion = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const isPageInView = usePageInView();
  const isInView = useInView(containerRef, { margin: '100px' });
  const [step, setStep] = useState(0);
  const shouldPlay = isPageInView && isInView;

  useEffect(() => {
    if (!shouldPlay) return;

    const beatId = setInterval(
      () => setStep((prev) => prev + 1),
      CYCLE_INTERVAL
    );

    return () => clearInterval(beatId);
  }, [shouldPlay]);

  return (
    <div ref={containerRef} className={cn('grid grid-cols-4', className)}>
      {columns.map((columnLogos, columnIndex) => (
        <LogoColumn
          key={columnIndex}
          logos={columnLogos}
          columnIndex={columnIndex}
          activeIndex={step % columnLogos.length}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  );
}

const LogoColumn = memo(function LogoColumn({
  logos,
  columnIndex,
  activeIndex,
  reduceMotion,
}: {
  logos: ReactNode[];
  columnIndex: number;
  activeIndex: number;
  reduceMotion: boolean;
}) {
  const transition: Transition = {
    ease: EASE_OUT_QUAD,
    duration: TRANSITION_DURATION,
    delay: columnIndex * STAGGER_DELAY,
  };

  const travel = reduceMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { transform: 'translateY(60%)', filter: 'blur(2px)' },
        animate: { transform: 'translateY(0%)', filter: 'blur(0px)' },
        exit: { transform: 'translateY(-50%)', filter: 'blur(3px)' },
      };

  return (
    <div className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={`${columnIndex}-${activeIndex}`}
          className="flex size-full items-center justify-center"
          initial={{ opacity: 0, ...travel.initial }}
          animate={{ opacity: 1, ...travel.animate, transition }}
          exit={{ opacity: 0, ...travel.exit, transition }}
        >
          {logos[activeIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

function distributeLogos(logos: ReactNode[]): ReactNode[][] {
  const columns: ReactNode[][] = Array.from({ length: COLUMN_COUNT }, () => []);

  logos.forEach((logo, index) => {
    columns[index % COLUMN_COUNT].push(logo);
  });

  return columns;
}
