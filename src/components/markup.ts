import { escapeAttribute } from '../parser/html';

type Value = string | number | boolean;

/** `name="value"` pairs for defined values; `true` becomes a valueless attribute. */
export function attributes(entries: Record<string, Value | undefined>): string {
  let html = '';
  for (const [name, value] of Object.entries(entries)) {
    if (value === undefined) continue;
    html +=
      value === true
        ? ` ${name}`
        : ` ${name}="${escapeAttribute(String(value))}"`;
  }
  return html;
}

/**
 * Options written as the platform's `data-*` attributes, in the given order. Booleans are
 * written as `"true"`/`"false"`, as platforms document them.
 */
export function dataAttributes(
  names: Readonly<Record<string, string>>,
  options: Readonly<Record<string, Value>>,
): string {
  const entries: Record<string, string> = {};
  for (const [key, name] of Object.entries(names)) {
    const value = options[key];
    if (value !== undefined) entries[name] = String(value);
  }
  return attributes(entries);
}

/** Embed code options first; props the host passed replace them. */
export function withProps(
  options: Readonly<Record<string, Value>>,
  props: Readonly<Record<string, Value | undefined>>,
): Record<string, Value> {
  const merged = { ...options };
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}

export function hasFallback(fallbackHtml: string | undefined): boolean {
  return fallbackHtml !== undefined && fallbackHtml.trim() !== '';
}

export { escapeAttribute };
