import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

const clientSnapshot = () => true;

const serverSnapshot = () => false;

export const useHydrated = () =>
  useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
