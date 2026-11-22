import type { Driver } from './drivers';

/** A frame that posts its own height (docs/decisions.md D55). */
export type MessageHeight = {
  /** The frame's origin; messages from any other origin are ignored. */
  origin: string;
  /** The height in a message's `data`, or `undefined` for any other message. May throw. */
  read: (data: unknown) => number | undefined;
  /** Calls `onHeight` with each height the frame posts; returns the cleanup. */
  listen: (
    this: MessageHeight,
    frame: () => HTMLIFrameElement | null | undefined,
    onHeight: (height: number) => void,
  ) => () => void;
};

export type IframePlan = {
  kind: 'iframe';
  src: string;
  title: string;
  allow: string;
  /** Default `true`. */
  allowFullscreen?: boolean;
  referrerPolicy?: Exclude<ReferrerPolicy, ''>;
  scrolling?: 'no';
  /** `''` sandboxes the frame fully. */
  sandbox?: string;
  /** Used when the input carries no size. */
  ratio: { width: number; height: number };
  size?: { width?: number; height?: number };
  /** The platform's default fixed height; a host `height` replaces it. */
  height?: number;
  /** Height from the frame's messages instead of an aspect ratio. */
  messageHeight?: MessageHeight;
  /** With `messageHeight`: the height until the first message. */
  startHeight?: number;
  /** Rewrites `src` when the iframe is created, on the client only (Twitch's `parent`, the page's host). */
  clientSrc?: (src: string) => string;
  /** Rounds the corners and clips the frame to them; the host's `style` can override. */
  borderRadius?: number;
  /** The platform's default; a host `maxWidth` replaces it. */
  maxWidth?: number;
  /** Verified fallback content shown as the placeholder: a quote's content, in a `<blockquote>`. */
  fallbackHtml?: string;
  /** `fallbackHtml` is a linked image that fills the box instead (Flickr). */
  fallbackImage?: boolean;
  /**
   * The frame lays out at the pixel size its URL names and never reflows (Flickr): `src` gets the
   * box's width and the height from the ratio, rebuilt when that width changes (docs/decisions.md D100).
   */
  sizeInSrc?: SizeInSrc;
};

export type SizeInSrc = {
  /** Calls `onWidth` with the box's width as it settles; returns the cleanup. */
  watch: (element: Element, onWidth: (width: number) => void) => () => void;
  src: (width: number) => string;
};

export type ScriptPlan = {
  kind: 'script';
  /** Changes whenever the platform script must render from scratch (D35). */
  key: string;
  markup: string;
  driver: Driver;
  minHeight: number;
  label: string;
  hasFallback: boolean;
  maxWidth?: number;
};

export type PlanError = { kind: 'error'; message: string };
export type Plan = IframePlan | ScriptPlan;
