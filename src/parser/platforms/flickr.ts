import { type HtmlElement, rebuild, type Whitelist, rebuildsAs } from '../html';
import type { Options, PlatformParser } from '../platform';
import { sizeOf, withSize } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';

// The frame is built from `id` on the client; the embed code's linked image is only fallback
// content, and Flickr's script is accepted and never loaded (docs/decisions.md D98, D100).

const HOSTS = new Set(['flickr.com', 'www.flickr.com']);
const USER = '((?!\\.{1,2}(?:/|$))[A-Za-z0-9@_.-]{1,64})';
const ID = '(\\d{1,20})';
const PHOTO_PATH = new RegExp(
  `^/photos/${USER}/${ID}(?:/in/[A-Za-z0-9_@./-]{1,200})?/?$`,
);
const ALBUM_PATH = new RegExp(`^/photos/${USER}/(?:albums|sets)/${ID}/?$`);
const SHORT_PATH = /^\/p\/([1-9a-km-zA-HJ-NP-Z]{1,12})$/;
const SCRIPT = /^(?:https?:)?\/\/embedr\.flickr\.com\/assets\/client-code\.js$/;
const ALPHABET = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const OPTIONS = ['header', 'footer', 'context'] as const;
const IMAGE_SRC = /^https:\/\/(?:live|farm\d{1,3})\.staticflickr\.com\//;
const FALLBACK: Whitelist = new Map([
  ['a', [{ name: 'href', value: /^https:\/\/(?:www\.)?flickr\.com\// }]],
  [
    'img',
    [
      { name: 'src', value: IMAGE_SRC },
      { name: 'width', value: /^\d{1,6}$/ },
      { name: 'height', value: /^\d{1,6}$/ },
      'alt',
    ],
  ],
]);

/** The photo id of a `flic.kr/p/{code}` code, or `null` for an empty code or a character outside Flickr's base-58 alphabet. */
export function decodeFlickrCode(code: string): string | null {
  if (code === '') return null;
  let id = 0n;
  for (const character of code) {
    const digit = ALPHABET.indexOf(character);
    if (digit === -1) return null;
    id = id * 58n + BigInt(digit);
  }
  return id.toString();
}

function encodeFlickrCode(id: string): string {
  let rest = BigInt(id);
  let code = '';
  while (rest > 0n) {
    code = ALPHABET.charAt(Number(rest % 58n)) + code;
    rest /= 58n;
  }
  return code;
}

function photo(user: string, id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'flickr',
    kind: 'post',
    url: `https://www.flickr.com/photos/${user}/${id}/`,
    id,
    variant: 'iframe',
  };
}

function album(user: string, id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'flickr',
    kind: 'post',
    url: `https://www.flickr.com/photos/${user}/albums/${id}`,
    id,
    variant: 'iframe',
  };
}

function fromLongUrl(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, albumUser, albumId] = ALBUM_PATH.exec(url.path) ?? [];
  if (albumUser !== undefined && albumId !== undefined)
    return album(albumUser, albumId);
  const [, user, id] = PHOTO_PATH.exec(url.path) ?? [];
  return user === undefined || id === undefined ? null : photo(user, id);
}

function fromShortUrl(url: ParsedUrl): Omit<ParsedEmbed, 'options'> | null {
  if (url.host !== 'flic.kr') return null;
  const [, code] = SHORT_PATH.exec(url.path) ?? [];
  const id = code === undefined ? null : decodeFlickrCode(code);
  // A leading `1` is a zero digit and would not come back from the id (docs/decisions.md D98).
  if (code === undefined || id === null || encodeFlickrCode(id) !== code)
    return null;
  return {
    platform: 'flickr',
    kind: 'post',
    url: `https://flic.kr/p/${code}`,
    id,
    variant: 'iframe',
  };
}

function onlyImage(root: HtmlElement): HtmlElement | null {
  let image: HtmlElement | null = null;
  for (const child of root.children) {
    if (child.type === 'text' && /^\s*$/.test(child.raw)) continue;
    if (child.type !== 'element' || child.tag !== 'img' || image) return null;
    image = child;
  }
  return image;
}

export const flickr: PlatformParser = {
  platform: 'flickr',
  name: 'Flickr',
  shapes: ['post iframe'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  parse(root) {
    if (root.tag !== 'a' || root.attrs.get('data-flickr-embed') !== 'true')
      return null;
    const found = fromLongUrl(parseUrl(root.attrs.get('href') ?? ''));
    const image = onlyImage(root);
    if (!found || !image) return null;
    const options: Options = {};
    for (const name of OPTIONS)
      if (root.attrs.get(`data-${name}`) === 'true') options[name] = true;
    const size = sizeOf(image);
    // An image `rebuild` would strip of its `src` goes entirely.
    const linked = IMAGE_SRC.test(image.attrs.get('src') ?? '')
      ? root
      : { ...root, children: [] };
    return withSize(
      { ...found, options, fallbackHtml: rebuild([linked], FALLBACK) },
      size?.width !== undefined && size.height !== undefined ? size : undefined,
    );
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const found = fromLongUrl(url) ?? fromShortUrl(url);
    return found && { ...found, options: {} };
  },
};
