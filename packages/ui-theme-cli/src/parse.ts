/* eslint-disable anti-slop/no-runtime-typeof -- walk untyped parser output at this boundary */
import { parse, parseExpression, type ParserPlugin } from '@babel/parser';
import type * as t from '@babel/types';

export type { t };

// mirrors the script kinds the typescript parser used: .js/.jsx/.tsx allowed jsx
function plugins(path: string): ParserPlugin[] {
  if (/\.tsx$/.test(path)) return ['typescript', 'jsx', 'decorators'];

  if (/\.(?:jsx|js)$/.test(path)) return ['jsx', 'decorators'];

  if (/\.[cm]?ts$/.test(path)) return ['typescript', 'decorators'];

  return ['decorators'];
}

/** Parse a module. Throws a SyntaxError when the source is not valid. */
export function parseModule(path: string, source: string): t.Program {
  return parse(source, {
    sourceType: 'module',
    sourceFilename: path,
    plugins: plugins(path),
    createParenthesizedExpressions: true,
    errorRecovery: false,
  }).program;
}

export function parseObjectExpression(source: string): t.Expression {
  return parseExpression(source, {
    createParenthesizedExpressions: true,
    errorRecovery: true,
  });
}

const skipped = new Set([
  'type',
  'start',
  'end',
  'loc',
  'range',
  'extra',
  'leadingComments',
  'trailingComments',
  'innerComments',
]);

export function children(node: t.Node): t.Node[] {
  const result: t.Node[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (skipped.has(key) || !value || typeof value !== 'object') continue;

    for (const child of Array.isArray(value) ? value : [value])
      if (child && typeof child === 'object' && typeof child.type === 'string')
        result.push(child);
  }

  return result;
}

export function walk(
  node: t.Node,
  visit: (node: t.Node, parents: readonly t.Node[]) => boolean | void,
  parents: t.Node[] = []
): void {
  if (visit(node, parents) === false) return;
  parents.push(node);

  for (const child of children(node)) walk(child, visit, parents);
  parents.pop();
}

export function text(source: string, node: t.Node): string {
  return source.slice(node.start!, node.end!);
}

// only whitespace, commas and comments can sit between the last item and the closer
export function hasTrailingComma(
  source: string,
  items: readonly (t.Node | null)[],
  closer: number
): boolean {
  const last = items.at(-1);

  if (!last) return items.length > 0;

  for (let index = last.end!; index < closer; index++) {
    if (source.startsWith('//', index))
      index =
        source.indexOf('\n', index) === -1
          ? closer
          : source.indexOf('\n', index);
    else if (source.startsWith('/*', index))
      index = source.indexOf('*/', index + 2) + 1;
    else if (source[index] === ',') return true;
  }

  return false;
}

export function isCall(
  node: t.Node
): node is t.CallExpression | t.OptionalCallExpression {
  return (
    node.type === 'CallExpression' || node.type === 'OptionalCallExpression'
  );
}

export function isMember(
  node: t.Node
): node is t.MemberExpression | t.OptionalMemberExpression {
  return (
    node.type === 'MemberExpression' || node.type === 'OptionalMemberExpression'
  );
}

/** The name of `a.name` or `a?.name`, as the TypeScript API exposed it. */
export function memberName(node: t.Node): string | undefined {
  if (!isMember(node) || node.computed) return;

  if (node.property.type === 'Identifier') return node.property.name;

  if (node.property.type === 'PrivateName') return `#${node.property.id.name}`;
}

/** The `a` of `a.name` or `a?.name`. */
export function memberObject(node: t.Node): t.Expression | undefined {
  if (isMember(node) && node.object && node.object.type !== 'Super')
    return node.object;
}

export function moduleName(node: t.Identifier | t.StringLiteral): string {
  return node.type === 'Identifier' ? node.name : node.value;
}
