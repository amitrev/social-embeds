import { descendants, hasClass } from '../html';
import { attributeOptions, withSize, type PlatformParser } from '../platform';
import { coerce, parseUrl, pixels } from '../url';
import { post, redditMatcher } from '../matchers/reddit';

const SCRIPT = /^(?:https?:)?\/\/embed\.reddit\.com\/widgets\.js$/;
const CARD_SCRIPT =
  /^(?:https?:)?\/\/embed\.redditmedia\.com\/widgets\/platform\.js$/;

// The `data-embed-*` attributes that widgets.js copies into the iframe query.
const OPTION_ATTRIBUTES = [
  'depth',
  'style',
  'theme',
  'showmedia',
  'showtitle',
  'showedits',
  'created',
  'locale',
  'showusername',
  'snippet',
].map((name) => [`data-embed-${name}`, name] as const);

export const reddit: PlatformParser = {
  ...redditMatcher,
  parse(root) {
    // `reddit-card` is older code; it renders as the post.
    if (
      root.tag !== 'blockquote' ||
      !(hasClass(root, 'reddit-embed-bq') || hasClass(root, 'reddit-card'))
    )
      return null;
    // widgets.js embeds the first post or comment link it finds.
    const found = descendants(root.children)
      .map((element) =>
        element.tag === 'a'
          ? post(parseUrl(element.attrs.get('href') ?? ''))
          : null,
      )
      .find((embed) => embed !== null);
    if (!found) return null;
    const height = pixels(root.attrs.get('data-embed-height'));
    return withSize(
      { ...found, options: attributeOptions(root, OPTION_ATTRIBUTES, coerce) },
      height === undefined ? undefined : { height },
    );
  },
  isOwnScript: (src) => SCRIPT.test(src) || CARD_SCRIPT.test(src),
};
