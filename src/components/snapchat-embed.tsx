import { snapchatPlan } from '../core/plans/snapchat';
import { snapchatMatcher as snapchat } from '../parser/matchers/snapchat';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type SnapchatEmbedProps = EmbedSource & FrameProps;

/** At most 416px wide by default, the size of Snapchat's own embed code (docs/decisions.md D50). */
export function SnapchatEmbed(props: SnapchatEmbedProps) {
  const [plan, frame] = usePlan(props, snapchat, [], snapchatPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
