import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
} from '../platform';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import {
  TWITCH_PLAYER_HOST as PLAYER_HOST,
  TWITCH_CLIPS_HOST as CLIPS_HOST,
} from '../frames';
import {
  channel,
  type Target,
  CHANNEL,
  collection,
  COLLECTION,
  vod,
  VIDEO,
  clip,
  CLIP,
  twitchMatcher,
} from '../matchers/twitch';

const PLAYER_OPTIONS = ['autoplay', 'muted', 'time'];

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

export const twitch: PlatformParser = {
  ...twitchMatcher,
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
};
