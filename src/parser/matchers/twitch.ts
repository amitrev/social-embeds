import type { Options, PlatformMatcher } from '../platform';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { TWITCH_CLIPS_HOST as CLIPS_HOST, twitchFrame } from '../frames';

// `parent` names the embedding page, so it is never read from the input (docs/decisions.md D62).

const HOSTS = /* @__PURE__ */ new Set([
  'twitch.tv',
  'www.twitch.tv',
  'm.twitch.tv',
]);
export const CHANNEL = /^[A-Za-z0-9_]{3,25}$/;
export const VIDEO = /^v?(\d{1,12})$/;
export const COLLECTION = /^[A-Za-z0-9_-]{6,30}$/;
export const CLIP = /^[A-Za-z0-9_-]{6,100}$/;
const TIME = /^(?:\d+h)?(?:\d+m)?(?:\d+s)?$/;
// Top-level twitch.tv pages that are not channels.
const RESERVED = /* @__PURE__ */ new Set([
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

export type Target = Omit<ParsedEmbed, 'options'>;

function target(path: string, id: string): Target {
  return {
    platform: 'twitch',
    kind: 'video',
    url: path,
    id,
    variant: 'iframe',
  };
}

export const channel = (name: string) =>
  target(`https://www.twitch.tv/${name.toLowerCase()}`, name.toLowerCase());
export const vod = (id: string) =>
  target(`https://www.twitch.tv/videos/${id}`, id);
export const collection = (id: string) =>
  target(`https://www.twitch.tv/collections/${id}`, id);
export const clip = (slug: string) =>
  target(`https://clips.twitch.tv/${slug}`, slug);

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

export const twitchMatcher: PlatformMatcher = {
  platform: 'twitch',
  name: 'Twitch',
  shapes: ['video iframe'],
  match(url) {
    const page = fromPage(url);
    return page && { ...page.found, options: page.options };
  },
  ownsFrame: twitchFrame,
};
