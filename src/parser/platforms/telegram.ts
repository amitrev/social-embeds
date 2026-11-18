import {
  attributeOptions,
  type Options,
  type PlatformParser,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce } from '../url';

// The embed code is the widget script itself; the package renders its iframe
// (docs/decisions.md D49).

const HOSTS = new Set(['t.me', 'telegram.me', 'www.telegram.me']);
const CHANNEL = '[A-Za-z][A-Za-z0-9_]{2,31}';
const POST = new RegExp(`^(${CHANNEL})/(\\d{1,10})$`);
const POST_PATH = new RegExp(`^/(?:s/)?(${CHANNEL})/(\\d{1,10})/?$`);
const SCRIPT =
  /^(?:https?:)?\/\/telegram\.org\/js\/telegram-widget\.js(?:\?\d{1,3})?$/;
// The other widgets of the same script (login, discussion, share) are not posts.
const OTHER_WIDGETS = [
  'data-telegram-login',
  'data-telegram-discussion',
  'data-telegram-share-url',
];

// telegram-widget.js copies these into the iframe query, with `-` read as `_`.
const OPTION_ATTRIBUTES = [
  ['data-width', 'width'],
  ['data-comment', 'comment'],
  ['data-userpic', 'userpic'],
  ['data-mode', 'mode'],
  ['data-color', 'color'],
  ['data-dark', 'dark'],
  ['data-dark-color', 'darkColor'],
] as const;

function post(channel: string, id: string, options: Options): ParsedEmbed {
  return {
    platform: 'telegram',
    kind: 'post',
    url: `https://t.me/${channel}/${id}`,
    id: `${channel}/${id}`,
    variant: 'iframe',
    options,
  };
}

export const telegram: PlatformParser = {
  platform: 'telegram',
  parse: () => null,
  parseScript(script) {
    if (!SCRIPT.test(script.attrs.get('src') ?? '')) return null;
    if (OTHER_WIDGETS.some((name) => script.attrs.has(name))) return null;
    const [, channel, id] =
      POST.exec(script.attrs.get('data-telegram-post') ?? '') ?? [];
    if (channel === undefined || id === undefined) return null;
    const options = attributeOptions(script, OPTION_ATTRIBUTES, coerce);
    // telegram-widget.js reads `data-single` by presence.
    if (script.attrs.has('data-single')) options.single = true;
    return post(channel, id, options);
  },
  isOwnScript: (src) => SCRIPT.test(src),
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
