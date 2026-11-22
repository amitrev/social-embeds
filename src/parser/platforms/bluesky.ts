import { descendants, hasClass, rebuild } from '../html';
import type { Options, PlatformParser } from '../platform';
import { parseUrl } from '../url';
import {
  fromUrl,
  post,
  RKEY,
  DID,
  FALLBACK,
  blueskyMatcher,
} from '../matchers/bluesky';

const AT_URI = new RegExp(`^at://${DID}/app\\.bsky\\.feed\\.post/${RKEY}$`);
const CID = /^[a-z2-7]{20,100}$/;
const COLOR_MODES = new Set(['light', 'dark', 'system']);
const SCRIPT = /^(?:https?:)?\/\/embed\.bsky\.app\/static\/embed\.js$/;

export const bluesky: PlatformParser = {
  ...blueskyMatcher,
  parse(root) {
    if (root.tag !== 'blockquote' || !hasClass(root, 'bluesky-embed'))
      return null;
    const [, did, rkey] =
      AT_URI.exec(root.attrs.get('data-bluesky-uri') ?? '') ?? [];
    if (did === undefined || rkey === undefined) return null;
    const found = post(did, rkey);
    // The post link is the last link; it must name the same post as the AT URI.
    const link = descendants(root.children)
      .reverse()
      .map((element) =>
        element.tag === 'a'
          ? fromUrl(parseUrl(element.attrs.get('href') ?? ''))
          : null,
      )
      .find((linked) => linked !== null);
    if (link?.id !== found.id) return null;

    const options: Options = {};
    const cid = root.attrs.get('data-bluesky-cid');
    if (cid !== undefined && CID.test(cid)) options.cid = cid;
    const colorMode = root.attrs.get('data-bluesky-embed-color-mode');
    if (colorMode !== undefined && COLOR_MODES.has(colorMode))
      options.colorMode = colorMode;
    return {
      ...found,
      options,
      fallbackHtml: rebuild(root.children, FALLBACK),
    };
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
