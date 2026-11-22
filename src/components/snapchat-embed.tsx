import { snapchatPlan } from '../core/plans/snapchat';
import { snapchat } from '../parser/platforms/snapchat';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type SnapchatEmbedProps = EmbedSource & FrameProps;

/** At most 416px wide by default, the size of Snapchat's own embed code (docs/decisions.md D50). */
export function SnapchatEmbed(props: SnapchatEmbedProps) {
  const { url, embed: given, onError, maxWidth, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, snapchat);
  const plan = embed ? snapchatPlan(embed) : undefined;
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
