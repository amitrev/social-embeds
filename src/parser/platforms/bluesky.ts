import { descendants, hasClass, rebuild, type Whitelist } from '../html';
import type { Options, PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';

// Only a DID names a post without a lookup; handle URLs return null (docs/decisions.md D70).

export const DID = '(did:(?:plc:[a-z2-7]{24}|web:[a-z0-9.-]{1,253}))';
const RKEY = '([A-Za-z0-9._~:-]{1,512})';
const HOSTS = new Set(['bsky.app', 'www.bsky.app']);
const POST_PATH = new RegExp(`^/profile/${DID}/post/${RKEY}/?$`);
const AT_URI = new RegExp(`^at://${DID}/app\\.bsky\\.feed\\.post/${RKEY}$`);
const CID = /^[a-z2-7]{20,100}$/;
const COLOR_MODES = new Set(['light', 'dark', 'system']);
const SCRIPT = /^(?:https?:)?\/\/embed\.bsky\.app\/static\/embed\.js$/;

const FALLBACK: Whitelist = new Map([
  ['p', ['lang']],
  ['a', ['href']],
  ['br', []],
]);

function post(did: string, rkey: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'bluesky',
    kind: 'post',
    url: `https://bsky.app/profile/${did}/post/${rkey}`,
    id: `${did}/app.bsky.feed.post/${rkey}`,
    variant: 'iframe',
  };
}

function fromUrl(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, did, rkey] = POST_PATH.exec(url.path) ?? [];
  return did === undefined || rkey === undefined ? null : post(did, rkey);
}

export const bluesky: PlatformParser = {
  platform: 'bluesky',
  fallback: FALLBACK,
  parse(root) {
    if (root.tag !== 'blockquote' || !hasClass(root, 'bluesky-embed'))
      return null;
    const [, did, rkey] =
      AT_URI.exec(root.attrs.get('data-bluesky-uri') ?? '') ?? [];
    if (did === undefined || rkey === undefined) return null;
    const found = post(did, rkey);
    // The post link is the last link; it must name the same post as the AT URI.
    const link = descendants(root.children)
      .reverse()
      .map((element) =>
        element.tag === 'a'
          ? fromUrl(parseUrl(element.attrs.get('href') ?? ''))
          : null,
      )
      .find((linked) => linked !== null);
    if (link?.id !== found.id) return null;

    const options: Options = {};
    const cid = root.attrs.get('data-bluesky-cid');
    if (cid !== undefined && CID.test(cid)) options.cid = cid;
    const colorMode = root.attrs.get('data-bluesky-embed-color-mode');
    if (colorMode !== undefined && COLOR_MODES.has(colorMode))
      options.colorMode = colorMode;
    return {
      ...found,
      options,
      fallbackHtml: rebuild(root.children, FALLBACK),
    };
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const found = fromUrl(url);
    return found && { ...found, options: {} };
  },
};
