import { descendants, hasClass, rebuild, type Whitelist } from '../html';
import type { Options, PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';

const HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const POST_PATH =
  /^\/(?:([A-Za-z0-9._]{1,30})\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]{1,64})\/?$/;
const TYPES = new Set(['p', 'reel', 'reels', 'tv']);
const USER_POST_TYPES = new Set(['p', 'reel']);
const SCRIPT = /^(?:https?:)?\/\/www\.instagram\.com\/embed\.js$/;

const FALLBACK: Whitelist = new Map([
  ['div', []],
  ['a', ['href']],
  ['p', []],
]);

// embed.js serves only /p/, /reel/ and /tv/ permalinks: the canonical URL drops the
// username and maps reels to reel (docs/decisions.md D15).
function post(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
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

export const instagram: PlatformParser = {
  platform: 'instagram',
  fallback: FALLBACK,
  parse(root) {
    if (root.tag !== 'blockquote' || !hasClass(root, 'instagram-media'))
      return null;
    // Like embed.js: the permalink attribute, else the last link to a post.
    const permalink = root.attrs.get('data-instgrm-permalink');
    const found =
      permalink === undefined
        ? descendants(root.children)
            .reverse()
            .map((element) =>
              element.tag === 'a'
                ? post(parseUrl(element.attrs.get('href') ?? ''))
                : null,
            )
            .find((candidate) => candidate !== null)
        : post(parseUrl(permalink));
    if (!found) return null;

    // embed.js only checks whether data-instgrm-captioned is present.
    const options: Options = {};
    if (root.attrs.has('data-instgrm-captioned')) options.captioned = true;
    const version = root.attrs.get('data-instgrm-version');
    if (version !== undefined) options.version = coerce(version);

    return {
      ...found,
      options,
      fallbackHtml: rebuild(root.children, FALLBACK),
    };
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const found = post(url);
    return found && { ...found, options: {} };
  },
};
