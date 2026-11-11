// `URL` and `URLSearchParams` are not used, on purpose: docs/decisions.md D20.

export type ParsedUrl = {
  host: string; // lower-cased, may include a port
  path: string; // as written, without query or fragment
  query: ReadonlyMap<string, string>; // decoded; first occurrence of a key wins
};

const URL_PATTERN =
  /^(?:https?:)?\/\/([^/?#\s@]+)((?:\/[^?#\s]*)?)(?:\?([^#\s]*))?(?:#\S*)?$/i;

/** Absolute or protocol-relative http(s) URLs only. */
export function parseUrl(input: string): ParsedUrl | null {
  const match = URL_PATTERN.exec(input.trim());
  if (!match) return null;
  const [, host = '', path = '', search = ''] = match;

  const query = new Map<string, string>();
  for (const pair of search.split('&')) {
    if (pair === '') continue;
    const eq = pair.indexOf('=');
    const key = decodeComponent(eq === -1 ? pair : pair.slice(0, eq));
    const value = decodeComponent(eq === -1 ? '' : pair.slice(eq + 1));
    if (key === null || value === null) return null;
    if (!query.has(key)) query.set(key, value);
  }
  return { host: host.toLowerCase(), path, query };
}

function decodeComponent(component: string): string | null {
  try {
    return decodeURIComponent(component.replace(/\+/g, ' '));
  } catch {
    return null;
  }
}

/** Types an option value: booleans, canonical integers, otherwise the string as given. */
export function coerce(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^(?:0|[1-9]\d{0,14})$/.test(value)) return Number(value);
  return value;
}

export function pixels(value: string | undefined): number | undefined {
  return value !== undefined && /^[1-9]\d{0,5}$/.test(value)
    ? Number(value)
    : undefined;
}
