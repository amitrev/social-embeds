import { flickrPlan, type FlickrOptions } from '../core/plans/flickr';
import { flickr } from '../parser/platforms/flickr';
import { useReportError } from './hooks';
import { fallbackPlaceholder, IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type { FlickrOptions };

export type FlickrEmbedProps = EmbedSource &
  Omit<FrameProps, keyof FlickrOptions> &
  FlickrOptions;

/** Embed code keeps its image's ratio and is at most as wide as the image; a URL renders at 4:3 (docs/decisions.md D98). */
export function FlickrEmbed(props: FlickrEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    header,
    footer,
    context,
    placeholder,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, flickr);
  const plan = embed
    ? flickrPlan(embed, { header, footer, context })
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
      placeholder={placeholder ?? fallbackPlaceholder(plan)}
    />
  );
}
