import type { Options, PlatformMatcher } from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, type ParsedUrl } from '../url';
import { SPOTIFY_HOST as HOST, spotifyFrame } from '../frames';

// A fixed-height player; a video show or episode is a 16:9 player (docs/decisions.md D60).

const TYPES = 'track|album|playlist|artist|episode|show|audiobook|chapter';
const CONTENT_PATH = /* @__PURE__ */ new RegExp(
  `^(?:/intl-[a-z]{2}(?:-[A-Za-z]{2})?)?(?:/embed)?/(${TYPES})/([A-Za-z0-9]{22})(/video)?/?$`,
);
// utm_source is Spotify's tracking, and si a share id.
const DROPPED = /* @__PURE__ */ new Set(['utm_source', 'si']);

export function content(
  url: ParsedUrl | null,
): (Omit<ParsedEmbed, 'options'> & { query: ParsedUrl['query'] }) | null {
  if (url?.host !== HOST) return null;
  const [, type, id, video] = CONTENT_PATH.exec(url.path) ?? [];
  if (type === undefined || id === undefined) return null;
  return {
    platform: 'spotify',
    kind: video ? 'video' : 'post',
    url: `https://open.spotify.com/${type}/${id}`,
    id,
    variant: 'iframe',
    query: url.query,
  };
}

export function options(query: ParsedUrl['query']): Options {
  return Object.fromEntries(
    [...query]
      .filter(([key]) => !DROPPED.has(key))
      .map(([key, value]) => [key, coerce(value)]),
  );
}

export const spotifyMatcher: PlatformMatcher = {
  platform: 'spotify',
  name: 'Spotify',
  shapes: ['post iframe', 'video iframe'],
  match(url) {
    const found = content(url);
    // A URL cannot tell a video show from an audio one: it renders the audio player.
    return (
      found && {
        platform: found.platform,
        kind: 'post',
        url: found.url,
        id: found.id,
        variant: found.variant,
        options: {},
      }
    );
  },
  ownsFrame: spotifyFrame,
};
