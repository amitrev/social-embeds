import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { soundcloudFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// Embed code names the sound by API id, a URL by permalink; both are canonical (docs/decisions.md D71).

export const PAGE_HOSTS = /* @__PURE__ */ new Set([
  'soundcloud.com',
  'www.soundcloud.com',
  'm.soundcloud.com',
]);
// Share code writes the id as a URN, `soundcloud%3Atracks%3A293`, after one decoding.
const API_PATH =
  /^\/(tracks|playlists|users)\/(?:soundcloud%3A(?:tracks|playlists|users)%3A)?(\d{1,15})\/?$/i;
const NAME = '[a-z0-9_-]{1,64}';
const SECRET = 's-[A-Za-z0-9]{1,32}';
const PERMALINK = /* @__PURE__ */ new RegExp(
  `^/(${NAME})(?:/(sets/${NAME}|${NAME})(?:/(${SECRET}))?)?/?$`,
  'i',
);
// soundcloud.com pages that are not a user, and a user's list pages.
const NOT_USERS = /* @__PURE__ */ new Set([
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
const NOT_SOUNDS = /* @__PURE__ */ new Set([
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
export const SECRET_TOKEN = /* @__PURE__ */ new RegExp(`^${SECRET}$`);

export function sound(url: string, id: string): Omit<ParsedEmbed, 'options'> {
  return { platform: 'soundcloud', kind: 'post', url, id, variant: 'iframe' };
}

export function fromApi(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
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

export const soundcloudMatcher: PlatformMatcher = {
  platform: 'soundcloud',
  name: 'SoundCloud',
  shapes: ['post iframe'],
  match(url) {
    const found = fromApi(url) ?? fromPage(url);
    return found && { ...found, options: {} };
  },
  ownsFrame: soundcloudFrame,
};
