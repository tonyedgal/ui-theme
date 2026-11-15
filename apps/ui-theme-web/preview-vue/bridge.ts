import type { PreviewMessage, PreviewState } from '../lib/vue-preview-protocol';

const transitionAttribute = 'data-ui-theme-transition';

// state set from inside the iframe reaches the parent after the transition
export function createBridge(
  initial: PreviewState,
  post: (message: PreviewMessage) => void
) {
  let state = { ...initial };
  let remote = false;
  let pending = false;

  function announce() {
    if (remote || pending) return;
    pending = true;
    const root = document.documentElement;

    const send = () => {
      pending = false;
      post({ type: 'uitheme-preview:state', ...state });
    };

    if (!root.hasAttribute(transitionAttribute)) {
      send();

      return;
    }

    const observer = new MutationObserver(() => {
      if (!root.hasAttribute(transitionAttribute)) done();
    });

    const timer = window.setTimeout(done, 3000);

    function done() {
      observer.disconnect();
      window.clearTimeout(timer);
      send();
    }

    observer.observe(root, {
      attributes: true,
      attributeFilter: [transitionAttribute],
    });
  }

  return {
    themeChanged(theme: PreviewState['theme']) {
      state = { ...state, theme };
      announce();
    },
    colorThemeChanged(colorTheme: string) {
      state = { ...state, colorTheme };
      announce();
    },
    // the parent state applies without animation and is never echoed back
    apply(
      next: PreviewState,
      ui: {
        setTheme: (theme: PreviewState['theme']) => void;
        setColorTheme: (theme: string) => void;
      }
    ) {
      if (pending) return;
      remote = true;

      try {
        if (next.theme !== state.theme) ui.setTheme(next.theme);

        if (next.colorTheme !== state.colorTheme)
          ui.setColorTheme(next.colorTheme);
      } finally {
        remote = false;
      }
    },
  };
}

export type PreviewBridge = ReturnType<typeof createBridge>;
