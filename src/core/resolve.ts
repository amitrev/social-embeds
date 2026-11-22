import { needsLookup } from '../parser/lookup';
import { matchWith } from '../parser/match-url';
import { parseUrl } from '../parser/url';
import type { PlatformParser } from '../parser/platform';
import type { ParsedEmbed, Platform } from '../parser/types';
import { verifyWith } from '../parser/verify';

// Only these two platforms have URLs that need a lookup.
const LOOKUP_NAMES: Partial<Record<Platform, string>> = {
  bluesky: 'Bluesky',
  rumble: 'Rumble',
};
/** For a post URL that only a network lookup could resolve (docs/decisions.md D70). */
export function lookupMessage(name: string): string {
  return `social-embeds: a ${name} URL needs a lookup: use the embed code`;
}

/** Takes the platform's own parser, so a per-platform component bundles no other (docs/decisions.md D103). */
export function resolveEmbed(
  url: string | undefined,
  given: ParsedEmbed | undefined,
  parser: PlatformParser,
): { embed: ParsedEmbed; error?: never } | { embed?: never; error: string } {
  const { platform, name } = parser;
  const embed = given ?? (url === undefined ? null : matchWith(parser, url));
  if (!embed && url !== undefined && lookupNeeded(parser, url)) {
    return {
      error: lookupMessage(name),
    };
  }
  if (!embed) {
    return {
      error: `social-embeds: not a ${name} post URL: ${String(url)}`,
    };
  }
  if (embed.platform !== platform) {
    return {
      error: `social-embeds: expected a ${name} embed, got ${embed.platform}`,
    };
  }
  const verified = verifyWith(parser, embed);
  if (!verified) {
    return {
      error: `social-embeds: the ${name} embed's url and id do not match`,
    };
  }
  return { embed: verified };
}

/** The message `<SocialEmbed>` reports when its input matches no platform. */
export function sourceError(
  source: { html: string } | { url: string },
): string {
  if ('html' in source) return 'social-embeds: unrecognised embed code';
  const lookup = needsLookup(source.url);
  return lookup
    ? lookupMessage(LOOKUP_NAMES[lookup] ?? lookup)
    : `social-embeds: not a supported post URL: ${source.url}`;
}

function lookupNeeded(parser: PlatformParser, url: string): boolean {
  const parsed = typeof url === 'string' ? parseUrl(url) : null;
  return parsed !== null && parser.needsLookup?.(parsed) === true;
}
