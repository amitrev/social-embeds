import { blueskyPlan, type BlueskyOptions } from '../core/plans/bluesky';
import { bluesky } from '../parser/platforms/bluesky';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { fallbackPlaceholder, frameOf } from './iframe-embed';

export type { BlueskyOptions };

export type BlueskyEmbedProps = EmbedSource &
  Omit<SharedProps, keyof BlueskyOptions> &
  BlueskyOptions;

const BLUESKY_OPTIONS = ['colorMode'] as const;

/**
 * At most 600px wide by default, Bluesky's oEmbed width. Renders the frame `embed.js` would
 * create, without the script (docs/decisions.md D77). Only embed code and URLs with a DID
 * render: a handle URL needs a lookup, and `onError` says so.
 */
export function BlueskyEmbed(props: BlueskyEmbedProps) {
  const [plan, frame] = usePlan(props, bluesky, BLUESKY_OPTIONS, blueskyPlan);
  return plan?.kind === 'iframe'
    ? frameOf(plan, frame, fallbackPlaceholder)
    : null;
}
