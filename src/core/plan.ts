import type { Driver } from './drivers';

/** A frame that posts its own height (docs/decisions.md D55). */
export type MessageHeight = {
  /** The frame's origin; messages from any other origin are ignored. */
  origin: string;
  /** The height in a message's `data`, or `undefined` for any other message. May throw. */
  read: (data: unknown) => number | undefined;
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
  /** Query parameter that gets the page's host when the iframe is created (Twitch's `parent`). */
  hostParam?: string;
  /** Rounds the corners and clips the frame to them; the host's `style` can override. */
  borderRadius?: number;
  /** The platform's default; a host `maxWidth` replaces it. */
  maxWidth?: number;
  /** Verified fallback content shown as the placeholder (Bluesky). */
  fallbackHtml?: string;
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
