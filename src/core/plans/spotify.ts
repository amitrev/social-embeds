import type { ParsedEmbed } from '../../parser';
import { query } from '../params';
import type { Plan, PlanError } from '../plan';

export type SpotifyOptions = {
  /** `0` for the dark player. */
  theme?: 0;
};

// The value in Spotify's own embed code.
const ALLOW =
  'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
// Spotify's oEmbed heights: the compact player for single items (docs/decisions.md D60).
const COMPACT = new Set(['track', 'episode']);
const COMPACT_HEIGHT = 152;
const FULL_HEIGHT = 352;

/**
 * A fixed height: the embed code's, else 152px for a track or episode and 352px for the rest.
 * A video show keeps its 16:9 aspect ratio instead.
 */
export function spotifyPlan(
  embed: ParsedEmbed,
  options: SpotifyOptions,
): Plan | PlanError {
  const type = new URL(embed.url).pathname.split('/')[1] ?? '';
  const video = embed.kind === 'video';
  const params = query(
    Object.entries(embed.options),
    options.theme === undefined ? undefined : [['theme', options.theme]],
  );
  return {
    kind: 'iframe',
    src: `https://open.spotify.com/embed/${type}/${embed.id}${video ? '/video' : ''}${params}`,
    title: 'Spotify Embed',
    allow: ALLOW,
    ratio: { width: 16, height: 9 },
    size: video ? embed.size : undefined,
    height: video
      ? undefined
      : (embed.size?.height ??
        (COMPACT.has(type) ? COMPACT_HEIGHT : FULL_HEIGHT)),
  };
}
