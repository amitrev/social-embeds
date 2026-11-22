import { hasClass } from '../html';
import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
} from '../platform';
import { parseUrl } from '../url';
import { post, ID, USER, truthsocialMatcher } from '../matchers/truthsocial';

const FRAME_PATH = new RegExp(`^/${USER}/${ID}/embed$`);
const SCRIPT = /^(?:https?:)?\/\/truthsocial\.com\/embed\.js$/;

export const truthsocial: PlatformParser = {
  ...truthsocialMatcher,
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (!src || src.host !== 'truthsocial.com') return null;
    const [, user, id] = FRAME_PATH.exec(src.path) ?? [];
    if (user === undefined || id === undefined) return null;
    const options: Options = hasClass(root, 'truthsocial-video')
      ? { video: true }
      : {};
    return withSize({ ...post(user, id), options }, sizeOf(root));
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
