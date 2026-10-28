import ts from 'typescript';

export interface Edit {
  start: number;
  end: number;
  text: string;
}

export interface LocalControl {
  file: string;
  exportName: string;
}

export type LocalControls = Record<string, LocalControl | undefined>;

export function applyEdits(source: string, edits: Edit[]): string {
  return [...edits]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (text, edit) =>
        text.slice(0, edit.start) + edit.text + text.slice(edit.end),
      source
    );
}

function specifier(value: string): string {
  if (value === 'uitheme-vue') return 'uitheme-web/vue';

  if (value === 'uitheme-vue/nuxt') return 'uitheme-web/nuxt';

  if (value === 'uitheme-vue/bootstrap') return 'uitheme-web/vue/bootstrap';

  return value.replace(/^@ui-theme\/web(?=\/|$)/, 'uitheme-web');
}

const removed = new Set([
  'UIThemeSwitcher',
  'UIThemeSelector',
  'UIThemeSwitcherProps',
  'UIThemeSelectorProps',
  'UISelect',
  'UISelectContent',
  'UISelectGroup',
  'UISelectItem',
  'UISelectLabel',
  'UISelectScrollDownButton',
  'UISelectScrollUpButton',
  'UISelectSeparator',
  'UISelectTrigger',
  'UISelectValue',
]);

const runtimeModule = (name: string) =>
  [
    'uitheme-web/react',
    '@ui-theme/web/react',
    'uitheme-vue',
    'uitheme-web/vue',
  ].includes(name);

export function rewriteScript(
  source: string,
  filename: string,
  controls: LocalControls
) {
  const ast = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    /\.(?:[jt]sx|js)$/.test(filename) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const edits: Edit[] = [];
  const diagnostics: string[] = [];

  if (
    'parseDiagnostics' in ast &&
    Array.isArray(ast.parseDiagnostics) &&
    ast.parseDiagnostics.length
  )
    return {
      text: source,
      diagnostics: [
        'Source syntax could not be parsed safely. Fix the syntax or migrate this file manually.',
      ],
    };
  const providers = new Set<string>();

  for (const node of ast.statements) {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      !runtimeModule(node.moduleSpecifier.text)
    )
      continue;
    const bindings = node.importClause?.namedBindings;

    if (bindings && ts.isNamedImports(bindings))
      for (const item of bindings.elements) {
        if ((item.propertyName ?? item.name).text === 'UIThemeProvider')
          providers.add(item.name.text);
      }
  }

  const hasProviderAncestor = (node: ts.Node): boolean => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (
        ts.isJsxElement(parent) &&
        providers.has(parent.openingElement.tagName.getText(ast))
      )
        return true;
    }

    return false;
  };

  const migrateControl = (
    item: ts.ImportSpecifier,
    declaration: ts.ImportDeclaration
  ): string | undefined => {
    const original = (item.propertyName ?? item.name).text;

    if (original.startsWith('UISelect')) {
      diagnostics.push(
        `${original}: removed select primitive requires manual replacement with your selected UI library before upgrading the runtime.`
      );

      return;
    }

    const local = controls[original];

    if (!local || item.isTypeOnly || declaration.importClause?.isTypeOnly) {
      diagnostics.push(
        `${original}: install the matching local registry control, then replace this import and review its props.`
      );

      return;
    }

    let uses = 0;
    let unsafe = false;

    const inspect = (node: ts.Node) => {
      if (
        ts.isIdentifier(node) &&
        node.text === item.name.text &&
        node !== item.name &&
        node !== item.propertyName
      ) {
        if (
          !ts.isJsxSelfClosingElement(node.parent) ||
          node.parent.tagName !== node ||
          node.parent.attributes.properties.length ||
          !hasProviderAncestor(node)
        )
          unsafe = true;
        uses++;
      }

      ts.forEachChild(node, inspect);
    };

    inspect(ast);

    if (!uses || unsafe) {
      diagnostics.push(
        `${original}: custom props or unknown provider context need manual migration. Use the local ${local.exportName} with UIThemeProvider and review the old behavior.`
      );

      return;
    }

    return `import { ${local.exportName} as ${item.name.text} } from '${local.file}';`;
  };

  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const module = node.moduleSpecifier;
      const bindings = node.importClause?.namedBindings;

      if (
        runtimeModule(module.text) &&
        bindings &&
        ts.isNamedImports(bindings)
      ) {
        const old = bindings.elements.filter((item) =>
          removed.has((item.propertyName ?? item.name).text)
        );

        if (old.length) {
          const replacements = old
            .map((item) => migrateControl(item, node))
            .filter((value): value is string => !!value);

          if (replacements.length !== old.length) return;

          const retained = bindings.elements.filter(
            (item) => !old.includes(item)
          );

          if (retained.length || node.importClause?.name) {
            for (let index = 0; index < bindings.elements.length; index++) {
              if (!old.includes(bindings.elements[index])) continue;
              const first = index;

              while (
                index + 1 < bindings.elements.length &&
                old.includes(bindings.elements[index + 1])
              )
                index++;
              const next = bindings.elements[index + 1];
              const previous = bindings.elements[first - 1];

              const start = next
                ? bindings.elements[first].getStart(ast)
                : previous
                  ? previous.end
                  : bindings.elements[first].getStart(ast);

              const end = next
                ? next.getStart(ast)
                : bindings.elements[index].end;

              const comments =
                source
                  .slice(start, end)
                  .match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g) ?? [];

              edits.push({
                start,
                end,
                text: comments.length ? ' ' + comments.join('\n') + '\n' : '',
              });
            }

            edits.push({
              start: node.end,
              end: node.end,
              text: '\n' + replacements.join('\n'),
            });
          } else {
            const comments =
              source
                .slice(node.getStart(ast), node.end)
                .match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g) ?? [];

            edits.push({
              start: node.getStart(ast),
              end: node.end,
              text: [...comments, ...replacements].join('\n'),
            });

            return;
          }
        }
      }

      if (
        runtimeModule(module.text) &&
        bindings &&
        ts.isNamespaceImport(bindings)
      )
        diagnostics.push(
          'Namespace theme imports need a manual check for removed styled controls. Replace the namespace with explicit provider/composable imports.'
        );

      if (
        module.text.startsWith('uitheme-vue/') &&
        !['uitheme-vue/nuxt', 'uitheme-vue/bootstrap'].includes(module.text)
      )
        diagnostics.push(
          `Unsupported legacy entry ${module.text}: choose an explicit uitheme-web subpath before migration.`
        );
      const value = specifier(module.text);

      if (value !== module.text)
        edits.push({
          start: module.getStart(ast) + 1,
          end: module.end - 1,
          text: value,
        });

      return;
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      runtimeModule(node.moduleSpecifier.text)
    ) {
      if (
        !node.exportClause ||
        !ts.isNamedExports(node.exportClause) ||
        node.exportClause.elements.some((item) =>
          removed.has((item.propertyName ?? item.name).text)
        )
      ) {
        diagnostics.push(
          'Removed styled control re-exports need manual migration to local registry components.'
        );
      }
    }

    if (ts.isStringLiteralLike(node)) {
      const parent = node.parent;

      const isModule =
        (ts.isExportDeclaration(parent) && parent.moduleSpecifier === node) ||
        (ts.isCallExpression(parent) &&
          parent.arguments[0] === node &&
          (parent.expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(parent.expression) &&
              parent.expression.text === 'require'))) ||
        ts.isExternalModuleReference(parent) ||
        (ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent)) ||
        (/(?:^|[/\\])nuxt\.config\.[cm]?[jt]s$/.test(filename) &&
          node.text === 'uitheme-vue/nuxt');

      if (isModule) {
        if (ts.isCallExpression(parent) && runtimeModule(node.text))
          diagnostics.push(
            'Dynamic or require theme imports need a manual check for removed styled controls. Use explicit named imports first.'
          );
        const value = specifier(node.text);

        if (value !== node.text)
          edits.push({
            start: node.getStart(ast) + 1,
            end: node.end - 1,
            text: value,
          });
      }
    }

    if (ts.isPropertyAccessExpression(node) && removed.has(node.name.text))
      diagnostics.push(
        `${node.name.text}: namespace control access requires a local component import and a manual prop review.`
      );
    ts.forEachChild(node, visit);
  };

  visit(ast);

  return { text: applyEdits(source, edits), diagnostics };
}

