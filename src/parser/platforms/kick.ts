import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
} from '../platform';
import { coerce, parseUrl } from '../url';
import { KICK_PLAYER_HOSTS as PLAYER } from '../frames';
import { channel, kickMatcher } from '../matchers/kick';

const KEPT = new Set(['autoplay', 'muted']);

export const kick: PlatformParser = {
  ...kickMatcher,
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    const found = channel(src, PLAYER);
    if (!found || !src) return null;
    const options: Options = Object.fromEntries(
      [...src.query]
        .filter(([key]) => KEPT.has(key))
        .map(([key, value]) => [key, coerce(value)]),
    );
    return withSize({ ...found, options }, sizeOf(root));
  },
  isOwnScript: () => false,
};
