import { parseHtml, rebuild } from './html';
import { matchUrl } from './match-url';
import { platforms } from './platforms';
import type { ParsedEmbed } from './types';

/**
 * Checks an embed handed to a component. It may not come from this parser: a host can build
 * one, or read one back from storage. Its URL must be one `matchUrl` recognises for the same
 * platform and id, because components put the URL and id into iframe sources and platform
 * markup. Its `fallbackHtml` must be exactly what the platform's whitelist rebuilds, else it
 * is dropped, because components write it into the page as HTML.
 */
export function verifyEmbed(embed: ParsedEmbed): ParsedEmbed | null {
  const matched = matchUrl(embed.url);
  if (matched?.platform !== embed.platform || matched.id !== embed.id)
    return null;
  if (embed.fallbackHtml === undefined) return embed;

  const whitelist = platforms.find(
    (platform) => platform.platform === embed.platform,
  )?.fallback;
  const nodes = parseHtml(embed.fallbackHtml);
  if (whitelist && nodes && rebuild(nodes, whitelist) === embed.fallbackHtml)
    return embed;
  const withoutFallback = { ...embed };
  delete withoutFallback.fallbackHtml;
  return withoutFallback;
}
