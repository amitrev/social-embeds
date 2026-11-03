import { hasClass } from '../html';
import {
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl } from '../url';

// Every TikTok input renders the Embed Player iframe (docs/decisions.md D11).

const HOSTS = new Set(['tiktok.com', 'www.tiktok.com']);
// The user part may be empty: TikTok serves /@/video/{id} (docs/decisions.md D11).
const VIDEO_PATH = /^\/@([A-Za-z0-9._]{0,64})\/video\/(\d{1,25})\/?$/;
const PLAYER_PATH = /^\/player\/v1\/(\d{1,25})\/?$/;
const VIDEO_ID = /^\d{1,25}$/;
const SCRIPT = /^(?:https?:)?\/\/www\.tiktok\.com\/embed\.js$/;

/** `user` is unknown for player iframe input; TikTok serves `/@/video/{id}` for that case. */
function video(id: string, user = '', options: Options = {}): ParsedEmbed {
  return {
    platform: 'tiktok',
    kind: 'video',
    url: `https://www.tiktok.com/@${user}/video/${id}`,
    id,
    variant: 'iframe',
    options,
  };
}

export const tiktok: PlatformParser = {
  platform: 'tiktok',
  parse(root) {
    if (root.tag === 'blockquote' && hasClass(root, 'tiktok-embed')) {
      const cite = parseUrl(root.attrs.get('cite') ?? '');
      const [, user, citeId] =
        cite && HOSTS.has(cite.host) ? (VIDEO_PATH.exec(cite.path) ?? []) : [];
      const dataId = root.attrs.get('data-video-id');
      if (dataId !== undefined && !VIDEO_ID.test(dataId)) return null;
      if (dataId !== undefined && citeId !== undefined && dataId !== citeId)
        return null;
      const id = dataId ?? citeId;
      return id === undefined ? null : video(id, user);
    }

    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (!src || !HOSTS.has(src.host)) return null;
    const [, id] = PLAYER_PATH.exec(src.path) ?? [];
    if (id === undefined) return null;
    // Player parameters are kept as given (https://developers.tiktok.com/doc/embed-player).
    const options: Options = Object.fromEntries(
      [...src.query].map(([key, value]) => [key, coerce(value)]),
    );
    return withSize(video(id, '', options), sizeOf(root));
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    if (!HOSTS.has(url.host)) return null;
    const [, user, id] = VIDEO_PATH.exec(url.path) ?? [];
    return user === undefined || id === undefined ? null : video(id, user);
  },
};
