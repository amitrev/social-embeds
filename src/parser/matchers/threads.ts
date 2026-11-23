import { type Whitelist, rebuildsAs } from '../html';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

const HOSTS = /* @__PURE__ */ new Set([
  'threads.com',
  'www.threads.com',
  'threads.net',
  'www.threads.net',
]);
const POST_PATH =
  /^\/(?:@[A-Za-z0-9._]{1,30}\/post|t)\/([A-Za-z0-9_-]{1,64})\/?$/;

export const FALLBACK: Whitelist = /* @__PURE__ */ new Map([
  ['a', ['href']],
  ['div', []],
]);

// Canonical URLs use /t/{code}: oEmbed code links that form, the Embed dialog /@{user}/post/{code}.
export function post(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, code] = POST_PATH.exec(url.path) ?? [];
  if (code === undefined) return null;
  return {
    platform: 'threads',
    kind: 'post',
    url: `https://www.threads.com/t/${code}`,
    id: code,
    variant: 'sdk',
  };
}

export const threadsMatcher: PlatformMatcher = {
  platform: 'threads',
  name: 'Threads',
  shapes: ['post sdk'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  match(url) {
    const found = post(url);
    return found && { ...found, options: {} };
  },
};
