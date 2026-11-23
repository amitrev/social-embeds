import type { Options, PlatformMatcher } from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, type ParsedUrl } from '../url';
import { VIMEO_PLAYER_HOST as PLAYER_HOST, vimeoFrame } from '../frames';

// Vimeo's responsive snippet keeps the ratio only in its wrapper (docs/decisions.md D61).

export const HOSTS = /* @__PURE__ */ new Set(['vimeo.com', 'www.vimeo.com']);
const VIDEO = '(\\d{1,12})';
const HASH = '([0-9a-f]{6,20})';
const PAGE_PATHS = [
  new RegExp(`^/${VIDEO}(?:/${HASH})?/?$`),
  new RegExp(`^/channels/[A-Za-z0-9_-]{1,64}/${VIDEO}/?$`),
  new RegExp(`^/groups/[A-Za-z0-9_-]{1,64}/videos/${VIDEO}/?$`),
  new RegExp(`^/showcase/\\d{1,12}/video/${VIDEO}/?$`),
];
const PLAYER_PATH = /* @__PURE__ */ new RegExp(`^/video/${VIDEO}/?$`);
// Vimeo adds these to its own code; they choose nothing about the video.
const DROPPED = /* @__PURE__ */ new Set(['h', 'app_id', 'player_id']);
const START = /^t=(\d+(?:\.\d+)?|(?:\d+h)?(?:\d+m)?(?:\d+s)?)$/;

function video(
  id: string,
  hash: string | undefined,
): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'vimeo',
    kind: 'video',
    url: `https://vimeo.com/${id}${hash ? `/${hash}` : ''}`,
    id,
    variant: 'iframe',
  };
}

function start(url: ParsedUrl): Options {
  const [, time] = START.exec(url.fragment ?? '') ?? [];
  return time ? { t: time } : {};
}

export function fromPage(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  for (const path of PAGE_PATHS) {
    const [, id, hash] = path.exec(url.path) ?? [];
    if (id !== undefined) return video(id, hash);
  }
  return null;
}

export function fromPlayer(url: ParsedUrl | null): ParsedEmbed | null {
  if (url?.host !== PLAYER_HOST) return null;
  const [, id] = PLAYER_PATH.exec(url.path) ?? [];
  if (id === undefined) return null;
  const hash = url.query.get('h');
  if (hash !== undefined && !new RegExp(`^${HASH}$`).test(hash)) return null;
  const options: Options = Object.fromEntries(
    [...url.query]
      .filter(([key]) => !DROPPED.has(key))
      .map(([key, value]) => [key, coerce(value)]),
  );
  return { ...video(id, hash), options: { ...options, ...start(url) } };
}

export const vimeoMatcher: PlatformMatcher = {
  platform: 'vimeo',
  name: 'Vimeo',
  shapes: ['video iframe'],
  match(url) {
    const player = fromPlayer(url);
    if (player) return player;
    const page = fromPage(url);
    return page && { ...page, options: start(url) };
  },
  ownsFrame: vimeoFrame,
};
