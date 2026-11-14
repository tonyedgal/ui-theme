/* eslint-disable anti-slop/no-unknown-returns -- parse untrusted JSON text at this boundary; callers validate the shape */
// the index after any whitespace and comments at `index`
function skipTrivia(source: string, index: number): number {
  while (index < source.length) {
    if (/\s/.test(source[index])) index++;
    else if (source.startsWith('//', index)) {
      const end = source.indexOf('\n', index);
      index = end === -1 ? source.length : end;
    } else if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2);

      if (end === -1) throw new SyntaxError('Unterminated comment');
      index = end + 2;
    } else break;
  }

  return index;
}

/**
 * Parse JSON with comments and trailing commas, as tsconfig.json and
 * components.json allow. Throws a SyntaxError for anything else that
 * JSON.parse rejects.
 */
export function parseJsonc(source: string): unknown {
  let result = '';

  for (let index = 0; index < source.length;) {
    const next = skipTrivia(source, index);

    if (next !== index) {
      result += ' ';
      index = next;
      continue;
    }

    const char = source[index];

    if (char === '"') {
      let end = index + 1;

      while (end < source.length && source[end] !== '"')
        end += source[end] === '\\' ? 2 : 1;
      result += source.slice(index, end + 1);
      index = end + 1;
    } else {
      const closer = source[skipTrivia(source, index + 1)];

      if (!(char === ',' && (closer === ']' || closer === '}'))) result += char;
      index++;
    }
  }

  return JSON.parse(result);
}
