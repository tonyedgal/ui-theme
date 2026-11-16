import { dirname, join, relative } from 'node:path';
import { displayPath, isInside } from '../paths.ts';
import { planSharedUtils } from './shared-utils.ts';
import { planNextThemes } from './next-themes.ts';
import {
  NextThemesRefusal,
  messages,
  type NextThemesMode,
} from './messages.ts';
import { readConfig } from '../config.ts';
import {
  hasTrailingComma,
  isCall,
  memberName,
  memberObject,
  moduleName,
  parseModule,
  text,
  walk,
  type t,
} from '../parse.ts';
import type { ProjectProfile } from '../types.ts';
import {
  appendObjectProperty,
  objectProperty,
  transformTailwind3,
  transformTailwind4,
  transformVariables,
  unwrapExpression,
} from '../tailwind/index.ts';
import {
  missingDependencies,
  planFile,
  readOptional,
  serializeConfig,
  settleConflict,
} from './index.ts';
import type { InstallPlan, PlannedFile, PlanOptions } from './index.ts';

async function firstFile(
  candidates: string[]
): Promise<{ path: string; content: string } | undefined> {
  for (const path of candidates) {
    const content = await readOptional(path);

    if (content !== undefined) return { path, content };
  }
}

function sourceFile(cwd: string, path: string, content: string): t.Program {
  try {
    return parseModule(path, content);
  } catch {
    throw new Error(
      `${displayPath(cwd, path)} has a syntax error, so the CLI cannot add the provider. Fix the error and run init again, or add the provider yourself.`
    );
  }
}

// The app-owned wrapper that the CLI generates around UIThemeProvider.
const wrapperName = 'ThemeProvider';

// Wrap the children of a JSX element and indent them one more level.
// `\n    <App />\n  ` becomes `\n    <Name>\n      <App />\n    </Name>\n  `.
function wrapChildren(inner: string, name: string): string {
  const last = inner.lastIndexOf('\n');

  if (last === -1) return `<${name}>${inner}</${name}>`;

  const body = inner.slice(0, last),
    closingIndent = inner.slice(last + 1),
    childIndent = /\n([ \t]*)\S/.exec(body)?.[1] ?? closingIndent;

  const unit = childIndent.startsWith(closingIndent)
    ? childIndent.slice(closingIndent.length) || '  '
    : '  ';

  return `\n${childIndent}<${name}>${body.replace(/\n(?=[ \t]*\S)/g, `\n${unit}`)}\n${childIndent}</${name}>\n${closingIndent}`;
}

// a jsx element with children, as the typescript api distinguished it
function isJsxElement(
  node: t.Node
): node is t.JSXElement & { closingElement: t.JSXClosingElement } {
  return node.type === 'JSXElement' && node.closingElement !== null;
}

function relativeImport(from: string, to: string): string {
  const path = relative(dirname(from), to)
    .replaceAll('\\', '/')
    .replace(/\.[jt]sx?$/, '');

  return path.startsWith('.') ? path : `./${path}`;
}

function isReactRoot(receiver: t.Expression, file: t.Program): boolean {
  const functions = new Set<string>(),
    namespaces = new Set<string>();

  for (const statement of file.body) {
    if (
      statement.type !== 'ImportDeclaration' ||
      statement.source.value !== 'react-dom/client'
    )
      continue;

    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier')
        namespaces.add(specifier.local.name);
      else if (moduleName(specifier.imported) === 'createRoot')
        functions.add(specifier.local.name);
    }
  }

  const createsRoot = (expression: t.Node): boolean => {
    if (!isCall(expression)) return false;

    const called = expression.callee,
      namespace = memberObject(called);

    return (
      (called.type === 'Identifier' && functions.has(called.name)) ||
      (memberName(called) === 'createRoot' &&
        namespace?.type === 'Identifier' &&
        namespaces.has(namespace.name))
    );
  };

  if (createsRoot(receiver)) return true;

  if (receiver.type !== 'Identifier') return false;
  let known = false;
  walk(file, (node) => {
    if (
      node.type === 'VariableDeclarator' &&
      node.id.type === 'Identifier' &&
      node.id.name === receiver.name &&
      node.init &&
      createsRoot(node.init)
    )
      known = true;
  });

  return known;
}

