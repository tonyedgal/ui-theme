import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ThemeAnimationType,
  useTheme,
  UIThemeProvider,
  useUITheme,
  NextUIThemeProvider,
  useNextUITheme,
  ViteUIThemeProvider,
  useViteUITheme,
  TanStackUIThemeProvider,
  useTanStackUITheme,
  UIThemeSelector,
  UIThemeSwitcher,
  TRANSITION_DIRECTIONS,
  preloadThemeLogo,
  type UseThemeProps,
  type ThemeLogoOptions,
  type TanStackUIThemeProviderProps,
  type AnimationPosition,
} from 'uitheme-web/react';
import './fixture.css';

const dimension = (value: string | null): number | 'auto' | undefined =>
  value === 'auto' ? 'auto' : value ? Number(value) : undefined;

const params = new URLSearchParams(location.search);

const animationType =
  Object.values(ThemeAnimationType).find(
    (value) => value === params.get('animation')
  ) ?? ThemeAnimationType.CIRCLE;

const duration = Number(params.get('duration') ?? 750);

const freezeProgress = Math.min(
  1,
  Math.max(0, Number(params.get('progress') ?? 0.05))
);

document.documentElement.dataset.origin =
  params.get('corner') ?? 'bottom-right';

const colorThemes = ['default', 'ocean', 'rose'];

const positions: AnimationPosition[] = [
  'trigger',
  'center',
  ...TRANSITION_DIRECTIONS,
];

const logoOptions: ThemeLogoOptions =
  params.has('logoLight') || params.has('logoDark')
    ? {
        logoLight: params.get('logoLight') ?? '',
        logoDark: params.get('logoDark') ?? '',
      }
    : { logo: params.get('logo') ?? undefined };

const config = {
  animationType,
  duration,
  easing: params.get('easing') ?? undefined,
  colorThemes,
  defaultTheme: 'light',
  clipPathDirection:
    TRANSITION_DIRECTIONS.find((value) => value === params.get('direction')) ??
    'top-left',
  animationPosition: positions.find(
    (value) => value === params.get('position')
  ),
  ...logoOptions,
  logoWidth: dimension(params.get('logoWidth')),
  logoHeight: dimension(params.get('logoHeight')),
} satisfies UseThemeProps;

const provider = params.get('provider') ?? 'hook';

interface TailProbe {
  outcome: string;
  elapsedMs: number;
  lastSampleMs?: number;
  firstHalf: { count: number; maxMs?: number; p95Ms?: number };
  finalQuarter: { count: number; maxMs?: number; p95Ms?: number };
  checkpoints: { time: number; clip: string }[];
  viewportEvents: string[];
  samples: { at: number; time: number; progress: number | null }[];
}

// Only the test page exposes inspection hooks; the package ships none of these.
interface Inspection {
  animations: {
    frames: PropertyIndexedKeyframes | Keyframe[] | null;
    options: KeyframeAnimationOptions | number | undefined;
  }[];
  transitions: ViewTransition[];
  callbacks: string[];
  paused: boolean;
  probes: TailProbe[];
}

const inspection: Inspection = {
  animations: [],
  transitions: [],
  callbacks: [],
  paused: false,
  probes: [],
};

