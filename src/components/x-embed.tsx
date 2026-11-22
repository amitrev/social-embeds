import { xPlan, type XOptions } from '../core/plans/x';
import { xMatcher as x } from '../parser/matchers/x';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { scriptOf } from './script-embed';

export type { XOptions };

export type XEmbedProps = EmbedSource &
  Omit<SharedProps, keyof XOptions> &
  XOptions;

const X_OPTIONS = [
  'theme',
  'conversation',
  'cards',
  'align',
  'lang',
  'dnt',
] as const;

export function XEmbed(props: XEmbedProps) {
  const [plan, frame] = usePlan(props, x, X_OPTIONS, xPlan);
  return plan?.kind === 'script' ? scriptOf(plan, frame) : null;
}
