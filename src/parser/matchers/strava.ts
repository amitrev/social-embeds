import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

// `data-embed-type` and `data-embed-id` are content, never options (docs/decisions.md D68, D97).

const HOSTS = new Set(['strava.com', 'www.strava.com']);
const PAGE_PATH = /^\/(activities|routes)\/(\d{1,20})\/?$/;
const PAGES = { activity: 'activities', route: 'routes' } as const;
export type Type = keyof typeof PAGES;

export function item(type: Type, number: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'strava',
    kind: 'post',
    url: `https://www.strava.com/${PAGES[type]}/${number}`,
    id: `${type}/${number}`,
    variant: 'iframe',
  };
}

export const stravaMatcher: PlatformMatcher = {
  platform: 'strava',
  name: 'Strava',
  shapes: ['post iframe'],
  match(url: ParsedUrl) {
    if (!HOSTS.has(url.host)) return null;
    const [, page, number] = PAGE_PATH.exec(url.path) ?? [];
    if (page === undefined || number === undefined) return null;
    return {
      ...item(page === 'routes' ? 'route' : 'activity', number),
      options: {},
    };
  },
};
