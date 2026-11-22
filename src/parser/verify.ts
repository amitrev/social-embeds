import { matchWith } from './match-url';
import type { PlatformParser } from './platform';
import { parserFor } from './platforms';
import type { ParsedEmbed } from './types';

/**
 * Security: the embed may be host-built, and its url, id and `fallbackHtml` are written
 * into the page: only what this parser itself produces passes (docs/decisions.md D35).
 */
export function verifyEmbed(embed: ParsedEmbed): ParsedEmbed | null {
  const parser = parserFor(embed.platform);
  return parser ? verifyWith(parser, embed) : null;
}

/**
 * `verifyEmbed` with only the embed's own parser, so a per-platform component does not
 * bundle the other platforms' (docs/decisions.md D103).
 */
export function verifyWith(
  parser: PlatformParser,
  embed: ParsedEmbed,
): ParsedEmbed | null {
  if (embed.platform !== parser.platform) return null;
  const matched = matchWith(parser, embed.url);
  if (matched?.platform !== embed.platform || matched.id !== embed.id)
    return null;
  // Components build iframe `src` from the URL, so it must be the parser's own form (docs/decisions.md D57).
  if (matched.url !== embed.url) return null;
  if (!parser.shapes.includes(`${embed.kind} ${embed.variant}`)) return null;
  if (embed.fallbackHtml === undefined) return embed;
  if (parser.trustsFallback?.(embed.fallbackHtml, embed)) return embed;

  const withoutFallback = { ...embed };
  delete withoutFallback.fallbackHtml;
  return withoutFallback;
}
