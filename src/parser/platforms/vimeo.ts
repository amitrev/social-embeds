import type { HtmlElement, HtmlNode } from '../html';
import {
  type Options,
  type PlatformParser,
  sizeOf,
  unwrapRatio,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import { VIMEO_PLAYER_HOST as PLAYER_HOST, vimeoFrame } from '../frames';

// Vimeo's responsive snippet keeps the ratio only in its wrapper (docs/decisions.md D61).

const HOSTS = new Set(['vimeo.com', 'www.vimeo.com']);
const VIDEO = '(\\d{1,12})';
const HASH = '([0-9a-f]{6,20})';
const PAGE_PATHS = [
  new RegExp(`^/${VIDEO}(?:/${HASH})?/?$`),
  new RegExp(`^/channels/[A-Za-z0-9_-]{1,64}/${VIDEO}/?$`),
  new RegExp(`^/groups/[A-Za-z0-9_-]{1,64}/videos/${VIDEO}/?$`),
  new RegExp(`^/showcase/\\d{1,12}/video/${VIDEO}/?$`),
];
const PLAYER_PATH = new RegExp(`^/video/${VIDEO}/?$`);
const WRAPPER =
  /^padding:\s*(\d{1,3}(?:\.\d{1,4})?)% 0 0 0;\s*position:\s*relative;?$/;
const SCRIPT = /^(?:https?:)?\/\/player\.vimeo\.com\/api\/player\.js$/;
// Vimeo adds these to its own code; they choose nothing about the video.
const DROPPED = new Set(['h', 'app_id', 'player_id']);
const START = /^t=(\d+(?:\.\d+)?|(?:\d+h)?(?:\d+m)?(?:\d+s)?)$/;

function video(
  id: string,
  hash: string | undefined,
): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'vimeo',
    kind: 'video',
    url: `https://vimeo.com/${id}${hash ? `/${hash}` : ''}`,
    id,
    variant: 'iframe',
  };
}

function start(url: ParsedUrl): Options {
  const [, time] = START.exec(url.fragment ?? '') ?? [];
  return time ? { t: time } : {};
}

function fromPage(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  for (const path of PAGE_PATHS) {
    const [, id, hash] = path.exec(url.path) ?? [];
    if (id !== undefined) return video(id, hash);
  }
  return null;
}

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

function fromPlayer(url: ParsedUrl | null): ParsedEmbed | null {
  if (url?.host !== PLAYER_HOST) return null;
  const [, id] = PLAYER_PATH.exec(url.path) ?? [];
  if (id === undefined) return null;
  const hash = url.query.get('h');
  if (hash !== undefined && !new RegExp(`^${HASH}$`).test(hash)) return null;
  const options: Options = Object.fromEntries(
    [...url.query]
      .filter(([key]) => !DROPPED.has(key))
      .map(([key, value]) => [key, coerce(value)]),
  );
  return { ...video(id, hash), options: { ...options, ...start(url) } };
}

export const vimeo: PlatformParser = {
  platform: 'vimeo',
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    if (iframe.tag !== 'iframe') return null;
    const embed = fromPlayer(parseUrl(iframe.attrs.get('src') ?? ''));
    return embed && withSize(embed, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: (src) => SCRIPT.test(src),
  isOwnExtra: isCredit,
  match(url) {
    const player = fromPlayer(url);
    if (player) return player;
    const page = fromPage(url);
    return page && { ...page, options: start(url) };
  },
  ownsFrame: vimeoFrame,
};
