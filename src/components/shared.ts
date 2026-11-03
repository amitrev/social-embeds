import type { ComponentProps, ReactNode } from 'react';
import { matchUrl, type ParsedEmbed, type Platform } from '../parser';
import { verifyEmbed } from '../parser/verify';

/** A platform component takes a post URL or an already-parsed embed (brief §5.2). */
export type EmbedSource =
  { url: string; embed?: never } | { embed: ParsedEmbed; url?: never };

/** Props every embed component shares (brief §6). */
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

/** Iframe-based embeds (Group B) may also be given a fixed height. */
export type FrameProps = SharedProps & {
  /** A fixed height in pixels, instead of the embed's aspect ratio. */
  height?: number;
};

const NAMES: Record<Platform, string> = {
  x: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

/** The embed for `platform`, or a message saying why the input is not one. */
export function resolveEmbed(
  url: string | undefined,
  given: ParsedEmbed | undefined,
  platform: Platform,
): { embed: ParsedEmbed; error?: never } | { embed?: never; error: string } {
  const embed = given ?? (url === undefined ? null : matchUrl(url));
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

/** Serialises query parameters; later entries replace earlier ones with the same name. */
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

/**
 * Maps option props to the platform's parameter names. Player parameters take 0 and 1,
 * so booleans become numbers; undefined props are left out.
 */
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
