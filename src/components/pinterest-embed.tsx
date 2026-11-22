import { pinterestPlan, type PinterestOptions } from '../core/plans/pinterest';
import { pinterestMatcher as pinterest } from '../parser/matchers/pinterest';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { scriptOf } from './script-embed';

export type { PinterestOptions };

export type PinterestEmbedProps = EmbedSource &
  Omit<SharedProps, keyof PinterestOptions> &
  PinterestOptions;

const PINTEREST_OPTIONS = ['pinWidth'] as const;

export function PinterestEmbed(props: PinterestEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    pinterest,
    PINTEREST_OPTIONS,
    pinterestPlan,
  );
  return plan?.kind === 'script' ? scriptOf(plan, frame) : null;
}
