import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { displayPath, samePath } from '../../paths.ts';
import { parseModule, text, walk, type t } from '../../parse.ts';
import { applyEdits, type Edit } from '../../migrate/rewrite.ts';
import { unwrapExpression } from '../../tailwind/index.ts';
import type { ProjectProfile } from '../../types.ts';
import { targetFor, type ReactTarget } from '../targets.ts';
import {
  NextThemesRefusal,
  docsUrl,
  messages,
  type DocsAnchor,
} from '../../install/messages.ts';

export interface NextThemesPlan {
  files: { path: string; content: string }[];
  remove: boolean;
}

const skipped = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  '.vercel',
  '.output',
  'dist',
  'build',
  'out',
  'coverage',
]);

const sourcePattern = /\.(?:[cm]?[jt]s|[jt]sx)$/;

const themeValues = ['light', 'dark', 'system'];

const hookMembers = [
  'theme',
  'setTheme',
  'resolvedTheme',
  'systemTheme',
  'themes',
];

async function sources(root: string, directory = root): Promise<string[]> {
  const found: string[] = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!skipped.has(entry.name)) found.push(...(await sources(root, path)));
    } else if (sourcePattern.test(entry.name)) found.push(path);
  }

  return found;
}

interface Unit {
  path: string;
  source: string;
  program: t.Program;
  edits: Edit[];
}

type Element = t.JSXOpeningElement;

class Converter {
  private units = new Map<string, Unit>();
  private handled = new Set<t.Node>();
  private direct: { unit: Unit; element: Element }[] = [];
  private wrappers: {
    unit: Unit;
    name: string;
    element: Element;
  }[] = [];

  constructor(
    private profile: ProjectProfile,
    private files: string[]
  ) {}

  private get next() {
    return this.profile.framework === 'next';
  }

  private get target(): ReactTarget {
    const target = targetFor(this.profile.framework);

    if (target.kind !== 'react')
      throw new Error(`${this.profile.framework} has no React provider`);

    return target;
  }

  private refuse(
    unit: Unit,
    node: t.Node,
    form: string,
    anchor: DocsAnchor
  ): never {
    throw new NextThemesRefusal(
      messages.refusal(
        `${displayPath(this.profile.cwd, unit.path)}:${node.loc?.start.line ?? 1}`,
        form,
        anchor
      )
    );
  }

  private async load(path: string): Promise<Unit> {
    const known = this.units.get(path);

    if (known) return known;
    const source = await readFile(path, 'utf8');
    let program: t.Program;

    try {
      program = parseModule(path, source);
    } catch {
      throw new NextThemesRefusal(
        `Stopped. No file changed. ${displayPath(this.profile.cwd, path)} has a syntax error, so init cannot read it. Fix the error and run init again. See ${docsUrl}#provider-shape`
      );
    }

    const unit = { path, source, program, edits: [] };
    this.units.set(path, unit);

    return unit;
  }

  async run(): Promise<NextThemesPlan | undefined> {
    const found: Unit[] = [];

    for (const path of this.files)
      if ((await readFile(path, 'utf8')).includes('next-themes'))
        found.push(await this.load(path));

    for (const unit of found) this.convertFile(unit);

    if (!found.length) return;

    if (!this.direct.length && !this.wrappers.length)
      throw new NextThemesRefusal(messages.noProvider());

    if (this.direct.length + this.wrappers.length > 1) {
      const second = this.direct[1] ?? this.wrappers[1] ?? this.wrappers[0];
      this.refuse(
        second.unit,
        second.element,
        'a second ThemeProvider',
        'provider-shape'
      );
    }

    for (const { unit, element } of this.direct)
      unit.edits.push(...this.mapProps(unit, element));

    for (const wrapper of this.wrappers) await this.convertCalls(wrapper);

    const files = [...this.units.values()].flatMap((unit) =>
      unit.edits.length
        ? [{ path: unit.path, content: applyEdits(unit.source, unit.edits) }]
        : []
    );

    // a leftover mention would break the app once the package is gone
    for (const file of files)
      if (file.content.includes('next-themes'))
        throw new NextThemesRefusal(
          `Stopped. No file changed. ${displayPath(this.profile.cwd, file.path)} still mentions next-themes after the rewrite. See ${docsUrl}#provider-shape`
        );

    return { files, remove: false };
  }

