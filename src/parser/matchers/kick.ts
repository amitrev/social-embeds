import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { KICK_PLAYER_HOSTS as PLAYER, kickFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

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

export function channel(
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

export const kickMatcher: PlatformMatcher = {
  platform: 'kick',
  name: 'Kick',
  shapes: ['video iframe'],
  match(url) {
    const found = channel(url, PAGE_HOSTS) ?? channel(url, PLAYER);
    return found && { ...found, options: {} };
  },
  ownsFrame: kickFrame,
};
