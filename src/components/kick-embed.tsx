import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  query,
  resolveEmbed,
} from './shared';

/** Kick's player parameters; undocumented, read from its player URL (docs/decisions.md D75). */
export type KickOptions = {
  autoplay?: boolean;
  muted?: boolean;
};

export type KickEmbedProps = EmbedSource &
  Omit<FrameProps, keyof KickOptions> &
  KickOptions;

const KEPT = new Set(['autoplay', 'muted']);

/** A live channel at 16:9. */
export function KickEmbed(props: KickEmbedProps) {
  const { url, embed: given, onError, autoplay, muted, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'kick');
  useReportError(error, onError);
  if (!embed) return null;

  const fromProps: [string, boolean][] = [];
  if (autoplay !== undefined) fromProps.push(['autoplay', autoplay]);
  if (muted !== undefined) fromProps.push(['muted', muted]);

  return (
    <IframeEmbed
      {...frame}
      onError={onError}
      src={`https://player.kick.com/${embed.id}${query(
        Object.entries(embed.options).filter(([key]) => KEPT.has(key)),
        fromProps,
      )}`}
      title="Kick player"
      allow="autoplay; fullscreen"
      scrolling="no"
      ratio={{ width: 16, height: 9 }}
      size={embed.size}
    />
  );
}