// Optional diagnostics record frame timestamps and a few tail checkpoints. They
// don't drive animation or update React/DOM on each frame.
function inspectTail(animation: Animation) {
  if (!params.has('probe')) return;
  const started = performance.now();
  const effect = animation.effect;

  if (!(effect instanceof KeyframeEffect)) return;
  const samples: { at: number; time: number; progress: number | null }[] = [];
  const checkpoints: { time: number; clip: string }[] = [];
  const viewportEvents: string[] = [];
  const pseudo = '::view-transition-new(root)';
  const snapshot = getComputedStyle(document.documentElement, pseudo);

  const geometry = {
    viewport: [innerWidth, innerHeight],
    client: [
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ],
    snapshot: [snapshot.width, snapshot.height],
    dpr: devicePixelRatio,
    screen: [screen.width, screen.height],
    visualViewport: [
      visualViewport?.width,
      visualViewport?.height,
      visualViewport?.scale,
    ],
    easing: effect.getTiming().easing,
    frames: effect.getKeyframes(),
  };

  let request = 0;
  let checkpoint = 0;
  const thresholds = [0.9, 0.95, 0.975, 0.99, 0.999];

  const sample = (at: number) => {
    const time = Number.isFinite(Number(animation.currentTime))
      ? animation.currentTime
      : 0;

    samples.push({ at, time, progress: effect.getComputedTiming().progress });

    if (time / duration >= thresholds[checkpoint]) {
      checkpoints.push({
        time,
        clip: getComputedStyle(document.documentElement, pseudo).clipPath,
      });
      checkpoint++;
    }

    request = requestAnimationFrame(sample);
  };

  const resized = () =>
    viewportEvents.push(
      `resize at ${Math.round(performance.now() - started)} ms: ${innerWidth}×${innerHeight}`
    );

  const visibility = () =>
    viewportEvents.push(`visibility: ${document.visibilityState}`);

  window.addEventListener('resize', resized);
  document.addEventListener('visibilitychange', visibility);
  request = requestAnimationFrame(sample);

  const finish = (outcome: string) => {
    cancelAnimationFrame(request);
    window.removeEventListener('resize', resized);
    document.removeEventListener('visibilitychange', visibility);

    const gaps = samples
      .slice(1)
      .map((frame, i) => ({ gap: frame.at - samples[i].at, time: frame.time }));

    const summary = (items: typeof gaps) => {
      const values = items.map((item) => item.gap).sort((a, b) => a - b);

      return {
        count: values.length,
        maxMs: values.at(-1),
        p95Ms: values[Math.floor(values.length * 0.95)],
      };
    };

    const result = {
      ...geometry,
      outcome,
      elapsedMs: performance.now() - started,
      lastSampleMs: samples.at(-1)?.time,
      firstHalf: summary(gaps.filter((frame) => frame.time < duration / 2)),
      finalQuarter: summary(
        gaps.filter((frame) => frame.time >= duration * 0.75)
      ),
      checkpoints,
      viewportEvents,
    };

    inspection.probes.push({ ...result, samples });

    const output = document.getElementById('probe-output');

    if (output instanceof HTMLTextAreaElement)
      output.value = JSON.stringify(result, null, 2);
  };

  void animation.finished.then(
    () => finish('finished'),
    () => finish('canceled')
  );
}

// Native root snapshots suppress pointer hit-testing during playback. Keep the
// inspection page resumable when its developer-only freeze control is enabled.
window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR' && !event.repeat) {
    document.getAnimations().forEach((animation) => animation.play());
  }
});

const originalAnimate = Element.prototype.animate;

Element.prototype.animate = function (frames, options) {
  const animation = originalAnimate.call(this, frames, options);
  inspection.animations.push({ frames, options });
  inspectTail(animation);

  if (inspection.paused) {
    animation.pause();
    animation.currentTime = duration * freezeProgress;

    for (const layer of document.getAnimations()) {
      if (
        layer instanceof CSSAnimation &&
        layer.animationName.startsWith('ui-theme-logo-')
      ) {
        layer.pause();
        layer.currentTime = duration * freezeProgress;
      }
    }
  }

  return animation;
};

if (document.startViewTransition) {
  const start = document.startViewTransition.bind(document);
  document.startViewTransition = (
    update: ViewTransitionUpdateCallback | StartViewTransitionOptions = () => {}
  ) => {
    const transition = start(update);
    inspection.transitions.push(transition);

    return transition;
  };
}

