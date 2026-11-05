/** Flat keys take precedence for backward compatibility. Nested names accept
 * profile.name and members[0].name without traversing prototypes. */
export function formPathValue(model: object, path: string): unknown {
  if (Object.hasOwn(model, path)) return (model as Record<string, unknown>)[path];
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let value: unknown = model;
  for (const key of parts) {
    if (!key || ['__proto__', 'prototype', 'constructor'].includes(key) || !value || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
export function matchesFormPath(pattern: string, path: string) {
  const split = (value: string) => value.replace(/\[(\d+)\]/g, '.$1').split('.');
  const expected = split(pattern), actual = split(path);
  return expected.length === actual.length && expected.every((part, index) => part === '*' || part === actual[index]);
}
