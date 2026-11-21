import { type ReactNode, useMemo } from 'react';
import { matchUrl, parseEmbed, parseIframe } from '../parser';
import { sourceError } from '../core/resolve';
import { AppleMusicEmbed, ApplePodcastsEmbed } from './apple-embed';
import { BlueskyEmbed, type BlueskyOptions } from './bluesky-embed';
import { DailymotionEmbed, type DailymotionOptions } from './dailymotion-embed';
import { FacebookEmbed, type FacebookOptions } from './facebook-embed';
import { GenericIframeEmbed } from './generic-iframe-embed';
import { GiphyEmbed } from './giphy-embed';
import { useReportError } from './hooks';
import { InstagramEmbed, type InstagramOptions } from './instagram-embed';
import { KickEmbed, type KickOptions } from './kick-embed';
import { LinkedInEmbed, type LinkedInOptions } from './linkedin-embed';
import { PinterestEmbed, type PinterestOptions } from './pinterest-embed';
import { RedditEmbed, type RedditOptions } from './reddit-embed';
import type { FrameProps } from './shared';
import { SnapchatEmbed } from './snapchat-embed';
import { SoundCloudEmbed, type SoundCloudOptions } from './soundcloud-embed';
import { SpotifyEmbed } from './spotify-embed';
import { TelegramEmbed, type TelegramOptions } from './telegram-embed';
import { ThreadsEmbed, type ThreadsOptions } from './threads-embed';
import { TikTokEmbed, type TikTokOptions } from './tiktok-embed';
import { TumblrEmbed } from './tumblr-embed';
import { TwitchEmbed, type TwitchOptions } from './twitch-embed';
import { VimeoEmbed, type VimeoOptions } from './vimeo-embed';
import { XEmbed, type XOptions } from './x-embed';
import { YouTubeEmbed, type YouTubeOptions } from './youtube-embed';

export type SocialEmbedSource =
  { html: string; url?: never } | { url: string; html?: never };

// Div attributes that share a name with a platform option (`lang`, `color`, `rel`, `title`)
// are left out, because each platform reads that name its own way.
type PlatformOption =
  | keyof XOptions
  | keyof InstagramOptions
  // Also Spotify's only option, `theme`.
  | keyof ThreadsOptions
  | keyof FacebookOptions
  | keyof TikTokOptions
  | keyof YouTubeOptions
  | keyof TelegramOptions
  | keyof RedditOptions
  | keyof LinkedInOptions
  | keyof PinterestOptions
  | keyof VimeoOptions
  | keyof TwitchOptions
  | keyof DailymotionOptions
  | keyof BlueskyOptions
  | keyof SoundCloudOptions
  | keyof KickOptions;

export type SocialEmbedProps = SocialEmbedSource &
  Omit<FrameProps, PlatformOption> & {
    /**
     * Called with the original string when `html` is neither a platform's embed code nor a
     * safe iframe. Without it, nothing is rendered and `onError` is called.
     */
    fallback?: (html: string) => ReactNode;
  };

/** `height` and `maxHeight` reach only the iframe-based embeds: the others size themselves. */
export function SocialEmbed(props: SocialEmbedProps) {
  const { html, url, fallback, height, maxHeight, onError, ...shared } = props;
  const frame = { height, maxHeight };
  const embed = useMemo(
    () => (html !== undefined ? parseEmbed(html) : matchUrl(url)),
    [html, url],
  );
  const iframe = useMemo(
    () => (embed === null && html !== undefined ? parseIframe(html) : null),
    [embed, html],
  );
  // With a fallback, unrecognised embed code is the host's to handle, not an error.
  const unrecognised =
    embed === null && iframe === null && !(html !== undefined && fallback);
  useReportError(
    unrecognised
      ? sourceError(html !== undefined ? { html } : { url })
      : undefined,
    onError,
  );

  if (iframe) {
    return (
      <GenericIframeEmbed
        {...shared}
        {...frame}
        onError={onError}
        embed={iframe}
      />
    );
  }
  if (!embed) {
    return html !== undefined && fallback ? fallback(html) : null;
  }
  switch (embed.platform) {
    case 'x':
      return <XEmbed {...shared} onError={onError} embed={embed} />;
    case 'instagram':
      return <InstagramEmbed {...shared} onError={onError} embed={embed} />;
    case 'threads':
      return <ThreadsEmbed {...shared} onError={onError} embed={embed} />;
    case 'facebook':
      return (
        <FacebookEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'tiktok':
      return (
        <TikTokEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'youtube':
      return (
        <YouTubeEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'telegram':
      return <TelegramEmbed {...shared} onError={onError} embed={embed} />;
    case 'snapchat':
      return (
        <SnapchatEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'linkedin':
      return (
        <LinkedInEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'reddit':
      return <RedditEmbed {...shared} onError={onError} embed={embed} />;
    case 'pinterest':
      return <PinterestEmbed {...shared} onError={onError} embed={embed} />;
    case 'spotify':
      return (
        <SpotifyEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'vimeo':
      return (
        <VimeoEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'twitch':
      return (
        <TwitchEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'dailymotion':
      // No Player ID prop here: only embed code that carries one renders (D63).
      return (
        <DailymotionEmbed
          {...shared}
          {...frame}
          onError={onError}
          embed={embed}
        />
      );
    case 'bluesky':
      return <BlueskyEmbed {...shared} onError={onError} embed={embed} />;
    case 'soundcloud':
      return (
        <SoundCloudEmbed
          {...shared}
          {...frame}
          onError={onError}
          embed={embed}
        />
      );
    case 'applemusic':
      return (
        <AppleMusicEmbed
          {...shared}
          {...frame}
          onError={onError}
          embed={embed}
        />
      );
    case 'applepodcasts':
      return (
        <ApplePodcastsEmbed
          {...shared}
          {...frame}
          onError={onError}
          embed={embed}
        />
      );
    case 'tumblr':
      return <TumblrEmbed {...shared} onError={onError} embed={embed} />;
    case 'kick':
      return (
        <KickEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
    case 'giphy':
      return (
        <GiphyEmbed {...shared} {...frame} onError={onError} embed={embed} />
      );
  }
}
