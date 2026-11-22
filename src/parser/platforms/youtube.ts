import {
  type PlatformParser,
  type Options,
  sizeOf,
  underPath,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import {
  YOUTUBE_HOSTS,
  YOUTUBE_NOCOOKIE_HOSTS as NOCOOKIE_HOSTS,
  youtubeFrame,
} from '../frames';

const BASE = 'https://www.youtube.com';
// `videoseries` (playlist embeds) and `live_stream` (a channel's stream) are 11 characters long too.
const VIDEO_ID = /^(?!videoseries|live_stream)[A-Za-z0-9_-]{11}$/;
const EMBED_PATH =
  /^\/embed\/(?:(videoseries|live_stream)|([A-Za-z0-9_-]{11}))\/?$/;
const URL_PATHS =
  /^\/(shorts|live)\/((?!videoseries|live_stream)[A-Za-z0-9_-]{11})\/?$/;
const SHORT_LINK_PATH = /^\/([A-Za-z0-9_-]{11})\/?$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const CHANNEL_LIVE_PATH = /^\/channel\/(UC[A-Za-z0-9_-]{22})\/live\/?$/;
const DURATION = /^(?:(\d{1,5})h)?(?:(\d{1,6})m)?(?:(\d{1,7})s?)?$/;
const FRAGMENT_START = /^t=(.+)$/;

/** `90`, `90s`, `1m30s`, `1h2m3s` → seconds. */
function seconds(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const match = DURATION.exec(value);
  if (!match) return undefined;
  const [, hours = '0', minutes = '0', secs = '0'] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(secs);
}

/** `start` wins over `t`; `t` is converted, because the embed player only reads `start`. */
function startOf(query: ReadonlyMap<string, string>): number | undefined {
  return seconds(query.get('start')) ?? seconds(query.get('t'));
}

type Found = Omit<ParsedEmbed, 'options'>;

function found(id: string, url: string): Found {
  return { platform: 'youtube', kind: 'video', url, id, variant: 'iframe' };
}

function video(id: string, shorts = false): Found {
  return found(id, shorts ? `${BASE}/shorts/${id}` : `${BASE}/watch?v=${id}`);
}

function playlist(id: string | undefined): Found | null {
  return id !== undefined && PLAYLIST_ID.test(id)
    ? found(id, `${BASE}/playlist?list=${id}`)
    : null;
}

function live(id: string | undefined): Found | null {
  return id !== undefined && CHANNEL_ID.test(id)
    ? found(id, `${BASE}/channel/${id}/live`)
    : null;
}

/** `key` is the query parameter that names the content, for a playlist or a channel's stream. */
function fromEmbed(
  url: ParsedUrl,
): { found: Found; key?: 'list' | 'channel' } | null {
  const [, series, id] = EMBED_PATH.exec(url.path) ?? [];
  if (id !== undefined) return { found: video(id) };
  if (series === 'videoseries') {
    const list = playlist(url.query.get('list'));
    return list && { found: list, key: 'list' };
  }
  if (series === 'live_stream') {
    const stream = live(url.query.get('channel'));
    return stream && { found: stream, key: 'channel' };
  }
  return null;
}

function urlOptions(url: ParsedUrl, nocookie: boolean): Options {
  const start =
    startOf(url.query) ?? seconds(FRAGMENT_START.exec(url.fragment ?? '')?.[1]);
  return {
    ...(start === undefined ? {} : { start }),
    ...(nocookie ? { nocookie: true } : {}),
  };
}

export const youtube: PlatformParser = {
  platform: 'youtube',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    const nocookie = src !== null && NOCOOKIE_HOSTS.has(src.host);
    if (!src || !(nocookie || YOUTUBE_HOSTS.has(src.host))) return null;
    const player = fromEmbed(src);
    if (!player) return null;

    const entries = [...src.query]
      .filter(([key]) => key !== 't' && key !== player.key)
      .map(([key, value]): [string, string | number | boolean] => [
        key,
        coerce(value),
      ]);
    const options: Options = Object.fromEntries(entries);
    const start = startOf(src.query);
    if (start !== undefined) options.start = start;
    if (nocookie) options.nocookie = true;

    return withSize({ ...player.found, options }, sizeOf(root));
  },
  isOwnScript: () => false,
  match(url) {
    if (url.host === 'youtu.be') {
      const [, id] = SHORT_LINK_PATH.exec(url.path) ?? [];
      return id === undefined
        ? null
        : { ...video(id), options: urlOptions(url, false) };
    }
    const nocookie = NOCOOKIE_HOSTS.has(url.host);
    if (!nocookie && !YOUTUBE_HOSTS.has(url.host)) return null;
    const options = urlOptions(url, nocookie);

    if (underPath(url.path, '/embed')) {
      const player = fromEmbed(url);
      return player && { ...player.found, options };
    }
    if (nocookie) return null;
    if (/^\/watch\/?$/.test(url.path)) {
      const id = url.query.get('v');
      return id !== undefined && VIDEO_ID.test(id)
        ? { ...video(id), options }
        : null;
    }
    if (/^\/playlist\/?$/.test(url.path)) {
      const list = playlist(url.query.get('list'));
      return list && { ...list, options };
    }
    const [, channel] = CHANNEL_LIVE_PATH.exec(url.path) ?? [];
    const stream = live(channel);
    if (stream) return { ...stream, options };
    const [, kind, id] = URL_PATHS.exec(url.path) ?? [];
    if (kind === undefined || id === undefined) return null;
    return { ...video(id, kind === 'shorts'), options };
  },
  ownsFrame: youtubeFrame,
};
