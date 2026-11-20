import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type GiphyEmbedProps = EmbedSource & FrameProps;

/** The embed code's aspect ratio; a URL carries no size and renders square (docs/decisions.md D76). */
export function GiphyEmbed(props: GiphyEmbedProps) {
  const { url, embed: given, onError, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'giphy');
  useReportError(error, onError);
  if (!embed) return null;

  return (
    <IframeEmbed
      {...frame}
      onError={onError}
      src={`https://giphy.com/embed/${embed.id}`}
      title="Giphy GIF"
      allow="fullscreen"
      ratio={{ width: 1, height: 1 }}
      size={embed.size}
    />
  );
}