  private convertFile(unit: Unit) {
    const imports: t.ImportDeclaration[] = [];
    let provider: string | undefined, hook: string | undefined;
    const providerProps: string[] = [];

    for (const statement of unit.program.body) {
      if (
        statement.type !== 'ImportDeclaration' ||
        statement.source.value !== 'next-themes'
      )
        continue;
      this.handled.add(statement.source);
      imports.push(statement);

      if (!statement.specifiers.length)
        this.refuse(
          unit,
          statement,
          'a bare import of next-themes',
          'provider-shape'
        );

      for (const specifier of statement.specifiers) {
        if (specifier.type !== 'ImportSpecifier')
          this.refuse(
            unit,
            specifier,
            'a default or namespace import',
            'usetheme'
          );

        const name =
          specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : specifier.imported.value;

        if (name === 'ThemeProvider') provider = specifier.local.name;
        else if (name === 'useTheme') hook = specifier.local.name;
        else if (name === 'ThemeProviderProps')
          providerProps.push(specifier.local.name);
        else this.refuse(unit, specifier, `the import ${name}`, 'usetheme');
      }
    }

    walk(unit.program, (node) => {
      if (
        (node.type === 'StringLiteral' &&
          (node.value === 'next-themes' ||
            node.value.startsWith('next-themes/')) &&
          !this.handled.has(node)) ||
        (node.type === 'TemplateElement' &&
          node.value.raw.includes('next-themes'))
      )
        this.refuse(
          unit,
          node,
          'next-themes outside a plain import (require, dynamic import, re-export, mock or config)',
          'usetheme'
        );
    });

    const target = this.target,
      module = target.module,
      providerName = target.provider,
      hookName = target.hook,
      propsName = `${providerName}Props`;

    for (const statement of imports) {
      const parts: string[] = [];

      for (const specifier of statement.specifiers) {
        if (specifier.type !== 'ImportSpecifier') continue;

        const imported = specifier.imported,
          name =
            imported.type === 'Identifier' ? imported.name : imported.value,
          next =
            name === 'ThemeProvider'
              ? providerName
              : name === 'useTheme'
                ? hookName
                : propsName,
          local = specifier.local.name,
          inline = specifier.importKind === 'type';

        parts.push(
          `${inline ? 'type ' : ''}${next === local ? next : `${next} as ${local}`}`
        );
      }

      const original = text(unit.source, statement),
        quote = original.includes("'") && !original.includes('"') ? "'" : '"',
        semicolon = original.trimEnd().endsWith(';') ? ';' : '';

      unit.edits.push({
        start: statement.start!,
        end: statement.end!,
        text: `import ${statement.importKind === 'type' ? 'type ' : ''}{ ${parts.join(', ')} } from ${quote}${module}${quote}${semicolon}`,
      });
    }

    if (provider) this.findProvider(unit, provider);

    if (hook) this.checkHook(unit, hook);
  }

