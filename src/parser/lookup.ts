import type { Platform } from './types';
import { parseUrl } from './url';

const BLUESKY_HOSTS = new Set(['bsky.app', 'www.bsky.app']);
const HANDLE_POST =
  /^\/profile\/([^/]{1,253})\/post\/[A-Za-z0-9._~:-]{1,512}\/?$/;
// A handle is a domain name; anything else is neither a handle nor a DID.
const HANDLE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

const RUMBLE_HOSTS = new Set(['rumble.com', 'www.rumble.com']);
// A page id is not the embed id (docs/decisions.md D99).
const RUMBLE_PAGE = /^\/v[a-z0-9]{1,12}-[^/]{1,300}\.html$/;

/**
 * The platform of a post URL that only a network lookup could turn into an embed: a Bluesky
 * URL with a handle instead of a DID, or a Rumble page URL. Internal; the parser entry does not export it.
 */
export function needsLookup(url: string): Platform | null {
  const parsed = typeof url === 'string' ? parseUrl(url) : null;
  if (!parsed) return null;
  if (RUMBLE_HOSTS.has(parsed.host))
    return RUMBLE_PAGE.test(parsed.path) ? 'rumble' : null;
  if (!BLUESKY_HOSTS.has(parsed.host)) return null;
  const [, profile] = HANDLE_POST.exec(parsed.path) ?? [];
  return profile !== undefined && HANDLE.test(profile) ? 'bluesky' : null;
}
