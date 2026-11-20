import type { ParsedEmbed } from '../parser';

/**
 * Security: options are not verified (docs/decisions.md D68). Keys that choose the content
 * come only from the verified url and id.
 */
export function optionsWithout(
  options: ParsedEmbed['options'],
  reserved: readonly string[],
): [string, string | number | boolean][] {
  // Lower-cased, so `URL` cannot slip past a reserved `url`.
  return Object.entries(options).filter(
    ([key]) => !reserved.includes(key.toLowerCase()),
  );
}

/** Later entries replace earlier ones with the same name. */
export function query(
  ...sources: (
    Iterable<readonly [string, string | number | boolean]> | undefined
  )[]
): string {
  const params = new Map<string, string>();
  for (const source of sources) {
    for (const [key, value] of source ?? []) params.set(key, String(value));
  }
  const pairs = [...params].map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
  );
  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

/** Player parameters take 0 and 1, so booleans become numbers. */
export function playerParams(
  props: Readonly<Record<string, unknown>>,
  names: Readonly<Record<string, string>>,
): [string, string | number][] {
  const params: [string, string | number][] = [];
  for (const [prop, name] of Object.entries(names)) {
    const value = props[prop];
    if (typeof value === 'boolean') params.push([name, value ? 1 : 0]);
    else if (typeof value === 'string' || typeof value === 'number')
      params.push([name, value]);
  }
  return params;
}
