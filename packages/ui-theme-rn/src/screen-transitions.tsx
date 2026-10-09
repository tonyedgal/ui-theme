import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode, RefObject } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Fill,
  ImageShader,
  Shader,
  Skia,
  makeImageFromView,
} from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useReducedMotion, useUITheme } from 'uitheme-rn';
import type { Theme } from './core/types';

export const screenTransitionTypes = [
  'fade',
  'circularReveal',
  'wipe',
  'slide',
  'split',
  'heart',
  'star',
  'pixelize',
  'dissolve',
] as const;

export type ScreenTransitionType = (typeof screenTransitionTypes)[number];

export interface ScreenTransitionOptions {
  transition?: ScreenTransitionType;
  duration?: number;
  origin?: { x: number; y: number } | RefObject<View | null>;
  inverted?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  split?: 'left-right' | 'top-bottom';
  blockSize?: number;
  noiseSize?: number;
  animated?: boolean;
}

type Change = () => void;

interface TransitionContext {
  isTransitioning: boolean;
  run: (change: Change, options?: ScreenTransitionOptions) => Promise<boolean>;
}

const Context = createContext<TransitionContext | null>(null);

// Both snapshots use provider coordinates. Density affects capture resolution,
// never the origin or shader geometry. The live tree remains the semantic tree.
const effect =
  Platform.OS === 'web'
    ? null
    : Skia.RuntimeEffect.Make(`
uniform shader before;
uniform shader after;
uniform float progress;
uniform float2 size;
uniform float2 origin;
uniform float radius;
uniform float mode;
uniform float inverted;
uniform float direction;
uniform float split;
uniform float blockSize;
uniform float noiseSize;
half4 main(float2 xy) {
  float p = clamp(progress, 0.0, 1.0);
  if (p <= 0.0) return before.eval(xy);
  if (p >= 1.0) return after.eval(xy);
  float t = inverted > 0.5 ? 1.0 - p : p;
  float mask = p;
  float2 delta = xy - origin;
  if (mode == 1.0) mask = 1.0 - smoothstep(radius*t - 1.0, radius*t + 1.0, length(delta));
  if (mode == 2.0) {
    float axis = direction < 2.0 ? xy.x / size.x : xy.y / size.y;
    if (direction == 0.0 || direction == 2.0) axis = 1.0 - axis;
    mask = step(axis, p);
  }
  if (mode == 3.0) {
    float2 travel = direction == 0.0 ? float2(-size.x,0.0) :
      direction == 1.0 ? float2(size.x,0.0) :
      direction == 2.0 ? float2(0.0,-size.y) : float2(0.0,size.y);
    float2 oldPoint = xy - travel*p;
    float2 newPoint = xy + travel*(1.0-p);
    bool inside = oldPoint.x >= 0.0 && oldPoint.y >= 0.0 && oldPoint.x < size.x && oldPoint.y < size.y;
    return inside ? before.eval(oldPoint) : after.eval(newPoint);
  }
  if (mode == 4.0) {
    float axis = split < 0.5 ? xy.x/size.x : xy.y/size.y;
    float2 halfTravel = split < 0.5 ? float2(size.x*0.5,0.0) : float2(0.0,size.y*0.5);
    if (inverted < 0.5) {
      if (axis < 0.5-p*0.5) return before.eval(xy+halfTravel*p);
      if (axis > 0.5+p*0.5) return before.eval(xy-halfTravel*p);
      return after.eval(xy);
    }
    if (axis < p*0.5) return after.eval(xy+halfTravel*(1.0-p));
    if (axis > 1.0-p*0.5) return after.eval(xy-halfTravel*(1.0-p));
    return before.eval(xy);
  }
  if (mode == 5.0) {
    float2 q = delta / max(radius*4.0*t, 0.001);
    q.y = -q.y + 0.15;
    float a = q.x*q.x + q.y*q.y - 0.25;
    mask = a*a*a - q.x*q.x*q.y*q.y*q.y < 0.0 ? 1.0 : 0.0;
  }
  if (mode == 6.0) {
    float angle = atan(delta.y,delta.x);
    float reach = radius*4.3*t*(0.62+0.38*cos(5.0*angle));
    mask = 1.0-smoothstep(reach-1.0,reach+1.0,length(delta));
  }
  if (mode == 7.0) {
    float block = max(1.0, blockSize*sin(p*3.14159265));
    float2 samplePoint = (floor(xy/block)+0.5)*block;
    return mix(before.eval(samplePoint),after.eval(samplePoint),p);
  }
  if (mode == 8.0) {
    float2 cell = floor(xy/noiseSize);
    float noise = fract(sin(dot(cell,float2(12.9898,78.233)))*43758.5453);
    mask = step(noise,p);
  }
  if (inverted > 0.5 && (mode == 1.0 || mode == 4.0 || mode == 5.0 || mode == 6.0)) mask = 1.0-mask;
  return mix(before.eval(xy),after.eval(xy),mask);
}
`);

