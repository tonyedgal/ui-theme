import ts from 'typescript';
import postcss from 'postcss';

type ColorFormat = 'css' | 'hsl-channels';

const light = {
  background: '0 0% 100%',
  foreground: '240 10% 3.9%',
  card: '0 0% 100%',
  'card-foreground': '240 10% 3.9%',
  popover: '0 0% 100%',
  'popover-foreground': '240 10% 3.9%',
  primary: '240 5.9% 10%',
  'primary-foreground': '0 0% 98%',
  secondary: '240 4.8% 95.9%',
  'secondary-foreground': '240 5.9% 10%',
  muted: '240 4.8% 95.9%',
  'muted-foreground': '240 3.8% 46.1%',
  accent: '240 4.8% 95.9%',
  'accent-foreground': '240 5.9% 10%',
  destructive: '0 84.2% 60.2%',
  'destructive-foreground': '0 0% 98%',
  border: '240 5.9% 90%',
  input: '240 5.9% 90%',
  ring: '240 10% 3.9%',
};

const dark = {
  ...light,
  background: '240 10% 3.9%',
  foreground: '0 0% 98%',
  card: '240 10% 3.9%',
  'card-foreground': '0 0% 98%',
  popover: '240 10% 3.9%',
  'popover-foreground': '0 0% 98%',
  primary: '0 0% 98%',
  'primary-foreground': '240 5.9% 10%',
  secondary: '240 3.7% 15.9%',
  'secondary-foreground': '0 0% 98%',
  muted: '240 3.7% 15.9%',
  'muted-foreground': '240 5% 64.9%',
  accent: '240 3.7% 15.9%',
  'accent-foreground': '0 0% 98%',
  destructive: '0 62.8% 30.6%',
  border: '240 3.7% 15.9%',
  input: '240 3.7% 15.9%',
  ring: '240 4.9% 83.9%',
};

const manual = (detail: string): never => {
  throw new Error(`Manual Tailwind setup required: ${detail}`);
};

export function unwrapExpression(node: ts.Expression): ts.Expression {
  while (
    ts.isSatisfiesExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    node = node.expression;

  return node;
}

export function propertyName(node: ts.PropertyName): string | undefined {
  return ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node)
    ? node.text
    : undefined;
}

export function objectProperty(
  object: ts.ObjectLiteralExpression,
  key: string
): ts.PropertyAssignment | undefined {
  if (
    object.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) ||
        (property.name && !propertyName(property.name))
    )
  )
    manual('computed properties or spreads cannot be merged safely');

  const properties = object.properties.filter(
    (property) => property.name && propertyName(property.name) === key
  );

  if (properties.length > 1) manual(`duplicate ${key} setting`);
  const property = properties[0];

  if (!property) return;

  if (!ts.isPropertyAssignment(property))
    return manual(`${key} is not a plain property`);

  return property;
}

export function appendObjectProperty(
  source: string,
  object: ts.ObjectLiteralExpression,
  text: string
): string {
  const end = object.end - 1;

  const separator =
    object.properties.length && !object.properties.hasTrailingComma ? ',' : '';

  return `${source.slice(0, end)}${separator}\n  ${text}\n${source.slice(end)}`;
}

function configObject(source: string): ts.ObjectLiteralExpression {
  const file = ts.createSourceFile(
    'tailwind.config.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  if (
    ts.transpileModule(source, {
      fileName: 'tailwind.config.ts',
      reportDiagnostics: true,
    }).diagnostics?.length
  )
    manual('configuration syntax is invalid');
  let expression: ts.Expression | undefined;

  for (const statement of file.statements) {
    if (ts.isExportAssignment(statement)) expression = statement.expression;

    if (
      ts.isExpressionStatement(statement) &&
      ts.isBinaryExpression(statement.expression) &&
      statement.expression.left.getText(file) === 'module.exports'
    )
      expression = statement.expression.right;
  }

  if (expression) expression = unwrapExpression(expression);

  if (expression && ts.isIdentifier(expression)) {
    const name = expression.text;

    for (const statement of file.statements)
      if (ts.isVariableStatement(statement))
        for (const declaration of statement.declarationList.declarations) {
          if (
            ts.isIdentifier(declaration.name) &&
            declaration.name.text === name &&
            declaration.initializer
          )
            expression = unwrapExpression(declaration.initializer);
        }
  }

  if (!expression || !ts.isObjectLiteralExpression(expression))
    return manual('the exported configuration must be a plain object');

  return expression;
}

