import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    themeFixture: {
      preloadLogo: () => Promise<void>;
      state: import('../../src/react').UseThemeReturn & {
        switchThemeFromElement?: (
          theme: 'light' | 'dark',
          element: Element
        ) => Promise<void>;
      };
      inspection: {
        animations: {
          frames: PropertyIndexedKeyframes;
          options: KeyframeAnimationOptions;
        }[];
        transitions: ViewTransition[];
        callbacks: string[];
        paused: boolean;
      };
    };
  }
}

async function open(page: Page, query = '') {
  await page.goto(`/?${query}`);
  await page.waitForFunction(
    () =>
      window.themeFixture &&
      document.documentElement.classList.contains('theme-default')
  );
}

// Snapshot color conversion can round one channel by one level in WebKit.
// Compare decoded pixels rather than PNG encoding, while catching real old-view leaks.
async function pixelDifference(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(
    async ([first, second]) => {
      async function decode(data: string) {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);

        return context.getImageData(0, 0, image.width, image.height).data;
      }

      const one = await decode(first);
      const two = await decode(second);

      return Math.max(
        ...one.map((channel, index) => Math.abs(channel - two[index]))
      );
    },
    [a.toString('base64'), b.toString('base64')]
  );
}

async function settle(page: Page) {
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-ui-theme-transition')
  );
}

async function center(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
}

async function expectOrigin(page: Page, origin: { x: number; y: number }) {
  await expect
    .poll(() =>
      page.evaluate(() => window.themeFixture.inspection.animations.length)
    )
    .toBeGreaterThan(0);

  const frames = await page.evaluate(
    () => window.themeFixture.inspection.animations.at(-1)!.frames
  );

  const clip = Array.isArray(frames.clipPath)
    ? String(frames.clipPath[0])
    : String(frames.clipPath);

  const coords = clip.match(/^circle\(0% at ([\d.e+-]+)% ([\d.e+-]+)%\)$/)!;

  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  expect((Number(coords[1]) / 100) * viewport.width).toBeCloseTo(origin.x, 3);
  expect((Number(coords[2]) / 100) * viewport.height).toBeCloseTo(origin.y, 3);
}

async function lastFrames(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => window.themeFixture.inspection.animations.length)
    )
    .toBeGreaterThan(0);

  return page.evaluate(
    () => window.themeFixture.inspection.animations.at(-1)!.frames
  );
}

/** Numbers in the first keyframe of one property. */
const firstNumbers = (frames: PropertyIndexedKeyframes, property: string) => {
  const value = frames[property];

  return [
    ...String(Array.isArray(value) ? value[0] : value).matchAll(
      /-?[\d.]+(?:e[+-]?\d+)?/g
    ),
  ].map(Number);
};

/** Bounding box, in viewport CSS px, of pixels painted in the dark background. */
async function darkBounds(page: Page) {
  const png = (await page.screenshot()).toString('base64');

  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const scale = image.width / window.innerWidth;
    let [left, top, right, bottom] = [Infinity, Infinity, -1, -1];

    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const i = (y * image.width + x) * 4;

        // #122433, the fixture's dark background, not its #162a35 text.
        if (
          Math.abs(pixels[i] - 0x12) < 3 &&
          Math.abs(pixels[i + 1] - 0x24) < 3 &&
          Math.abs(pixels[i + 2] - 0x33) < 3
        ) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    return {
      left: left / scale,
      top: top / scale,
      right: (right + 1) / scale,
      bottom: (bottom + 1) / scale,
    };
  }, png);
}

test('declared ref stays in viewport CSS pixels under transformed parents and scrolling', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => window.scrollTo(0, 40));
  const origin = await center(page, '#ref-toggle');
  await page.locator('#ref-toggle').click();
  await expectOrigin(page, origin);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await settle(page);
});

const directions = [
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
];

test('circle origins support the eight fixed positions plus center without a button ref', async ({
  page,
}) => {
  for (const position of [...directions, 'center']) {
    await open(page, `position=${position}&duration=100`);
    const size = page.viewportSize()!;
    await page.evaluate(async () => {
      window.themeFixture.state.ref.current = null;
      await window.themeFixture.state.toggleTheme();
    });
    await expectOrigin(page, {
      x: position.includes('left')
        ? 0
        : position.includes('right')
          ? size.width
          : size.width / 2,
      y: position.includes('top')
        ? 0
        : position.includes('bottom')
          ? size.height
          : size.height / 2,
    });
    await settle(page);
  }
});

