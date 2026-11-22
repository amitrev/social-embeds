import { giphyPlan } from '../core/plans/giphy';
import { giphy } from '../parser/platforms/giphy';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type GiphyEmbedProps = EmbedSource & FrameProps;

/** The embed code's aspect ratio; a URL carries no size and renders square (docs/decisions.md D76). */
export function GiphyEmbed(props: GiphyEmbedProps) {
  const { url, embed: given, onError, maxWidth, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, giphy);
  const plan = embed ? giphyPlan(embed) : undefined;
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
