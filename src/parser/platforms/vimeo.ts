import {
  type Options,
  type PlatformParser,
  sizeOf,
  unwrapRatio,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';

// Vimeo's responsive snippet keeps the ratio only in its wrapper (docs/decisions.md D61).

const HOSTS = new Set(['vimeo.com', 'www.vimeo.com']);
const VIDEO = '(\\d{1,12})';
const HASH = '([0-9a-f]{6,20})';
const PAGE_PATHS = [
  new RegExp(`^/${VIDEO}(?:/${HASH})?/?$`),
  new RegExp(`^/channels/[A-Za-z0-9_-]{1,64}/${VIDEO}/?$`),
  new RegExp(`^/groups/[A-Za-z0-9_-]{1,64}/videos/${VIDEO}/?$`),
  new RegExp(`^/showcase/\\d{1,12}/video/${VIDEO}/?$`),
];
const PLAYER_PATH = new RegExp(`^/video/${VIDEO}/?$`);
const WRAPPER =
  /^padding:\s*(\d{1,3}(?:\.\d{1,4})?)% 0 0 0;\s*position:\s*relative;?$/;
const SCRIPT = /^(?:https?:)?\/\/player\.vimeo\.com\/api\/player\.js$/;
// Vimeo adds these to its own code; they choose nothing about the video.
const DROPPED = new Set(['h', 'app_id', 'player_id']);
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

function fromPlayer(url: ParsedUrl | null): ParsedEmbed | null {
  if (url?.host !== 'player.vimeo.com') return null;
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

export const vimeo: PlatformParser = {
  platform: 'vimeo',
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    if (iframe.tag !== 'iframe') return null;
    const embed = fromPlayer(parseUrl(iframe.attrs.get('src') ?? ''));
    return embed && withSize(embed, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const player = fromPlayer(url);
    if (player) return player;
    if (!HOSTS.has(url.host)) return null;
    for (const path of PAGE_PATHS) {
      const [, id, hash] = path.exec(url.path) ?? [];
      if (id !== undefined) return { ...video(id, hash), options: start(url) };
    }
    return null;
  },
};
