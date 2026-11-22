import { vimeoPlan, type VimeoOptions } from '../core/plans/vimeo';
import { vimeo } from '../parser/platforms/vimeo';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { VimeoOptions };

export type VimeoEmbedProps = EmbedSource &
  Omit<FrameProps, keyof VimeoOptions> &
  VimeoOptions;

export function VimeoEmbed(props: VimeoEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    autopause,
    autoplay,
    background,
    byline,
    color,
    controls,
    dnt,
    keyboard,
    loop,
    muted,
    pip,
    playsinline,
    portrait,
    quality,
    speed,
    title,
    transparent,
    t,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, vimeo);
  const plan = embed
    ? vimeoPlan(embed, {
        autopause,
        autoplay,
        background,
        byline,
        color,
        controls,
        dnt,
        keyboard,
        loop,
        muted,
        pip,
        playsinline,
        portrait,
        quality,
        speed,
        title,
        transparent,
        t,
      })
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
