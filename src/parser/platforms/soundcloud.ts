import type { HtmlElement, HtmlNode } from '../html';
import {
  type Options,
  sizeOf,
  withSize,
  type PlatformParser,
  parserOf,
} from '../platform';
import { coerce, parseUrl } from '../url';
import { SOUNDCLOUD_WIDGET_HOST as WIDGET_HOST } from '../frames';
import {
  PAGE_HOSTS,
  fromApi,
  SECRET_TOKEN,
  soundcloudMatcher,
} from '../matchers/soundcloud';

const LINK_ATTRIBUTES = /* @__PURE__ */ new Set([
  'href',
  'title',
  'target',
  'style',
]);

function isCreditLink(node: HtmlNode | undefined): boolean {
  if (node?.type !== 'element' || node.tag !== 'a') return false;
  if ([...node.attrs.keys()].some((name) => !LINK_ATTRIBUTES.has(name)))
    return false;
  const [text, ...rest] = node.children;
  return (
    rest.length === 0 &&
    text?.type === 'text' &&
    PAGE_HOSTS.has(parseUrl(node.attrs.get('href') ?? '')?.host ?? '')
  );
}

/** Share code's credit: a styled `div` with the artist link, ` · `, and the sound link. */
function isCredit(element: HtmlElement): boolean {
  if (
    element.tag !== 'div' ||
    element.attrs.size !== 1 ||
    !element.attrs.has('style')
  )
    return false;
  const [artist, separator, sound, ...rest] = element.children;
  return (
    rest.length === 0 &&
    isCreditLink(artist) &&
    separator?.type === 'text' &&
    /^\s*·\s*$/.test(separator.raw) &&
    isCreditLink(sound)
  );
}

export const soundcloud: PlatformParser = /* @__PURE__ */ parserOf(
  soundcloudMatcher,
  {
    parse(root) {
      if (root.tag !== 'iframe') return null;
      const src = parseUrl(root.attrs.get('src') ?? '');
      if (src?.host !== WIDGET_HOST || !/^\/player\/?$/.test(src.path))
        return null;
      let found = fromApi(parseUrl(src.query.get('url') ?? ''));
      if (!found) return null;
      const outer = src.query.get('secret_token');
      if (outer !== undefined) {
        if (!SECRET_TOKEN.test(outer)) return null;
        if (!found.url.includes('?'))
          found = { ...found, url: `${found.url}?secret_token=${outer}` };
      }
      const options: Options = Object.fromEntries(
        [...src.query]
          .filter(([key]) => key !== 'url' && key !== 'secret_token')
          .map(([key, value]) => [key, coerce(value)]),
      );
      const { height } = sizeOf(root) ?? {};
      return withSize(
        { ...found, options },
        height === undefined ? undefined : { height },
      );
    },
    isOwnScript: () => false,
    isOwnExtra: isCredit,
  },
);