function Controls({
  state: { ref: buttonRef, ...state },
  children,
  logo,
  logoLight,
  logoDark,
}: {
  state: ReturnType<typeof useTheme>;
  children?: React.ReactNode;
  logo?: string;
  logoLight?: string;
  logoDark?: string;
}) {
  const [frozen, setFrozen] = React.useState(false);
  React.useEffect(() => {
    Object.assign(window, {
      themeFixture: {
        state: { ...state, ref: buttonRef },
        inspection,
        preloadLogo: async () => {
          await Promise.all(
            [
              logo ?? config.logo,
              logoLight ?? config.logoLight,
              logoDark ?? config.logoDark,
            ].map((asset) =>
              asset ? preloadThemeLogo(asset) : Promise.resolve()
            )
          );
        },
      },
    });
  }, [state, buttonRef, logo, logoLight, logoDark]);

  return (
    <>
      <aside>
        <h1>Theme transitions</h1>
        <p>Origin marker and slowed playback for browser inspection.</p>
        {children}
        {params.has('probe') && (
          <>
            <p>
              {duration / 1000}s · {config.easing ?? 'default easing'} ·{' '}
              {params.get('corner')}
            </p>
            <a
              href={`/?duration=${duration}&corner=${params.get('corner') ?? 'top-right'}&probe&easing=linear`}
            >
              Compare linear timing
            </a>
            <textarea
              id="probe-output"
              readOnly
              defaultValue="Toggle once to record ending diagnostics."
              aria-label="Ending diagnostics"
            />
          </>
        )}
        <output id="diagnostics">
          DPR {devicePixelRatio} · {innerWidth} × {innerHeight} CSS px ·{' '}
          {state.theme} · {state.colorTheme}
        </output>
        <button
          id="freeze"
          onClick={() => {
            inspection.paused = !frozen;
            setFrozen(!frozen);
          }}
        >
          Freeze {frozen ? 'on' : 'off'}
        </button>
        <button
          id="resume"
          onClick={() =>
            document.getAnimations().forEach((animation) => animation.play())
          }
        >
          Resume (R)
        </button>
      </aside>
      <main>
        <div id="transformed">
          <button
            id="ref-toggle"
            ref={buttonRef}
            onClick={() => void state.toggleTheme()}
          >
            Ref toggle
          </button>
        </div>
        <button
          id="element-toggle"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const marker = document.getElementById('marker')!;
            marker.style.left = `${rect.left + rect.width / 2}px`;
            marker.style.top = `${rect.top + rect.height / 2}px`;
            marker.hidden = false;
            void state.toggleTheme({ element: event.currentTarget });
          }}
        >
          Element toggle
        </button>
        <button
          id="palette"
          onClick={(event) =>
            void state.switchColorTheme(
              state.colorTheme === 'ocean' ? 'rose' : 'ocean',
              { element: event.currentTarget }
            )
          }
        >
          Change palette
        </button>
        <button
          id="cycle"
          onClick={(event) => void state.toggleColorTheme(event)}
        >
          Cycle palette
        </button>
        <button
          id="target-palette"
          onClick={(event) => void state.createColorThemeToggle('rose')(event)}
        >
          Rose palette
        </button>
        <div className="preview">
          <h2>A themed surface</h2>
          <p>Text and cards should stay still as the circle expands.</p>
        </div>
        {params.has('widgets') && (
          <>
            <UIThemeSwitcher
              currentTheme={state.theme}
              onThemeChange={state.setTheme}
            />
            <UIThemeSelector
              colorThemes={colorThemes}
              currentColorTheme={state.colorTheme}
              onColorThemeChange={(value) => {
                inspection.callbacks.push(`selector:${value}`);
                state.setColorTheme(value);
              }}
            />
          </>
        )}
        <div className="tiles">
          {Array.from({ length: 80 }, (_, i) => (
            <article key={i}>Card {i + 1}</article>
          ))}
        </div>
      </main>
      <div id="marker" hidden />
    </>
  );
}

