import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import { type EmbedSource, type FrameProps, resolveEmbed } from './shared';

export type AppleMusicEmbedProps = EmbedSource & FrameProps;
export type ApplePodcastsEmbedProps = EmbedSource & FrameProps;

// The values in Apple's own embed code (docs/decisions.md D72, D73).
const ALLOW = 'autoplay *; encrypted-media *; fullscreen *; clipboard-write';
const SANDBOX =
  'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation';
const SINGLE_HEIGHT = 175; // a song
const EPISODE_HEIGHT = 160;
const FULL_HEIGHT = 450; // an album, playlist or show

/** A fixed height: the `height` prop, else the embed code's, else 175px for a song and 450px for the rest. */
export function AppleMusicEmbed(props: AppleMusicEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    height,
    maxWidth = 660,
    style,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'applemusic');
  useReportError(error, onError);
  if (!embed) return null;

  const path = embed.url.slice('https://music.apple.com'.length);
  const single = path.includes('/song/') || path.includes('?i=');
  return (
    <IframeEmbed
      {...frame}
      onError={onError}
      maxWidth={maxWidth}
      style={{ borderRadius: 10, overflow: 'hidden', ...style }}
      height={
        height ?? embed.size?.height ?? (single ? SINGLE_HEIGHT : FULL_HEIGHT)
      }
      src={`https://embed.music.apple.com${path}`}
      title="Apple Music player"
      allow={ALLOW}
      sandbox={SANDBOX}
      ratio={{ width: 16, height: 9 }}
    />
  );
}

/** A fixed height: the `height` prop, else the embed code's, else 160px for an episode and 450px for a show. */
export function ApplePodcastsEmbed(props: ApplePodcastsEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    height,
    maxWidth = 640,
    style,
    ...frame
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'applepodcasts');
  useReportError(error, onError);
  if (!embed) return null;

  const path = embed.url.slice('https://podcasts.apple.com'.length);
  return (
    <IframeEmbed
      {...frame}
      onError={onError}
      maxWidth={maxWidth}
      style={{ borderRadius: 12, overflow: 'hidden', ...style }}
      height={
        height ??
        embed.size?.height ??
        (path.includes('?i=') ? EPISODE_HEIGHT : FULL_HEIGHT)
      }
      src={`https://embed.podcasts.apple.com${path}`}
      title="Apple Podcasts player"
      allow={ALLOW}
      sandbox={SANDBOX}
      ratio={{ width: 16, height: 9 }}
    />
  );
}
