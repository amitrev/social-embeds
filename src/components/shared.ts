import type { ComponentProps, ReactNode } from 'react';
import type { ParsedEmbed } from '../parser';

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

export { lookupMessage, resolveEmbed } from '../core/resolve';
export { optionsWithout, playerParams, query } from '../core/params';
