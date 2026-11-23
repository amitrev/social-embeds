import { type HtmlElement, rebuild } from '../html';
import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
  parserOf,
} from '../platform';
import { parseUrl } from '../url';
import {
  fromLongUrl,
  FALLBACK,
  IMAGE_SRC,
  flickrMatcher,
} from '../matchers/flickr';

const SCRIPT = /^(?:https?:)?\/\/embedr\.flickr\.com\/assets\/client-code\.js$/;
const OPTIONS = ['header', 'footer', 'context'] as const;

function onlyImage(root: HtmlElement): HtmlElement | null {
  let image: HtmlElement | null = null;
  for (const child of root.children) {
    if (child.type === 'text' && /^\s*$/.test(child.raw)) continue;
    if (child.type !== 'element' || child.tag !== 'img' || image) return null;
    image = child;
  }
  return image;
}

export const flickr: PlatformParser = /* @__PURE__ */ parserOf(flickrMatcher, {
  parse(root) {
    if (root.tag !== 'a' || root.attrs.get('data-flickr-embed') !== 'true')
      return null;
    const found = fromLongUrl(parseUrl(root.attrs.get('href') ?? ''));
    const image = onlyImage(root);
    if (!found || !image) return null;
    const options: Options = {};
    for (const name of OPTIONS)
      if (root.attrs.get(`data-${name}`) === 'true') options[name] = true;
    const size = sizeOf(image);
    // An image `rebuild` would strip of its `src` goes entirely.
    const linked = IMAGE_SRC.test(image.attrs.get('src') ?? '')
      ? root
      : { ...root, children: [] };
    return withSize(
      { ...found, options, fallbackHtml: rebuild([linked], FALLBACK) },
      size?.width !== undefined && size.height !== undefined ? size : undefined,
    );
  },
  isOwnScript: (src) => SCRIPT.test(src),
});
