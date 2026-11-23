import { sizeOf, withSize, type PlatformParser, parserOf } from '../platform';
import { parseUrl } from '../url';
import { APPLE_PODCASTS_FRAME_HOST as FRAME_HOST } from '../frames';
import { content, applepodcastsMatcher } from '../matchers/applepodcasts';

export const applepodcasts: PlatformParser = /* @__PURE__ */ parserOf(
  applepodcastsMatcher,
  {
    parse(root) {
      if (root.tag !== 'iframe') return null;
      const found = content(parseUrl(root.attrs.get('src') ?? ''), FRAME_HOST);
      return found && withSize({ ...found, options: {} }, sizeOf(root));
    },
    isOwnScript: () => false,
  },
);
