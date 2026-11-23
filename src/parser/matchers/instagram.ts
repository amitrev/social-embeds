import { type Whitelist, rebuildsAs } from '../html';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

const HOSTS = /* @__PURE__ */ new Set(['instagram.com', 'www.instagram.com']);
const POST_PATH =
  /^\/(?:([A-Za-z0-9._]{1,30})\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]{1,64})\/?$/;
const TYPES = /* @__PURE__ */ new Set(['p', 'reel', 'reels', 'tv']);
const USER_POST_TYPES = /* @__PURE__ */ new Set(['p', 'reel']);

export const FALLBACK: Whitelist = /* @__PURE__ */ new Map([
  ['div', []],
  ['a', ['href']],
  ['p', []],
]);

// embed.js serves only /p/, /reel/ and /tv/ permalinks: the canonical URL drops the
// username and maps reels to reel (docs/decisions.md D15).
export function post(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, user, type, code] = POST_PATH.exec(url.path) ?? [];
  if (type === undefined || code === undefined) return null;
  // Instagram links /{user}/p/ and /{user}/reel/ only.
  if (user !== undefined && (TYPES.has(user) || !USER_POST_TYPES.has(type)))
    return null;
  return {
    platform: 'instagram',
    kind: 'post',
    url: `https://www.instagram.com/${type === 'reels' ? 'reel' : type}/${code}/`,
    id: code,
    variant: 'sdk',
  };
}

export const instagramMatcher: PlatformMatcher = {
  platform: 'instagram',
  name: 'Instagram',
  shapes: ['post sdk'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  match(url) {
    const found = post(url);
    return found && { ...found, options: {} };
  },
};
