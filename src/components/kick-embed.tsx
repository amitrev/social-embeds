import { kickPlan, type KickOptions } from '../core/plans/kick';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { KickOptions };

export type KickEmbedProps = EmbedSource &
  Omit<FrameProps, keyof KickOptions> &
  KickOptions;

/** A live channel at 16:9. */
export function KickEmbed(props: KickEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    autoplay,
    muted,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'kick');
  const plan = embed ? kickPlan(embed, { autoplay, muted }) : undefined;
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
    />
  );
}
