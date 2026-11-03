import { parseHtml, rebuild } from './html';
import { matchUrl } from './match-url';
import { platforms } from './platforms';
import { x } from './platforms/x';
import type { ParsedEmbed, Platform } from './types';

/** The kind and variant pairs the parser produces for each platform. */
const SHAPES: Record<Platform, readonly string[]> = {
  x: ['post sdk'],
  instagram: ['post sdk'],
  threads: ['post sdk'],
  facebook: ['post sdk', 'video sdk', 'video iframe'],
  tiktok: ['video iframe'],
  youtube: ['video iframe'],
};

/**
 * Checks an embed handed to a component. It may not come from this parser: a host can build
 * one, or read one back from storage.
 *
 * - Its URL must be one `matchUrl` recognises for the same platform and id, and its kind
 *   and variant a pair the parser produces, because components put the URL and id into
 *   iframe sources and platform markup.
 * - Its `fallbackHtml` must be exactly what the platform's whitelist rebuilds, because
 *   components write it into the page as HTML. For X it must also link to the same post,
 *   because widgets.js renders the post the blockquote links to. Otherwise the fallback is
 *   dropped.
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

  // The same check parseEmbed makes: the last status link names the post.
  const [root] =
    parseHtml(
      `<blockquote class="twitter-tweet">${fallbackHtml}</blockquote>`,
    ) ?? [];
  return root?.type === 'element' && x.parse(root)?.id === embed.id;
}
