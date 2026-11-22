import { dailymotionMatcher as dailymotion } from '../parser/matchers/dailymotion';
import {
  dailymotionPlan,
  type DailymotionOptions,
} from '../core/plans/dailymotion';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { DailymotionOptions };

export type DailymotionEmbedProps = EmbedSource &
  Omit<FrameProps, keyof DailymotionOptions> &
  DailymotionOptions;

const DAILYMOTION_OPTIONS = ['playerId', 'mute', 'startTime', 'loop'] as const;

/**
 * Dailymotion refuses embeds without a Player ID: one from the embed code or the `playerId`
 * prop, never another account's (docs/decisions.md D63).
 */
export function DailymotionEmbed(props: DailymotionEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    dailymotion,
    DAILYMOTION_OPTIONS,
    dailymotionPlan,
  );
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
