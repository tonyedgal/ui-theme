/*
 * MIT License
 *
 * Copyright (c) 2026 Chánh Đại
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
'use client';

import { Children, useEffect, useState } from 'react';
import type { Transition, Variants } from 'motion/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import useMeasure from 'react-use-measure';

import { cn } from '@/lib/utils';

const widthTransition: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.35,
};

const defaultVariants: Variants = {
  initial: { y: '-20%', opacity: 0, filter: 'blur(1px)' },
  animate: { y: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: {
    y: '40%',
    opacity: 0,
    filter: 'blur(1px)',
    transition: { ease: 'easeOut' },
  },
};

export type TextFlipProps = {
  as?: 'p' | 'span' | 'code';
  className?: string;
  children: React.ReactNode[];
  interval?: number;
  transition?: Transition;
  variants?: Variants;
  play?: boolean;
};

export function TextFlip({
  as = 'p',
  className,
  children,
  interval = 2,
  transition = { duration: 0.3 },
  variants = defaultVariants,
  play = true,
}: TextFlipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const items = Children.toArray(children);
  const Component = motion[as];
  const [measureRef, bounds] = useMeasure();

  useEffect(() => {
    if (!play || reduceMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [play, reduceMotion, interval, items.length]);

  return (
    <motion.span
      className="inline-block whitespace-nowrap"
      initial={false}
      animate={{ width: bounds.width || 'auto' }}
      transition={reduceMotion ? { duration: 0 } : widthTransition}
    >
      <span ref={measureRef} className="inline-block">
        <AnimatePresence mode="wait" initial={false}>
          <Component
            key={currentIndex}
            className={cn('inline-block', className)}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            variants={variants}
          >
            {items[currentIndex]}
          </Component>
        </AnimatePresence>
      </span>
    </motion.span>
  );
}
