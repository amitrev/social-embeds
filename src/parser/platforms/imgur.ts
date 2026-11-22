import { type HtmlElement, type HtmlNode, hasClass, rebuild } from '../html';
import type { Options, PlatformParser } from '../platform';
import { post, HASH, image, FALLBACK, imgurMatcher } from '../matchers/imgur';

const DATA_ID = new RegExp(`^(a/)?${HASH}$`);
const SCRIPT = /^(?:https?:)?\/\/s\.imgur\.com\/min\/embed\.js$/;

// The dialog writes `//imgur.com/…`; `rebuild` keeps only http(s) links.
function withScheme(nodes: readonly HtmlNode[]): HtmlNode[] {
  return nodes.map((node): HtmlNode => {
    if (node.type !== 'element') return node;
    const href = node.attrs.get('href');
    const attrs = new Map(node.attrs);
    if (node.tag === 'a' && href?.startsWith('//'))
      attrs.set('href', `https:${href}`);
    return { ...node, attrs, children: withScheme(node.children) };
  });
}

function falseOption(root: HtmlElement, attribute: string): boolean {
  return root.attrs.get(attribute) === 'false';
}

export const imgur: PlatformParser = {
  ...imgurMatcher,
  parse(root) {
    if (root.tag !== 'blockquote' || !hasClass(root, 'imgur-embed-pub'))
      return null;
    const id = root.attrs.get('data-id') ?? '';
    const [, album, hash] = DATA_ID.exec(id) ?? [];
    if (hash === undefined || (album === undefined && !image(hash)))
      return null;
    const options: Options = {};
    if (falseOption(root, 'data-context')) options.context = false;
    if (falseOption(root, 'data-analytics')) options.analytics = false;
    return {
      ...post(id),
      options,
      fallbackHtml: rebuild(withScheme(root.children), FALLBACK),
    };
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
