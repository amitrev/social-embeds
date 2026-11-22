import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

// Every type renders as the iframe at `{url}/embed` (docs/decisions.md D50).

const HOSTS = new Set(['snapchat.com', 'www.snapchat.com']);
const USER = '([A-Za-z][A-Za-z0-9._-]{1,29})';
const SPOTLIGHT = new RegExp(
  `^(?:/@${USER})?/spotlight/([A-Za-z0-9_-]{20,120})$`,
);
const PROFILE = new RegExp(`^/(?:@|add/)${USER}$`);
const LENS = /^\/lens\/([0-9a-f]{32}|\d{1,20})$/;
const HIGHLIGHT = new RegExp(
  `^/@${USER}/highlight/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$`,
);

type Content = Omit<ParsedEmbed, 'options'>;

export function content(url: ParsedUrl | null): Content | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const path = url.path.replace(/\/$/, '');
  const base = { platform: 'snapchat', variant: 'iframe' } as const;

  const [, spotlightUser, spotlightId] = SPOTLIGHT.exec(path) ?? [];
  if (spotlightId !== undefined) {
    const prefix = spotlightUser === undefined ? '' : `/@${spotlightUser}`;
    return {
      ...base,
      kind: 'video',
      url: `https://www.snapchat.com${prefix}/spotlight/${spotlightId}`,
      id: spotlightId,
    };
  }
  const [, user] = PROFILE.exec(path) ?? [];
  if (user !== undefined) {
    return {
      ...base,
      kind: 'post',
      url: `https://www.snapchat.com/@${user}`,
      id: user,
    };
  }
  const [, lens] = LENS.exec(path) ?? [];
  if (lens !== undefined) {
    return {
      ...base,
      kind: 'post',
      url: `https://www.snapchat.com/lens/${lens}`,
      id: lens,
    };
  }
  const [, owner, highlight] = HIGHLIGHT.exec(path) ?? [];
  if (owner !== undefined && highlight !== undefined) {
    return {
      ...base,
      kind: 'post',
      url: `https://www.snapchat.com/@${owner}/highlight/${highlight}`,
      id: highlight,
    };
  }
  return null;
}

export const snapchatMatcher: PlatformMatcher = {
  platform: 'snapchat',
  name: 'Snapchat',
  shapes: ['post iframe', 'video iframe'],
  match(url) {
    const found = content(url);
    return found && { ...found, options: {} };
  },
};