function wrapperSource(profile: ProjectProfile, name: string): string {
  const provider =
    profile.framework === 'next' ? 'NextUIThemeProvider' : 'UIThemeProvider';

  return `${profile.framework === 'next' ? "'use client';\n\n" : ''}import { ${provider} } from 'uitheme-web/${profile.framework === 'next' ? 'next' : 'react'}';\n${profile.language === 'ts' ? "import type { ReactNode } from 'react';\n" : ''}\nexport function ${name}({ children }${profile.language === 'ts' ? ': { children: ReactNode }' : ''}) {\n  return <${provider} defaultTheme="system" defaultColorTheme="default" colorThemes={['default']}>{children}</${provider}>;\n}\n`;
}

async function separateProvider(profile: ProjectProfile): Promise<PlannedFile> {
  const directory = isInside(profile.cwd, profile.componentsDir)
      ? dirname(profile.componentsDir)
      : join(profile.cwd, 'components'),
    extension = profile.language === 'ts' ? 'tsx' : 'jsx',
    source = wrapperSource(profile, 'AppUIThemeProvider');

  for (let number = 1; ; number++) {
    const path = join(
      directory,
      `ui-theme-provider${number === 1 ? '' : `-${number}`}.${extension}`
    );

    const existing = await readOptional(path);

    if (existing === undefined || existing === source)
      return planFile(profile, path, source);
  }
}

