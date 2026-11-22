import { blueskyNeedsLookup } from '../lookup';
import { type Whitelist, rebuildsAs } from '../html';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

// Only a DID names a post without a lookup; handle URLs return null (docs/decisions.md D70).

export const DID = '(did:(?:plc:[a-z2-7]{24}|web:[a-z0-9.-]{1,253}))';
// The AT Protocol forbids the record keys `.` and `..`, which would also move the frame's path.
export const RKEY = '((?!\\.{1,2}(?:/|$))[A-Za-z0-9._~:-]{1,512})';
const HOSTS = new Set(['bsky.app', 'www.bsky.app']);
const POST_PATH = new RegExp(`^/profile/${DID}/post/${RKEY}/?$`);

export const FALLBACK: Whitelist = new Map([
  ['p', ['lang']],
  ['a', ['href']],
  ['br', []],
]);

export function post(did: string, rkey: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'bluesky',
    kind: 'post',
    url: `https://bsky.app/profile/${did}/post/${rkey}`,
    id: `${did}/app.bsky.feed.post/${rkey}`,
    variant: 'iframe',
  };
}

export function fromUrl(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, did, rkey] = POST_PATH.exec(url.path) ?? [];
  return did === undefined || rkey === undefined ? null : post(did, rkey);
}

export const blueskyMatcher: PlatformMatcher = {
  platform: 'bluesky',
  name: 'Bluesky',
  shapes: ['post iframe'],
  needsLookup: blueskyNeedsLookup,
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  match(url) {
    const found = fromUrl(url);
    return found && { ...found, options: {} };
  },
};
