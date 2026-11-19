import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  query,
  resolveEmbed,
} from './shared';

export type TwitchOptions = {
  /** Twitch's default: `true` for channels and videos, `false` for clips. */
  autoplay?: boolean;
  muted?: boolean;
  /** A video's start time, as `1h2m3s`. */
  time?: string;
};

export type TwitchEmbedProps = EmbedSource &
  Omit<FrameProps, keyof TwitchOptions> &
  TwitchOptions;

/** The player and its content parameter for the embed's canonical URL (docs/decisions.md D64). */
function player(url: string, id: string): [string, [string, string]] {
  const { hostname, pathname } = new URL(url);
  if (hostname === 'clips.twitch.tv')
    return ['https://clips.twitch.tv/embed', ['clip', id]];
  const section = pathname.split('/')[1];
  return [
    'https://player.twitch.tv/',
    section === 'videos'
      ? ['video', `v${id}`]
      : section === 'collections'
        ? ['collection', id]
        : ['channel', id],
  ];
}

/** `parent` is the page's own host, added on the client (docs/decisions.md D62, D65). */
export function TwitchEmbed(props: TwitchEmbedProps) {
  const { url, embed: given, onError, autoplay, muted, time, ...frame } = props;
  const { embed, error } = resolveEmbed(url, given, 'twitch');
  useReportError(error, onError);
  if (!embed) return null;

  // Twitch reads `true` and `false`, not 1 and 0.
  const params: [string, string][] = [];
  if (autoplay !== undefined) params.push(['autoplay', String(autoplay)]);
  if (muted !== undefined) params.push(['muted', String(muted)]);
  if (time !== undefined) params.push(['time', time]);
  const [base, content] = player(embed.url, embed.id);

  return (
    <IframeEmbed
      {...frame}
      src={`${base}${query([content], Object.entries(embed.options), params)}`}
      title="Twitch player"
      allow=""
      ratio={{ width: 16, height: 9 }}
      size={embed.size}
      hostParam="parent"
    />
  );
}
