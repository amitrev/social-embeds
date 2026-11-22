import { appleMusicPlan, applePodcastsPlan } from '../core/plans/apple';
import { applemusic } from '../parser/platforms/applemusic';
import { applepodcasts } from '../parser/platforms/applepodcasts';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type AppleMusicEmbedProps = EmbedSource & FrameProps;
export type ApplePodcastsEmbedProps = EmbedSource & FrameProps;

/** A fixed height: the `height` prop, else the embed code's, else 175px for a song and 450px for the rest. */
export function AppleMusicEmbed(props: AppleMusicEmbedProps) {
  const { url, embed: given, onError, height, maxWidth, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, applemusic);
  const plan = embed ? appleMusicPlan(embed) : undefined;
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

/** A fixed height: the `height` prop, else the embed code's, else 160px for an episode and 450px for a show. */
export function ApplePodcastsEmbed(props: ApplePodcastsEmbedProps) {
  const { url, embed: given, onError, height, maxWidth, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, applepodcasts);
  const plan = embed ? applePodcastsPlan(embed) : undefined;
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
