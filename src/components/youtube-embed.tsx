import { youtubePlan, type YouTubeOptions } from '../core/plans/youtube';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { YouTubeOptions };

export type YouTubeEmbedProps = EmbedSource &
  Omit<FrameProps, keyof YouTubeOptions> &
  YouTubeOptions;

export function YouTubeEmbed(props: YouTubeEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    autoplay,
    ccLangPref,
    ccLoadPolicy,
    color,
    controls,
    disablekb,
    enablejsapi,
    end,
    fs,
    hl,
    ivLoadPolicy,
    list,
    listType,
    loop,
    origin,
    playlist,
    playsinline,
    rel,
    start,
    widgetReferrer,
    nocookie,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'youtube');
  const plan = embed
    ? youtubePlan(embed, {
        autoplay,
        ccLangPref,
        ccLoadPolicy,
        color,
        controls,
        disablekb,
        enablejsapi,
        end,
        fs,
        hl,
        ivLoadPolicy,
        list,
        listType,
        loop,
        origin,
        playlist,
        playsinline,
        rel,
        start,
        widgetReferrer,
        nocookie,
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
