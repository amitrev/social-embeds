import { type ReactNode, useMemo } from 'react';
import { sourceError } from '../core/resolve';
import { matchUrlWith } from '../parser/match-url';
import { parseEmbedWith } from '../parser/parse-embed';
import type { PlatformParser } from '../parser/platform';
import type { ParsedEmbed, Platform } from '../parser/types';
import type { BlueskyOptions } from './bluesky-embed';
import type { DailymotionOptions } from './dailymotion-embed';
import type { FacebookOptions } from './facebook-embed';
import type { FlickrOptions } from './flickr-embed';
import { useReportError } from './hooks';
import { EVERY_PLATFORM } from './platforms';
import type { ParsedIframe } from '../parser/iframe';
import type { ImgurOptions } from './imgur-embed';
import type { InstagramOptions } from './instagram-embed';
import type { KickOptions } from './kick-embed';
import type { LinkedInOptions } from './linkedin-embed';
import type { PinterestOptions } from './pinterest-embed';
import type { RedditOptions } from './reddit-embed';
import type { FrameProps } from './shared';
import type { SoundCloudOptions } from './soundcloud-embed';
import type { StravaOptions } from './strava-embed';
import type { StreamableOptions } from './streamable-embed';
import type { TelegramOptions } from './telegram-embed';
import type { ThreadsOptions } from './threads-embed';
import type { TikTokOptions } from './tiktok-embed';
import type { TwitchOptions } from './twitch-embed';
import type { VimeoOptions } from './vimeo-embed';
import type { XOptions } from './x-embed';
import type { YouTubeOptions } from './youtube-embed';

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
  | keyof KickOptions
  | keyof StreamableOptions
  | keyof ImgurOptions
  | keyof StravaOptions
  | keyof FlickrOptions;

export type SocialEmbedProps = SocialEmbedSource &
  Omit<FrameProps, PlatformOption> & {
    /**
     * Called with the original string when `html` is neither a platform's embed code nor a
     * safe iframe. Without it, nothing is rendered and `onError` is called.
     */
    fallback?: (html: string) => ReactNode;
  };

/** What `<SocialEmbed>` passes on to the platform it renders. */
export type RouteProps = {
  shared: Omit<
    SocialEmbedProps,
    'html' | 'url' | 'fallback' | 'height' | 'maxHeight' | 'onError'
  >;
  frame: Pick<FrameProps, 'height' | 'maxHeight'>;
  onError: FrameProps['onError'];
};

/**
 * A platform for `createSocialEmbed`, such as `youtube` or `genericIframe`. Opaque: import the
 * ones a page needs and pass them on.
 */
export type EmbedPlatform =
  | {
      readonly kind: 'platform';
      readonly parser: PlatformParser;
      readonly render: (embed: ParsedEmbed, props: RouteProps) => ReactNode;
    }
  | {
      readonly kind: 'iframe';
      readonly parse: (html: string) => ParsedIframe | null;
      readonly render: (embed: ParsedIframe, props: RouteProps) => ReactNode;
    };

type Table = {
  parsers: readonly PlatformParser[];
  renders: ReadonlyMap<
    Platform,
    (embed: ParsedEmbed, props: RouteProps) => ReactNode
  >;
  iframe: Extract<EmbedPlatform, { kind: 'iframe' }> | undefined;
};

function tableOf(list: readonly EmbedPlatform[]): Table {
  const named = list.flatMap((entry) =>
    entry.kind === 'platform' ? [entry] : [],
  );
  return {
    parsers: named.map((entry) => entry.parser),
    renders: new Map(
      named.map((entry) => [entry.parser.platform, entry.render]),
    ),
    iframe: list.find((entry) => entry.kind === 'iframe'),
  };
}

function useSocialEmbed(props: SocialEmbedProps, table: Table): ReactNode {
  const { html, url, fallback, height, maxHeight, onError, ...shared } = props;
  const route = { shared, frame: { height, maxHeight }, onError };
  const embed = useMemo(
    () =>
      html !== undefined
        ? parseEmbedWith(table.parsers, html)
        : matchUrlWith(table.parsers, url),
    [html, url, table],
  );
  const iframe = useMemo(
    () =>
      embed === null && html !== undefined
        ? (table.iframe?.parse(html) ?? null)
        : null,
    [embed, html, table],
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

  if (iframe && table.iframe) return table.iframe.render(iframe, route);
  if (!embed) return html !== undefined && fallback ? fallback(html) : null;
  return table.renders.get(embed.platform)?.(embed, route) ?? null;
}

/**
 * A `<SocialEmbed>` that recognises only the listed platforms, so a bundler leaves the others
 * out. Call it in a client module: `createSocialEmbed([youtube, x, genericIframe])`.
 */
export function createSocialEmbed(
  list: readonly EmbedPlatform[],
): (props: SocialEmbedProps) => ReactNode {
  const table = tableOf(list);
  function SocialEmbed(props: SocialEmbedProps) {
    return useSocialEmbed(props, table);
  }
  return SocialEmbed;
}

let every: Table | undefined;

/** `height` and `maxHeight` reach only the iframe-based embeds: the others size themselves. */
export function SocialEmbed(props: SocialEmbedProps) {
  every ??= tableOf(EVERY_PLATFORM);
  return useSocialEmbed(props, every);
}
