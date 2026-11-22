import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { pinterestFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// Widget code and oEmbed iframe code both render through the widget
// (docs/decisions.md D51).

const HOST =
  /^(?:(?:www|[a-z]{2})\.)?pinterest\.(?:[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/;
const PIN_PATH = /^\/pin\/(?:[A-Za-z0-9-]{0,200}--)?(\d{1,25})\/?$/;

export function pin(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'pinterest',
    kind: 'post',
    url: `https://www.pinterest.com/pin/${id}/`,
    id,
    variant: 'sdk',
  };
}

export function pinOf(
  url: ParsedUrl | null,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOST.test(url.host)) return null;
  const [, id] = PIN_PATH.exec(url.path) ?? [];
  return id === undefined ? null : pin(id);
}

export const pinterestMatcher: PlatformMatcher = {
  platform: 'pinterest',
  name: 'Pinterest',
  shapes: ['post sdk'],
  match(url) {
    const found = pinOf(url);
    return found && { ...found, options: {} };
  },
  ownsFrame: pinterestFrame,
};
