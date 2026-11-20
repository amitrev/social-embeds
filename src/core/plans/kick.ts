import type { ParsedEmbed } from '../../parser';
import { query } from '../params';
import type { Plan, PlanError } from '../plan';

/** Kick's player parameters; undocumented, read from its player URL (docs/decisions.md D75). */
export type KickOptions = {
  autoplay?: boolean;
  muted?: boolean;
};

const KEPT = new Set(['autoplay', 'muted']);

/** A live channel at 16:9. */
export function kickPlan(
  embed: ParsedEmbed,
  options: KickOptions,
): Plan | PlanError {
  const fromOptions: [string, boolean][] = [];
  if (options.autoplay !== undefined)
    fromOptions.push(['autoplay', options.autoplay]);
  if (options.muted !== undefined) fromOptions.push(['muted', options.muted]);
  return {
    kind: 'iframe',
    src: `https://player.kick.com/${embed.id}${query(
      Object.entries(embed.options).filter(([key]) => KEPT.has(key)),
      fromOptions,
    )}`,
    title: 'Kick player',
    allow: 'autoplay; fullscreen',
    scrolling: 'no',
    ratio: { width: 16, height: 9 },
    size: embed.size,
  };
}
