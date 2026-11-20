import { twitchPlan, type TwitchOptions } from '../core/plans/twitch';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { TwitchOptions };

export type TwitchEmbedProps = EmbedSource &
  Omit<FrameProps, keyof TwitchOptions> &
  TwitchOptions;

/** `parent` is the page's own host, added on the client (docs/decisions.md D62, D65). */
export function TwitchEmbed(props: TwitchEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    autoplay,
    muted,
    time,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'twitch');
  const plan = embed ? twitchPlan(embed, { autoplay, muted, time }) : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  return (
    <IframeEmbed
      {...frame}
      {...planProps(plan)}
      maxWidth={maxWidth ?? plan.maxWidth}
    />
  );
}
