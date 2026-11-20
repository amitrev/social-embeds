import { spotifyPlan, type SpotifyOptions } from '../core/plans/spotify';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { SpotifyOptions };

export type SpotifyEmbedProps = EmbedSource &
  Omit<FrameProps, keyof SpotifyOptions> &
  SpotifyOptions;

/**
 * A fixed height: the `height` prop, else the embed code's, else 152px for a track or episode
 * and 352px for the rest. A video show keeps its 16:9 aspect ratio instead.
 */
export function SpotifyEmbed(props: SpotifyEmbedProps) {
  const { url, embed: given, onError, height, theme, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'spotify');
  const plan = embed ? spotifyPlan(embed, { theme }) : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  return (
    <IframeEmbed
      {...frame}
      {...planProps(plan)}
      height={height ?? plan.height}
    />
  );
}
