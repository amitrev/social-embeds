import { type Whitelist, rebuildsAs } from '../html';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

// `id` keeps the `a/` of albums and gallery posts, and every template uses it whole (docs/decisions.md D94).

const HOSTS = new Set(['imgur.com', 'www.imgur.com', 'm.imgur.com']);
export const HASH = '([A-Za-z0-9]{5,7})';
const ALBUM_PATH = new RegExp(`^/a/${HASH}/?$`);
const GALLERY_PATH = new RegExp(
  `^/gallery/(?:[A-Za-z0-9-]{1,200}-)?${HASH}/?$`,
);
const IMAGE_PATH = new RegExp(`^/${HASH}/?$`);
const FILE_PATH = new RegExp(`^/${HASH}\\.(?:jpe?g|png|gif|gifv|mp4|webp)$`);
// Page names that look like a hash.
const NOT_IMAGES = new Set([
  'about',
  'apps',
  'blog',
  'help',
  'jobs',
  'login',
  'press',
  'privacy',
  'random',
  'search',
  'signin',
  'signup',
  'terms',
  'tools',
  'upload',
  'account',
  'contact',
  'emerald',
  'explore',
  'gallery',
  'hot',
  'new',
  'rules',
  'user',
]);
export const FALLBACK: Whitelist = new Map([
  ['a', [{ name: 'href', value: /^https:\/\/(?:www\.)?imgur\.com\// }]],
]);

export function post(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'imgur',
    kind: 'post',
    url: `https://imgur.com/${id}`,
    id,
    variant: 'iframe',
  };
}

export function image(hash: string | undefined): string | undefined {
  return hash === undefined || NOT_IMAGES.has(hash.toLowerCase())
    ? undefined
    : hash;
}

function idOf(url: ParsedUrl | null): string | undefined {
  if (!url) return undefined;
  if (url.host === 'i.imgur.com') return image(FILE_PATH.exec(url.path)?.[1]);
  if (!HOSTS.has(url.host)) return undefined;
  const album = (ALBUM_PATH.exec(url.path) ?? GALLERY_PATH.exec(url.path))?.[1];
  if (album !== undefined) return `a/${album}`;
  return image(IMAGE_PATH.exec(url.path)?.[1]);
}

export const imgurMatcher: PlatformMatcher = {
  platform: 'imgur',
  name: 'Imgur',
  shapes: ['post iframe'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...post(id), options: {} };
  },
};
