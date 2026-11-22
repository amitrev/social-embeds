import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

// The frame renders by blog name, so the embed code's token is dropped (docs/decisions.md D74).

export const BLOG = '([a-z0-9-]{1,32})';
export const POST = '(\\d{1,20})';
const WWW_HOSTS = new Set(['www.tumblr.com', 'tumblr.com']);
const WWW_PATH = new RegExp(`^/${BLOG}/${POST}(?:/[^/]{1,200})?/?$`);
const BLOG_HOST = new RegExp(`^${BLOG}\\.tumblr\\.com$`);
const BLOG_PATH = new RegExp(`^/post/${POST}(?:/[^/]{1,200})?/?$`);
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

export function fromUrl(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
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

export const tumblrMatcher: PlatformMatcher = {
  platform: 'tumblr',
  name: 'Tumblr',
  shapes: ['post iframe'],
  match(url) {
    const found = fromUrl(url);
    return found && { ...found, options: {} };
  },
};
