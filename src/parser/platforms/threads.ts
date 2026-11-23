import { hasClass, rebuild } from '../html';
import { attributeOptions, type PlatformParser, parserOf } from '../platform';
import { coerce, parseUrl } from '../url';
import { post, FALLBACK, threadsMatcher } from '../matchers/threads';

const SCRIPT = /^(?:https?:)?\/\/www\.threads\.(?:com|net)\/embed\.js$/;

const OPTION_ATTRIBUTES = [
  ['data-theme', 'theme'],
  ['data-text-post-version', 'version'],
] as const;

export const threads: PlatformParser = /* @__PURE__ */ parserOf(
  threadsMatcher,
  {
    parse(root) {
      if (root.tag !== 'blockquote' || !hasClass(root, 'text-post-media'))
        return null;
      const found = post(
        parseUrl(root.attrs.get('data-text-post-permalink') ?? ''),
      );
      if (!found) return null;
      const elementId = root.attrs.get('id');
      if (elementId !== undefined && elementId !== `ig-tp-${found.id}`)
        return null;
      return {
        ...found,
        options: attributeOptions(root, OPTION_ATTRIBUTES, coerce),
        fallbackHtml: rebuild(root.children, FALLBACK),
      };
    },
    isOwnScript: (src) => SCRIPT.test(src),
  },
);
