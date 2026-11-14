import {
  isCall,
  memberName,
  moduleName,
  parseModule,
  parseObjectExpression,
  text,
  walk,
  type t,
} from '../parse.ts';

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

// a string literal or a template literal without substitutions
function stringValue(node: t.Node): string | undefined {
  if (node.type === 'StringLiteral') return node.value;

  if (node.type === 'TemplateLiteral' && !node.expressions.length)
    return node.quasis[0].value.cooked ?? undefined;
}

function identifierName(node: t.Node): string | undefined {
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier')
    return node.name;
}

export function rewriteScript(
  source: string,
  filename: string,
  controls: LocalControls
) {
  let ast: t.Program;

  try {
    ast = parseModule(filename, source);
  } catch {
    return {
      text: source,
      diagnostics: [
        'Source syntax could not be parsed safely. Fix the syntax or migrate this file manually.',
      ],
    };
  }

  const edits: Edit[] = [];
  const diagnostics: string[] = [];
  const providers = new Set<string>();

  for (const node of ast.body) {
    if (node.type !== 'ImportDeclaration' || !runtimeModule(node.source.value))
      continue;

    for (const item of node.specifiers)
      if (
        item.type === 'ImportSpecifier' &&
        moduleName(item.imported) === 'UIThemeProvider'
      )
        providers.add(item.local.name);
  }

  const hasProviderAncestor = (parents: readonly t.Node[]): boolean =>
    parents.some(
      (parent) =>
        parent.type === 'JSXElement' &&
        parent.closingElement !== null &&
        providers.has(text(source, parent.openingElement.name))
    );

  const migrateControl = (
    item: t.ImportSpecifier,
    declaration: t.ImportDeclaration
  ): string | undefined => {
    const original = moduleName(item.imported);

    if (original.startsWith('UISelect')) {
      diagnostics.push(
        `${original}: removed select primitive requires manual replacement with your selected UI library before upgrading the runtime.`
      );

      return;
    }

    const local = controls[original];

    if (
      !local ||
      item.importKind === 'type' ||
      declaration.importKind === 'type'
    ) {
      diagnostics.push(
        `${original}: install the matching local registry control, then replace this import and review its props.`
      );

      return;
    }

    let uses = 0;
    let unsafe = false;

    walk(ast, (node, parents) => {
      if (
        identifierName(node) !== item.local.name ||
        node === item.local ||
        node === item.imported
      )
        return;
      const parent = parents.at(-1);

      if (
        parent?.type !== 'JSXOpeningElement' ||
        !parent.selfClosing ||
        parent.name !== node ||
        parent.attributes.length ||
        !hasProviderAncestor(parents)
      )
        unsafe = true;
      uses++;
    });

    if (!uses || unsafe) {
      diagnostics.push(
        `${original}: custom props or unknown provider context need manual migration. Use the local ${local.exportName} with UIThemeProvider and review the old behavior.`
      );

      return;
    }

    return `import { ${local.exportName} as ${item.local.name} } from '${local.file}';`;
  };

  const comments = (start: number, end: number) =>
    source.slice(start, end).match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g) ?? [];

  const importDeclaration = (node: t.ImportDeclaration) => {
    const module = node.source;

    const elements = node.specifiers.filter(
      (item): item is t.ImportSpecifier => item.type === 'ImportSpecifier'
    );

    if (runtimeModule(module.value)) {
      const old = elements.filter((item) =>
        removed.has(moduleName(item.imported))
      );

      if (old.length) {
        const replacements = old
          .map((item) => migrateControl(item, node))
          .filter((value): value is string => !!value);

        if (replacements.length !== old.length) return;

        const retained = elements.filter((item) => !old.includes(item));

        const hasDefault = node.specifiers.some(
          (item) => item.type === 'ImportDefaultSpecifier'
        );

        if (retained.length || hasDefault) {
          for (let index = 0; index < elements.length; index++) {
            if (!old.includes(elements[index])) continue;
            const first = index;

            while (
              index + 1 < elements.length &&
              old.includes(elements[index + 1])
            )
              index++;
            const next = elements[index + 1];
            const previous = elements[first - 1];

            const start = next
              ? elements[first].start!
              : previous
                ? previous.end!
                : elements[first].start!;

            const end = next ? next.start! : elements[index].end!;
            const kept = comments(start, end);

            edits.push({
              start,
              end,
              text: kept.length ? ' ' + kept.join('\n') + '\n' : '',
            });
          }

          edits.push({
            start: node.end!,
            end: node.end!,
            text: '\n' + replacements.join('\n'),
          });
        } else {
          edits.push({
            start: node.start!,
            end: node.end!,
            text: [...comments(node.start!, node.end!), ...replacements].join(
              '\n'
            ),
          });

          return;
        }
      }
    }

    if (
      runtimeModule(module.value) &&
      node.specifiers.some((item) => item.type === 'ImportNamespaceSpecifier')
    )
      diagnostics.push(
        'Namespace theme imports need a manual check for removed styled controls. Replace the namespace with explicit provider/composable imports.'
      );

    if (
      module.value.startsWith('uitheme-vue/') &&
      !['uitheme-vue/nuxt', 'uitheme-vue/bootstrap'].includes(module.value)
    )
      diagnostics.push(
        `Unsupported legacy entry ${module.value}: choose an explicit uitheme-web subpath before migration.`
      );
    const value = specifier(module.value);

    if (value !== module.value)
      edits.push({
        start: module.start! + 1,
        end: module.end! - 1,
        text: value,
      });
  };

  const nuxtConfig = /(?:^|[/\\])nuxt\.config\.[cm]?[jt]s$/.test(filename);

  walk(ast, (node, parents) => {
    if (node.type === 'ImportDeclaration') {
      importDeclaration(node);

      return false;
    }

    if (
      (node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportAllDeclaration') &&
      node.source &&
      runtimeModule(node.source.value) &&
      (node.type === 'ExportAllDeclaration' ||
        node.specifiers.some(
          (item) =>
            item.type !== 'ExportSpecifier' ||
            removed.has(moduleName(item.local))
        ))
    )
      diagnostics.push(
        'Removed styled control re-exports need manual migration to local registry components.'
      );

    const value =
      stringValue(node) ??
      (nuxtConfig && node.type === 'DirectiveLiteral' ? node.value : undefined);

    if (value !== undefined) {
      const parent = parents.at(-1);
      const grandparent = parents.at(-2);

      const call =
        parent?.type === 'ImportExpression'
          ? parent.source === node
          : !!parent &&
            isCall(parent) &&
            parent.arguments[0] === node &&
            (parent.callee.type === 'Import' ||
              (parent.callee.type === 'Identifier' &&
                parent.callee.name === 'require'));

      const isModule =
        call ||
        ((parent?.type === 'ExportNamedDeclaration' ||
          parent?.type === 'ExportAllDeclaration') &&
          parent.source === node) ||
        parent?.type === 'TSExternalModuleReference' ||
        parent?.type === 'TSImportType' ||
        (parent?.type === 'TSLiteralType' &&
          grandparent?.type === 'TSImportType') ||
        (nuxtConfig && value === 'uitheme-vue/nuxt');

      if (isModule) {
        if (call && runtimeModule(value))
          diagnostics.push(
            'Dynamic or require theme imports need a manual check for removed styled controls. Use explicit named imports first.'
          );
        const next = specifier(value);

        if (next !== value)
          edits.push({
            start: node.start! + 1,
            end: node.end! - 1,
            text: next,
          });
      }
    }

    const member =
      memberName(node) ??
      (node.type === 'JSXMemberExpression' ? node.property.name : undefined);

    if (member && removed.has(member))
      diagnostics.push(
        `${member}: namespace control access requires a local component import and a manual prop review.`
      );
  });

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
  const expression = parseObjectExpression(source);

  if (expression.type !== 'ObjectExpression')
    throw new Error('package.json must contain an object.');
  const edits: Edit[] = [];

  for (const property of expression.properties) {
    if (
      property.type !== 'ObjectProperty' ||
      property.key.type !== 'StringLiteral'
    )
      continue;
    const key = property.key.value;

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

    if (property.value.type !== 'ObjectExpression') continue;

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
      source.lastIndexOf('\n', property.start!) + 1,
      property.start!
    );

    const text = JSON.stringify(next, null, indent).replaceAll(
      '\n',
      '\n' + (/^[ \t]*$/.test(prefix) ? prefix : '')
    );

    edits.push({
      start: property.value.start!,
      end: property.value.end!,
      text,
    });
  }

  return applyEdits(source, edits);
}
