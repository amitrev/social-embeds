import { threadsPlan, type ThreadsOptions } from '../core/plans/threads';
import { threadsMatcher as threads } from '../parser/matchers/threads';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { scriptOf } from './script-embed';

export type { ThreadsOptions };

export type ThreadsEmbedProps = EmbedSource &
  Omit<SharedProps, keyof ThreadsOptions> &
  ThreadsOptions;

const THREADS_OPTIONS = ['theme'] as const;

export function ThreadsEmbed(props: ThreadsEmbedProps) {
  const [plan, frame] = usePlan(props, threads, THREADS_OPTIONS, threadsPlan);
  return plan?.kind === 'script' ? scriptOf(plan, frame) : null;
}
