import { parseHtml, rebuild } from './html';
import { matchWith } from './match-url';
import type { PlatformParser } from './platform';
import { parserFor } from './platforms';
import type { ParsedEmbed, Platform } from './types';

const SHAPES: Record<Platform, readonly string[]> = {
  x: ['post sdk'],
  instagram: ['post sdk'],
  threads: ['post sdk'],
  facebook: ['post sdk', 'video sdk', 'video iframe'],
  tiktok: ['video iframe'],
  youtube: ['video iframe'],
  telegram: ['post iframe'],
  snapchat: ['post iframe', 'video iframe'],
  linkedin: ['post iframe'],
  reddit: ['post iframe'],
  pinterest: ['post sdk'],
  spotify: ['post iframe', 'video iframe'],
  vimeo: ['video iframe'],
  twitch: ['video iframe'],
  dailymotion: ['video iframe'],
  bluesky: ['post iframe'],
  soundcloud: ['post iframe'],
  applemusic: ['post iframe'],
  applepodcasts: ['post iframe'],
  tumblr: ['post iframe'],
  kick: ['video iframe'],
  giphy: ['video iframe'],
  truthsocial: ['post iframe'],
  imgur: ['post iframe'],
  tenor: ['video iframe'],
  streamable: ['video iframe'],
  strava: ['post iframe'],
  flickr: ['post iframe'],
  rumble: ['video iframe'],
};

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
  if (!SHAPES[embed.platform].includes(`${embed.kind} ${embed.variant}`))
    return null;
  if (embed.fallbackHtml === undefined) return embed;
  if (trustedFallback(parser, embed, embed.fallbackHtml)) return embed;

  const withoutFallback = { ...embed };
  delete withoutFallback.fallbackHtml;
  return withoutFallback;
}

function trustedFallback(
  parser: PlatformParser,
  embed: ParsedEmbed,
  fallbackHtml: string,
): boolean {
  const whitelist = parser.fallback;
  const nodes = parseHtml(fallbackHtml);
  if (!whitelist || !nodes || rebuild(nodes, whitelist) !== fallbackHtml)
    return false;
  if (embed.platform !== 'x') return true;

  // widgets.js renders the post that the blockquote's last status link names.
  const [root] =
    parseHtml(
      `<blockquote class="twitter-tweet">${fallbackHtml}</blockquote>`,
    ) ?? [];
  return root?.type === 'element' && parser.parse(root)?.id === embed.id;
}
