import type { ParsedEmbed } from '../../parser';
import type { Plan, PlanError } from '../plan';

// The value embed.js gives the frame; Lenses use the camera and microphone.
const ALLOW = 'autoplay; camera; microphone; clipboard-write;';

/** At most 416px wide by default, the size of Snapchat's own embed code (docs/decisions.md D50). */
export function snapchatPlan(embed: ParsedEmbed): Plan | PlanError {
  const title = embed.options.title;
  return {
    kind: 'iframe',
    src: `${embed.url}/embed`,
    title: typeof title === 'string' && title !== '' ? title : 'Snapchat',
    allow: ALLOW,
    scrolling: 'no',
    ratio: { width: 416, height: 692 },
    size: embed.size,
    maxWidth: 416,
  };
}
