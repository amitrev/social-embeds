import { instagramPlan, type InstagramOptions } from '../core/plans/instagram';
import { instagramMatcher as instagram } from '../parser/matchers/instagram';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { scriptOf } from './script-embed';

export type { InstagramOptions };

export type InstagramEmbedProps = EmbedSource &
  Omit<SharedProps, keyof InstagramOptions> &
  InstagramOptions;

const INSTAGRAM_OPTIONS = ['captioned'] as const;

export function InstagramEmbed(props: InstagramEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    instagram,
    INSTAGRAM_OPTIONS,
    instagramPlan,
  );
  return plan?.kind === 'script' ? scriptOf(plan, frame) : null;
}
