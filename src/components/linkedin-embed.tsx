import { linkedinPlan, type LinkedInOptions } from '../core/plans/linkedin';
import { linkedin } from '../parser/platforms/linkedin';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { LinkedInOptions };

export type LinkedInEmbedProps = EmbedSource &
  Omit<FrameProps, keyof LinkedInOptions> &
  LinkedInOptions;

/** A fixed height: the `height` prop, else the embed code's, else 670px. */
export function LinkedInEmbed(props: LinkedInEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    height,
    collapsed,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, linkedin);
  const plan = embed ? linkedinPlan(embed, { collapsed }) : undefined;
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
