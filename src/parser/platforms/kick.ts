import {
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import { KICK_PLAYER_HOSTS as PLAYER, kickFrame } from '../frames';

// Channels only: Kick has no embed dialog, and its player takes a channel name (docs/decisions.md D75).

const PAGE_HOSTS = new Set(['kick.com', 'www.kick.com']);
const CHANNEL = /^\/([A-Za-z0-9_-]{1,32})\/?$/;
// kick.com pages that are not a channel.
const NOT_CHANNELS = new Set([
  'browse',
  'categories',
  'category',
  'clips',
  'video',
  'videos',
  'following',
  'search',
  'settings',
  'dashboard',
  'subscriptions',
  'privacy-policy',
  'terms-of-service',
  'community-guidelines',
  'help',
]);
const KEPT = new Set(['autoplay', 'muted']);

function channel(
  url: ParsedUrl | null,
  hosts: ReadonlySet<string>,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !hosts.has(url.host)) return null;
  const [, name] = CHANNEL.exec(url.path) ?? [];
  if (name === undefined || NOT_CHANNELS.has(name.toLowerCase())) return null;
  const id = name.toLowerCase();
  return {
    platform: 'kick',
    kind: 'video',
    url: `https://kick.com/${id}`,
    id,
    variant: 'iframe',
  };
}

export const kick: PlatformParser = {
  platform: 'kick',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    const found = channel(src, PLAYER);
    if (!found || !src) return null;
    const options: Options = Object.fromEntries(
      [...src.query]
        .filter(([key]) => KEPT.has(key))
        .map(([key, value]) => [key, coerce(value)]),
    );
    return withSize({ ...found, options }, sizeOf(root));
  },
  isOwnScript: () => false,
  match(url) {
    const found = channel(url, PAGE_HOSTS) ?? channel(url, PLAYER);
    return found && { ...found, options: {} };
  },
  ownsFrame: kickFrame,
};