for (const provider of ['ui', 'next', 'vite', 'tanstack']) {
  test(`${provider} provider forwards SVG asset and dimensions for centered palette reveals`, async ({
    page,
  }) => {
    await open(
      page,
      `provider=${provider}&animation=svg-logo&position=center&logo=/logo.svg&logoWidth=140&logoHeight=90&duration=6000`
    );
    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.locator('#freeze').click();
    await page.evaluate(() =>
      window.themeFixture.state.switchColorTheme('ocean')
    );
    await expect(page.locator('html')).toHaveClass(/theme-ocean/);

    const frames = await page.evaluate(
      () => window.themeFixture.inspection.animations[0].frames
    );

    expect(JSON.stringify(frames)).toContain('circle(');
    const logo = await page.locator('[data-ui-theme-logo]').boundingBox();
    expect(logo!.width).toBeCloseTo(140, 2);
    expect(logo!.height).toBeCloseTo(90, 2);
    await page.evaluate(() =>
      window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
    );
    await settle(page);
  });
}

test('gallery accepts an actual SVG file and displays the uploaded logo', async ({
  page,
}) => {
  await open(page, 'gallery&duration=6000');
  await page
    .getByLabel('SVG logo')
    .setInputFiles('tests/browser/public/logo.svg');
  await expect(page.getByLabel('Effect', { exact: true })).toHaveValue(
    'svg-logo'
  );
  await page.evaluate(() => window.themeFixture.preloadLogo());
  await page.locator('#freeze').click();
  await page.locator('#element-toggle').click();
  await expect
    .poll(() =>
      page.evaluate(() => window.themeFixture.inspection.animations.length)
    )
    .toBe(1);
  await expect(page.locator('[data-ui-theme-logo]')).toHaveAttribute(
    'src',
    /data:image\/svg\+xml/
  );
  await page.evaluate(() =>
    window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
  );
  await settle(page);
});

for (const effect of ['clip-path', 'polygon-gradient']) {
  test(`${effect} paints from each of the eight selected directions`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'firefox',
      'Firefox drawSnapshot omits active view transitions: Mozilla bug 2008417'
    );
    await page.setViewportSize({ width: 1280, height: 800 });

    for (const direction of directions) {
      await open(
        page,
        `animation=${effect}&direction=${direction}&duration=6000&easing=linear&progress=0.25`
      );
      await page.evaluate(() => window.themeFixture.state.setTheme('light'));
      await expect(page.locator('html')).not.toHaveClass(/dark/);

      const x = direction.includes('left')
        ? 5
        : direction.includes('right')
          ? 1270
          : 640;

      const y = direction.includes('top')
        ? 5
        : direction.includes('bottom')
          ? 790
          : 400;

      const start = { x, y, width: 3, height: 3 };
      const opposite = { x: 1275 - x, y: 795 - y, width: 3, height: 3 };
      // Keep the probe pixels on an undecorated background, preserving layout.
      await page.addStyleTag({
        content: 'aside, main > :not(#element-toggle) { visibility: hidden; }',
      });
      const beforeStart = await page.screenshot({ clip: start });
      const beforeOpposite = await page.screenshot({ clip: opposite });
      await page
        .locator('#freeze')
        .evaluate((button: HTMLButtonElement) => button.click());
      await page.locator('#element-toggle').click();
      await page.waitForFunction(() =>
        document.getAnimations().some((a) => a.playState === 'paused')
      );
      expect(
        await pixelDifference(
          page,
          await page.screenshot({ clip: start }),
          beforeStart
        ),
        direction
      ).toBeGreaterThan(50);
      expect(
        await pixelDifference(
          page,
          await page.screenshot({ clip: opposite }),
          beforeOpposite
        ),
        direction
      ).toBeLessThanOrEqual(1);
      await page.evaluate(() =>
        window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
      );
      await settle(page);
    }
  });
}

for (const effect of [
  'clip-path',
  'polygon-gradient',
  'triangle',
  'svg-logo',
]) {
  test(`${effect} covers all four corners before cleanup, including hollow SVG logos`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'firefox',
      'Firefox drawSnapshot omits active view transitions: Mozilla bug 2008417'
    );
    await open(
      page,
      `animation=${effect}&position=center&logo=/logo.svg&duration=6000&progress=1`
    );
    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.locator('#freeze').click();
    await page.locator('#element-toggle').click();
    await page.waitForFunction(() =>
      document.getAnimations().some((a) => a.playState === 'paused')
    );
    const size = page.viewportSize()!;

    const corners = [
      { x: 0, y: 0, width: 3, height: 3 },
      { x: size.width - 3, y: 0, width: 3, height: 3 },
      { x: 0, y: size.height - 3, width: 3, height: 3 },
      { x: size.width - 3, y: size.height - 3, width: 3, height: 3 },
    ];

    const before = [];

    for (const clip of corners) before.push(await page.screenshot({ clip }));
    await page.evaluate(() =>
      window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
    );
    await settle(page);

    for (const [i, clip] of corners.entries())
      expect(
        await pixelDifference(page, await page.screenshot({ clip }), before[i])
      ).toBeLessThanOrEqual(1);
  });
}

