import { spotifyPlan, type SpotifyOptions } from '../core/plans/spotify';
import { spotify } from '../parser/platforms/spotify';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { SpotifyOptions };

export type SpotifyEmbedProps = EmbedSource &
  Omit<FrameProps, keyof SpotifyOptions> &
  SpotifyOptions;

const SPOTIFY_OPTIONS = ['theme'] as const;

/**
 * A fixed height: the `height` prop, else the embed code's, else 152px for a track or episode
 * and 352px for the rest. A video show keeps its 16:9 aspect ratio instead.
 */
export function SpotifyEmbed(props: SpotifyEmbedProps) {
  const [plan, frame] = usePlan(props, spotify, SPOTIFY_OPTIONS, spotifyPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
