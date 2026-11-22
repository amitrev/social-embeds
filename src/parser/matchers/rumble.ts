import { rumbleNeedsLookup } from '../lookup';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { rumbleFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// Iframe code only: the embedJS player has no iframe, and a page URL holds another id (docs/decisions.md D99).

const PATH = /^\/embed\/(v[a-z0-9]{1,12})\/?$/;
const HOSTS = new Set(['rumble.com', 'www.rumble.com']);

export function video(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'rumble',
    kind: 'video',
    url: `https://rumble.com/embed/${id}/`,
    id,
    variant: 'iframe',
  };
}

export function idOf(url: ParsedUrl | null, hosts: ReadonlySet<string>) {
  return url && hosts.has(url.host) ? PATH.exec(url.path)?.[1] : undefined;
}

export const rumbleMatcher: PlatformMatcher = {
  platform: 'rumble',
  name: 'Rumble',
  shapes: ['video iframe'],
  needsLookup: rumbleNeedsLookup,
  match(url) {
    const id = idOf(url, HOSTS);
    return id === undefined ? null : { ...video(id), options: {} };
  },
  ownsFrame: rumbleFrame,
};
