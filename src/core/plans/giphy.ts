import type { ParsedEmbed } from '../../parser';
import type { Plan, PlanError } from '../plan';

/** The embed code's aspect ratio; a URL carries no size and renders square (docs/decisions.md D76). */
export function giphyPlan(embed: ParsedEmbed): Plan | PlanError {
  return {
    kind: 'iframe',
    src: `https://giphy.com/embed/${embed.id}`,
    title: 'Giphy GIF',
    allow: 'fullscreen',
    ratio: { width: 1, height: 1 },
    size: embed.size,
  };
}
