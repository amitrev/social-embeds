import { tumblrPlan } from '../core/plans/tumblr';
import { tumblrMatcher as tumblr } from '../parser/matchers/tumblr';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type TumblrEmbedProps = EmbedSource & SharedProps;

/** At most 540px wide by default, Tumblr's oEmbed width. Renders the frame `post.js` would create (docs/decisions.md D77). */
export function TumblrEmbed(props: TumblrEmbedProps) {
  const [plan, frame] = usePlan(props, tumblr, [], tumblrPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
