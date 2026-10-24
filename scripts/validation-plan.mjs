const products = ['uitheme-rn', 'uitheme-vue', 'uitheme-web'];

const reactExamples = [
  'example-next',
  'example-tanstack',
  'example-tanstack-ssr',
];

const vueExamples = ['example-vue', 'example-nuxt'];

const nativeExamples = [
  'example-expo',
  'example-nativewind',
  'example-uniwind',
];

const examples = [...reactExamples, ...vueExamples, ...nativeExamples];

export function selectChecks(files, { ci = false } = {}) {
  const packages = new Set();
  const references = new Set();
  const browsers = new Set();
  const consumers = new Set();
  let website = false;

  function web(shared = false) {
    packages.add('uitheme-web');
    reactExamples.forEach((name) => references.add(name));
    browsers.add('web');
    website = true;
    browsers.add('website');

    if (shared) vue();
  }

  function vue() {
    packages.add('uitheme-vue');
    vueExamples.forEach((name) => references.add(name));
    browsers.add('vue');
  }

  function native() {
    packages.add('uitheme-rn');
    nativeExamples.forEach((name) => references.add(name));
  }

  function all() {
    web(true);
    native();
    consumers.add('rn');
    consumers.add('vue');
  }

  for (const file of files) {
    if (file.startsWith('apps/ui-theme-web/')) {
      website = true;
      browsers.add('website');
    } else if (/^(docs\/|\.changeset\/)|\.(md|txt)$/.test(file)) {
      continue;
    } else if (
      /^(packages\/ui-theme\/src\/core\/|packages\/ui-theme\/package\.json$)/.test(
        file
      )
    ) {
      web(true);
    } else if (file.startsWith('packages/ui-theme/')) {
      web();
    } else if (file.startsWith('packages/ui-theme-vue/')) {
      vue();

      if (
        /package\.json$|vite\.config|tsconfig|src\/(nuxt|index|types)/.test(
          file
        )
      )
        consumers.add('vue');
    } else if (file.startsWith('packages/ui-theme-rn/')) {
      native();

      if (
        /package\.json$|tsup\.config|tsconfig|src\/(index|core\/types|expo|nativewind|uniwind|reanimated|screen-transitions)/.test(
          file
        )
      )
        consumers.add('rn');
    } else if (file.startsWith('apps/examples/')) {
      const name = file.split('/')[2];

      if (vueExamples.includes(name) || name === 'vue-theme-demo') {
        vueExamples.forEach((example) => references.add(example));
        browsers.add('vue');
      } else if (examples.includes(name)) references.add(name);
      else all();
    } else {
      all();
    }
  }

  return {
    packages: [...packages].sort(),
    examples: ci ? [] : [...references].sort(),
    website,
    browsers: ci ? [] : [...browsers].sort(),
    consumers: ci ? [] : [...consumers].sort(),
    tooling: files.some((file) =>
      /^(scripts\/|\.github\/|\.husky\/|package\.json$|pnpm-lock\.yaml$)/.test(
        file
      )
    ),
    products,
  };
}