test('SVG logo stays centered at the declared dimensions while a reveal grows underneath', async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  for (const [query, width, height] of [
    ['', 96, 64],
    ['&logoWidth=180', 180, 120],
    ['&logoWidth=180&logoHeight=auto', 180, 120],
    ['&logoWidth=auto&logoHeight=80', 120, 80],
    ['&logoWidth=auto&logoHeight=auto', 120, 80],
    ['&logoHeight=auto', 120, 80],
    ['&logoHeight=80', 120, 80],
    ['&logoWidth=180&logoHeight=80', 180, 80],
  ] as const) {
    await open(
      page,
      `animation=svg-logo&position=top-right&logo=/logo.svg&duration=6000&easing=linear&progress=0.25${query}`
    );
    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.locator('#freeze').click();
    await page.locator('#element-toggle').click();
    await page.waitForFunction(() =>
      document.getAnimations().some((a) => a.playState === 'paused')
    );
    const image = page.locator('[data-ui-theme-logo]');
    const before = await image.boundingBox();
    expect(before!.width).toBeCloseTo(width, 2);
    expect(before!.height).toBeCloseTo(height, 2);
    expect(before!.x + width / 2).toBeCloseTo(640, 2);
    expect(before!.y + height / 2).toBeCloseTo(400, 2);
    await expectOrigin(page, { x: 640, y: 400 });

    const snapshot = await page.evaluate(() => {
      const name = document.querySelector<HTMLElement>('[data-ui-theme-logo]')!
        .style.viewTransitionName;

      const style = getComputedStyle(
        document.documentElement,
        `::view-transition-group(${name})`
      );

      return {
        width: parseFloat(style.width),
        height: parseFloat(style.height),
        transform: style.transform,
      };
    });

    expect(snapshot.width).toBeCloseTo(width, 2);
    expect(snapshot.height).toBeCloseTo(height, 2);

    if (browserName === 'chromium' && width === 96)
      await page.screenshot({ path: 'test-results/stationary-logo-dpr.png' });
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = 3600;
      }
    });
    expect(await image.boundingBox()).toEqual(before);

    const afterTransform = await page.evaluate(() => {
      const name = document.querySelector<HTMLElement>('[data-ui-theme-logo]')!
        .style.viewTransitionName;

      return getComputedStyle(
        document.documentElement,
        `::view-transition-group(${name})`
      ).transform;
    });

    expect(afterTransform).toBe(snapshot.transform);
    await page.evaluate(() =>
      window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
    );
    await settle(page);
    await expect(image).toHaveCount(0);
    await expect(page.locator('[data-ui-theme-logo-style]')).toHaveCount(0);
  }
});

test('new effects expose animated pseudo styles and clean up interruption and reduced motion', async ({
  page,
}) => {
  for (const effect of [
    'clip-path',
    'polygon-gradient',
    'triangle',
    'svg-logo',
  ]) {
    await open(
      page,
      `animation=${effect}&logo=/logo.svg&position=center&duration=6000&easing=linear&progress=0.25`
    );
    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.evaluate(() => window.themeFixture.state.setTheme('light'));
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.locator('#freeze').click();
    await page.locator('#element-toggle').click();
    await page.waitForFunction(() =>
      document.getAnimations().some((a) => a.playState === 'paused')
    );

    const style = await page.evaluate(() => {
      const pseudo = getComputedStyle(
        document.documentElement,
        '::view-transition-new(root)'
      );

      return {
        clip: pseudo.clipPath,
        mask: pseudo.maskImage,
        size: pseudo.maskSize,
      };
    });

    if (
      effect === 'clip-path' ||
      effect === 'triangle' ||
      effect === 'svg-logo'
    )
      expect(style.clip).toContain(
        effect === 'svg-logo' ? 'circle(' : 'polygon('
      );
    else {
      expect(style.mask).toContain('data:image/svg+xml');
      expect(style.size).not.toBe('0px 0px');
    }

    await page.evaluate(() =>
      window.themeFixture.state.switchTheme('light', true)
    );
    await settle(page);
    await expect(page.locator('[data-ui-theme-logo]')).toHaveCount(0);
    await expect(page.locator('[data-ui-theme-logo-style]')).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            [...document.querySelectorAll('style')].filter((style) =>
              style.textContent?.includes('@keyframes ui-theme-reveal-')
            ).length
        )
      )
      .toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.themeFixture.state.toggleTheme());
    await settle(page);
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(
      await page.evaluate(
        () => window.themeFixture.inspection.animations.length
      )
    ).toBe(1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});