const frame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

async function capture(ref: RefObject<View | null>) {
  const texture = await makeImageFromView(ref);

  if (!texture) throw new Error('Screen capture returned no image.');

  try {
    const image = texture.makeNonTextureImage();

    if (!image) throw new Error('Screen capture conversion failed.');

    return image;
  } finally {
    texture.dispose();
  }
}

interface Images {
  before: SkImage;
  after: SkImage | null;
  options: ScreenTransitionOptions;
  origin: { x: number; y: number };
  width: number;
  height: number;
}

/** Place inside UIThemeProvider, around the native navigation tree. */
export function UIThemeTransitionProvider({
  children,
  defaults,
  enabled = true,
  onError,
}: {
  children: ReactNode;
  defaults?: ScreenTransitionOptions;
  /** Disable during native navigation or other movement of the captured tree. */
  enabled?: boolean;
  onError?: (error: Error) => void;
}) {
  const reducedMotion = useReducedMotion();
  const root = useRef<View>(null);
  const dimensions = useRef({ width: 0, height: 0 });
  const generation = useRef(0);
  const busy = useRef(false);
  const resources = useRef<Images | null>(null);
  const [images, setImages] = useState<Images | null>(null);
  const [isTransitioning, setTransitioning] = useState(false);
  const progress = useSharedValue(0);

  const finish = useCallback(() => {
    generation.current += 1;
    busy.current = false;
    cancelAnimation(progress);
    setTransitioning(false);
    setImages(null);
    const previous = resources.current;
    resources.current = null;

    if (previous)
      requestAnimationFrame(() => {
        previous.before.dispose();
        previous.after?.dispose();
      });
  }, [progress]);

  useEffect(() => {
    const cancelFrame =
      reducedMotion || !enabled ? requestAnimationFrame(finish) : null;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') finish();
    });

    return () => {
      subscription.remove();

      if (cancelFrame !== null) cancelAnimationFrame(cancelFrame);
    };
  }, [reducedMotion, enabled, finish]);

  useEffect(
    () => () => {
      generation.current += 1;
      busy.current = false;
      cancelAnimation(progress);
      const previous = resources.current;
      resources.current = null;
      previous?.before.dispose();
      previous?.after?.dispose();
    },
    [progress]
  );

  async function run(change: Change, supplied?: ScreenTransitionOptions) {
    if (busy.current) return false;

    const options = {
      transition: 'circularReveal' as const,
      duration: 350,
      ...defaults,
      ...supplied,
    };

    if (!screenTransitionTypes.includes(options.transition))
      throw new Error('Unknown screen transition.');

    if (!Number.isFinite(options.duration) || options.duration < 0)
      throw new Error('Duration must be finite and non-negative.');

    for (const value of [options.blockSize ?? 52, options.noiseSize ?? 5]) {
      if (!Number.isFinite(value) || value < 1)
        throw new Error('Effect size must be finite and at least one point.');
    }

    if (
      reducedMotion ||
      !enabled ||
      AppState.currentState !== 'active' ||
      options.animated === false ||
      options.duration === 0 ||
      !effect
    ) {
      change();

      return true;
    }

    const { width, height } = dimensions.current;

    if (width <= 0 || height <= 0) {
      change();

      return true;
    }

    busy.current = true;
    setTransitioning(true);
    const token = ++generation.current;
    let pending: SkImage | null = null;
    let committed = false;

    try {
      let origin = { x: width / 2, y: height / 2 };

      if (options.origin && 'current' in options.origin) {
        const view = options.origin.current;

        if (view && root.current) {
          origin = await new Promise((resolve) =>
            view.measureLayout(
              root.current!,
              (x, y, w, h) => resolve({ x: x + w / 2, y: y + h / 2 }),
              () => resolve(origin)
            )
          );
        }
      } else if (options.origin) {
        origin = options.origin;
      }

      if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y))
        throw new Error('Origin must use finite points.');
      await frame();

      if (token !== generation.current) return false;
      pending = await capture(root);

      if (token !== generation.current) return false;

      const state: Images = {
        before: pending,
        after: null,
        options,
        origin,
        width,
        height,
      };

      pending = null;
      resources.current = state;
      progress.set(0);
      setImages(state);
      await frame();
      await frame();

      if (token !== generation.current) return false;
      change();
      committed = true;
      await frame();
      await frame();

      if (token !== generation.current) return true;
      pending = await capture(root);

      if (token !== generation.current) return true;
      const ready = { ...state, after: pending };
      resources.current = ready;
      pending = null;
      setImages(ready);
      await frame();
      await frame();

      if (token !== generation.current) return true;
      progress.set(
        withTiming(
          1,
          {
            duration: options.duration,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          },
          (completed) => {
            if (completed) scheduleOnRN(finish);
          }
        )
      );

      return true;
    } catch (error) {
      if (token === generation.current) {
        if (!committed) change();
        finish();
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }

      return true;
    } finally {
      pending?.dispose();
    }
  }

  function onLayout(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout;
    const previous = dimensions.current;

    if (
      busy.current &&
      (previous.width !== next.width || previous.height !== next.height)
    )
      finish();
    dimensions.current = { width: next.width, height: next.height };
  }

  return (
    <Context.Provider value={{ run, isTransitioning }}>
      <View style={styles.fill} onLayout={onLayout}>
        <View ref={root} collapsable={false} style={styles.fill}>
          {children}
        </View>
        {effect && (
          <Canvas
            style={styles.overlay}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {images && <Snapshot images={images} progress={progress} />}
          </Canvas>
        )}
        {isTransitioning && (
          <View
            style={styles.overlay}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          />
        )}
      </View>
    </Context.Provider>
  );
}

