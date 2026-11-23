import type { HtmlElement } from '../html';
import {
  sizeOf,
  unwrapRatio,
  withSize,
  type PlatformParser,
  parserOf,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl } from '../url';
import { GIPHY_PAGE_HOSTS as PAGE_HOSTS } from '../frames';
import { gif, EMBED_PATH, PAGE_PATH, giphyMatcher } from '../matchers/giphy';

const WRAPPER =
  /^width:\s*100%;\s*height:\s*0;\s*padding-bottom:\s*(\d{1,3}(?:\.\d{1,4})?)%;\s*position:\s*relative;?$/;

function fromIframe(iframe: HtmlElement): Omit<ParsedEmbed, 'options'> | null {
  if (iframe.tag !== 'iframe') return null;
  const src = parseUrl(iframe.attrs.get('src') ?? '');
  if (!src || !PAGE_HOSTS.has(src.host)) return null;
  const [, id] = EMBED_PATH.exec(src.path) ?? [];
  return id === undefined ? null : gif(id);
}

function isCredit(element: HtmlElement, embed: ParsedEmbed): boolean {
  if (element.tag !== 'p' || element.attrs.size !== 0) return false;
  const [link, ...rest] = element.children;
  if (rest.length > 0 || link?.type !== 'element' || link.tag !== 'a')
    return false;
  if (link.attrs.size !== 1) return false;
  const href = parseUrl(link.attrs.get('href') ?? '');
  if (
    !href ||
    !PAGE_HOSTS.has(href.host) ||
    PAGE_PATH.exec(href.path)?.[1] !== embed.id
  )
    return false;
  const [text, ...more] = link.children;
  return (
    more.length === 0 &&
    text?.type === 'text' &&
    text.raw.trim() === 'via GIPHY'
  );
}

export const giphy: PlatformParser = /* @__PURE__ */ parserOf(giphyMatcher, {
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    const found = fromIframe(iframe);
    if (!found) return null;
    return withSize({ ...found, options: {} }, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: () => false,
  isOwnExtra: isCredit,
});
