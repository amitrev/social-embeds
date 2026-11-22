import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
} from '../platform';
import { coerce, parseUrl } from '../url';
import {
  YOUTUBE_HOSTS,
  YOUTUBE_NOCOOKIE_HOSTS as NOCOOKIE_HOSTS,
} from '../frames';
import { fromEmbed, startOf, youtubeMatcher } from '../matchers/youtube';

export const youtube: PlatformParser = {
  ...youtubeMatcher,
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
};
