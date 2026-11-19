import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  query,
  resolveEmbed,
} from './shared';

export type SpotifyOptions = {
  /** `0` for the dark player. */
  theme?: 0;
};

export type SpotifyEmbedProps = EmbedSource &
  Omit<FrameProps, keyof SpotifyOptions> &
  SpotifyOptions;

// The value in Spotify's own embed code.
const ALLOW =
  'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
// Spotify's oEmbed heights: the compact player for single items (docs/decisions.md D60).
const COMPACT = new Set(['track', 'episode']);
const COMPACT_HEIGHT = 152;
const FULL_HEIGHT = 352;

/**
 * A fixed height: the `height` prop, else the embed code's, else 152px for a track or episode
 * and 352px for the rest. A video show keeps its 16:9 aspect ratio instead.
 */
export function SpotifyEmbed(props: SpotifyEmbedProps) {
  const { url, embed: given, onError, height, theme, style, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'spotify');
  useReportError(error, onError);
  if (!embed) return null;

  const type = new URL(embed.url).pathname.split('/')[1] ?? '';
  const video = embed.kind === 'video';
  const params = query(
    Object.entries(embed.options),
    theme === undefined ? undefined : [['theme', theme]],
  );

  return (
    <IframeEmbed
      {...frame}
      style={{ borderRadius: 12, overflow: 'hidden', ...style }}
      height={
        video
          ? height
          : (height ??
            embed.size?.height ??
            (COMPACT.has(type) ? COMPACT_HEIGHT : FULL_HEIGHT))
      }
      src={`https://open.spotify.com/embed/${type}/${embed.id}${video ? '/video' : ''}${params}`}
      title="Spotify Embed"
      allow={ALLOW}
      ratio={{ width: 16, height: 9 }}
      size={video ? embed.size : undefined}
    />
  );
}
