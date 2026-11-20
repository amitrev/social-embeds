import { tiktokPlan, type TikTokOptions } from '../core/plans/tiktok';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { TikTokOptions };

export type TikTokEmbedProps = EmbedSource &
  Omit<FrameProps, keyof TikTokOptions> &
  TikTokOptions;

/** At most 325px wide by default, the size of TikTok's own embed code (docs/decisions.md D40). */
export function TikTokEmbed(props: TikTokEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    controls,
    progressBar,
    playButton,
    volumeControl,
    fullscreenButton,
    timestamp,
    loop,
    autoplay,
    musicInfo,
    description,
    rel,
    nativeContextMenu,
    closedCaption,
    forceMuted,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'tiktok');
  const plan = embed
    ? tiktokPlan(embed, {
        controls,
        progressBar,
        playButton,
        volumeControl,
        fullscreenButton,
        timestamp,
        loop,
        autoplay,
        musicInfo,
        description,
        rel,
        nativeContextMenu,
        closedCaption,
        forceMuted,
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
      maxWidth={maxWidth ?? plan.maxWidth}
    />
  );
}
