import { attributeOptions, type PlatformParser } from '../platform';
import { coerce, parseUrl } from '../url';
import { PINTEREST_FRAME_HOST as FRAME_HOST } from '../frames';
import { pinOf, pin, pinterestMatcher } from '../matchers/pinterest';

const PIN_ID = /^\d{1,25}$/;
const SCRIPT =
  /^(?:https?:)?\/\/assets\.pinterest\.com\/js\/pinit(?:_main)?\.js$/;

const OPTION_ATTRIBUTES = [
  ['data-pin-width', 'width'],
  ['data-pin-lang', 'lang'],
  ['data-pin-terse', 'terse'],
] as const;

export const pinterest: PlatformParser = {
  ...pinterestMatcher,
  parse(root) {
    if (root.tag === 'a') {
      if (root.attrs.get('data-pin-do') !== 'embedPin') return null;
      if (root.children.some((child) => child.type === 'element')) return null;
      const found = pinOf(parseUrl(root.attrs.get('href') ?? ''));
      return (
        found && {
          ...found,
          options: attributeOptions(root, OPTION_ATTRIBUTES, coerce),
        }
      );
    }

    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (src?.host !== FRAME_HOST || src.path !== '/ext/embed.html') return null;
    const id = src.query.get('id');
    return id !== undefined && PIN_ID.test(id)
      ? { ...pin(id), options: {} }
      : null;
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
