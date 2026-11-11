import { type ReactNode, useMemo } from 'react';
import { matchUrl, parseEmbed } from '../parser';
import { FacebookEmbed, type FacebookOptions } from './facebook-embed';
import { useReportError } from './hooks';
import { InstagramEmbed, type InstagramOptions } from './instagram-embed';
import type { FrameProps } from './shared';
import { ThreadsEmbed, type ThreadsOptions } from './threads-embed';
import { TikTokEmbed, type TikTokOptions } from './tiktok-embed';
import { XEmbed, type XOptions } from './x-embed';
import { YouTubeEmbed, type YouTubeOptions } from './youtube-embed';

/** Embed code or a post URL; never both (brief §5.2). */
export type SocialEmbedSource =
  { html: string; url?: never } | { url: string; html?: never };

/**
 * Platform options come from the embed code. Div attributes that share a name with one
 * (`lang`, `color`, `rel`) are left out, because each platform reads that name its own way.
 */
type PlatformOption =
  | keyof XOptions
  | keyof InstagramOptions
  | keyof ThreadsOptions
  | keyof FacebookOptions
  | keyof TikTokOptions
  | keyof YouTubeOptions;

export type SocialEmbedProps = SocialEmbedSource &
  Omit<FrameProps, PlatformOption> & {
    /**
     * Called with the original string when `html` is not a recognised embed code
     * (brief §6.4). Without it, nothing is rendered and `onError` is called.
     */
    fallback?: (html: string) => ReactNode;
  };

/**
 * Recognises embed code or a post URL and renders the platform's component. `height` and
 * `maxHeight` reach only the iframe-based embeds; the others size themselves (brief §6.1).
 */
export function SocialEmbed(props: SocialEmbedProps) {
  const { html, url, fallback, height, maxHeight, onError, ...shared } = props;
  const frame = { height, maxHeight };
  const embed = useMemo(
    () => (html !== undefined ? parseEmbed(html) : matchUrl(url)),
    [html, url],
  );
  // With a fallback, unrecognised embed code is the host's to handle (brief §6.4).
  const unrecognised = embed === null && !(html !== undefined && fallback);
  useReportError(
    unrecognised
      ? html !== undefined
        ? 'social-embeds: unrecognised embed code'
        : `social-embeds: not a supported post URL: ${url}`
      : undefined,
    onError,
  );

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
  }
}
