import { soundcloud } from '../parser/platforms/soundcloud';
import {
  soundcloudPlan,
  type SoundCloudOptions,
} from '../core/plans/soundcloud';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { SoundCloudOptions };

export type SoundCloudEmbedProps = EmbedSource &
  Omit<FrameProps, keyof SoundCloudOptions> &
  SoundCloudOptions;

/** A fixed height: the `height` prop, else the embed code's, else 400px for the visual player. */
export function SoundCloudEmbed(props: SoundCloudEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    height,
    visual,
    color,
    autoPlay,
    hideRelated,
    showComments,
    showUser,
    showReposts,
    showTeaser,
    showArtwork,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, soundcloud);
  const plan = embed
    ? soundcloudPlan(embed, {
        visual,
        color,
        autoPlay,
        hideRelated,
        showComments,
        showUser,
        showReposts,
        showTeaser,
        showArtwork,
      })
    : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  return (
    <IframeEmbed
      {...frame}
      {...planProps(plan)}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
      height={height ?? plan.height}
    />
  );
}
