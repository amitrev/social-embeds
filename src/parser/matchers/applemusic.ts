import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { appleMusicFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// Albums, songs and playlists; the slug is dropped, since the player does not need it (docs/decisions.md D72).

const PATH =
  /^\/([a-z]{2})\/(album|song|playlist)\/(?:[^/]{1,200}\/)?(\d{1,15}|pl\.[A-Za-z0-9-]{1,64})\/?$/;
const SONG = /^\d{1,15}$/;

export function appleContent(
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

export const applemusicMatcher: PlatformMatcher = {
  platform: 'applemusic',
  name: 'Apple Music',
  shapes: ['post iframe'],
  match(url) {
    const found = appleContent(url, 'music.apple.com');
    return found && { platform: 'applemusic', ...found, options: {} };
  },
  ownsFrame: appleMusicFrame,
};
