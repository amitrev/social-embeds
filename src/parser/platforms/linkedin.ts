import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
} from '../platform';
import { coerce, parseUrl } from '../url';
import { LINKEDIN_FRAME_HOST as FRAME_HOST } from '../frames';
import { post, URN, linkedinMatcher } from '../matchers/linkedin';

const EMBED_PATH = new RegExp(`^/embed/feed/update/urn:li:${URN}$`);

export const linkedin: PlatformParser = {
  ...linkedinMatcher,
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (src?.host !== FRAME_HOST) return null;
    const [, type, id] = EMBED_PATH.exec(src.path) ?? [];
    if (type === undefined || id === undefined) return null;
    const options: Options = Object.fromEntries(
      [...src.query].map(([key, value]) => [key, coerce(value)]),
    );
    return withSize(post(type, id, options), sizeOf(root));
  },
  isOwnScript: () => false,
};
