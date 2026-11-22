import { truthSocialPlan } from '../core/plans/truthsocial';
import { truthsocial } from '../parser/platforms/truthsocial';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type TruthSocialEmbedProps = EmbedSource & SharedProps;

/** At most 600px wide by default, the width of Truth Social's embed code (docs/decisions.md D93). */
export function TruthSocialEmbed(props: TruthSocialEmbedProps) {
  const { url, embed: given, onError, maxWidth, ...shared } = props;
  const { embed, error } = resolveEmbed(url, given, truthsocial);
  const plan = embed ? truthSocialPlan(embed) : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  return (
    <IframeEmbed
      {...shared}
      {...planProps(plan)}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
    />
  );
}
