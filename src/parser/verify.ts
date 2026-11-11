import { parseHtml, rebuild } from './html';
import { matchUrl } from './match-url';
import { platforms } from './platforms';
import { x } from './platforms/x';
import type { ParsedEmbed, Platform } from './types';

const SHAPES: Record<Platform, readonly string[]> = {
  x: ['post sdk'],
  instagram: ['post sdk'],
  threads: ['post sdk'],
  facebook: ['post sdk', 'video sdk', 'video iframe'],
  tiktok: ['video iframe'],
  youtube: ['video iframe'],
};

/**
 * Security: the embed may be host-built, and its url, id and `fallbackHtml` are written
 * into the page: only what this parser itself produces passes (docs/decisions.md D35).
 */
export function verifyEmbed(embed: ParsedEmbed): ParsedEmbed | null {
  const matched = matchUrl(embed.url);
  if (matched?.platform !== embed.platform || matched.id !== embed.id)
    return null;
  if (!SHAPES[embed.platform].includes(`${embed.kind} ${embed.variant}`))
    return null;
  if (embed.fallbackHtml === undefined) return embed;
  if (trustedFallback(embed, embed.fallbackHtml)) return embed;

  const withoutFallback = { ...embed };
  delete withoutFallback.fallbackHtml;
  return withoutFallback;
}

function trustedFallback(embed: ParsedEmbed, fallbackHtml: string): boolean {
  const whitelist = platforms.find(
    (platform) => platform.platform === embed.platform,
  )?.fallback;
  const nodes = parseHtml(fallbackHtml);
  if (!whitelist || !nodes || rebuild(nodes, whitelist) !== fallbackHtml)
    return false;
  if (embed.platform !== 'x') return true;

  // widgets.js renders the post that the blockquote's last status link names.
  const [root] =
    parseHtml(
      `<blockquote class="twitter-tweet">${fallbackHtml}</blockquote>`,
    ) ?? [];
  return root?.type === 'element' && x.parse(root)?.id === embed.id;
}
