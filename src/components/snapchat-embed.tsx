import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type SnapchatEmbedProps = EmbedSource & FrameProps;

// The value embed.js gives the frame; Lenses use the camera and microphone.
const ALLOW = 'autoplay; camera; microphone; clipboard-write;';

/** At most 416px wide by default, the size of Snapchat's own embed code (docs/decisions.md D50). */
export function SnapchatEmbed(props: SnapchatEmbedProps) {
  const { url, embed: given, onError, maxWidth = 416, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'snapchat');
  useReportError(error, onError);
  if (!embed) return null;

  const title = embed.options.title;
  return (
    <IframeEmbed
      {...frame}
      maxWidth={maxWidth}
      src={`${embed.url}/embed`}
      title={typeof title === 'string' && title !== '' ? title : 'Snapchat'}
      allow={ALLOW}
      scrolling="no"
      ratio={{ width: 416, height: 692 }}
      size={embed.size}
    />
  );
}