test('stationary SVG layers clean up failed capture and rapid replacement', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, 'animation=svg-logo&logo=/logo.svg&duration=100');
  await page.evaluate(() => window.themeFixture.preloadLogo());
  await page.evaluate(async () => {
    document.body.style.viewTransitionName = 'duplicate';
    document.querySelector('main')!.style.viewTransitionName = 'duplicate';
    await window.themeFixture.state.toggleTheme();
    document.body.style.viewTransitionName = '';
    document.querySelector('main')!.style.viewTransitionName = '';
  });
  await settle(page);
  await expect(page.locator('[data-ui-theme-logo]')).toHaveCount(0);
  await expect(page.locator('[data-ui-theme-logo-style]')).toHaveCount(0);
  await page.evaluate(async () => {
    await Promise.all([
      window.themeFixture.state.toggleTheme(),
      window.themeFixture.state.switchColorTheme('ocean'),
    ]);
  });
  await settle(page);
  await expect(page.locator('html')).toHaveClass(/theme-ocean/);
  await expect(page.locator('[data-ui-theme-logo]')).toHaveCount(0);
  await expect(page.locator('[data-ui-theme-logo-style]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('missing or non-SVG logos fall back immediately without blocking theme updates', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const logo of [
    '/missing.svg',
    'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==',
  ]) {
    await open(
      page,
      `animation=svg-logo&duration=100&logo=${encodeURIComponent(logo)}`
    );
    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.locator('#element-toggle').click();
    await expect
      .poll(() =>
        page.evaluate(() => window.themeFixture.inspection.animations.length)
      )
      .toBe(1);
    expect(
      await page.evaluate(
        () => window.themeFixture.inspection.animations[0].frames
      )
    ).toHaveProperty('clipPath');
    await settle(page);
  }

  expect(errors).toEqual([]);
});

test('clicked element overrides the ref without mutating it, including fixed mobile layout', async ({
  page,
}) => {
  await open(page);
  const origin = await center(page, '#element-toggle');
  await page.locator('#element-toggle').click();
  await expectOrigin(page, origin);
  expect(
    await page.evaluate(() => window.themeFixture.state.ref.current?.id)
  ).toBe('ref-toggle');
  await settle(page);
});

test('triangle, blur circle and polygon gradient keyframes start at the origin', async ({
  page,
}) => {
  const origin = { x: 125.5, y: 230.25 };

  await open(page, 'animation=triangle&duration=100');
  await page.evaluate(
    (point) => window.themeFixture.state.toggleTheme({ origin: point }),
    origin
  );
  const triangle = await lastFrames(page);
  const vertices = firstNumbers(triangle, 'clipPath');
  const viewport = page.viewportSize()!;
  expect(vertices).toHaveLength(6);

  for (let i = 0; i < 6; i += 2) {
    expect((vertices[i] / 100) * viewport.width).toBeCloseTo(origin.x, 3);
    expect((vertices[i + 1] / 100) * viewport.height).toBeCloseTo(origin.y, 3);
  }

  await settle(page);

  await open(page, 'animation=blur-circle&duration=100');
  await page.evaluate(
    (point) => window.themeFixture.state.toggleTheme({ origin: point }),
    origin
  );
  const blur = await lastFrames(page);
  expect(firstNumbers(blur, 'maskPosition')).toEqual([origin.x, origin.y]);
  await settle(page);

  await open(
    page,
    'animation=polygon-gradient&direction=bottom-right&duration=100'
  );
  await page.evaluate(() => window.themeFixture.state.toggleTheme());
  const polygon = await lastFrames(page);
  expect(firstNumbers(polygon, 'maskPosition')).toEqual([
    viewport.width,
    viewport.height,
  ]);
  await settle(page);
});

