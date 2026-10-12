import type { ThemeStorage } from 'uitheme-rn';

// The browser preview does not need SQLite's WASM or cross-origin isolation.
const storage: ThemeStorage = {
  getItem: (key) => globalThis.localStorage.getItem(key),
  setItem: (key, value) => globalThis.localStorage.setItem(key, value),
};

export default storage;
