import type { HtmlElement, HtmlNode } from '../html';
import {
  sizeOf,
  unwrapRatio,
  withSize,
  type PlatformParser,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';
import { fromPage, HOSTS, fromPlayer, vimeoMatcher } from '../matchers/vimeo';

const WRAPPER =
  /^padding:\s*(\d{1,3}(?:\.\d{1,4})?)% 0 0 0;\s*position:\s*relative;?$/;
const SCRIPT = /^(?:https?:)?\/\/player\.vimeo\.com\/api\/player\.js$/;

function isLink(
  node: HtmlNode | undefined,
  test: (url: ParsedUrl) => boolean,
): boolean {
  if (node?.type !== 'element' || node.tag !== 'a' || node.attrs.size !== 1)
    return false;
  const href = parseUrl(node.attrs.get('href') ?? '');
  return (
    href !== null &&
    HOSTS.has(href.host) &&
    test(href) &&
    node.children.every((child) => child.type === 'text')
  );
}

function isText(node: HtmlNode | undefined, text: string): boolean {
  return node?.type === 'text' && node.raw.trim() === text;
}

/** Older embed code's credit: the video, its author and Vimeo, linked; it is dropped. */
function isCredit(element: HtmlElement, embed: ParsedEmbed): boolean {
  if (element.tag !== 'p' || element.attrs.size !== 0) return false;
  const [title, from, author, on, home, stop, ...rest] = element.children;
  return (
    rest.length === 0 &&
    isLink(title, (url) => fromPage(url)?.id === embed.id) &&
    isText(from, 'from') &&
    isLink(author, () => true) &&
    isText(on, 'on') &&
    isLink(home, (url) => url.path === '' || url.path === '/') &&
    isText(stop, '.')
  );
}

export const vimeo: PlatformParser = {
  ...vimeoMatcher,
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    if (iframe.tag !== 'iframe') return null;
    const embed = fromPlayer(parseUrl(iframe.attrs.get('src') ?? ''));
    return embed && withSize(embed, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: (src) => SCRIPT.test(src),
  isOwnExtra: isCredit,
};
