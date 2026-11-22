import { hasClass } from '../html';
import { parseUrl } from '../url';
import type { PlatformParser } from '../platform';
import { fromUrl, POST, BLOG, tumblrMatcher } from '../matchers/tumblr';

const FRAME_PATH = new RegExp(
  `^/embed/post/(?:t:[A-Za-z0-9_-]{1,64}|${BLOG})/${POST}/v2$`,
);
// Older code: no `/v2`, and a token without `t:`.
const OLD_FRAME_PATH = new RegExp(
  `^/embed/post/(?:t:)?[A-Za-z0-9_-]{1,64}/${POST}$`,
);
const SCRIPT =
  /^(?:https?:)?\/\/(?:secure\.)?assets\.tumblr\.com\/post\.js(?:\?[^#]*)?$/;

export const tumblr: PlatformParser = {
  ...tumblrMatcher,
  parse(root) {
    if (root.tag !== 'div' || !hasClass(root, 'tumblr-post')) return null;
    const frame = parseUrl(root.attrs.get('data-href') ?? '');
    if (frame?.host !== 'embed.tumblr.com') return null;
    const [, frameBlog, v2Post] = FRAME_PATH.exec(frame.path) ?? [];
    const framePost = v2Post ?? OLD_FRAME_PATH.exec(frame.path)?.[1];
    if (framePost === undefined) return null;
    const [link, ...rest] = root.children.filter(
      (node) => node.type !== 'text' || node.raw.trim() !== '',
    );
    if (rest.length > 0 || link?.type !== 'element' || link.tag !== 'a')
      return null;
    const found = fromUrl(parseUrl(link.attrs.get('href') ?? ''));
    if (found?.id !== framePost) return null;
    // A frame that names a blog must name the linked one; a token cannot be checked.
    if (
      frameBlog !== undefined &&
      found.url !== `https://www.tumblr.com/${frameBlog}/${framePost}`
    )
      return null;
    return { ...found, options: {} };
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
