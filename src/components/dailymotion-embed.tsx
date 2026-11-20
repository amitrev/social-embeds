import {
  dailymotionPlan,
  type DailymotionOptions,
} from '../core/plans/dailymotion';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { DailymotionOptions };

export type DailymotionEmbedProps = EmbedSource &
  Omit<FrameProps, keyof DailymotionOptions> &
  DailymotionOptions;

/**
 * Dailymotion refuses embeds without a Player ID: one from the embed code or the `playerId`
 * prop, never another account's (docs/decisions.md D63).
 */
export function DailymotionEmbed(props: DailymotionEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    playerId,
    mute,
    startTime,
    loop,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'dailymotion');
  const plan = embed
    ? dailymotionPlan(embed, { playerId, mute, startTime, loop })
    : undefined;
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