for (const animation of [
  'circle',
  'triangle',
  'blur-circle',
  'polygon-gradient',
]) {
  test(`root zoom keeps the ${animation} reveal on the clicked element`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'firefox',
      'Firefox page screenshots omit active view transitions'
    );

    // Root zoom gives ::view-transition-new(root) a box in zoomed px. Chrome
    // and WebKit resolved px keyframes in that box, so the reveal started at
    // origin * zoom. Percentages and box-scaled masks resolve correctly.
    const bounds = async (zoom: string) => {
      await open(page, `animation=${animation}&duration=6000&progress=0.03`);
      await page.evaluate((value) => {
        document.documentElement.style.zoom = value;
        const target = document.createElement('button');
        target.id = 'zoom-target';
        target.textContent = 'Target';
        target.style.cssText = 'position:fixed;left:30vw;top:30vh';
        document.body.append(target);
      }, zoom);
      await page.locator('#freeze').click();
      const box = (await page.locator('#zoom-target').boundingBox())!;
      void page.evaluate(() =>
        window.themeFixture.state.switchTheme('dark', {
          element: document.getElementById('zoom-target'),
        })
      );
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .some((animation) => animation.playState === 'paused')
      );
      // Let the paused frame paint before reading pixels.
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          )
      );
      const dark = await darkBounds(page);
      await page.evaluate(() =>
        window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
      );
      await settle(page);
      await page.evaluate(() =>
        window.themeFixture.state.switchTheme('light', false)
      );

      return {
        dark,
        center: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      };
    };

    const plain = await bounds('1');
    const zoomed = await bounds('1.5');

    if (animation === 'polygon-gradient') {
      // A corner reveal: same corner and the same progress as without zoom.
      expect(zoomed.dark.left).toBeLessThan(1);
      expect(zoomed.dark.top).toBeLessThan(1);
      // Before the fix the zoomed mask was 1.5 times too large.
      expect(zoomed.dark.right / plain.dark.right).toBeCloseTo(1, 1);
      expect(zoomed.dark.bottom / plain.dark.bottom).toBeCloseTo(1, 1);

      return;
    }

    const { dark, center } = zoomed;
    // Before the fix the reveal started at the origin times the zoom, more
    // than 100 px away here. The tolerance covers antialiasing and feathering.
    expect(Math.abs((dark.left + dark.right) / 2 - center.x)).toBeLessThan(8);

    // A triangle's bounding box is not centred on its incircle vertically.
    // Page content in the new theme can cover the apex, so the measured top
    // is unreliable. Use the base instead: an equilateral triangle is
    // width * sqrt(3) / 2 tall, and its incircle centre is one third of the
    // height above the base.
    const middleY =
      animation === 'triangle'
        ? dark.bottom - ((dark.right - dark.left) * Math.sqrt(3)) / 6
        : (dark.top + dark.bottom) / 2;

    expect(Math.abs(middleY - center.y)).toBeLessThan(8);
    expect(plain.dark.right).toBeGreaterThan(plain.dark.left);
  });
}

test('explicit origin does not need an attached ref', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    window.themeFixture.state.ref.current = null;
    await window.themeFixture.state.toggleTheme({
      origin: { x: 125.5, y: 230.25 },
    });
  });
  await expectOrigin(page, { x: 125.5, y: 230.25 });
  await settle(page);
});

test('color palettes use the same circle path and preserve the current mode', async ({
  page,
}) => {
  await open(page);
  const origin = await center(page, '#palette');
  await page.locator('#palette').click();
  await expectOrigin(page, origin);
  await expect(page.locator('html')).toHaveClass(/theme-ocean/);
  expect(await page.evaluate(() => window.themeFixture.state.theme)).toBe(
    'light'
  );
  await settle(page);
  const cycleOrigin = await center(page, '#cycle');
  await page.locator('#cycle').click();
  await expect
    .poll(() =>
      page.evaluate(() => window.themeFixture.inspection.animations.length)
    )
    .toBe(2);
  await expectOrigin(page, cycleOrigin);
  await expect(page.locator('html')).toHaveClass(/theme-rose/);
  await settle(page);
});

test('reduced motion, unsupported browsers, invalid palettes and legacy boolean bypass are safe', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.locator('#palette').click();
  await expect(page.locator('html')).toHaveClass(/theme-ocean/);
  expect(
    await page.evaluate(() => window.themeFixture.inspection.transitions.length)
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(async () => {
    await window.themeFixture.state.toggleTheme(true);
    await window.themeFixture.state.switchColorTheme('missing');
    Object.defineProperty(document, 'startViewTransition', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    await window.themeFixture.state.switchColorTheme('rose', {
      origin: { x: 1, y: 2 },
    });
  });
  await expect(page.locator('html')).toHaveClass(/theme-rose/);
  expect(
    await page.evaluate(() => window.themeFixture.inspection.transitions.length)
  ).toBe(0);
});

test('rapid mode and palette requests keep the latest state and clean up interrupted transitions', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, 'animation=blur-circle');
  await page.evaluate(async () => {
    const state = window.themeFixture.state;
    const options = { origin: { x: 150, y: 200 } };
    await Promise.all([
      state.toggleTheme(options),
      state.toggleTheme(options),
      state.switchColorTheme('ocean', options),
      state.switchColorTheme('rose', options),
    ]);
  });
  await expect(page.locator('html')).toHaveClass(/theme-rose/);
  expect(await page.evaluate(() => window.themeFixture.state.theme)).toBe(
    'light'
  );
  await settle(page);
  expect(errors).toEqual([]);
});

