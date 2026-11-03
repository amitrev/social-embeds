import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  playerParams,
  query,
  resolveEmbed,
} from './shared';

/** The Embed Player parameters TikTok documents (developers.tiktok.com/doc/embed-player). */
export type TikTokOptions = {
  controls?: boolean;
  progressBar?: boolean;
  playButton?: boolean;
  volumeControl?: boolean;
  fullscreenButton?: boolean;
  timestamp?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  musicInfo?: boolean;
  description?: boolean;
  rel?: boolean;
  nativeContextMenu?: boolean;
  closedCaption?: boolean;
  forceMuted?: boolean;
};

const PARAMS: Record<keyof TikTokOptions, string> = {
  controls: 'controls',
  progressBar: 'progress_bar',
  playButton: 'play_button',
  volumeControl: 'volume_control',
  fullscreenButton: 'fullscreen_button',
  timestamp: 'timestamp',
  loop: 'loop',
  autoplay: 'autoplay',
  musicInfo: 'music_info',
  description: 'description',
  rel: 'rel',
  nativeContextMenu: 'native_context_menu',
  closedCaption: 'closed_caption',
  forceMuted: 'force_muted',
};

export type TikTokEmbedProps = EmbedSource &
  Omit<FrameProps, keyof TikTokOptions> &
  TikTokOptions;

// TikTok's oEmbed and share dialog embed code (test/fixtures/tiktok/).
const ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';

/** Every TikTok input renders the Embed Player iframe (docs/decisions.md D11). */
export function TikTokEmbed(props: TikTokEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth = 605,
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
  useReportError(error, onError);
  if (!embed) return null;

  const params = playerParams(
    {
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
    },
    PARAMS,
  );

  return (
    <IframeEmbed
      {...frame}
      maxWidth={maxWidth}
      src={`https://www.tiktok.com/player/v1/${embed.id}${query(Object.entries(embed.options), params)}`}
      title="TikTok video player"
      allow={ALLOW}
      ratio={{ width: 9, height: 16 }}
      size={embed.size}
    />
  );
}
