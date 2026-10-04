import { createContext, useContext } from 'react';
import type { UseThemeReturn } from '../types';

export const SharedThemeContext = createContext<UseThemeReturn | null>(null);

export const useSharedThemeContext = () => useContext(SharedThemeContext);