test('skipped native capture still applies state exactly once without rejected promises', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await page.evaluate(async () => {
    const promise = window.themeFixture.state.toggleTheme();
    window.themeFixture.inspection.transitions.at(-1)!.skipTransition();
    await promise;
  });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await settle(page);
  expect(errors).toEqual([]);
});

test('blur circle feathers a bounded mask on only the new snapshot', async ({
  page,
}) => {
  await open(page, 'animation=blur-circle');
  await page.locator('#ref-toggle').click();
  await expect
    .poll(() =>
      page.evaluate(() => window.themeFixture.inspection.animations.length)
    )
    .toBe(1);

  const animation = await page.evaluate(
    () => window.themeFixture.inspection.animations[0]
  );

  expect(animation.options.pseudoElement).toBe('::view-transition-new(root)');
  expect(JSON.stringify(animation.frames)).toContain('radial-gradient');
  expect(JSON.stringify(animation.frames)).not.toContain('feGaussianBlur');
  await settle(page);
});

test('slide honors configured duration and uses transforms without a trigger', async ({
  page,
}) => {
  await open(page, 'animation=slide&duration=100');
  await page.evaluate(async () => {
    window.themeFixture.state.ref.current = null;
    await window.themeFixture.state.switchColorTheme('ocean');
  });

  const animation = await page.evaluate(
    () => window.themeFixture.inspection.animations[0]
  );

  expect(animation.frames.transform).toEqual([
    'translate(-100%, 0%)',
    'translate(0%, 0%)',
  ]);
  expect(animation.options.duration).toBe(100);
  await settle(page);
});

for (const provider of ['ui', 'next', 'vite', 'tanstack']) {
  test(`${provider} provider forwards explicit element and animated palette options`, async ({
    page,
  }) => {
    await open(page, `provider=${provider}`);
    const origin = await center(page, '#element-toggle');
    await page.locator('#element-toggle').click();
    await expectOrigin(page, origin);
    await settle(page);
    await page.locator('#palette').click();
    await expect(page.locator('html')).toHaveClass(/theme-ocean/);
    await settle(page);
    await page.evaluate(async () =>
      window.themeFixture.state.switchThemeFromElement!(
        'light',
        document.getElementById('element-toggle')!
      )
    );
    expect(
      await page.evaluate(() => window.themeFixture.state.ref.current?.id)
    ).toBe('ref-toggle');
    await settle(page);

    if (provider === 'tanstack') {
      expect(
        await page.evaluate(() => window.themeFixture.inspection.callbacks)
      ).toEqual(['dark', 'ocean', 'light']);
      await page.evaluate(async () =>
        window.themeFixture.state.toggleColorTheme({ origin: { x: 20, y: 20 } })
      );
      await settle(page);
      expect(
        await page.evaluate(() =>
          window.themeFixture.inspection.callbacks.at(-1)
        )
      ).toBe('rose');
    }
  });
}

test('CSS zoom keeps element origin and explicit short duration in CSS pixels', async ({
  page,
}) => {
  await open(page, 'duration=100');
  await page.evaluate(() => {
    document.body.style.zoom = '1.25';
  });
  const origin = await center(page, '#element-toggle');
  await page.locator('#element-toggle').click();
  await expectOrigin(page, origin);
  expect(
    await page.evaluate(
      () => window.themeFixture.inspection.animations[0].options.duration
    )
  ).toBe(100);
  await settle(page);
});

test('direct palette helpers use the clicked element and keyboard controls skip movement', async ({
  page,
}) => {
  await open(page);
  const origin = await center(page, '#target-palette');
  await page.locator('#target-palette').click();
  await expectOrigin(page, origin);
  await settle(page);
  await page.evaluate(() => {
    window.themeFixture.inspection.transitions.length = 0;
  });
  await page.locator('#cycle').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveClass(/theme-default/);
  expect(
    await page.evaluate(() => window.themeFixture.inspection.transitions.length)
  ).toBe(0);
});

test('failed capture or unsupported pseudo animation preserves the update and cleans up', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await page.evaluate(async () => {
    document.body.style.viewTransitionName = 'duplicate';
    document.querySelector('main')!.style.viewTransitionName = 'duplicate';
    await window.themeFixture.state.toggleTheme();
    document.body.style.viewTransitionName = '';
    document.querySelector('main')!.style.viewTransitionName = '';
  });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await settle(page);
  await page.evaluate(async () => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const rest = options && options !== Number(options) ? { ...options } : {};
      delete rest.pseudoElement;

      return animate.call(this, frames, rest);
    };

    await window.themeFixture.state.toggleTheme();
  });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await settle(page);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).clipPath
    )
  ).toBe('none');
  expect(errors).toEqual([]);
});

