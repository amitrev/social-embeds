import { hasClass, rebuild } from '../html';
import {
  attributeOptions,
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
  parserOf,
} from '../platform';
import { coerce, parseUrl, pixels } from '../url';
import { FACEBOOK_PLUGIN_HOSTS as PLUGIN_HOSTS } from '../frames';
import { embed, target, FALLBACK, facebookMatcher } from '../matchers/facebook';

const SCRIPT =
  /^(?:https?:)?\/\/connect\.facebook\.net\/([a-z]{2,3}_[A-Z]{2})\/sdk\.js(?:[?#].*)?$/;

const OPTION_ATTRIBUTES = [
  ['data-width', 'width'],
  ['data-show-text', 'showText'],
  ['data-lazy', 'lazy'],
  ['data-allowfullscreen', 'allowfullscreen'],
  ['data-autoplay', 'autoplay'],
  ['data-show-captions', 'showCaptions'],
] as const;

// The plugins/video.php parameters that fb-video has an attribute for.
const VIDEO_SDK_PARAMETERS = [
  ['show_text', 'showText'],
  ['allowfullscreen', 'allowfullscreen'],
  ['autoplay', 'autoplay'],
  ['show_captions', 'showCaptions'],
] as const;

export const facebook: PlatformParser = /* @__PURE__ */ parserOf(
  facebookMatcher,
  {
    parse(root) {
      if (root.tag === 'div') {
        const kind = hasClass(root, 'fb-post')
          ? 'post'
          : hasClass(root, 'fb-video')
            ? 'video'
            : null;
        const found = target(parseUrl(root.attrs.get('data-href') ?? ''));
        if (!kind || !found) return null;
        return {
          ...embed(
            found,
            kind,
            'sdk',
            attributeOptions(root, OPTION_ATTRIBUTES, coerce),
          ),
          fallbackHtml: rebuild(root.children, FALLBACK),
        };
      }

      if (root.tag !== 'iframe') return null;
      const src = parseUrl(root.attrs.get('src') ?? '');
      if (!src || !PLUGIN_HOSTS.has(src.host)) return null;
      const found = target(parseUrl(src.query.get('href') ?? ''));
      if (!found) return null;

      if (src.path === '/plugins/post.php') {
        // A post iframe's height only fits its width: posts go to the SDK (docs/decisions.md D22).
        const options: Options = {};
        const showText = src.query.get('show_text');
        const width = src.query.get('width');
        if (showText !== undefined) options.showText = coerce(showText);
        if (width !== undefined) options.width = coerce(width);
        return embed(found, 'post', 'sdk', options);
      }
      if (src.path === '/plugins/video.php') {
        const showText = coerce(src.query.get('show_text') ?? '');
        if (showText === true || showText === 1) {
          // The post text has its own height at every width: docs/decisions.md D44.
          const options: Options = {};
          for (const [parameter, key] of VIDEO_SDK_PARAMETERS) {
            const value = src.query.get(parameter);
            if (value !== undefined) options[key] = coerce(value);
          }
          // The player's own size: the iframe's height attribute includes the text.
          const width = pixels(src.query.get('width'));
          const height = pixels(src.query.get('height'));
          return withSize(
            embed(found, 'video', 'sdk', { ...options, showText: true }),
            width === undefined || height === undefined
              ? undefined
              : { width, height },
          );
        }
        const options: Options = Object.fromEntries(
          [...src.query]
            .filter(([key]) => key !== 'href')
            .map(([key, value]) => [key, coerce(value)]),
        );
        return withSize(embed(found, 'video', 'iframe', options), sizeOf(root));
      }
      return null;
    },
    isOwnScript: (src) => SCRIPT.test(src),
    scriptOptions(src): Options {
      const [, locale] = SCRIPT.exec(src) ?? [];
      return locale === undefined ? {} : { locale };
    },
    allowsFbRoot: true,
  },
);
