import { descendants, hasClass } from '../html';
import { attributeOptions, type PlatformParser, withSize } from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, pixels, type ParsedUrl } from '../url';

// The package builds the embed.reddit.com iframe itself (docs/decisions.md D52).

const HOSTS = new Set([
  'reddit.com',
  'www.reddit.com',
  'old.reddit.com',
  'new.reddit.com',
]);
const POST_PATH =
  /^\/r\/([A-Za-z0-9_]{2,21})\/comments\/([a-z0-9]{1,12})(?:\/([^/]{1,300}))?(?:\/([a-z0-9]{1,16}))?\/?$/;
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

function post(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, sub, postId, slug, commentId] = POST_PATH.exec(url.path) ?? [];
  if (sub === undefined || postId === undefined) return null;
  const base = {
    platform: 'reddit',
    kind: 'post',
    variant: 'iframe',
  } as const;
  const postUrl = `https://www.reddit.com/r/${sub}/comments/${postId}/`;
  // A comment is `comment/{id}`, or `{slug}/{id}` in older permalinks.
  if (commentId === undefined) return { ...base, url: postUrl, id: postId };
  if (slug === undefined) return null;
  return {
    ...base,
    url: `${postUrl}comment/${commentId}/`,
    id: commentId,
  };
}

export const reddit: PlatformParser = {
  platform: 'reddit',
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
  match(url) {
    const found = post(url);
    return found && { ...found, options: {} };
  },
};
