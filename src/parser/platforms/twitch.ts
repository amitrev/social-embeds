import {
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import {
  TWITCH_PLAYER_HOST as PLAYER_HOST,
  TWITCH_CLIPS_HOST as CLIPS_HOST,
  twitchFrame,
} from '../frames';

// `parent` names the embedding page, so it is never read from the input (docs/decisions.md D62).

const HOSTS = new Set(['twitch.tv', 'www.twitch.tv', 'm.twitch.tv']);
const CHANNEL = /^[A-Za-z0-9_]{3,25}$/;
const VIDEO = /^v?(\d{1,12})$/;
const COLLECTION = /^[A-Za-z0-9_-]{6,30}$/;
const CLIP = /^[A-Za-z0-9_-]{6,100}$/;
const TIME = /^(?:\d+h)?(?:\d+m)?(?:\d+s)?$/;
// Top-level twitch.tv pages that are not channels.
const RESERVED = new Set([
  'directory',
  'videos',
  'collections',
  'settings',
  'subscriptions',
  'inventory',
  'wallet',
  'drops',
  'search',
  'downloads',
  'jobs',
  'turbo',
  'p',
  'login',
  'signup',
]);
const PLAYER_OPTIONS = ['autoplay', 'muted', 'time'];

type Target = Omit<ParsedEmbed, 'options'>;

function target(path: string, id: string): Target {
  return {
    platform: 'twitch',
    kind: 'video',
    url: path,
    id,
    variant: 'iframe',
  };
}

const channel = (name: string) =>
  target(`https://www.twitch.tv/${name.toLowerCase()}`, name.toLowerCase());
const vod = (id: string) => target(`https://www.twitch.tv/videos/${id}`, id);
const collection = (id: string) =>
  target(`https://www.twitch.tv/collections/${id}`, id);
const clip = (slug: string) => target(`https://clips.twitch.tv/${slug}`, slug);

function playerOptions(query: ParsedUrl['query']): Options {
  const options: Options = {};
  for (const name of PLAYER_OPTIONS) {
    const value = query.get(name);
    if (value !== undefined) options[name] = coerce(value);
  }
  return options;
}

/** The player's own precedence: channel, then video, then collection. */
function fromPlayer(url: ParsedUrl): Target | null {
  const name = url.query.get('channel');
  if (name !== undefined) return CHANNEL.test(name) ? channel(name) : null;
  const [, id] = VIDEO.exec(url.query.get('video') ?? '') ?? [];
  if (id !== undefined) return vod(id);
  const list = url.query.get('collection');
  return list !== undefined && COLLECTION.test(list) ? collection(list) : null;
}

function fromPage(url: ParsedUrl): { found: Target; options: Options } | null {
  if (url.host === CLIPS_HOST) {
    const slug = url.path.replace(/^\/|\/$/g, '');
    return CLIP.test(slug) ? { found: clip(slug), options: {} } : null;
  }
  if (!HOSTS.has(url.host)) return null;
  const parts = url.path.replace(/^\/|\/$/g, '').split('/');
  const [first = '', second, third] = parts;
  if (parts.length === 2 && first === 'videos') {
    const [, id] = VIDEO.exec(second ?? '') ?? [];
    if (id === undefined) return null;
    const time = url.query.get('t');
    return {
      found: vod(id),
      options: time !== undefined && TIME.test(time) && time ? { time } : {},
    };
  }
  if (parts.length === 2 && first === 'collections')
    return COLLECTION.test(second ?? '')
      ? { found: collection(second ?? ''), options: {} }
      : null;
  if (parts.length === 3 && second === 'clip')
    return CHANNEL.test(first) && CLIP.test(third ?? '')
      ? { found: clip(third ?? ''), options: {} }
      : null;
  if (
    parts.length === 1 &&
    CHANNEL.test(first) &&
    !RESERVED.has(first.toLowerCase())
  )
    return { found: channel(first), options: {} };
  return null;
}

export const twitch: PlatformParser = {
  platform: 'twitch',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (!src) return null;
    let found: Target | null = null;
    if (src.host === PLAYER_HOST && /^\/?$/.test(src.path))
      found = fromPlayer(src);
    if (src.host === CLIPS_HOST && src.path === '/embed') {
      const slug = src.query.get('clip') ?? '';
      found = CLIP.test(slug) ? clip(slug) : null;
    }
    return (
      found &&
      withSize({ ...found, options: playerOptions(src.query) }, sizeOf(root))
    );
  },
  isOwnScript: () => false,
  match(url) {
    const page = fromPage(url);
    return page && { ...page.found, options: page.options };
  },
  ownsFrame: twitchFrame,
};