function variableFormats(
  source: string,
  fallback: ColorFormat
): Map<string, ColorFormat> {
  const formats = new Map<string, ColorFormat>();

  if (!source) return formats;
  postcss.parse(source).walkDecls((declaration) => {
    if (
      !declaration.prop.startsWith('--') ||
      !(declaration.prop.slice(2) in light)
    )
      return;
    const value = declaration.value.trim();

    const format: ColorFormat =
      /^[-+\d.]+(?:deg)?\s+[-+\d.]+%\s+[-+\d.]+%(?:\s*\/.*)?$/.test(value)
        ? 'hsl-channels'
        : /^(?:var|env)\(/.test(value)
          ? fallback
          : 'css';

    const previous = formats.get(declaration.prop.slice(2));

    if (previous && previous !== format)
      manual(`inconsistent color formats for ${declaration.prop}`);
    formats.set(declaration.prop.slice(2), format);
  });

  return formats;
}

export function transformTailwind3(
  source: string,
  format: ColorFormat,
  variablesSource = ''
): string {
  const formats = variableFormats(variablesSource, format);
  let root = configObject(source);
  const darkMode = objectProperty(root, 'darkMode');

  if (darkMode) {
    const value = unwrapExpression(darkMode.initializer);

    const valid =
      (ts.isStringLiteral(value) && value.text === 'class') ||
      (ts.isArrayLiteralExpression(value) &&
        value.elements.length <= 2 &&
        value.elements.every(
          (element, index) =>
            ts.isStringLiteral(element) &&
            element.text === (index === 0 ? 'class' : '.dark')
        ));

    if (!valid) manual('existing darkMode does not use the .dark class');
  } else source = appendObjectProperty(source, root, 'darkMode: "class"');

  for (const key of ['theme', 'extend', 'colors']) {
    root = configObject(source);
    let object = root;

    for (const parent of ['theme', 'extend', 'colors'].slice(
      0,
      ['theme', 'extend', 'colors'].indexOf(key)
    )) {
      const value = unwrapExpression(
        objectProperty(object, parent)!.initializer
      );

      if (!ts.isObjectLiteralExpression(value))
        return manual(`${parent} must be a plain object`);
      object = value;
    }

    const property = objectProperty(object, key);

    if (!property) source = appendObjectProperty(source, object, `${key}: {}`);
    else if (
      !ts.isObjectLiteralExpression(unwrapExpression(property.initializer))
    )
      manual(`${key} must be a plain object`);
  }

  root = configObject(source);
  let colors = root;

  for (const key of ['theme', 'extend', 'colors']) {
    const property = objectProperty(colors, key);

    if (!property) return manual(`missing ${key} setting`);
    const value = unwrapExpression(property.initializer);

    if (!ts.isObjectLiteralExpression(value))
      return manual(`${key} must be a plain object`);
    colors = value;
  }

  const missing = Object.keys(light).filter(
    (token) => !objectProperty(colors, token)
  );

  if (!missing.length) return source;

  const values = missing.map(
    (token) =>
      `${JSON.stringify(token)}: ${JSON.stringify((formats.get(token) ?? format) === 'hsl-channels' ? `hsl(var(--${token}) / <alpha-value>)` : `var(--${token})`)}`
  );

  return appendObjectProperty(source, colors, values.join(',\n  '));
}

export function transformVariables(
  source: string,
  format: ColorFormat
): string {
  const formats = variableFormats(source, format);
  const root = postcss.parse(source);

  for (const [selector, tokens] of [
    [':root', light],
    ['.dark', dark],
  ] as const) {
    const rules: postcss.Rule[] = [];
    root.walkRules(selector, (rule) => {
      rules.push(rule);
    });
    let rule = rules[0];
    const existing = new Set<string>();

    for (const item of rules)
      item.walkDecls((declaration) => {
        existing.add(declaration.prop);
      });

    const entries = Object.entries(tokens).filter(
      ([token]) => !existing.has(`--${token}`)
    );

    if (!entries.length) continue;

    if (!rule) {
      rule = postcss.rule({ selector });
      root.append(rule);
    }

    for (const [token, channels] of entries)
      rule.append(
        postcss.decl({
          prop: `--${token}`,
          value:
            (formats.get(token) ?? format) === 'hsl-channels'
              ? channels
              : `hsl(${channels})`,
        })
      );
  }

  return root.toString();
}

export function transformTailwind4(
  source: string,
  format: ColorFormat
): string {
  const formats = variableFormats(source, format);
  const root = postcss.parse(source);
  let darkExists = false;
  root.walkAtRules('custom-variant', (rule) => {
    if (!/^dark(?:\s|$)/.test(rule.params)) return;

    if (!/\.dark\b/.test(rule.params) || /\.(?!dark\b)[\w-]+/.test(rule.params))
      manual('existing dark variant does not use the .dark class');
    darkExists = true;
  });
  root.raws.semicolon = true;

  if (!darkExists)
    root.append(
      postcss.atRule({
        name: 'custom-variant',
        params: 'dark (&:where(.dark, .dark *))',
      })
    );
  const existing = new Set<string>();
  let theme: postcss.AtRule | undefined;
  root.walkAtRules('theme', (rule) => {
    if (rule.params === 'inline') theme ??= rule;
    rule.walkDecls((declaration) => {
      existing.add(declaration.prop);
    });
  });

  const missing = Object.keys(light).filter(
    (token) => !existing.has(`--color-${token}`)
  );

  if (!missing.length) return root.toString();

  if (!theme) {
    theme = postcss.atRule({ name: 'theme', params: 'inline' });
    root.append(theme);
  }

  for (const token of missing)
    theme.append(
      postcss.decl({
        prop: `--color-${token}`,
        value:
          (formats.get(token) ?? format) === 'hsl-channels'
            ? `hsl(var(--${token}))`
            : `var(--${token})`,
      })
    );

  return root.toString();
}
