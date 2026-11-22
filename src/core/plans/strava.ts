import type { ParsedEmbed } from '../../parser';
import type { MessageHeight, Plan, PlanError } from '../plan';

/** The display options of Strava's embed code (docs/decisions.md D97). */
export type StravaOptions = {
  /** The embed's `data-style`. */
  embedStyle?: 'standard' | 'minimal';
  /** Routes only: the frame fills its container, with no maximum width. */
  fullWidth?: boolean;
  mapHash?: string;
};

// The frame echoes the token in its messages; any token will do (docs/decisions.md D100).
const NS = 'social-embeds';

/** The frame posts `[ns, 'BROADCAST_IFRAME_HEIGHT', height]` once, unasked (docs/decisions.md D97). */
const STRAVA_HEIGHT: MessageHeight = {
  origin: 'https://strava-embeds.com',
  read(data) {
    if (!Array.isArray(data)) return undefined;
    const [, type, height] = data as unknown[];
    return type === 'BROADCAST_IFRAME_HEIGHT' && typeof height === 'number'
      ? height
      : undefined;
  },
};

function styleOf(value: unknown): 'standard' | 'minimal' {
  return value === 'minimal' ? 'minimal' : 'standard';
}

/** At most 554px wide by default, as `embed.js` makes the frame; a full-width route has no maximum (docs/decisions.md D97). */
export function stravaPlan(
  embed: ParsedEmbed,
  options: StravaOptions,
): Plan | PlanError {
  // `embed.id` is `{type}/{number}`; the type and number never come from the options (docs/decisions.md D68).
  const route = embed.id.startsWith('route/');
  const style = styleOf(options.embedStyle ?? embed.options.style);
  const fullWidth =
    route && (options.fullWidth ?? embed.options.fullWidth === true);
  const mapHash = options.mapHash ?? embed.options.mapHash;
  const query = `?style=${style}${fullWidth ? '&fullWidth=true' : ''}`;
  const fragment = `#ns=${NS}${
    typeof mapHash === 'string' && mapHash !== ''
      ? `&mapHash=${encodeURIComponent(mapHash)}`
      : ''
  }`;
  return {
    kind: 'iframe',
    src: `https://strava-embeds.com/${embed.id}${query}${fragment}`,
    title: route ? 'Strava route' : 'Strava activity',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: STRAVA_HEIGHT,
    startHeight: 650,
    ...(fullWidth ? {} : { maxWidth: 554 }),
  };
}