export function rewriteSource(
  source: string,
  filename: string,
  controls: LocalControls
) {
  if (filename.endsWith('.css'))
    return {
      text: source.replace(
        /node_modules\/@ui-theme\/web(?=\/|[\s'";)])/g,
        'node_modules/uitheme-web'
      ),
      diagnostics: [],
    };

  if (!filename.endsWith('.vue'))
    return rewriteScript(source, filename, controls);
  const edits: Edit[] = [];
  const diagnostics: string[] = [];

  for (const match of source.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
  )) {
    if (/\bsrc\s*=/.test(match[1])) {
      diagnostics.push('External Vue script blocks require manual migration.');
      continue;
    }

    const start = match.index! + match[0].indexOf('>') + 1;
    const result = rewriteScript(match[2], filename + '.ts', {});
    diagnostics.push(...result.diagnostics);
    edits.push({ start, end: start + match[2].length, text: result.text });
  }

  return { text: applyEdits(source, edits), diagnostics };
}

export function rewriteManifest(source: string): string {
  const manifest = JSON.parse(source);
  const ast = ts.parseJsonText('package.json', source);
  const statement = ast.statements[0];

  if (
    !statement ||
    !ts.isExpressionStatement(statement) ||
    !ts.isObjectLiteralExpression(statement.expression)
  )
    throw new Error('package.json must contain an object.');
  const expression = statement.expression;
  const edits: Edit[] = [];

  for (const property of expression.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      !ts.isStringLiteral(property.name)
    )
      continue;
    const key = property.name.text;

    if (
      ![
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ].includes(key)
    )
      continue;
    const values = manifest[key];

    if (!ts.isObjectLiteralExpression(property.initializer)) continue;

    if (
      !['@ui-theme/web', 'uitheme-vue', 'uitheme-web'].some(
        (name) => name in values
      )
    )
      continue;
    const next = { ...values };
    delete next['@ui-theme/web'];
    delete next['uitheme-vue'];
    next['uitheme-web'] = '^2.0.0';

    if (JSON.stringify(next) === JSON.stringify(values)) continue;
    const indent = /^([ \t]+)"/m.exec(source)?.[1] ?? '  ';

    const prefix = source.slice(
      source.lastIndexOf('\n', property.getStart(ast)) + 1,
      property.getStart(ast)
    );

    const text = JSON.stringify(next, null, indent).replaceAll(
      '\n',
      '\n' + (/^[ \t]*$/.test(prefix) ? prefix : '')
    );

    edits.push({
      start: property.initializer.getStart(ast),
      end: property.initializer.end,
      text,
    });
  }

  return applyEdits(source, edits);
}