test('large viewports do not impose the former 500 ms duration floor', async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== 'chromium-dpr2',
    'One large DPR 2 snapshot is sufficient for the duration regression.'
  );
  await page.setViewportSize({ width: 3200, height: 2000 });
  await open(page, 'duration=100');
  await page.locator('#ref-toggle').click();
  await expect
    .poll(() =>
      page.evaluate(() => window.themeFixture.inspection.animations.length)
    )
    .toBe(1);
  expect(
    await page.evaluate(
      () => window.themeFixture.inspection.animations[0].options.duration
    )
  ).toBe(100);
  await settle(page);
});

test('last corner is already painted before snapshot cleanup despite viewport rounding', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === 'firefox',
    'Firefox drawSnapshot omits active view transitions: Mozilla bug 2008417'
  );
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, 'duration=6000&corner=top-right&progress=1');
  // Arc at 90% zoom reported an integer viewport smaller than the snapshot's
  // fractional CSS box. Simulate that rounding without needing OS display zoom.
  await page.evaluate(() => {
    Object.defineProperty(window, 'innerHeight', {
      value: 799,
      configurable: true,
    });
  });
  await page.locator('#freeze').click();
  await page.locator('#element-toggle').click();
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .some((animation) => animation.playState === 'paused')
  );
  expect(
    await page.evaluate(() =>
      document.documentElement.hasAttribute('data-ui-theme-transition')
    )
  ).toBe(true);
  const corner = { x: 0, y: 795, width: 5, height: 5 };
  const beforeCleanup = await page.screenshot({ clip: corner });
  await page.evaluate(() =>
    window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
  );
  await settle(page);
  // Compare the actual rendered far corner, not just the animation keyframes.
  expect(beforeCleanup).toEqual(await page.screenshot({ clip: corner }));
});

for (const provider of ['hook', 'ui', 'next', 'vite', 'tanstack']) {
  test(`${provider} selects the current theme logo with auto dimensions`, async ({
    page,
  }) => {
    await open(
      page,
      `provider=${provider}&animation=svg-logo&logoLight=/logo-light.svg&logoDark=/logo-dark.svg&logoWidth=180&logoHeight=auto&duration=6000`
    );
    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.locator('#freeze').click();

    for (const destination of ['dark', 'light'] as const) {
      await page.evaluate(
        (mode) => window.themeFixture.state.switchTheme(mode),
        destination
      );
      const image = page.locator('[data-ui-theme-logo]');
      await expect(image).toBeVisible();
      expect(
        decodeURIComponent((await image.getAttribute('src')) ?? '')
      ).toContain(`id="${destination === 'light' ? 'dark' : 'light'}-logo"`);
      const bounds = await image.boundingBox();
      expect(bounds!.width).toBeCloseTo(180, 2);
      expect(bounds!.height).toBeCloseTo(120, 2);
      await page.screenshot({
        path: test.info().outputPath(`${destination}-transition.png`),
      });
      await page.evaluate(() =>
        window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
      );
      await settle(page);
    }
  });
}

test('gallery activates light and dark uploads only after both are supplied', async ({
  page,
}) => {
  await open(page, 'gallery&animation=svg-logo&logo=/logo.svg&duration=6000');
  await page
    .getByLabel('Light logo', { exact: true })
    .setInputFiles('tests/browser/public/logo-light.svg');
  await expect(
    page.getByText('Upload both light and dark logos', { exact: false })
  ).toBeVisible();
  await page
    .getByLabel('Dark logo', { exact: true })
    .setInputFiles('tests/browser/public/logo-dark.svg');
  await expect(
    page.getByText('Paired logos active:', { exact: false })
  ).toBeVisible();
  await page.evaluate(() => window.themeFixture.preloadLogo());
  await page.locator('#freeze').click();

  for (const destination of ['dark', 'light'] as const) {
    await page.evaluate(
      (mode) => window.themeFixture.state.switchTheme(mode),
      destination
    );
    const image = page.locator('[data-ui-theme-logo]');
    await expect(image).toBeVisible();
    expect(
      decodeURIComponent((await image.getAttribute('src')) ?? '')
    ).toContain(`id="${destination === 'light' ? 'dark' : 'light'}-logo"`);
    await page.evaluate(() =>
      window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
    );
    await settle(page);
  }
});

