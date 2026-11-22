import { attributeOptions, type PlatformParser } from '../platform';
import { coerce } from '../url';
import { post, CHANNEL, telegramMatcher } from '../matchers/telegram';

const POST = new RegExp(`^(${CHANNEL})/(\\d{1,10})$`);
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

export const telegram: PlatformParser = {
  ...telegramMatcher,
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
};
