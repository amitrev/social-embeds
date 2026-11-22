import { kickPlan, type KickOptions } from '../core/plans/kick';
import { kickMatcher as kick } from '../parser/matchers/kick';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { KickOptions };

export type KickEmbedProps = EmbedSource &
  Omit<FrameProps, keyof KickOptions> &
  KickOptions;

const KICK_OPTIONS = ['autoplay', 'muted'] as const;

/** A live channel at 16:9. */
export function KickEmbed(props: KickEmbedProps) {
  const [plan, frame] = usePlan(props, kick, KICK_OPTIONS, kickPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
