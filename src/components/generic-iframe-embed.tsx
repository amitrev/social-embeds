import { useMemo } from 'react';
import type { IframePlan, PlanError } from '../core/plan';
import { genericPlan } from '../core/plans/generic';
import { type ParsedIframe, parseIframe } from '../parser';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import type { FrameProps } from './shared';

export type GenericIframeEmbedProps = (
  { html: string; embed?: never } | { embed: ParsedIframe; html?: never }
) &
  FrameProps;

/** One iframe rebuilt from its checked attributes; nothing else in the code renders. */
export function GenericIframeEmbed(props: GenericIframeEmbedProps) {
  const { html, embed: given, onError, maxWidth, height, ...frame } = props;
  const embed = useMemo(() => given ?? parseIframe(html), [given, html]);
  const plan: IframePlan | PlanError = embed
    ? genericPlan(embed)
    : { kind: 'error', message: 'social-embeds: not an iframe embed code' };
  useReportError(plan.kind === 'error' ? plan.message : undefined, onError);
  if (plan.kind !== 'iframe') return null;

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
