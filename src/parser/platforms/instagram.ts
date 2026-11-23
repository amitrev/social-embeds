import { parserOf } from '../platform';
import { descendants, hasClass, rebuild } from '../html';
import type { Options, PlatformParser } from '../platform';
import { coerce, parseUrl } from '../url';
import { post, FALLBACK, instagramMatcher } from '../matchers/instagram';

const SCRIPT = /^(?:https?:)?\/\/www\.instagram\.com\/embed\.js$/;

export const instagram: PlatformParser = /* @__PURE__ */ parserOf(
  instagramMatcher,
  {
    parse(root) {
      if (root.tag !== 'blockquote' || !hasClass(root, 'instagram-media'))
        return null;
      // Like embed.js: the permalink attribute, else the last link to a post.
      const permalink = root.attrs.get('data-instgrm-permalink');
      const found =
        permalink === undefined
          ? descendants(root.children)
              .reverse()
              .map((element) =>
                element.tag === 'a'
                  ? post(parseUrl(element.attrs.get('href') ?? ''))
                  : null,
              )
              .find((candidate) => candidate !== null)
          : post(parseUrl(permalink));
      if (!found) return null;

      // embed.js only checks whether data-instgrm-captioned is present.
      const options: Options = {};
      if (root.attrs.has('data-instgrm-captioned')) options.captioned = true;
      const version = root.attrs.get('data-instgrm-version');
      if (version !== undefined) options.version = coerce(version);

      return {
        ...found,
        options,
        fallbackHtml: rebuild(root.children, FALLBACK),
      };
    },
    isOwnScript: (src) => SCRIPT.test(src),
  },
);
