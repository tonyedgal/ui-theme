import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { createThemeController } from '../../core/controller';
import type { UseThemeProps, UseThemeReturn } from '../types';

const createReactController = (props: UseThemeProps) => {
  let trigger: RefObject<HTMLButtonElement | null> | undefined;

  const controller = createThemeController(props, {
    commit: (update) => flushSync(update),
    getElement: () => trigger?.current ?? null,
  });

  return {
    controller,
    connectTrigger: (ref: RefObject<HTMLButtonElement | null>) => {
      trigger = ref;
    },
  };
};

export const useTheme = (props: UseThemeProps = {}): UseThemeReturn => {
  const ref = useRef<HTMLButtonElement>(null);

  const [binding] = useState(() => createReactController(props));
  const { controller } = binding;

  const previousProps = useRef(props);

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot
  );

  useLayoutEffect(() => {
    const removed = Object.fromEntries(
      Object.keys(previousProps.current)
        .filter((key) => !(key in props))
        .map((key) => [key, undefined])
    );

    controller.updateOptions({ ...removed, ...props });
    previousProps.current = props;
  });

  useLayoutEffect(() => {
    binding.connectTrigger(ref);

    return controller.mount();
  }, [controller, binding]);

  return {
    ...snapshot,
    ref,
    setTheme: controller.setTheme,
    setColorTheme: controller.setColorTheme,
    switchTheme: controller.switchTheme,
    switchColorTheme: controller.switchColorTheme,
    toggleTheme: controller.toggleTheme,
    toggleLightTheme: controller.toggleLightTheme,
    toggleDarkTheme: controller.toggleDarkTheme,
    toggleColorTheme: controller.toggleColorTheme,
    createColorThemeToggle: controller.createColorThemeToggle,
    isColorThemeActive: controller.isColorThemeActive,
  };
};
