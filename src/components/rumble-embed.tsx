import { rumblePlan } from '../core/plans/rumble';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type RumbleEmbedProps = EmbedSource & FrameProps;

/** Embed code only: a page URL holds another id than the player (docs/decisions.md D99). */
export function RumbleEmbed(props: RumbleEmbedProps) {
  const { url, embed: given, onError, maxWidth, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'rumble');
  const plan = embed ? rumblePlan(embed) : undefined;
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
