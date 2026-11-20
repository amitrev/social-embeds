import type { ParsedEmbed } from '../../parser';
import { query } from '../params';
import type { Plan, PlanError } from '../plan';

export type LinkedInOptions = {
  /** The Embed dialog's "less text" option. */
  collapsed?: boolean;
};

// LinkedIn's frame neither scales nor reports its height (docs/decisions.md D53).
const DEFAULT_HEIGHT = 670;
const DEFAULT_WIDTH = 504;

/** A fixed height: the embed code's, else 670px; `size.height` carries it. */
export function linkedinPlan(
  embed: ParsedEmbed,
  options: LinkedInOptions,
): Plan | PlanError {
  const params = new Map(Object.entries(embed.options));
  if (options.collapsed === true) params.set('collapsed', 1);
  if (options.collapsed === false) params.delete('collapsed');
  return {
    kind: 'iframe',
    src: `https://www.linkedin.com/embed/feed/update/${embed.id}${query(params)}`,
    title: 'LinkedIn post',
    allow: '',
    ratio: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    size: { height: embed.size?.height ?? DEFAULT_HEIGHT },
    maxWidth: embed.size?.width ?? DEFAULT_WIDTH,
  };
}
