import type { ParsedEmbed } from '../../parser';
import { playerParams, query } from '../params';
import type { Plan, PlanError } from '../plan';

/** The player parameters of Streamable's help center (docs/decisions.md D96). */
export type StreamableOptions = {
  autoplay?: boolean;
  hd?: boolean;
  loop?: boolean;
  muted?: boolean;
  nocontrols?: boolean;
};

const KEPT = new Set(['autoplay', 'hd', 'loop', 'muted', 'nocontrols']);

const PARAMS = {
  autoplay: 'autoplay',
  hd: 'hd',
  loop: 'loop',
  muted: 'muted',
  nocontrols: 'nocontrols',
};

export function streamablePlan(
  embed: ParsedEmbed,
  options: StreamableOptions,
): Plan | PlanError {
  const parsed = Object.entries(embed.options).filter(([key]) => KEPT.has(key));
  return {
    kind: 'iframe',
    src: `https://streamable.com/e/${embed.id}${query(
      parsed,
      playerParams(options, PARAMS),
    )}`,
    title: 'Streamable video',
    allow: 'autoplay; fullscreen',
    ratio: { width: 16, height: 9 },
    size: embed.size,
  };
}
