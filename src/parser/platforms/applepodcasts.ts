import { type PlatformParser, sizeOf, withSize } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';

// Episodes from embed code, shows from URLs; the slug is dropped (docs/decisions.md D73).

const PATH = /^\/([a-z]{2})\/podcast\/(?:[^/]{1,200}\/)?(?:id)?(\d{1,15})\/?$/;
const EPISODE = /^\d{1,15}$/;
const FRAME_HOST = 'embed.podcasts.apple.com';

function content(
  url: ParsedUrl | null,
  host: string,
): Omit<ParsedEmbed, 'options'> | null {
  if (url?.host !== host) return null;
  const [, country, show] = PATH.exec(url.path) ?? [];
  if (country === undefined || show === undefined) return null;
  const episode = url.query.get('i');
  if (episode !== undefined && !EPISODE.test(episode)) return null;
  return {
    platform: 'applepodcasts',
    kind: 'post',
    url: `https://podcasts.apple.com/${country}/podcast/id${show}${episode ? `?i=${episode}` : ''}`,
    id: episode ?? show,
    variant: 'iframe',
  };
}

export const applepodcasts: PlatformParser = {
  platform: 'applepodcasts',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const found = content(parseUrl(root.attrs.get('src') ?? ''), FRAME_HOST);
    return found && withSize({ ...found, options: {} }, sizeOf(root));
  },
  isOwnScript: () => false,
  match(url) {
    const found = content(url, 'podcasts.apple.com');
    return found && { ...found, options: {} };
  },
  ownsFrame: (src) => src.host === FRAME_HOST,
};
