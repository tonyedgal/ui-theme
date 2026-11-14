export function isString(value: unknown): value is string {
  // eslint-disable-next-line anti-slop/no-runtime-typeof -- this guard is the parse step
  return typeof value === 'string';
}

export function isCssColor(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

// native has no global Element, so a bare reference would throw a ReferenceError
export function assertDomElement(value: unknown): asserts value is Element {
  if (typeof Element === 'undefined' || !(value instanceof Element))
    throw new TypeError('Expected a DOM Element.');
}
