import { tenorPlan } from '../core/plans/tenor';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type TenorEmbedProps = EmbedSource & FrameProps;

/** The embed code's aspect ratio; a URL carries no size and renders at 1.33:1 (docs/decisions.md D95). */
export function TenorEmbed(props: TenorEmbedProps) {
  const { url, embed: given, onError, maxWidth, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'tenor');
  const plan = embed ? tenorPlan(embed) : undefined;
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
