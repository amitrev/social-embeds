import { hasClass, rebuild } from '../html';
import { attributeOptions, type PlatformParser } from '../platform';
import { coerce } from '../url';
import { lastStatus, FALLBACK, xMatcher } from '../matchers/x';

const SCRIPT = /^(?:https?:)?\/\/platform\.(?:x|twitter)\.com\/widgets\.js$/;

// publish.x.com emits a plain `align` attribute; `data-align` is the documented spelling.
const OPTION_ATTRIBUTES = [
  ['data-theme', 'theme'],
  ['data-conversation', 'conversation'],
  ['data-cards', 'cards'],
  ['data-align', 'align'],
  ['align', 'align'],
  ['data-lang', 'lang'],
  ['data-dnt', 'dnt'],
  ['data-width', 'width'],
] as const;

export const x: PlatformParser = {
  ...xMatcher,
  parse(root) {
    // `twitter-video` is older code for a post with a video.
    if (
      root.tag !== 'blockquote' ||
      !(hasClass(root, 'twitter-tweet') || hasClass(root, 'twitter-video'))
    )
      return null;
    const status = lastStatus(root.children);
    if (!status) return null;
    return {
      ...status,
      options: attributeOptions(root, OPTION_ATTRIBUTES, coerce),
      fallbackHtml: rebuild(root.children, FALLBACK),
    };
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
