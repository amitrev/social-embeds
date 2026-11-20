import type { ComponentProps, ReactNode } from 'react';
import { matchUrl, type ParsedEmbed, type Platform } from '../parser';
import { needsLookup } from '../parser/lookup';
import { verifyEmbed } from '../parser/verify';

export type EmbedSource =
  { url: string; embed?: never } | { embed: ParsedEmbed; url?: never };

export type SharedProps = Omit<
  ComponentProps<'div'>,
  'children' | 'onLoad' | 'onError'
> & {
  /** Wrapper width. Default `'100%'`. */
  width?: number | string;
  /** The embed fills its container up to this width, in pixels. */
  maxWidth?: number;
  /** Rendered until the embed has loaded. Default: a neutral skeleton. */
  placeholder?: ReactNode;
  /** Load the embed only when it comes near the viewport. Default `true`. */
  lazy?: boolean;
  /** Fires once the platform has rendered the post. */
  onLoad?: () => void;
  /** Fires on invalid input, script load failure or init timeout. */
  onError?: (error: Error) => void;
};

export type FrameProps = SharedProps & {
  /** A fixed height in pixels, instead of the embed's aspect ratio. */
  height?: number;
  /** The embed is at most this tall, in pixels: it narrows to keep its aspect ratio. */
  maxHeight?: number;
};

const NAMES: Record<Platform, string> = {
  x: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  telegram: 'Telegram',
  snapchat: 'Snapchat',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  spotify: 'Spotify',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
  dailymotion: 'Dailymotion',
  bluesky: 'Bluesky',
  soundcloud: 'SoundCloud',
  applemusic: 'Apple Music',
  applepodcasts: 'Apple Podcasts',
  tumblr: 'Tumblr',
  kick: 'Kick',
  giphy: 'Giphy',
};

/** For a post URL that only a network lookup could resolve (docs/decisions.md D70). */
export function lookupMessage(platform: Platform): string {
  return `social-embeds: a ${NAMES[platform]} URL needs a lookup: use the embed code`;
}

export function resolveEmbed(
  url: string | undefined,
  given: ParsedEmbed | undefined,
  platform: Platform,
): { embed: ParsedEmbed; error?: never } | { embed?: never; error: string } {
  const embed = given ?? (url === undefined ? null : matchUrl(url));
  if (!embed && url !== undefined && needsLookup(url) === platform) {
    return {
      error: lookupMessage(platform),
    };
  }
  if (!embed) {
    return {
      error: `social-embeds: not a ${NAMES[platform]} post URL: ${String(url)}`,
    };
  }
  if (embed.platform !== platform) {
    return {
      error: `social-embeds: expected a ${NAMES[platform]} embed, got ${NAMES[embed.platform]}`,
    };
  }
  const verified = verifyEmbed(embed);
  if (!verified) {
    return {
      error: `social-embeds: the ${NAMES[platform]} embed's url and id do not match`,
    };
  }
  return { embed: verified };
}

/**
 * Security: options are not verified (docs/decisions.md D68). Keys that choose the content
 * come only from the verified url and id.
 */
export function optionsWithout(
  options: ParsedEmbed['options'],
  reserved: readonly string[],
): [string, string | number | boolean][] {
  // Lower-cased, so `URL` cannot slip past a reserved `url`.
  return Object.entries(options).filter(
    ([key]) => !reserved.includes(key.toLowerCase()),
  );
}

/** Later entries replace earlier ones with the same name. */
export function query(
  ...sources: (
    Iterable<readonly [string, string | number | boolean]> | undefined
  )[]
): string {
  const params = new Map<string, string>();
  for (const source of sources) {
    for (const [key, value] of source ?? []) params.set(key, String(value));
  }
  const pairs = [...params].map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
  );
  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

/** Player parameters take 0 and 1, so booleans become numbers. */
export function playerParams(
  props: Readonly<Record<string, unknown>>,
  names: Readonly<Record<string, string>>,
): [string, string | number][] {
  const params: [string, string | number][] = [];
  for (const [prop, name] of Object.entries(names)) {
    const value = props[prop];
    if (typeof value === 'boolean') params.push([name, value ? 1 : 0]);
    else if (typeof value === 'string' || typeof value === 'number')
      params.push([name, value]);
  }
  return params;
}
