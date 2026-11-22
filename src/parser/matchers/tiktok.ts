import type { Options, PlatformMatcher } from '../platform';
import type { ParsedEmbed } from '../types';
import { TIKTOK_HOSTS as HOSTS, tiktokFrame } from '../frames';

// Every TikTok input renders the Embed Player iframe (docs/decisions.md D11).

// The user part may be empty: TikTok serves /@/video/{id} (docs/decisions.md D11).
export const VIDEO_PATH = /^\/@([A-Za-z0-9._]{0,64})\/video\/(\d{1,25})\/?$/;

export function video(
  id: string,
  user = '',
  options: Options = {},
): ParsedEmbed {
  return {
    platform: 'tiktok',
    kind: 'video',
    url: `https://www.tiktok.com/@${user}/video/${id}`,
    id,
    variant: 'iframe',
    options,
  };
}

export const tiktokMatcher: PlatformMatcher = {
  platform: 'tiktok',
  name: 'TikTok',
  shapes: ['video iframe'],
  match(url) {
    if (!HOSTS.has(url.host)) return null;
    const [, user, id] = VIDEO_PATH.exec(url.path) ?? [];
    return user === undefined || id === undefined ? null : video(id, user);
  },
  ownsFrame: tiktokFrame,
};
