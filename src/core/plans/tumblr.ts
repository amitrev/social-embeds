import type { ParsedEmbed } from '../../parser';
import type { MessageHeight, Plan, PlanError } from '../plan';

/** The frame posts a JSON string once it has painted (docs/decisions.md D74). */
const TUMBLR_HEIGHT: MessageHeight = {
  origin: 'https://embed.tumblr.com',
  read(data) {
    if (typeof data !== 'string') return undefined;
    const message = JSON.parse(data) as { method?: unknown; args?: unknown };
    const [height] = Array.isArray(message.args)
      ? (message.args as unknown[])
      : [];
    return message.method === 'tumblr-post:sizeChange' &&
      typeof height === 'number'
      ? height
      : undefined;
  },
};

/** At most 540px wide by default, Tumblr's oEmbed width. Renders the frame `post.js` would create (docs/decisions.md D77). */
export function tumblrPlan(embed: ParsedEmbed): Plan | PlanError {
  const blog =
    embed.url.slice('https://www.tumblr.com/'.length).split('/')[0] ?? '';
  return {
    kind: 'iframe',
    src: `https://embed.tumblr.com/embed/post/${blog}/${embed.id}/v2`,
    title: 'Tumblr post',
    allow: '',
    scrolling: 'no',
    ratio: { width: 1, height: 1 },
    messageHeight: TUMBLR_HEIGHT,
    startHeight: 400,
    maxWidth: 540,
  };
}
