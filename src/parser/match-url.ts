import type { PlatformParser } from './platform';
import { platforms } from './platforms';
import type { ParsedEmbed } from './types';
import { type ParsedUrl, parseUrl } from './url';

/** Never throws. Options hold only what the URL itself carries (docs/decisions.md D13). */
export function matchUrl(url: string): ParsedEmbed | null {
  return matchUrlWith(platforms, url);
}

/** `matchUrl` for these platforms only. */
export function matchUrlWith(
  parsers: readonly PlatformParser[],
  url: string,
): ParsedEmbed | null {
  const parsed = parse(url);
  if (!parsed) return null;
  for (const platform of parsers) {
    const embed = platform.match(parsed);
    if (embed) return embed;
  }
  return null;
}

/** `matchUrl` for one platform. */
export function matchWith(
  parser: PlatformParser,
  url: string,
): ParsedEmbed | null {
  const parsed = parse(url);
  return parsed && parser.match(parsed);
}

function parse(url: string): ParsedUrl | null {
  // Callers without type checking may pass anything.
  return typeof url === 'string' ? parseUrl(url) : null;
}
