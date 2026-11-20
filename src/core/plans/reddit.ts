import type { ParsedEmbed } from '../../parser';
import { query } from '../params';
import type { MessageHeight, Plan, PlanError } from '../plan';

/** The `data-embed-*` options of Reddit's embed code that hosts set most. */
export type RedditOptions = {
  theme?: 'light' | 'dark';
  showMedia?: boolean;
  showTitle?: boolean;
  showUsername?: boolean;
  /** Language of the post, which Reddit machine-translates (docs/decisions.md D52). */
  locale?: string;
  /** Replies shown under an embedded comment. */
  depth?: number;
};

const PARAMS: Record<keyof RedditOptions, string> = {
  theme: 'theme',
  showMedia: 'showmedia',
  showTitle: 'showtitle',
  showUsername: 'showusername',
  locale: 'locale',
  depth: 'depth',
};

// widgets.js copies its attributes into the query as written: booleans stay `true`/`false`.
const SANDBOX = 'allow-scripts allow-same-origin allow-popups';
const ALLOW = 'clipboard-read; clipboard-write';
const START_HEIGHT = 316; // the post in Reddit's own embed code

/** docs/decisions.md D52. */
const REDDIT_HEIGHT: MessageHeight = {
  origin: 'https://embed.reddit.com',
  read(data) {
    if (typeof data !== 'string') return undefined;
    const message = JSON.parse(data) as { type?: unknown; data?: unknown };
    return message.type === 'resize.embed' && typeof message.data === 'number'
      ? message.data
      : undefined;
  },
};

/** At most 640px wide by default, the width widgets.js gives the frame (docs/decisions.md D52). */
export function redditPlan(
  embed: ParsedEmbed,
  options: RedditOptions,
): Plan | PlanError {
  const fromProps: [string, string | number | boolean][] = [];
  for (const [prop, name] of Object.entries(PARAMS)) {
    const value = options[prop as keyof RedditOptions];
    if (value !== undefined) fromProps.push([name, value]);
  }
  // verifyEmbed guarantees the canonical `https://www.reddit.com/r/…` form (docs/decisions.md D57).
  const path = embed.url.slice('https://www.reddit.com'.length);
  return {
    kind: 'iframe',
    src: `https://embed.reddit.com${path}${query([['embed', true]], Object.entries(embed.options), fromProps)}`,
    title: 'Reddit post',
    allow: ALLOW,
    sandbox: SANDBOX,
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: REDDIT_HEIGHT,
    startHeight: embed.size?.height ?? START_HEIGHT,
    maxWidth: 640,
  };
}