  private findProvider(unit: Unit, local: string) {
    walk(unit.program, (node, parents) => {
      const parent = parents.at(-1);

      if (node.type === 'JSXOpeningElement') {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== local)
          return;
        this.useProvider(unit, node, [...parents]);

        return;
      }

      if (node.type !== 'Identifier' || node.name !== local || !parent) return;

      if (
        parent.type === 'ImportSpecifier' ||
        parent.type === 'TSTypeQuery' ||
        (parent.type === 'MemberExpression' &&
          parent.property === node &&
          !parent.computed) ||
        (parent.type === 'ObjectProperty' &&
          parent.key === node &&
          !parent.computed)
      )
        return;
      this.refuse(unit, node, 'ThemeProvider outside JSX', 'provider-shape');
    });
  }

  private useProvider(unit: Unit, element: Element, parents: t.Node[]) {
    const boundary = parents
      .map(
        (node) =>
          node.type === 'FunctionDeclaration' ||
          node.type === 'FunctionExpression' ||
          node.type === 'ArrowFunctionExpression'
      )
      .lastIndexOf(true);

    for (const node of parents.slice(boundary + 1))
      if (
        [
          'ConditionalExpression',
          'LogicalExpression',
          'IfStatement',
          'SwitchStatement',
        ].includes(node.type)
      )
        this.refuse(
          unit,
          element,
          'a conditional ThemeProvider',
          'provider-shape'
        );

    const spreads = element.attributes.filter(
      (attribute) => attribute.type === 'JSXSpreadAttribute'
    );

    if (!spreads.length) {
      this.direct.push({ unit, element });

      return;
    }

    const enclosing = parents[boundary],
      fn =
        enclosing?.type === 'FunctionDeclaration' ||
        enclosing?.type === 'ArrowFunctionExpression'
          ? enclosing
          : undefined,
      param = fn?.params[0];

    const rest =
      param?.type === 'ObjectPattern'
        ? param.properties.find((property) => property.type === 'RestElement')
        : undefined;

    const restName =
      rest?.argument.type === 'Identifier' ? rest.argument.name : undefined;

    const jsx = parents.at(-1)!;

    const body =
      fn?.body.type === 'BlockStatement'
        ? fn.body.body.length === 1 &&
          fn.body.body[0].type === 'ReturnStatement'
          ? fn.body.body[0].argument
          : undefined
        : fn?.body;

    const clean =
      body &&
      // SAFETY: a returned argument or an arrow expression body is an expression
      unwrapExpression(body as t.Expression) === jsx &&
      element.attributes.length === 1 &&
      spreads[0].argument.type === 'Identifier' &&
      spreads[0].argument.name === restName;

    const declaration = parents.find(
      (node): node is t.ExportNamedDeclaration =>
        node.type === 'ExportNamedDeclaration'
    );

    const exported =
      declaration?.declaration?.type === 'FunctionDeclaration'
        ? declaration.declaration.id?.name
        : declaration?.declaration?.type === 'VariableDeclaration' &&
            declaration.declaration.declarations[0].id.type === 'Identifier'
          ? declaration.declaration.declarations[0].id.name
          : undefined;

    if (!clean || !exported)
      this.refuse(
        unit,
        element,
        'a ThemeProvider wrapper with extra logic, a props spread or an unnamed export',
        'provider-shape'
      );
    this.wrappers.push({ unit, name: exported!, element });
  }

  private async convertCalls(wrapper: { unit: Unit; name: string }) {
    const stem = wrapper.unit.path.replace(/\.[^./\\]+$/, ''),
      relativeStem = displayPath(this.profile.cwd, stem);

    const matches = (from: string, specifier: string) => {
      const bare = specifier.replace(/\.[jt]sx?$/, '');

      if (bare.startsWith('.'))
        return samePath(resolve(dirname(from), bare), stem);
      const rest = bare.replace(/^(?:@|~|#)\//, '');

      return (
        rest !== bare &&
        (rest === relativeStem || `src/${rest}` === relativeStem)
      );
    };

    for (const path of this.files) {
      if (path === wrapper.unit.path) continue;
      const content = await readFile(path, 'utf8');

      if (!content.includes(basename(stem))) continue;
      const unit = await this.load(path);
      let local: string | undefined;

      for (const statement of unit.program.body) {
        if (
          statement.type !== 'ImportDeclaration' ||
          !matches(path, statement.source.value)
        )
          continue;

        for (const specifier of statement.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            (specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value) === wrapper.name
          )
            local = specifier.local.name;
          else if (specifier.type !== 'ImportSpecifier')
            this.refuse(
              unit,
              specifier,
              'a default or namespace import of the ThemeProvider wrapper',
              'provider-shape'
            );
        }
      }

      if (!local) continue;
      const calls: Element[] = [];

      walk(unit.program, (node, parents) => {
        if (node.type === 'JSXOpeningElement') {
          if (node.name.type === 'JSXIdentifier' && node.name.name === local)
            calls.push(node);
        } else if (
          node.type === 'Identifier' &&
          node.name === local &&
          parents.at(-1)?.type !== 'ImportSpecifier'
        )
          this.refuse(
            unit,
            node,
            'the ThemeProvider wrapper outside JSX',
            'provider-shape'
          );
      });

      if (calls.length > 1)
        this.refuse(unit, calls[1], 'a second ThemeProvider', 'provider-shape');

      for (const call of calls) unit.edits.push(...this.mapProps(unit, call));
    }
  }

  private mapProps(unit: Unit, element: Element): Edit[] {
    const refuse = (node: t.Node, form: string) =>
      this.refuse(unit, node, form, 'provider-props');

    const inner = (attribute: t.JSXAttribute) => {
      const value = attribute.value;

      if (value?.type !== 'JSXExpressionContainer') return value;

      return value.expression.type === 'JSXEmptyExpression'
        ? undefined
        : unwrapExpression(value.expression);
    };

    const string = (attribute: t.JSXAttribute) => {
      const value = inner(attribute);

      return value?.type === 'StringLiteral' ? value.value : undefined;
    };

    const flag = (attribute: t.JSXAttribute, name: string) => {
      if (!attribute.value) return true;

      const value = inner(attribute);

      if (value?.type !== 'BooleanLiteral')
        return refuse(attribute, `a computed ${name}`);

      return value.value;
    };

    const named = new Map<string, t.JSXAttribute>(),
      order: [string, t.JSXAttribute][] = [];

    for (const attribute of element.attributes) {
      if (
        attribute.type !== 'JSXAttribute' ||
        attribute.name.type !== 'JSXIdentifier'
      ) {
        refuse(attribute, 'a props spread');
        continue;
      }

      named.set(attribute.name.name, attribute);
      order.push([attribute.name.name, attribute]);
    }

    const system = named.has('enableSystem')
      ? flag(named.get('enableSystem')!, 'enableSystem')
      : true;

    const removed = new Set<t.JSXAttribute>(),
      replaced = new Map<t.JSXAttribute, string>(),
      added: string[] = [];

    for (const [name, attribute] of order) {
      if (name === 'attribute') {
        const value = string(attribute);

        if (value === 'class') removed.add(attribute);
        else if (!(value === 'data-theme' && this.next))
          refuse(
            attribute,
            value ? `attribute="${value}"` : 'a computed attribute'
          );
      } else if (name === 'defaultTheme') {
        const value = string(attribute);

        if (
          !value ||
          !themeValues.includes(value) ||
          (!system && value === 'system')
        )
          refuse(attribute, 'a defaultTheme that is not light, dark or system');
      } else if (name === 'enableSystem') removed.add(attribute);
      else if (name === 'enableColorScheme') {
        if (!flag(attribute, name))
          refuse(attribute, 'enableColorScheme={false}');
        removed.add(attribute);
      } else if (name === 'disableTransitionOnChange') {
        if (!flag(attribute, name)) removed.add(attribute);
      } else if (name === 'storageKey' || name === 'nonce') {
        if (!attribute.value) refuse(attribute, `a ${name} without a value`);
      } else if (name === 'themes') {
        const value = inner(attribute),
          items: string[] = [];

        if (value?.type === 'ArrayExpression')
          for (const item of value.elements)
            if (
              item?.type === 'StringLiteral' &&
              (item.value === 'light' || item.value === 'dark')
            )
              items.push(item.value);
            else refuse(attribute, 'themes other than light and dark');
        else refuse(attribute, 'themes other than light and dark');

        const list = [...items, ...(system ? ['system'] : [])];
        replaced.set(
          attribute,
          `themes={[${list.map((item) => `'${item}'`).join(', ')}]}`
        );
      } else refuse(attribute, `the prop ${name}`);
    }

    if (!named.has('attribute')) {
      if (this.next) added.push('attribute="data-theme"');
      else refuse(element, 'the default data-theme attribute');
    }

    if (this.target.systemThemeMode)
      added.push(`systemThemeMode="${this.target.systemThemeMode}"`);

    if (!system) {
      if (!named.has('themes')) added.push(`themes={['light', 'dark']}`);

      if (!named.has('defaultTheme')) added.push('defaultTheme="light"');
    }

    const edits: Edit[] = [];
    let previous = element.name.end!;

    for (const [, attribute] of order) {
      if (removed.has(attribute))
        edits.push({ start: previous, end: attribute.end!, text: '' });
      else if (replaced.has(attribute))
        edits.push({
          start: attribute.start!,
          end: attribute.end!,
          text: replaced.get(attribute)!,
        });
      previous = attribute.end!;
    }

    if (added.length)
      edits.push({
        start: element.name.end!,
        end: element.name.end!,
        text: added.map((attribute) => ` ${attribute}`).join(''),
      });

    return edits;
  }

  private checkHook(unit: Unit, local: string) {
    const refuse = (node: t.Node, form: string) =>
      this.refuse(unit, node, form, 'usetheme');

    const setters = new Set<string>(),
      contexts = new Set<string>();

    walk(unit.program, (node, parents) => {
      const parent = parents.at(-1);

      if (node.type === 'Identifier' && node.name === local && parent) {
        if (parent.type === 'ImportSpecifier') return;

        if (parent.type !== 'CallExpression' || parent.callee !== node)
          refuse(node, 'useTheme as a value');
      }

      if (
        node.type !== 'CallExpression' ||
        node.callee.type !== 'Identifier' ||
        node.callee.name !== local
      )
        return;

      if (parent?.type !== 'VariableDeclarator')
        return refuse(node, 'a useTheme call that is not assigned');
      const id = parent.id;

      if (id.type === 'Identifier') contexts.add(id.name);
      else if (id.type === 'ObjectPattern')
        for (const property of id.properties) {
          if (
            property.type !== 'ObjectProperty' ||
            property.computed ||
            property.key.type !== 'Identifier' ||
            !hookMembers.includes(property.key.name)
          )
            return refuse(
              property,
              property.type === 'ObjectProperty' &&
                property.key.type === 'Identifier' &&
                property.key.name === 'forcedTheme'
                ? 'forcedTheme'
                : 'a useTheme member that UI-Theme does not return'
            );

          const value =
            property.value.type === 'AssignmentPattern'
              ? property.value.left
              : property.value;

          if (property.key.name === 'setTheme' && value.type === 'Identifier')
            setters.add(value.name);
        }
      else return refuse(node, 'a destructuring that init cannot read');
    });

    walk(unit.program, (node, parents) => {
      const parent = parents.at(-1);

      if (
        node.type === 'Identifier' &&
        contexts.has(node.name) &&
        parent &&
        parent.type !== 'VariableDeclarator'
      ) {
        if (
          parent.type !== 'MemberExpression' ||
          parent.object !== node ||
          parent.computed ||
          parent.property.type !== 'Identifier' ||
          !hookMembers.includes(parent.property.name)
        )
          refuse(node, 'the whole useTheme result as an object');
      }

      if (node.type !== 'CallExpression') return;
      const callee = node.callee;

      const isSetter =
        (callee.type === 'Identifier' && setters.has(callee.name)) ||
        (callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          contexts.has(callee.object.name) &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'setTheme');

      if (!isSetter) return;
      const [argument] = node.arguments;

      if (
        !argument ||
        argument.type === 'ArrowFunctionExpression' ||
        argument.type === 'FunctionExpression' ||
        (argument.type === 'StringLiteral' &&
          !themeValues.includes(argument.value))
      )
        refuse(
          node,
          'setTheme with a function or a theme other than light, dark or system'
        );
    });
  }
}

export async function planNextThemes(
  profile: ProjectProfile
): Promise<NextThemesPlan | undefined> {
  if (!['next', 'tanstack', 'vite-react'].includes(profile.framework)) return;
  let manifest: Record<string, Record<string, string> | undefined> = {};

  try {
    manifest = JSON.parse(
      await readFile(join(profile.cwd, 'package.json'), 'utf8')
    );
  } catch {
    return;
  }

  const declared = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
  ].some((field) => manifest[field] && 'next-themes' in manifest[field]!);

  const plan = await new Converter(profile, await sources(profile.cwd)).run();

  if (!plan) return declared ? { files: [], remove: true } : undefined;

  return { ...plan, remove: declared };
}
