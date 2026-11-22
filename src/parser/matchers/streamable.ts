import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { streamableFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// Two wrapper styles and one stray `</div>` are accepted (docs/decisions.md D96).

const ID = '([a-z0-9]{4,8})';
const PAGE_HOSTS = new Set(['streamable.com', 'www.streamable.com']);
export const PLAYER_PATH = new RegExp(`^/[eo]/${ID}$`);
const PAGE_PATH = new RegExp(`^/${ID}/?$`);
// Short paths on streamable.com that are pages, not videos.
const NOT_VIDEOS = new Set([
  'about',
  'login',
  'signup',
  'terms',
  'privacy',
  'pricing',
  'upload',
  'help',
  'apps',
  'blog',
  'jobs',
  'press',
  'tools',
  'embed',
  'plans',
  'contact',
  'support',
  'videos',
  'account',
  'profile',
]);

export function video(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'streamable',
    kind: 'video',
    url: `https://streamable.com/${id}`,
    id,
    variant: 'iframe',
  };
}

export function validId(id: string | undefined): id is string {
  return id !== undefined && !NOT_VIDEOS.has(id);
}

function idOf(url: ParsedUrl | null): string | undefined {
  if (!url || !PAGE_HOSTS.has(url.host)) return undefined;
  const id = (PLAYER_PATH.exec(url.path) ?? PAGE_PATH.exec(url.path))?.[1];
  return validId(id) ? id : undefined;
}

export const streamableMatcher: PlatformMatcher = {
  platform: 'streamable',
  name: 'Streamable',
  shapes: ['video iframe'],
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...video(id), options: {} };
  },
  ownsFrame: streamableFrame,
};
