import { sizeOf, withSize, type PlatformParser, parserOf } from '../platform';
import { parseUrl } from '../url';
import { options, content, spotifyMatcher } from '../matchers/spotify';

export const spotify: PlatformParser = /* @__PURE__ */ parserOf(
  spotifyMatcher,
  {
    parse(root) {
      if (root.tag !== 'iframe') return null;
      const src = parseUrl(root.attrs.get('src') ?? '');
      if (!src?.path.startsWith('/embed/')) return null;
      const found = content(src);
      if (!found) return null;
      const { query, ...embed } = found;
      return withSize({ ...embed, options: options(query) }, sizeOf(root));
    },
    isOwnScript: () => false,
  },
);
