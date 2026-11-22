import type { ParsedEmbed } from '../../parser';
import { query } from '../params';
import type { MessageHeight, Plan, PlanError } from '../plan';
import { listenForHeight } from '../message-height';

export type BlueskyOptions = {
  colorMode?: 'light' | 'dark' | 'system';
};

/** The frame posts `{ height }` once it has painted (docs/decisions.md D70). */
const BLUESKY_HEIGHT: MessageHeight = {
  origin: 'https://embed.bsky.app',
  read(data) {
    const height = (data as { height?: unknown } | null)?.height;
    return typeof height === 'number' ? height : undefined;
  },
  listen: listenForHeight,
};

/**
 * At most 600px wide by default, Bluesky's oEmbed width. Renders the frame `embed.js` would
 * create, without the script (docs/decisions.md D77). Only embed code and URLs with a DID
 * render: a handle URL needs a lookup, and `onError` says so.
 */
export function blueskyPlan(
  embed: ParsedEmbed,
  options: BlueskyOptions,
): Plan | PlanError {
  const mode = options.colorMode ?? embed.options.colorMode;
  return {
    kind: 'iframe',
    src: `https://embed.bsky.app/embed/${embed.id}${query(
      typeof mode === 'string' ? [['colorMode', mode]] : undefined,
    )}`,
    title: 'Bluesky post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: BLUESKY_HEIGHT,
    startHeight: 300,
    maxWidth: 600,
    fallbackHtml: embed.fallbackHtml,
  };
}
