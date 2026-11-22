import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

// The package builds the embed.reddit.com iframe itself (docs/decisions.md D52).

const HOSTS = new Set([
  'reddit.com',
  'www.reddit.com',
  'old.reddit.com',
  'new.reddit.com',
]);
const POST_PATH =
  /^\/r\/([A-Za-z0-9_]{2,21})\/comments\/([a-z0-9]{1,12})(?:\/([^/]{1,300}))?(?:\/([a-z0-9]{1,16}))?\/?$/;

export function post(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
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

export const redditMatcher: PlatformMatcher = {
  platform: 'reddit',
  name: 'Reddit',
  shapes: ['post iframe'],
  match(url) {
    const found = post(url);
    return found && { ...found, options: {} };
  },
};
