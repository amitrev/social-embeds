import {
  type Options,
  type PlatformParser,
  sizeOf,
  unwrapRatio,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import {
  DAILYMOTION_HOSTS as HOSTS,
  DAILYMOTION_PLAYER_HOST as PLAYER_HOST,
  DAILYMOTION_SHORT_HOST as SHORT_HOST,
  dailymotionFrame,
} from '../frames';

// Dailymotion refuses embeds without a publisher's Player ID (docs/decisions.md D63).

const VIDEO_ID = /^x[a-z0-9]{4,12}$/;
const PLAYER_ID = /^x[a-z0-9]{3,12}$/;
const WRAPPER =
  /^position:\s*relative;\s*padding-bottom:\s*(\d{1,3}(?:\.\d{1,4})?)%;\s*height:\s*0;\s*overflow:\s*hidden;?$/;

function video(id: string, options: Options): ParsedEmbed {
  return {
    platform: 'dailymotion',
    kind: 'video',
    url: `https://www.dailymotion.com/video/${id}`,
    id,
    variant: 'iframe',
    options,
  };
}

/** A geo.dailymotion.com player, with or without a Player ID. Playlists are left out. */
function fromPlayer(url: ParsedUrl): ParsedEmbed | null {
  if (url.host !== PLAYER_HOST || url.query.has('playlist')) return null;
  const match = /^\/player(?:\/([a-z0-9]+))?\.html$/.exec(url.path);
  if (!match) return null;
  const [, playerId] = match;
  const id = url.query.get('video') ?? '';
  if (!VIDEO_ID.test(id)) return null;
  if (playerId !== undefined && !PLAYER_ID.test(playerId)) return null;
  const options: Options = Object.fromEntries(
    [...url.query]
      .filter(([key]) => key !== 'video')
      .map(([key, value]) => [key, coerce(value)]),
  );
  if (playerId !== undefined) options.playerId = playerId;
  return video(id, options);
}

function fromPage(url: ParsedUrl): ParsedEmbed | null {
  if (url.host === SHORT_HOST) {
    const id = url.path.replace(/^\/|\/$/g, '');
    return VIDEO_ID.test(id) ? video(id, {}) : null;
  }
  if (!HOSTS.has(url.host)) return null;
  const [, id] = /^(?:\/embed)?\/video\/([a-z0-9]+)\/?$/.exec(url.path) ?? [];
  return id !== undefined && VIDEO_ID.test(id) ? video(id, {}) : null;
}

export const dailymotion: PlatformParser = {
  platform: 'dailymotion',
  name: 'Dailymotion',
  shapes: ['video iframe'],
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    if (iframe.tag !== 'iframe') return null;
    const src = parseUrl(iframe.attrs.get('src') ?? '');
    if (!src) return null;
    const embed = fromPlayer(src) ?? fromPage(src);
    return embed && withSize(embed, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: () => false,
  match(url) {
    return fromPlayer(url) ?? fromPage(url);
  },
  ownsFrame: dailymotionFrame,
};
