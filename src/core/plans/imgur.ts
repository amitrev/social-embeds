import type { ParsedEmbed } from '../../parser';
import type { MessageHeight, Plan, PlanError } from '../plan';

export type ImgurOptions = {
  /** `false` hides the post's title and description. */
  context?: boolean;
};

/** The frame posts one JSON string at `load`, unasked (docs/decisions.md D94). */
const IMGUR_HEIGHT: MessageHeight = {
  origin: 'https://imgur.com',
  read(data) {
    if (typeof data !== 'string') return undefined;
    const message = JSON.parse(data) as { message?: unknown; height?: unknown };
    return message.message === 'resize_imgur' &&
      typeof message.height === 'number'
      ? message.height
      : undefined;
  },
};

/** At most 540px wide by default, the widest `embed.js` makes the frame (docs/decisions.md D94). */
export function imgurPlan(
  embed: ParsedEmbed,
  options: ImgurOptions,
): Plan | PlanError {
  const context = options.context ?? embed.options.context !== false;
  const params = [
    'pub=true',
    ...(context ? [] : ['context=false']),
    ...(embed.options.analytics === false ? ['analytics=false'] : []),
  ];
  return {
    kind: 'iframe',
    src: `https://imgur.com/${embed.id}/embed?${params.join('&')}`,
    title: 'Imgur post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: IMGUR_HEIGHT,
    startHeight: 500,
    maxWidth: 540,
    fallbackHtml: embed.fallbackHtml,
  };
}
