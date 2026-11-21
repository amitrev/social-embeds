import { type PlatformParser, sizeOf, withSize } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';

// Albums, songs and playlists; the slug is dropped, since the player does not need it (docs/decisions.md D72).

const PATH =
  /^\/([a-z]{2})\/(album|song|playlist)\/(?:[^/]{1,200}\/)?(\d{1,15}|pl\.[A-Za-z0-9-]{1,64})\/?$/;
const SONG = /^\d{1,15}$/;
const FRAME_HOST = 'embed.music.apple.com';

function appleContent(
  url: ParsedUrl | null,
  host: string,
): Omit<ParsedEmbed, 'platform' | 'options'> | null {
  if (url?.host !== host) return null;
  const [, country, type, id] = PATH.exec(url.path) ?? [];
  if (country === undefined || type === undefined || id === undefined)
    return null;
  if (type === 'playlist' ? !id.startsWith('pl.') : !SONG.test(id)) return null;
  const song = type === 'album' ? url.query.get('i') : undefined;
  if (song !== undefined && !SONG.test(song)) return null;
  return {
    kind: 'post',
    url: `https://music.apple.com/${country}/${type}/${id}${song ? `?i=${song}` : ''}`,
    id: song ?? id,
    variant: 'iframe',
  };
}

export const applemusic: PlatformParser = {
  platform: 'applemusic',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const found = appleContent(
      parseUrl(root.attrs.get('src') ?? ''),
      FRAME_HOST,
    );
    if (!found) return null;
    const { height } = sizeOf(root) ?? {};
    return withSize(
      { platform: 'applemusic', ...found, options: {} },
      height === undefined ? undefined : { height },
    );
  },
  isOwnScript: () => false,
  match(url) {
    const found = appleContent(url, 'music.apple.com');
    return found && { platform: 'applemusic', ...found, options: {} };
  },
  ownsFrame: (src) => src.host === FRAME_HOST,
};
