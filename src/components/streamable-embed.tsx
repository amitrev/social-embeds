import { streamableMatcher as streamable } from '../parser/matchers/streamable';
import {
  streamablePlan,
  type StreamableOptions,
} from '../core/plans/streamable';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { StreamableOptions };

export type StreamableEmbedProps = EmbedSource &
  Omit<FrameProps, keyof StreamableOptions> &
  StreamableOptions;

const STREAMABLE_OPTIONS = [
  'autoplay',
  'hd',
  'loop',
  'muted',
  'nocontrols',
] as const;

/** The embed code's aspect ratio, else 16:9. */
export function StreamableEmbed(props: StreamableEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    streamable,
    STREAMABLE_OPTIONS,
    streamablePlan,
  );
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
