import { rumblePlan } from '../core/plans/rumble';
import { rumbleMatcher as rumble } from '../parser/matchers/rumble';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type RumbleEmbedProps = EmbedSource & FrameProps;

/** Embed code only: a page URL holds another id than the player (docs/decisions.md D99). */
export function RumbleEmbed(props: RumbleEmbedProps) {
  const [plan, frame] = usePlan(props, rumble, [], rumblePlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
