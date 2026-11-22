import { hasClass } from '../html';
import type { PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';

// The frame renders by blog name, so the embed code's token is dropped (docs/decisions.md D74).

const BLOG = '([a-z0-9-]{1,32})';
const POST = '(\\d{1,20})';
const WWW_HOSTS = new Set(['www.tumblr.com', 'tumblr.com']);
const WWW_PATH = new RegExp(`^/${BLOG}/${POST}(?:/[^/]{1,200})?/?$`);
const BLOG_HOST = new RegExp(`^${BLOG}\\.tumblr\\.com$`);
const BLOG_PATH = new RegExp(`^/post/${POST}(?:/[^/]{1,200})?/?$`);
const FRAME_PATH = new RegExp(
  `^/embed/post/(?:t:[A-Za-z0-9_-]{1,64}|${BLOG})/${POST}/v2$`,
);
// Older code: no `/v2`, and a token without `t:`.
const OLD_FRAME_PATH = new RegExp(
  `^/embed/post/(?:t:)?[A-Za-z0-9_-]{1,64}/${POST}$`,
);
// tumblr.com pages and blog subdomains that are not a blog.
const NOT_BLOGS = new Set([
  'dashboard',
  'explore',
  'tagged',
  'search',
  'settings',
  'blog',
  'www',
  'assets',
  'embed',
  'api',
  'help',
]);
const SCRIPT =
  /^(?:https?:)?\/\/(?:secure\.)?assets\.tumblr\.com\/post\.js(?:\?[^#]*)?$/;

function fromUrl(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url) return null;
  let blog: string | undefined;
  let id: string | undefined;
  if (WWW_HOSTS.has(url.host)) [, blog, id] = WWW_PATH.exec(url.path) ?? [];
  else {
    [, blog] = BLOG_HOST.exec(url.host) ?? [];
    [, id] = BLOG_PATH.exec(url.path) ?? [];
  }
  if (blog === undefined || id === undefined || NOT_BLOGS.has(blog))
    return null;
  return {
    platform: 'tumblr',
    kind: 'post',
    url: `https://www.tumblr.com/${blog}/${id}`,
    id,
    variant: 'iframe',
  };
}

export const tumblr: PlatformParser = {
  platform: 'tumblr',
  name: 'Tumblr',
  shapes: ['post iframe'],
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
  match(url) {
    const found = fromUrl(url);
    return found && { ...found, options: {} };
  },
};
