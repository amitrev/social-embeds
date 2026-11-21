import type { ParsedEmbed } from '../../parser';
import { optionsWithout, query } from '../params';
import type { Plan, PlanError } from '../plan';

/**
 * Rumble documents no player parameters (docs/decisions.md D99), so there are no options.
 * The embed code's `pub` is kept as given and never added.
 */
export function rumblePlan(embed: ParsedEmbed): Plan | PlanError {
  const pub = optionsWithout(embed.options, []).filter(
    ([key]) => key === 'pub',
  );
  return {
    kind: 'iframe',
    src: `https://rumble.com/embed/${embed.id}/${query(pub)}`,
    title: 'Rumble video',
    allow: 'fullscreen',
    ratio: { width: 16, height: 9 },
    size: embed.size,
  };
}
