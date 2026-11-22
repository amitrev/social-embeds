import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
} from '../platform';
import { coerce, parseUrl } from '../url';
import { video, idOf, rumbleMatcher } from '../matchers/rumble';

export const rumble: PlatformParser = {
  ...rumbleMatcher,
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    const id = idOf(src, new Set(['rumble.com']));
    if (id === undefined || !src) return null;
    const options: Options = {};
    const pub = src.query.get('pub');
    if (pub) options.pub = coerce(pub);
    return withSize({ ...video(id), options }, sizeOf(root));
  },
  isOwnScript: () => false,
};
