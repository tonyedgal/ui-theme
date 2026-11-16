import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseModule, type t } from '../../parse.ts';
import type { ProjectProfile } from '../../types.ts';
import { ConversionRefusal, messages } from '../../install/messages.ts';
import type { ThemeSetup } from '../detect.ts';
import type { Conversion } from '../plan.ts';

const exportsAllowed = new Set(['ThemeProvider', 'useTheme']);

function exportedNames(program: t.Program): string[] {
  const names: string[] = [];

  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') names.push('default');

    if (statement.type !== 'ExportNamedDeclaration') continue;

    if (statement.exportKind === 'type') continue;
    const declaration = statement.declaration;

    if (declaration?.type === 'FunctionDeclaration' && declaration.id)
      names.push(declaration.id.name);
    else if (declaration?.type === 'VariableDeclaration')
      for (const item of declaration.declarations)
        names.push(item.id.type === 'Identifier' ? item.id.name : '?');
    else if (declaration?.type === 'TSTypeAliasDeclaration') continue;
    else if (declaration?.type === 'TSInterfaceDeclaration') continue;
    else if (declaration) names.push('?');
    else
      for (const specifier of statement.specifiers)
        names.push(
          specifier.exported.type === 'Identifier'
            ? specifier.exported.name
            : specifier.exported.value
        );
  }

  return names;
}

function providerDefaults(
  program: t.Program
): { defaultTheme: string; storageKey: string } | undefined {
  for (const statement of program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration'
        ? statement.declaration
        : undefined;

    if (
      declaration?.type !== 'FunctionDeclaration' ||
      declaration.id?.name !== 'ThemeProvider'
    )
      continue;
    const [param] = declaration.params;

    if (param?.type !== 'ObjectPattern') return;
    const values: Record<string, string> = {};

    for (const property of param.properties) {
      if (
        property.type !== 'ObjectProperty' ||
        property.key.type !== 'Identifier'
      )
        continue;

      if (
        property.value.type === 'AssignmentPattern' &&
        property.value.right.type === 'StringLiteral'
      )
        values[property.key.name] = property.value.right.value;
    }

    if (
      values.storageKey &&
      ['light', 'dark', 'system'].includes(values.defaultTheme)
    )
      return {
        defaultTheme: values.defaultTheme,
        storageKey: values.storageKey,
      };
  }
}

function replacement(
  setup: ThemeSetup,
  typescript: boolean,
  defaults: { defaultTheme: string; storageKey: string }
): string {
  const tanstack = setup.kind === 'shadcn-tanstack',
    provider = tanstack ? 'TanStackUIThemeProvider' : 'UIThemeProvider',
    script = tanstack ? 'TanStackStartThemeScript, ' : '',
    options = `defaultTheme={defaultTheme} storageKey={storageKey} defaultColorTheme="default" colorThemes={['default']}`;

  return `import { ${script}${provider}, useUITheme${typescript ? ', type Theme' : ''} } from 'uitheme-web/react'
${typescript ? "import type { ReactNode } from 'react'\n\ntype ThemeProviderProps = {\n  children: ReactNode\n  defaultTheme?: Theme\n  storageKey?: string\n}\n" : ''}
export function ThemeProvider({
  children,
  defaultTheme = ${JSON.stringify(defaults.defaultTheme)},
  storageKey = ${JSON.stringify(defaults.storageKey)},
}${typescript ? ': ThemeProviderProps' : ''}) {
  return (
    <${provider} ${options}${tanstack ? ' systemThemeMode="js"' : ''}>
${tanstack ? '      <TanStackStartThemeScript defaultTheme={defaultTheme} storageKey={storageKey} />\n' : ''}      {children}
    </${provider}>
  )
}

export const useTheme = useUITheme
`;
}

export async function convertShadcn(
  profile: ProjectProfile,
  setup: ThemeSetup
): Promise<Conversion> {
  const [file] = setup.files,
    path = join(profile.cwd, file),
    source = await readFile(path, 'utf8');

  let program: t.Program;

  try {
    program = parseModule(path, source);
  } catch {
    throw new ConversionRefusal(messages.syntax(file));
  }

  const extra = exportedNames(program).filter(
    (name) => !exportsAllowed.has(name)
  );

  if (extra.length)
    throw new ConversionRefusal(
      messages.refusal(file, `the extra export ${extra[0]}`, 'shadcn-provider')
    );

  const defaults = providerDefaults(program);

  if (!defaults)
    throw new ConversionRefusal(
      messages.refusal(
        file,
        'ThemeProvider defaults that are not plain strings',
        'shadcn-provider'
      )
    );

  return {
    files: [
      {
        path,
        content: replacement(setup, /\.tsx?$/.test(file), defaults),
      },
    ],
    remove: [],
  };
}
