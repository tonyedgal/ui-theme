'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

const revealSlideDirection = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  TOP_BLUR: 'top-blur',
  BOTTOM_BLUR: 'bottom-blur',
  LEFT_BLUR: 'left-blur',
  RIGHT_BLUR: 'right-blur',
} as const;

type ObjectValues<T> = T[keyof T];
type RevealSlideDirection = ObjectValues<typeof revealSlideDirection>;

interface RevealProps {
  children: ReactNode;
  width?: 'fit-content' | '100%';
  delay?: number;
  slideDirection?: RevealSlideDirection;
  duration?: number;
}

export function Reveal({
  children,
  width = 'fit-content',
  delay = 0.25,
  slideDirection = 'bottom',
  duration = 0.5,
}: RevealProps) {
  const variants = (() => {
    switch (slideDirection) {
      case 'top':
        return {
          hidden: { opacity: 0, y: -75, x: 0 },
          visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
              staggerChildren: 0.1,
            },
          },
        };
      case 'top-blur':
        return {
          hidden: {
            filter: 'blur(10px)',
            transform: 'translateY(-20%)',
            opacity: 0,
          },
          visible: {
            filter: 'blur(0)',
            transform: 'translateY(0)',
            opacity: 1,
          },
        };
      case 'left':
        return {
          hidden: { opacity: 0, y: 0, x: -75 },
          visible: { opacity: 1, y: 0, x: 0 },
        };
      case 'left-blur':
        return {
          hidden: {
            filter: 'blur(10px)',
            transform: 'translateX(-20%)',
            opacity: 0,
          },
          visible: {
            filter: 'blur(0)',
            transform: 'translateX(0)',
            opacity: 1,
          },
        };
      case 'right':
        return {
          hidden: { opacity: 0, y: 0, x: 75 },
          visible: { opacity: 1, y: 0, x: 0 },
        };
      case 'right-blur':
        return {
          hidden: {
            filter: 'blur(10px)',
            transform: 'translateX(20%)',
            opacity: 0,
          },
          visible: {
            filter: 'blur(0)',
            transform: 'translateX(0)',
            opacity: 1,
          },
        };
      case 'bottom-blur':
        return {
          hidden: {
            filter: 'blur(10px)',
            transform: 'translateY(20%)',
            opacity: 0,
          },
          visible: {
            filter: 'blur(0)',
            transform: 'translateY(0)',
            opacity: 1,
          },
        };
      default:
        return {
          hidden: { opacity: 0, y: 75, x: 0 },
          visible: { opacity: 1, y: 0, x: 0 },
        };
    }
  })();

  return (
    <div
      style={{
        position: 'relative',
        width,
        overflow: 'hidden',
      }}
    >
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        transition={{ duration: duration, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}
