import type { Platform } from './types';
import { parseUrl } from './url';

const BLUESKY_HOSTS = new Set(['bsky.app', 'www.bsky.app']);
const HANDLE_POST =
  /^\/profile\/([^/]{1,253})\/post\/[A-Za-z0-9._~:-]{1,512}\/?$/;
// A handle is a domain name; anything else is neither a handle nor a DID.
const HANDLE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

/**
 * The platform of a post URL that only a network lookup could turn into an embed: a Bluesky
 * URL with a handle instead of a DID. Internal; the parser entry does not export it.
 */
export function needsLookup(url: string): Platform | null {
  const parsed = typeof url === 'string' ? parseUrl(url) : null;
  if (!parsed || !BLUESKY_HOSTS.has(parsed.host)) return null;
  const [, profile] = HANDLE_POST.exec(parsed.path) ?? [];
  return profile !== undefined && HANDLE.test(profile) ? 'bluesky' : null;
}