function Snapshot({
  images,
  progress,
}: {
  images: Images;
  progress: ReturnType<typeof useSharedValue<number>>;
}) {
  const { width, height, origin, options } = images;

  const radius = Math.max(
    ...[
      [0, 0],
      [width, 0],
      [0, height],
      [width, height],
    ].map(([x, y]) => Math.hypot(x - origin.x, y - origin.y))
  );

  const mode = screenTransitionTypes.indexOf(
    options.transition ?? 'circularReveal'
  );

  const inverted = options.inverted ? 1 : 0;

  const direction = ['left', 'right', 'up', 'down'].indexOf(
    options.direction ?? 'right'
  );

  const split = options.split === 'top-bottom' ? 1 : 0;
  const blockSize = options.blockSize ?? 52;
  const noiseSize = options.noiseSize ?? 5;
  const originX = origin.x;
  const originY = origin.y;

  const uniforms = useDerivedValue(() => ({
    progress: progress.get(),
    size: [width, height],
    origin: [originX, originY],
    radius,
    mode,
    inverted,
    direction,
    split,
    blockSize,
    noiseSize,
  }));

  if (!effect) return null;

  return (
    <Fill>
      <Shader source={effect} uniforms={uniforms}>
        <ImageShader
          image={images.before}
          fit="fill"
          rect={{ x: 0, y: 0, width, height }}
        />
        <ImageShader
          image={images.after ?? images.before}
          fit="fill"
          rect={{ x: 0, y: 0, width, height }}
        />
      </Shader>
    </Fill>
  );
}

/** Use these commands for animated changes; root commands remain immediate. */
export function useAnimatedUITheme() {
  const context = useContext(Context);
  const theme = useUITheme();

  if (!context)
    throw new Error('useAnimatedUITheme requires UIThemeTransitionProvider.');

  return {
    ...theme,
    isTransitioning: context.isTransitioning,
    setTheme: (value: Theme, options?: ScreenTransitionOptions) =>
      value === theme.theme
        ? Promise.resolve(false)
        : context.run(() => theme.setTheme(value), options),
    setColorTheme: (value: string, options?: ScreenTransitionOptions) => {
      if (!theme.colorThemes.includes(value))
        throw new Error(`Unknown color theme: ${value}`);

      return value === theme.colorTheme
        ? Promise.resolve(false)
        : context.run(() => theme.setColorTheme(value), options);
    },
    toggleTheme: (options?: ScreenTransitionOptions) =>
      context.run(() => theme.toggleTheme(), options),
    toggleColorTheme: (options?: ScreenTransitionOptions) =>
      context.run(() => theme.toggleColorTheme(), options),
  };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