test('a failed storage write still applies the theme without rejecting', async ({
  page,
}) => {
  await open(page);

  const result = await page.evaluate(async () => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      await window.themeFixture.state.switchTheme('dark', true);

      return {
        rejected: false,
        theme: window.themeFixture.state.theme,
        stored: localStorage.getItem('theme'),
      };
    } catch {
      return { rejected: true };
    } finally {
      Storage.prototype.setItem = setItem;
    }
  });

  expect(result.rejected).toBe(false);
  expect(result.stored).not.toBe('dark');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('#diagnostics')).toContainText('dark');
});

test('server preferences hydrate even when storage is blocked', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage blocked');
    };
  });
  await page.goto('/?provider=tanstack&serverTheme=dark');
  await page.waitForFunction(() => Boolean(window.themeFixture));
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('html')).toHaveClass(/theme-ocean/);
  expect(errors).toEqual([]);
});

test('rejected server callback is reported without an unhandled rejection', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, 'provider=tanstack&reject-server');
  await page.evaluate(() =>
    window.themeFixture.state.switchTheme('dark', true)
  );
  await expect
    .poll(() => page.evaluate(() => window.themeFixture.inspection.callbacks))
    .toEqual(['dark', 'error:Cookie notification failed']);
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(errors).toEqual([]);
});

for (const provider of ['hook', 'next', 'ui', 'vite', 'tanstack']) {
  test(`${provider} injected styles apply under a nonce-based CSP`, async ({
    page,
  }) => {
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') {
        await route.continue();

        return;
      }

      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          'content-security-policy': "style-src 'nonce-uitheme-test'",
        },
      });
    });

    const applied = (selector: string) =>
      page.evaluate((query) => {
        const style = document.querySelector<HTMLStyleElement>(query);

        return Boolean(style?.sheet && style.sheet.cssRules.length > 0);
      }, selector);

    // Negative control: without the nonce the policy blocks the styles.
    await open(page, `provider=${provider}`);
    expect(await applied('#ui-theme-base-style')).toBe(false);

    await open(
      page,
      `provider=${provider}&nonce=uitheme-test&animation=svg-logo&logo=/logo.svg&duration=6000`
    );
    expect(await applied('#ui-theme-base-style')).toBe(true);
    expect(
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-ui-theme-transition', '');
        const value = getComputedStyle(document.body).transitionProperty;
        document.documentElement.removeAttribute('data-ui-theme-transition');

        return value;
      })
    ).toBe('none');

    await page.evaluate(() => window.themeFixture.preloadLogo());
    await page.locator('#freeze').click();
    void page.evaluate(() => window.themeFixture.state.toggleTheme());
    await expect(page.locator('[data-ui-theme-logo-style]')).toHaveCount(1);
    expect(await applied('[data-ui-theme-logo-style]')).toBe(true);
    await page.evaluate(() =>
      window.themeFixture.inspection.transitions.at(-1)!.skipTransition()
    );
    await settle(page);
  });
}

test('the CSS keyframe fallback style carries the CSP nonce', async ({
  page,
}) => {
  await open(page, 'nonce=uitheme-test&duration=100');

  const nonce = await page.evaluate(async () => {
    const animate = Element.prototype.animate;
    const added: HTMLStyleElement[] = [];

    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (node instanceof HTMLStyleElement) added.push(node);
    });

    observer.observe(document.head, { childList: true });
    Element.prototype.animate = function (frames, options) {
      const rest = options && options !== Number(options) ? { ...options } : {};
      delete rest.pseudoElement;

      return animate.call(this, frames, rest);
    };

    try {
      await window.themeFixture.state.toggleTheme();
    } finally {
      Element.prototype.animate = animate;
      observer.disconnect();
    }

    return added.flatMap((style) =>
      style.textContent?.includes('ui-theme-reveal-') ? [style.nonce] : []
    );
  });

  expect(nonce).toEqual(['uitheme-test']);
  await settle(page);
});

test('vite disableTransitionOnChange style carries the CSP nonce', async ({
  page,
}) => {
  await open(page, 'provider=vite&disableTransitions&nonce=uitheme-test');

  const nonces = await page.evaluate(async () => {
    const added: string[] = [];

    const observer = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes)
          if (
            node instanceof HTMLStyleElement &&
            node.textContent?.includes('transition:none')
          )
            added.push(node.nonce);
    });

    observer.observe(document.head, { childList: true });
    window.themeFixture.state.setTheme('dark');
    await new Promise((resolve) => setTimeout(resolve, 20));
    observer.disconnect();

    return added;
  });

  expect(nonces).toEqual(['uitheme-test']);
  await expect(page.locator('html')).toHaveClass(/dark/);
});