function HookControls() {
  const [options, setOptions] = React.useState(config);
  const state = useTheme(options);
  const asset = React.useRef<string | null>(null);

  const pairAssets = React.useRef({
    light: config.logoLight,
    dark: config.logoDark,
  });

  const [pairReady, setPairReady] = React.useState(
    Boolean(config.logoLight && config.logoDark)
  );

  const uploadedPair = React.useRef<string[]>([]);
  React.useEffect(
    () => () => {
      if (asset.current) URL.revokeObjectURL(asset.current);
      uploadedPair.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  return (
    <Controls
      state={state}
      logo={options.logo}
      logoLight={options.logoLight}
      logoDark={options.logoDark}
    >
      {params.has('gallery') && (
        <div className="effect-options">
          <label>
            Effect
            <select
              aria-label="Effect"
              value={options.animationType}
              onChange={(event) =>
                setOptions({
                  ...options,
                  animationType:
                    Object.values(ThemeAnimationType).find(
                      (value) => value === event.target.value
                    ) ?? ThemeAnimationType.CIRCLE,
                })
              }
            >
              {Object.values(ThemeAnimationType).map((effect) => (
                <option key={effect} value={effect}>
                  {effect}
                </option>
              ))}
            </select>
          </label>
          <label>
            Direction
            <select
              value={options.clipPathDirection}
              onChange={(event) =>
                setOptions({
                  ...options,
                  clipPathDirection:
                    TRANSITION_DIRECTIONS.find(
                      (value) => value === event.target.value
                    ) ?? 'top-left',
                })
              }
            >
              {TRANSITION_DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </select>
          </label>
          <label>
            Origin
            <select
              value={options.animationPosition ?? 'trigger'}
              onChange={(event) =>
                setOptions({
                  ...options,
                  animationPosition: positions.find(
                    (value) => value === event.target.value
                  ),
                })
              }
            >
              {['trigger', 'center', ...TRANSITION_DIRECTIONS].map(
                (position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                )
              )}
            </select>
          </label>
          <div className="logo-dimensions">
            <label>
              Logo width
              <input
                type="text"
                inputMode="numeric"
                placeholder="Auto"
                value={options.logoWidth ?? ''}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    logoWidth: dimension(event.target.value),
                  })
                }
              />
            </label>
            <label>
              Logo height
              <input
                type="text"
                inputMode="numeric"
                placeholder="Auto"
                value={options.logoHeight ?? ''}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    logoHeight: dimension(event.target.value),
                  })
                }
              />
            </label>
          </div>
          <label>
            SVG logo
            <input
              type="file"
              accept="image/svg+xml,.svg"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) return;

                if (asset.current) URL.revokeObjectURL(asset.current);
                asset.current = URL.createObjectURL(file);
                pairAssets.current = { light: undefined, dark: undefined };
                setPairReady(false);
                setOptions({
                  ...options,
                  logo: asset.current,
                  logoLight: undefined,
                  logoDark: undefined,
                  animationType: ThemeAnimationType.SVG_LOGO,
                });
              }}
            />
          </label>
          {(['light', 'dark'] as const).map((mode) => (
            <label key={mode}>
              {mode === 'light' ? 'Light logo' : 'Dark logo'}
              <input
                type="file"
                accept="image/svg+xml,.svg"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  uploadedPair.current.push(url);
                  pairAssets.current[mode] = url;
                  const { light, dark } = pairAssets.current;

                  if (light && dark) {
                    setOptions({
                      ...options,
                      logo: undefined,
                      logoLight: light,
                      logoDark: dark,
                      animationType: ThemeAnimationType.SVG_LOGO,
                    });
                    setPairReady(true);
                  } else {
                    setPairReady(false);
                  }
                }}
              />
            </label>
          ))}
          <p>
            {pairReady
              ? 'Paired logos active: light for the light theme, dark for the dark theme.'
              : 'Upload both light and dark logos to activate the pair. Until then, the shared logo stays active.'}
          </p>
          <p>
            Upload a logo, then click Element toggle or Change palette. R
            resumes frozen playback.
          </p>
        </div>
      )}
    </Controls>
  );
}

function UIControls() {
  return <Controls state={useUITheme()} />;
}

function NextControls() {
  return <Controls state={useNextUITheme()} />;
}

function ViteControls() {
  return <Controls state={useViteUITheme()} />;
}

function TanStackControls() {
  return <Controls state={useTanStackUITheme()} />;
}

const callbacks = {
  onServerThemeChange: (theme: string) => {
    inspection.callbacks.push(theme);

    if (params.has('reject-server'))
      return Promise.reject(new Error('Cookie notification failed'));
  },
  onServerColorThemeChange: (theme: string) => {
    inspection.callbacks.push(theme);
  },
};

const serverPreferences: Pick<
  TanStackUIThemeProviderProps,
  'serverTheme' | 'serverColorTheme'
> = params.has('serverTheme')
  ? { serverTheme: 'dark', serverColorTheme: 'ocean' }
  : {};

const app =
  provider === 'ui' ? (
    <UIThemeProvider {...config}>
      <UIControls />
    </UIThemeProvider>
  ) : provider === 'next' ? (
    <NextUIThemeProvider {...config}>
      <NextControls />
    </NextUIThemeProvider>
  ) : provider === 'vite' ? (
    <ViteUIThemeProvider {...config}>
      <ViteControls />
    </ViteUIThemeProvider>
  ) : provider === 'tanstack' ? (
    <TanStackUIThemeProvider
      {...config}
      {...callbacks}
      {...serverPreferences}
      onServerError={(error) =>
        inspection.callbacks.push(`error:${error.message}`)
      }
    >
      <TanStackControls />
    </TanStackUIThemeProvider>
  ) : (
    <HookControls />
  );

createRoot(document.getElementById('root')!).render(app);