async function reactProvider(
  profile: ProjectProfile,
  files: PlannedFile[],
  manual: string[],
  options: PlanOptions
): Promise<void> {
  const extensions =
    profile.language === 'ts' ? ['tsx', 'jsx', 'js'] : ['jsx', 'js', 'tsx'];

  const stems =
    profile.framework === 'next'
      ? ['src/app/layout', 'app/layout']
      : profile.framework === 'tanstack'
        ? ['src/routes/__root', 'app/routes/__root']
        : ['src/main', 'src/index', 'main'];

  const entry = await firstFile(
    stems.flatMap((stem) =>
      extensions.map((extension) => join(profile.cwd, `${stem}.${extension}`))
    )
  );

  if (!entry) {
    manual.push(
      'Add a UIThemeProvider around the application root. No recognized application entry file was found.'
    );

    return;
  }

  const file = sourceFile(profile.cwd, entry.path, entry.content);
  const source = entry.content;
  const edits: { start: number; end: number; text: string }[] = [];
  let rootNode: t.Node | undefined;

  if (profile.framework === 'next' || profile.framework === 'tanstack') {
    const bodies: (t.JSXElement & { closingElement: t.JSXClosingElement })[] =
      [];

    walk(file, (node) => {
      if (
        isJsxElement(node) &&
        text(source, node.openingElement.name) === 'body'
      )
        bodies.push(node);
    });

    if (bodies.length !== 1) {
      manual.push(
        `Wrap the application content in ${displayPath(profile.cwd, entry.path)} with UIThemeProvider. The document body is not a single JSX element.`
      );

      return;
    }

    const body = bodies[0];
    rootNode = body;
    edits.push({
      start: body.openingElement.end!,
      end: body.openingElement.end!,
      text: `<${wrapperName}>`,
    });
    edits.push({
      start: body.closingElement.start!,
      end: body.closingElement.start!,
      text: `</${wrapperName}>`,
    });
  } else {
    const renders: t.Node[] = [];
    walk(file, (node) => {
      if (
        isCall(node) &&
        memberName(node.callee) === 'render' &&
        memberObject(node.callee) !== undefined &&
        isReactRoot(memberObject(node.callee)!, file) &&
        node.arguments.length === 1 &&
        (node.arguments[0].type === 'JSXElement' ||
          node.arguments[0].type === 'JSXFragment')
      )
        renders.push(node.arguments[0]);
    });

    if (renders.length !== 1) {
      manual.push(
        `Wrap the React root in ${displayPath(profile.cwd, entry.path)} with UIThemeProvider. The entry uses a custom render function.`
      );

      return;
    }

    const child = renders[0];
    rootNode = child;

    // Keep StrictMode outermost so that it also checks the provider.
    if (
      isJsxElement(child) &&
      ['StrictMode', 'React.StrictMode'].includes(
        text(source, child.openingElement.name)
      )
    ) {
      const start = child.openingElement.end!,
        end = child.closingElement.start!;

      edits.push({
        start,
        end,
        text: wrapChildren(source.slice(start, end), wrapperName),
      });
    } else
      edits.push({
        start: child.start!,
        end: child.end!,
        text: `<${wrapperName}>${text(source, child)}</${wrapperName}>`,
      });
  }

  const wrapperDirectory = isInside(profile.cwd, profile.componentsDir)
    ? dirname(profile.componentsDir)
    : join(profile.cwd, 'components');

  const wrapperPath = join(
    wrapperDirectory,
    `theme-provider.${profile.language === 'ts' ? 'tsx' : 'jsx'}`
  );

  const wrapper = wrapperSource(profile, wrapperName);
  const directProviders = new Set<string>();
  let setupImported = false;
  let setupConflict = false;

  for (const statement of file.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    const module = statement.source.value;

    for (const element of statement.specifiers) {
      if (element.type !== 'ImportSpecifier') continue;
      const exported = moduleName(element.imported);

      if (
        (module === 'uitheme-web/react' || module === 'uitheme-web/next') &&
        ['UIThemeProvider', 'NextUIThemeProvider'].includes(exported)
      )
        directProviders.add(element.local.name);

      if (element.local.name === wrapperName) {
        if (
          exported === wrapperName &&
          module === relativeImport(entry.path, wrapperPath)
        )
          setupImported = true;
        else setupConflict = true;
      }
    }
  }

  let directProviderUsed = false,
    setupUsed = false;

  if (rootNode)
    walk(rootNode, (node) => {
      if (node.type === 'JSXOpeningElement') {
        const tag = text(source, node.name);

        if (directProviders.has(tag)) directProviderUsed = true;

        if (tag === wrapperName) setupUsed = true;
      }
    });

  if (directProviderUsed) return;

  const planned = await settleConflict(
    profile,
    await planFile(profile, wrapperPath, wrapper),
    'existing',
    options
  );

  if (setupUsed && setupImported) {
    files.push(planned);

    return;
  }

  // The kept file may export something else, so the CLI does not wire it.
  if (planned.kept) {
    files.push(planned);
    manual.push(
      `Kept your ${displayPath(profile.cwd, wrapperPath)}. Wrap the application root in ${displayPath(profile.cwd, entry.path)} with the provider.`
    );

    return;
  }

  if (
    setupConflict ||
    setupUsed ||
    new RegExp(`\\b(?:const|function|class)\\s+${wrapperName}\\b`).test(
      entry.content
    )
  ) {
    manual.push(
      `Choose an unused provider binding in ${displayPath(profile.cwd, entry.path)}. ${wrapperName} already belongs to existing source. Rename that binding, or wrap the root with UIThemeProvider yourself.`
    );

    return;
  }

  let content = entry.content;

  for (const edit of edits.sort((a, b) => b.start - a.start))
    content =
      content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  const imported = `import { ${wrapperName} } from '${relativeImport(entry.path, wrapperPath)}';\n`;
  let insertAt = 0;

  for (const directive of file.directives) insertAt = directive.end!;

  content =
    content.slice(0, insertAt) +
    (insertAt ? '\n' : '') +
    imported +
    content.slice(insertAt);
  files.push(planned, await planFile(profile, entry.path, content));
}

