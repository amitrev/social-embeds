import {
  sizeOf,
  unwrapRatio,
  withSize,
  type PlatformParser,
} from '../platform';
import { parseUrl } from '../url';
import {
  fromPage,
  fromPlayer,
  dailymotionMatcher,
} from '../matchers/dailymotion';

const WRAPPER =
  /^position:\s*relative;\s*padding-bottom:\s*(\d{1,3}(?:\.\d{1,4})?)%;\s*height:\s*0;\s*overflow:\s*hidden;?$/;

export const dailymotion: PlatformParser = {
  ...dailymotionMatcher,
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    if (iframe.tag !== 'iframe') return null;
    const src = parseUrl(iframe.attrs.get('src') ?? '');
    if (!src) return null;
    const embed = fromPlayer(src) ?? fromPage(src);
    return embed && withSize(embed, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: () => false,
};
