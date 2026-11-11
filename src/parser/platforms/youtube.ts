import {
  type PlatformParser,
  type Options,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
]);
const NOCOOKIE_HOSTS = new Set([
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
// `videoseries` (playlist embeds) is also 11 characters long.
const VIDEO_ID = /^(?!videoseries)[A-Za-z0-9_-]{11}$/;
const EMBED_PATH = /^\/embed\/((?!videoseries)[A-Za-z0-9_-]{11})\/?$/;
const URL_PATHS =
  /^\/(shorts|embed|live)\/((?!videoseries)[A-Za-z0-9_-]{11})\/?$/;
const SHORT_LINK_PATH = /^\/([A-Za-z0-9_-]{11})\/?$/;
const DURATION = /^(?:(\d{1,5})h)?(?:(\d{1,6})m)?(?:(\d{1,7})s?)?$/;

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

function video(id: string, shorts = false): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'youtube',
    kind: 'video',
    url: shorts
      ? `https://www.youtube.com/shorts/${id}`
      : `https://www.youtube.com/watch?v=${id}`,
    id,
    variant: 'iframe',
  };
}

function urlOptions(url: ParsedUrl, nocookie: boolean): Options {
  const start = startOf(url.query);
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
    const [, id] = EMBED_PATH.exec(src.path) ?? [];
    if (id === undefined) return null;

    const entries = [...src.query]
      .filter(([key]) => key !== 't')
      .map(([key, value]): [string, string | number | boolean] => [
        key,
        coerce(value),
      ]);
    const options: Options = Object.fromEntries(entries);
    const start = startOf(src.query);
    if (start !== undefined) options.start = start;
    if (nocookie) options.nocookie = true;

    return withSize({ ...video(id), options }, sizeOf(root));
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

    if (!nocookie && /^\/watch\/?$/.test(url.path)) {
      const id = url.query.get('v');
      return id !== undefined && VIDEO_ID.test(id)
        ? { ...video(id), options: urlOptions(url, false) }
        : null;
    }
    const [, kind, id] = URL_PATHS.exec(url.path) ?? [];
    if (kind === undefined || id === undefined) return null;
    if (nocookie && kind !== 'embed') return null;
    return {
      ...video(id, kind === 'shorts'),
      options: urlOptions(url, nocookie),
    };
  },
};
