import type { Options, PlatformMatcher } from '../platform';
import type { ParsedEmbed } from '../types';

// The embed code is the widget script itself; the package renders its iframe
// (docs/decisions.md D49).

const HOSTS = /* @__PURE__ */ new Set([
  't.me',
  'telegram.me',
  'www.telegram.me',
]);
export const CHANNEL = '[A-Za-z][A-Za-z0-9_]{2,31}';
const POST_PATH = /* @__PURE__ */ new RegExp(
  `^/(?:s/)?(${CHANNEL})/(\\d{1,10})/?$`,
);

export function post(
  channel: string,
  id: string,
  options: Options,
): ParsedEmbed {
  return {
    platform: 'telegram',
    kind: 'post',
    url: `https://t.me/${channel}/${id}`,
    id: `${channel}/${id}`,
    variant: 'iframe',
    options,
  };
}

export const telegramMatcher: PlatformMatcher = {
  platform: 'telegram',
  name: 'Telegram',
  shapes: ['post iframe'],
  match(url) {
    if (!HOSTS.has(url.host)) return null;
    const [, channel, id] = POST_PATH.exec(url.path) ?? [];
    if (channel === undefined || id === undefined) return null;
    const options: Options = {};
    if (url.query.has('single')) options.single = true;
    const comment = url.query.get('comment');
    if (comment !== undefined && /^\d{1,10}$/.test(comment))
      options.comment = Number(comment);
    return post(channel, id, options);
  },
};
