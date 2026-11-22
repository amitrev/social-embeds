import { streamable } from '../parser/platforms/streamable';
import {
  streamablePlan,
  type StreamableOptions,
} from '../core/plans/streamable';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { StreamableOptions };

export type StreamableEmbedProps = EmbedSource &
  Omit<FrameProps, keyof StreamableOptions> &
  StreamableOptions;

/** The embed code's aspect ratio, else 16:9. */
export function StreamableEmbed(props: StreamableEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    autoplay,
    hd,
    loop,
    muted,
    nocontrols,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, streamable);
  const plan = embed
    ? streamablePlan(embed, { autoplay, hd, loop, muted, nocontrols })
    : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  return (
    <IframeEmbed
      {...frame}
      {...planProps(plan)}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
    />
  );
}
