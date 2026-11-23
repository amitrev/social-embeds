import { type Whitelist, rebuildsAs } from '../html';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { tenorFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// The default ratio, 1.33, is embed.js's own (docs/decisions.md D95); a URL carries no size here.

const HOSTS = /* @__PURE__ */ new Set(['tenor.com', 'www.tenor.com']);
export const ID = '(\\d{1,20})';
const PAGE_PATH = /* @__PURE__ */ new RegExp(
  `^/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?/)?view/(?:[A-Za-z0-9%_.~-]{1,300}-gif-)?${ID}/?$`,
);
export const FALLBACK: Whitelist = /* @__PURE__ */ new Map([['a', ['href']]]);

export function gif(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'tenor',
    kind: 'video',
    url: `https://tenor.com/view/${id}`,
    id,
    variant: 'iframe',
  };
}

function idOf(url: ParsedUrl | null): string | undefined {
  return url && HOSTS.has(url.host) ? PAGE_PATH.exec(url.path)?.[1] : undefined;
}

export const tenorMatcher: PlatformMatcher = {
  platform: 'tenor',
  name: 'Tenor',
  shapes: ['video iframe'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...gif(id), options: {} };
  },
  ownsFrame: tenorFrame,
};