async function vueProvider(
  profile: ProjectProfile,
  files: PlannedFile[],
  manual: string[]
): Promise<void> {
  const entry = await firstFile(
    ['src/main.ts', 'src/main.js', 'main.ts', 'main.js'].map((path) =>
      join(profile.cwd, path)
    )
  );

  if (!entry) {
    manual.push(
      'Install createUITheme() with app.use() before app.mount() in the Vue entry.'
    );

    return;
  }

  if (
    /\.use\(\s*createUITheme\(/.test(entry.content) &&
    /from\s*['"]uitheme-web\/vue['"]/.test(entry.content)
  )
    return;
  const file = sourceFile(profile.cwd, entry.path, entry.content);
  const mounts: (t.CallExpression | t.OptionalCallExpression)[] = [];
  walk(file, (node) => {
    if (isCall(node) && memberName(node.callee) === 'mount') mounts.push(node);
  });

  if (mounts.length !== 1) {
    manual.push(
      `Install createUITheme() with app.use() in ${displayPath(profile.cwd, entry.path)}. The entry has no single mount call.`
    );

    return;
  }

  const mount = mounts[0].callee;

  const receiver = memberObject(mount);

  if (!receiver)
    throw new Error(
      `Install createUITheme() on the Vue application in ${displayPath(profile.cwd, entry.path)}. Its mount call is custom.`
    );

  const createsApp = (node: t.Node) =>
    isCall(node) &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'createApp';

  let known = false;
  walk(receiver, (node) => {
    if (createsApp(node)) known = true;
  });

  if (receiver.type === 'Identifier')
    walk(file, (node) => {
      if (
        node.type === 'VariableDeclarator' &&
        node.id.type === 'Identifier' &&
        node.id.name === receiver.name &&
        node.init
      )
        walk(node.init, (expression) => {
          if (createsApp(expression)) known = true;
        });
    });

  if (!known) {
    manual.push(
      `Install createUITheme() on the Vue application in ${displayPath(profile.cwd, entry.path)}. Its mount receiver is custom.`
    );

    return;
  }

  const at = receiver.end!;
  const content = `import { createUITheme } from 'uitheme-web/vue';\n${entry.content.slice(0, at)}.use(createUITheme({ defaultTheme: 'system', defaultColorTheme: 'default', colorThemes: ['default'] }))${entry.content.slice(at)}`;
  files.push(await planFile(profile, entry.path, content));
}

async function nuxtModule(
  profile: ProjectProfile,
  files: PlannedFile[],
  manual: string[]
): Promise<void> {
  const entry = await firstFile(
    ['nuxt.config.ts', 'nuxt.config.js', 'nuxt.config.mjs'].map((path) =>
      join(profile.cwd, path)
    )
  );

  if (!entry) {
    manual.push("Add 'uitheme-web/nuxt' to the modules array in nuxt.config.");

    return;
  }

  const file = sourceFile(profile.cwd, entry.path, entry.content);
  let config: t.ObjectExpression | undefined;

  for (const statement of file.body) {
    const exported =
      statement.type === 'TSExportAssignment'
        ? statement.expression
        : statement.type === 'ExportDefaultDeclaration'
          ? statement.declaration
          : undefined;

    if (
      exported &&
      isCall(exported) &&
      exported.callee.type === 'Identifier' &&
      exported.callee.name === 'defineNuxtConfig' &&
      exported.arguments.length === 1
    ) {
      const [argument] = exported.arguments;

      const value =
        argument.type === 'SpreadElement' ||
        argument.type === 'ArgumentPlaceholder'
          ? argument
          : unwrapExpression(argument);

      if (value.type === 'ObjectExpression') config = value;
    }
  }

  if (!config) {
    manual.push(
      "Add 'uitheme-web/nuxt' to the existing Nuxt modules. The config is not a plain defineNuxtConfig object."
    );

    return;
  }

  const modules = objectProperty(config, 'modules');
  let content: string;

  if (!modules)
    content = appendObjectProperty(
      entry.content,
      config,
      "modules: ['uitheme-web/nuxt']"
    );
  else {
    const array = unwrapExpression(modules.value);

    if (
      array.type !== 'ArrayExpression' ||
      array.elements.some((value) => value?.type === 'SpreadElement')
    ) {
      manual.push("Add 'uitheme-web/nuxt' to the computed Nuxt modules array.");

      return;
    }

    if (
      array.elements.some(
        (value) =>
          value?.type === 'StringLiteral' && value.value === 'uitheme-web/nuxt'
      )
    )
      return;
    const end = array.end! - 1;
    content = `${entry.content.slice(0, end)}${array.elements.length && !hasTrailingComma(entry.content, array.elements, end) ? ',' : ''}'uitheme-web/nuxt'${entry.content.slice(end)}`;
  }

  files.push(await planFile(profile, entry.path, content));
}

export async function planInit(
  profile: ProjectProfile,
  options: PlanOptions = {}
): Promise<InstallPlan> {
  const files: PlannedFile[] = [],
    manualSteps: string[] = [];

  let nextThemes: Awaited<ReturnType<typeof planNextThemes>>,
    refusal: NextThemesRefusal | undefined;

  try {
    nextThemes = await planNextThemes(profile);
  } catch (error) {
    if (!(error instanceof NextThemesRefusal)) throw error;
    refusal = error;
  }

  let mode: NextThemesMode | undefined;

  if (nextThemes || refusal) {
    mode =
      options.nextThemesMode ??
      (await options.chooseNextThemes?.(refusal?.message)) ??
      'replace';

    if (mode === 'replace' && refusal) throw refusal;
  }

  const replacing = mode === 'replace' && Boolean(nextThemes);
  const converted = replacing && Boolean(nextThemes?.files.length);

  if (replacing)
    for (const file of nextThemes?.files ?? [])
      files.push(await planFile(profile, file.path, file.content));

  const utility = await planSharedUtils(profile, options);
  profile = utility.profile;
  files.push(utility.file);
  manualSteps.push(...utility.manualSteps);

  const original = await readOptional(profile.cssFile);

  if (original === undefined)
    throw new Error('Existing Tailwind CSS file is required');
  let css = transformVariables(original, profile.colorFormat);

  if (profile.tailwind === 4)
    css = transformTailwind4(css, profile.colorFormat);
  else {
    if (!profile.tailwindConfigFile)
      throw new Error('Existing Tailwind 3 config is required');
    const config = await readOptional(profile.tailwindConfigFile);

    if (config === undefined)
      throw new Error('Tailwind configuration does not exist');
    files.push(
      await planFile(
        profile,
        profile.tailwindConfigFile,
        transformTailwind3(config, profile.colorFormat, css)
      )
    );
  }

  files.push(await planFile(profile, profile.cssFile, css));

  const providerSteps = manualSteps.length;

  try {
    if (profile.framework === 'nuxt')
      await nuxtModule(profile, files, manualSteps);
    else if (profile.framework === 'vite-vue')
      await vueProvider(profile, files, manualSteps);
    else if (mode === 'create') {
      const separate = await separateProvider(profile);
      files.push(separate);
      manualSteps.push(
        messages.created(displayPath(profile.cwd, separate.path))
      );
    } else if (mode === 'keep') manualSteps.push(messages.manual());
    else if (!converted)
      await reactProvider(profile, files, manualSteps, options);
  } catch (error) {
    manualSteps.push(error instanceof Error ? error.message : String(error));
  }

  if (
    manualSteps.length > providerSteps &&
    mode !== 'keep' &&
    mode !== 'create'
  )
    manualSteps.push(messages.manual());

  files.push(
    await planFile(
      profile,
      profile.configFile,
      serializeConfig(profile, await readConfig(profile.cwd))
    )
  );

  const plan: InstallPlan = {
    profile,
    files,
    manualSteps,
    ...(mode && {
      nextThemes: {
        mode,
        files: replacing ? (nextThemes?.files.length ?? 0) : 0,
        remove: replacing && Boolean(nextThemes?.remove),
      },
    }),
    dependencies: await missingDependencies(
      profile,
      [
        options.webDependency ?? 'uitheme-web@latest',
        ...(utility.owner.cwd === profile.cwd ? utility.dependencies : []),
      ],
      ['uitheme-web']
    ),
  };

  if (utility.owner.cwd !== profile.cwd)
    plan.dependencyInstalls = [
      {
        profile: utility.owner,
        dependencies: await missingDependencies(
          utility.owner,
          utility.dependencies
        ),
      },
    ];

  return plan;
}
