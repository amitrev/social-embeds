import { truthSocialPlan } from '../core/plans/truthsocial';
import { truthsocial } from '../parser/platforms/truthsocial';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type TruthSocialEmbedProps = EmbedSource & SharedProps;

/** At most 600px wide by default, the width of Truth Social's embed code (docs/decisions.md D93). */
export function TruthSocialEmbed(props: TruthSocialEmbedProps) {
  const [plan, frame] = usePlan(props, truthsocial, [], truthSocialPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
