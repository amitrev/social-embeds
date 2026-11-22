import {
  type HtmlElement,
  type HtmlNode,
  hasClass,
  rebuild,
  type Whitelist,
  rebuildsAs,
} from '../html';
import type { Options, PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';

// `id` keeps the `a/` of albums and gallery posts, and every template uses it whole (docs/decisions.md D94).

const HOSTS = new Set(['imgur.com', 'www.imgur.com', 'm.imgur.com']);
const HASH = '([A-Za-z0-9]{5,7})';
const DATA_ID = new RegExp(`^(a/)?${HASH}$`);
const ALBUM_PATH = new RegExp(`^/a/${HASH}/?$`);
const GALLERY_PATH = new RegExp(
  `^/gallery/(?:[A-Za-z0-9-]{1,200}-)?${HASH}/?$`,
);
const IMAGE_PATH = new RegExp(`^/${HASH}/?$`);
const FILE_PATH = new RegExp(`^/${HASH}\\.(?:jpe?g|png|gif|gifv|mp4|webp)$`);
const SCRIPT = /^(?:https?:)?\/\/s\.imgur\.com\/min\/embed\.js$/;
// Page names that look like a hash.
const NOT_IMAGES = new Set([
  'about',
  'apps',
  'blog',
  'help',
  'jobs',
  'login',
  'press',
  'privacy',
  'random',
  'search',
  'signin',
  'signup',
  'terms',
  'tools',
  'upload',
  'account',
  'contact',
  'emerald',
  'explore',
  'gallery',
  'hot',
  'new',
  'rules',
  'user',
]);
const FALLBACK: Whitelist = new Map([
  ['a', [{ name: 'href', value: /^https:\/\/(?:www\.)?imgur\.com\// }]],
]);

function post(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'imgur',
    kind: 'post',
    url: `https://imgur.com/${id}`,
    id,
    variant: 'iframe',
  };
}

function image(hash: string | undefined): string | undefined {
  return hash === undefined || NOT_IMAGES.has(hash.toLowerCase())
    ? undefined
    : hash;
}

function idOf(url: ParsedUrl | null): string | undefined {
  if (!url) return undefined;
  if (url.host === 'i.imgur.com') return image(FILE_PATH.exec(url.path)?.[1]);
  if (!HOSTS.has(url.host)) return undefined;
  const album = (ALBUM_PATH.exec(url.path) ?? GALLERY_PATH.exec(url.path))?.[1];
  if (album !== undefined) return `a/${album}`;
  return image(IMAGE_PATH.exec(url.path)?.[1]);
}

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
  platform: 'imgur',
  name: 'Imgur',
  shapes: ['post iframe'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
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
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...post(id), options: {} };
  },
};
