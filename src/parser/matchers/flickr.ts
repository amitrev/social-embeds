import { type Whitelist, rebuildsAs } from '../html';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

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
const ALPHABET = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
export const IMAGE_SRC = /^https:\/\/(?:live|farm\d{1,3})\.staticflickr\.com\//;
export const FALLBACK: Whitelist = new Map([
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

export function fromLongUrl(
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

export const flickrMatcher: PlatformMatcher = {
  platform: 'flickr',
  name: 'Flickr',
  shapes: ['post iframe'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  match(url) {
    const found = fromLongUrl(url) ?? fromShortUrl(url);
    return found && { ...found, options: {} };
  },
};
