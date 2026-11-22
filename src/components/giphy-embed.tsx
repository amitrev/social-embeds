import { giphyPlan } from '../core/plans/giphy';
import { giphyMatcher as giphy } from '../parser/matchers/giphy';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type GiphyEmbedProps = EmbedSource & FrameProps;

/** The embed code's aspect ratio; a URL carries no size and renders square (docs/decisions.md D76). */
export function GiphyEmbed(props: GiphyEmbedProps) {
  const [plan, frame] = usePlan(props, giphy, [], giphyPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
