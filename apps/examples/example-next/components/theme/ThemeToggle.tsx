'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, ThemeAnimationType } from 'uitheme-web/react';

export function ThemeToggle() {
  const { ref, toggleTheme } = useTheme({
    animationType: ThemeAnimationType.CIRCLE,
  });

  return (
    <div className="z-50 flex h-12 w-12 cursor-pointer items-center justify-center">
      <Button
        variant="outline"
        size="icon"
        ref={ref}
        onClick={(event) =>
          void toggleTheme({
            element: event.currentTarget,
            animationOff: event.detail === 0,
          })
        }
      >
        <Sun className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <Moon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
