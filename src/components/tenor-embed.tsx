import { tenorPlan } from '../core/plans/tenor';
import { tenorMatcher as tenor } from '../parser/matchers/tenor';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type TenorEmbedProps = EmbedSource & FrameProps;

/** The embed code's aspect ratio; a URL carries no size and renders at 1.33:1 (docs/decisions.md D95). */
export function TenorEmbed(props: TenorEmbedProps) {
  const [plan, frame] = usePlan(props, tenor, [], tenorPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
