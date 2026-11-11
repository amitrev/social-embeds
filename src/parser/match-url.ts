import { platforms } from './platforms';
import type { ParsedEmbed } from './types';
import { parseUrl } from './url';

/** Never throws. Options hold only what the URL itself carries (docs/decisions.md D13). */
export function matchUrl(url: string): ParsedEmbed | null {
  // Callers without type checking may pass anything.
  if (typeof url !== 'string') return null;
  const parsed = parseUrl(url);
  if (!parsed) return null;
  for (const platform of platforms) {
    const embed = platform.match(parsed);
    if (embed) return embed;
  }
  return null;
}
