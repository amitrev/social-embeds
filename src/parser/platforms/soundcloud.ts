import type { HtmlElement, HtmlNode } from '../html';
import {
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import {
  SOUNDCLOUD_WIDGET_HOST as WIDGET_HOST,
  soundcloudFrame,
} from '../frames';

// Embed code names the sound by API id, a URL by permalink; both are canonical (docs/decisions.md D71).

const PAGE_HOSTS = new Set([
  'soundcloud.com',
  'www.soundcloud.com',
  'm.soundcloud.com',
]);
// Share code writes the id as a URN, `soundcloud%3Atracks%3A293`, after one decoding.
const API_PATH =
  /^\/(tracks|playlists|users)\/(?:soundcloud%3A(?:tracks|playlists|users)%3A)?(\d{1,15})\/?$/i;
const NAME = '[a-z0-9_-]{1,64}';
const SECRET = 's-[A-Za-z0-9]{1,32}';
const PERMALINK = new RegExp(
  `^/(${NAME})(?:/(sets/${NAME}|${NAME})(?:/(${SECRET}))?)?/?$`,
  'i',
);
// soundcloud.com pages that are not a user, and a user's list pages.
const NOT_USERS = new Set([
  'discover',
  'search',
  'stream',
  'feed',
  'you',
  'upload',
  'charts',
  'pages',
  'settings',
  'messages',
  'notifications',
  'people',
  'stations',
  'library',
  'terms-of-use',
  'signin',
]);
const NOT_SOUNDS = new Set([
  'likes',
  'tracks',
  'sets',
  'albums',
  'reposts',
  'popular-tracks',
  'followers',
  'following',
  'comments',
  'spotlight',
  'toptracks',
]);
const SECRET_TOKEN = new RegExp(`^${SECRET}$`);

function sound(url: string, id: string): Omit<ParsedEmbed, 'options'> {
  return { platform: 'soundcloud', kind: 'post', url, id, variant: 'iframe' };
}

function fromApi(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (url?.host !== 'api.soundcloud.com') return null;
  const [, type, id] = API_PATH.exec(url.path) ?? [];
  if (type === undefined || id === undefined) return null;
  const token = url.query.get('secret_token');
  if (token !== undefined && !SECRET_TOKEN.test(token)) return null;
  const secret = token === undefined ? '' : `?secret_token=${token}`;
  return sound(
    `https://api.soundcloud.com/${type.toLowerCase()}/${id}${secret}`,
    id,
  );
}

function fromPage(url: ParsedUrl): Omit<ParsedEmbed, 'options'> | null {
  if (!PAGE_HOSTS.has(url.host)) return null;
  const [, user, second, secret] = PERMALINK.exec(url.path) ?? [];
  if (user === undefined || NOT_USERS.has(user.toLowerCase())) return null;
  if (second !== undefined && NOT_SOUNDS.has(second.toLowerCase())) return null;
  const path = [user, second, secret].filter(Boolean).join('/');
  return sound(`https://soundcloud.com/${path}`, path);
}

const LINK_ATTRIBUTES = new Set(['href', 'title', 'target', 'style']);

function isCreditLink(node: HtmlNode | undefined): boolean {
  if (node?.type !== 'element' || node.tag !== 'a') return false;
  if ([...node.attrs.keys()].some((name) => !LINK_ATTRIBUTES.has(name)))
    return false;
  const [text, ...rest] = node.children;
  return (
    rest.length === 0 &&
    text?.type === 'text' &&
    PAGE_HOSTS.has(parseUrl(node.attrs.get('href') ?? '')?.host ?? '')
  );
}

/** Share code's credit: a styled `div` with the artist link, ` · `, and the sound link. */
function isCredit(element: HtmlElement): boolean {
  if (
    element.tag !== 'div' ||
    element.attrs.size !== 1 ||
    !element.attrs.has('style')
  )
    return false;
  const [artist, separator, sound, ...rest] = element.children;
  return (
    rest.length === 0 &&
    isCreditLink(artist) &&
    separator?.type === 'text' &&
    /^\s*·\s*$/.test(separator.raw) &&
    isCreditLink(sound)
  );
}

export const soundcloud: PlatformParser = {
  platform: 'soundcloud',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (src?.host !== WIDGET_HOST || !/^\/player\/?$/.test(src.path))
      return null;
    let found = fromApi(parseUrl(src.query.get('url') ?? ''));
    if (!found) return null;
    const outer = src.query.get('secret_token');
    if (outer !== undefined) {
      if (!SECRET_TOKEN.test(outer)) return null;
      if (!found.url.includes('?'))
        found = { ...found, url: `${found.url}?secret_token=${outer}` };
    }
    const options: Options = Object.fromEntries(
      [...src.query]
        .filter(([key]) => key !== 'url' && key !== 'secret_token')
        .map(([key, value]) => [key, coerce(value)]),
    );
    const { height } = sizeOf(root) ?? {};
    return withSize(
      { ...found, options },
      height === undefined ? undefined : { height },
    );
  },
  isOwnScript: () => false,
  isOwnExtra: isCredit,
  match(url) {
    const found = fromApi(url) ?? fromPage(url);
    return found && { ...found, options: {} };
  },
  ownsFrame: soundcloudFrame,
};
