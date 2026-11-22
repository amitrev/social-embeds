import { redditPlan, type RedditOptions } from '../core/plans/reddit';
import { reddit } from '../parser/platforms/reddit';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { RedditOptions };

export type RedditEmbedProps = EmbedSource &
  Omit<SharedProps, keyof RedditOptions> &
  RedditOptions;

const REDDIT_OPTIONS = [
  'theme',
  'showMedia',
  'showTitle',
  'showUsername',
  'locale',
  'depth',
] as const;

/** At most 640px wide by default, the width widgets.js gives the frame (docs/decisions.md D52). */
export function RedditEmbed(props: RedditEmbedProps) {
  const [plan, frame] = usePlan(props, reddit, REDDIT_OPTIONS, redditPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
