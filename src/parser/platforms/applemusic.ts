import { sizeOf, withSize, type PlatformParser, parserOf } from '../platform';
import { parseUrl } from '../url';
import { APPLE_MUSIC_FRAME_HOST as FRAME_HOST } from '../frames';
import { appleContent, applemusicMatcher } from '../matchers/applemusic';

export const applemusic: PlatformParser = /* @__PURE__ */ parserOf(
  applemusicMatcher,
  {
    parse(root) {
      if (root.tag !== 'iframe') return null;
      const found = appleContent(
        parseUrl(root.attrs.get('src') ?? ''),
        FRAME_HOST,
      );
      if (!found) return null;
      const { height } = sizeOf(root) ?? {};
      return withSize(
        { platform: 'applemusic', ...found, options: {} },
        height === undefined ? undefined : { height },
      );
    },
    isOwnScript: () => false,
  },
);
