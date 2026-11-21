import type { ParsedEmbed } from '../../parser';
import type { Plan, PlanError } from '../plan';

/** The embed code's aspect ratio; a URL carries no size and renders at 4:3, as `embed.js` does (docs/decisions.md D95). */
export function tenorPlan(embed: ParsedEmbed): Plan | PlanError {
  return {
    kind: 'iframe',
    src: `https://tenor.com/embed/${embed.id}`,
    title: 'Tenor GIF',
    allow: 'fullscreen',
    ratio: { width: 133, height: 100 },
    size: embed.size,
  };
}
