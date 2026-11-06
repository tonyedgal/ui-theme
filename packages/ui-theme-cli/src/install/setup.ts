import { dirname, join, relative, isAbsolute } from 'node:path';
import ts from 'typescript';
import { planSharedUtils } from './shared-utils.ts';
import { readConfig } from '../config.ts';
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

function sourceFile(path: string, content: string): ts.SourceFile {
  const file = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    /\.(?:[jt]sx|js)$/.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  if (
    ts.transpileModule(content, {
      fileName: path,
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.Preserve },
    }).diagnostics?.length
  )
    throw new Error('Source syntax requires manual provider setup');

  return file;
}

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  node.forEachChild((child) => {
    walk(child, visit);
  });
}

function relativeImport(from: string, to: string): string {
  const path = relative(dirname(from), to)
    .replaceAll('\\', '/')
    .replace(/\.[jt]sx?$/, '');

  return path.startsWith('.') ? path : `./${path}`;
}

function isReactRoot(receiver: ts.Expression, file: ts.SourceFile): boolean {
  const functions = new Set<string>(),
    namespaces = new Set<string>();

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== 'react-dom/client'
    )
      continue;
    const clause = statement.importClause;

    if (clause?.name) namespaces.add(clause.name.text);

    if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings))
      namespaces.add(clause.namedBindings.name.text);

    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings))
      for (const element of clause.namedBindings.elements)
        if ((element.propertyName?.text ?? element.name.text) === 'createRoot')
          functions.add(element.name.text);
  }

  const createsRoot = (expression: ts.Expression): boolean => {
    if (!ts.isCallExpression(expression)) return false;
    const called = expression.expression;

    return (
      (ts.isIdentifier(called) && functions.has(called.text)) ||
      (ts.isPropertyAccessExpression(called) &&
        called.name.text === 'createRoot' &&
        ts.isIdentifier(called.expression) &&
        namespaces.has(called.expression.text))
    );
  };

  if (createsRoot(receiver)) return true;

  if (!ts.isIdentifier(receiver)) return false;
  let known = false;
  walk(file, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === receiver.text &&
      node.initializer &&
      createsRoot(node.initializer)
    )
      known = true;
  });

  return known;
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

  const file = sourceFile(entry.path, entry.content);
  const edits: { start: number; end: number; text: string }[] = [];
  let rootNode: ts.Node | undefined;

  if (profile.framework === 'next' || profile.framework === 'tanstack') {
    const bodies: ts.JsxElement[] = [];
    walk(file, (node) => {
      if (
        ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(file) === 'body'
      )
        bodies.push(node);
    });

    if (bodies.length !== 1) {
      manual.push(
        `Wrap the application content in ${relative(profile.cwd, entry.path)} with UIThemeProvider. The document body is not a single JSX element.`
      );

      return;
    }

    const body = bodies[0];
    rootNode = body;
    edits.push({
      start: body.openingElement.end,
      end: body.openingElement.end,
      text: '<UIThemeSetup>',
    });
    edits.push({
      start: body.closingElement.getStart(file),
      end: body.closingElement.getStart(file),
      text: '</UIThemeSetup>',
    });
  } else {
    const renders: ts.CallExpression[] = [];
    walk(file, (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'render' &&
        isReactRoot(node.expression.expression, file) &&
        node.arguments.length === 1 &&
        (ts.isJsxElement(node.arguments[0]) ||
          ts.isJsxSelfClosingElement(node.arguments[0]) ||
          ts.isJsxFragment(node.arguments[0]))
      )
        renders.push(node);
    });

    if (renders.length !== 1) {
      manual.push(
        `Wrap the React root in ${relative(profile.cwd, entry.path)} with UIThemeProvider. The entry uses a custom render function.`
      );

      return;
    }

    const child = renders[0].arguments[0];
    rootNode = child;
    edits.push({
      start: child.getStart(file),
      end: child.end,
      text: `<UIThemeSetup>${child.getText(file)}</UIThemeSetup>`,
    });
  }

  const localComponents = relative(profile.cwd, profile.componentsDir);

  const wrapperDirectory =
    localComponents === '..' ||
    localComponents.startsWith('../') ||
    isAbsolute(localComponents)
      ? join(profile.cwd, 'components')
      : dirname(profile.componentsDir);

  const wrapperPath = join(
    wrapperDirectory,
    `uitheme-provider.${profile.language === 'ts' ? 'tsx' : 'jsx'}`
  );

  const provider =
    profile.framework === 'next' ? 'NextUIThemeProvider' : 'UIThemeProvider';

  const wrapper = `${profile.framework === 'next' ? "'use client';\n\n" : ''}import { ${provider} } from 'uitheme-web/${profile.framework === 'next' ? 'next' : 'react'}';\n${profile.language === 'ts' ? "import type { ReactNode } from 'react';\n" : ''}\nexport function UIThemeSetup({ children }${profile.language === 'ts' ? ': { children: ReactNode }' : ''}) {\n  return <${provider} defaultTheme="system" defaultColorTheme="default" colorThemes={['default']}>{children}</${provider}>;\n}\n`;
  const directProviders = new Set<string>();
  let setupImported = false;
  let setupConflict = false;

  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const module = statement.moduleSpecifier.text;
    const bindings = statement.importClause?.namedBindings;

    if (!bindings || !ts.isNamedImports(bindings)) continue;

    for (const element of bindings.elements) {
      const exported = element.propertyName?.text ?? element.name.text;

      if (
        (module === 'uitheme-web/react' || module === 'uitheme-web/next') &&
        ['UIThemeProvider', 'NextUIThemeProvider'].includes(exported)
      )
        directProviders.add(element.name.text);

      if (element.name.text === 'UIThemeSetup') {
        if (
          exported === 'UIThemeSetup' &&
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
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(file);

        if (directProviders.has(tag)) directProviderUsed = true;

        if (tag === 'UIThemeSetup') setupUsed = true;
      }
    });

  if (directProviderUsed) return;
  const planned = await planFile(profile, wrapperPath, wrapper);

  if (planned.action === 'replace' && !options.overwrite) {
    manual.push(
      `Existing provider file requires --overwrite: ${relative(profile.cwd, wrapperPath)}`
    );

    return;
  }

  if (setupUsed && setupImported) {
    files.push(planned);

    return;
  }

  if (
    setupConflict ||
    setupUsed ||
    /\b(?:const|function|class)\s+UIThemeSetup\b/.test(entry.content)
  ) {
    manual.push(
      `Choose an unused provider binding in ${relative(profile.cwd, entry.path)}. UIThemeSetup already belongs to existing source.`
    );

    return;
  }

  let content = entry.content;

  for (const edit of edits.sort((a, b) => b.start - a.start))
    content =
      content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  const imported = `import { UIThemeSetup } from '${relativeImport(entry.path, wrapperPath)}';\n`;
  let insertAt = 0;

  for (const statement of file.statements) {
    if (
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression)
    )
      insertAt = statement.end;
    else break;
  }

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
  const file = sourceFile(entry.path, entry.content);
  const mounts: ts.CallExpression[] = [];
  walk(file, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'mount'
    )
      mounts.push(node);
  });

  if (mounts.length !== 1) {
    manual.push(
      `Install createUITheme() with app.use() in ${relative(profile.cwd, entry.path)}. The entry has no single mount call.`
    );

    return;
  }

  const mount = mounts[0].expression;

  if (!ts.isPropertyAccessExpression(mount))
    throw new Error('Manual provider setup required');
  const receiver = mount.expression;
  let known = false;
  walk(receiver, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'createApp'
    )
      known = true;
  });

  if (ts.isIdentifier(receiver))
    walk(file, (node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === receiver.text &&
        node.initializer
      )
        walk(node.initializer, (expression) => {
          if (
            ts.isCallExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            expression.expression.text === 'createApp'
          )
            known = true;
        });
    });

  if (!known) {
    manual.push(
      `Install createUITheme() on the Vue application in ${relative(profile.cwd, entry.path)}. Its mount receiver is custom.`
    );

    return;
  }

  const at = receiver.end;
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

  const file = sourceFile(entry.path, entry.content);
  let config: ts.ObjectLiteralExpression | undefined;

  for (const statement of file.statements)
    if (
      ts.isExportAssignment(statement) &&
      ts.isCallExpression(statement.expression) &&
      ts.isIdentifier(statement.expression.expression) &&
      statement.expression.expression.text === 'defineNuxtConfig' &&
      statement.expression.arguments.length === 1
    ) {
      const value = unwrapExpression(statement.expression.arguments[0]);

      if (ts.isObjectLiteralExpression(value)) config = value;
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
    const array = unwrapExpression(modules.initializer);

    if (
      !ts.isArrayLiteralExpression(array) ||
      array.elements.some(ts.isSpreadElement)
    ) {
      manual.push("Add 'uitheme-web/nuxt' to the computed Nuxt modules array.");

      return;
    }

    if (
      array.elements.some(
        (value) =>
          ts.isStringLiteral(value) && value.text === 'uitheme-web/nuxt'
      )
    )
      return;
    const end = array.end - 1;
    content = `${entry.content.slice(0, end)}${array.elements.length && !array.elements.hasTrailingComma ? ',' : ''}'uitheme-web/nuxt'${entry.content.slice(end)}`;
  }

  files.push(await planFile(profile, entry.path, content));
}

export async function planInit(
  profile: ProjectProfile,
  options: PlanOptions = {}
): Promise<InstallPlan> {
  const files: PlannedFile[] = [],
    manualSteps: string[] = [];

  const utility = await planSharedUtils(profile, options);
  profile = utility.profile;
  files.push(utility.file);

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

  try {
    if (profile.framework === 'nuxt')
      await nuxtModule(profile, files, manualSteps);
    else if (profile.framework === 'vite-vue')
      await vueProvider(profile, files, manualSteps);
    else await reactProvider(profile, files, manualSteps, options);
  } catch (error) {
    manualSteps.push(error instanceof Error ? error.message : String(error));
  }

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
