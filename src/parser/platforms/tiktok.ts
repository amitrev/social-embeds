import { hasClass } from '../html';
import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
} from '../platform';
import { coerce, parseUrl } from '../url';
import { TIKTOK_HOSTS as HOSTS } from '../frames';
import { video, VIDEO_PATH, tiktokMatcher } from '../matchers/tiktok';

const PLAYER_PATH = /^\/player\/v1\/(\d{1,25})\/?$/;
const VIDEO_ID = /^\d{1,25}$/;
const SCRIPT = /^(?:https?:)?\/\/www\.tiktok\.com\/embed\.js$/;

export const tiktok: PlatformParser = {
  ...tiktokMatcher,
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
    const options: Options = Object.fromEntries(
      [...src.query].map(([key, value]) => [key, coerce(value)]),
    );
    return withSize(video(id, '', options), sizeOf(root));
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
