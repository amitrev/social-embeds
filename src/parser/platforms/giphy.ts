import type { HtmlElement } from '../html';
import {
  type PlatformParser,
  sizeOf,
  unwrapRatio,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';

// Giphy's code ends with a "via GIPHY" credit, accepted and dropped (docs/decisions.md D76).

const ID = '([A-Za-z0-9]{6,40})';
const PAGE_HOSTS = new Set(['giphy.com', 'www.giphy.com']);
const PAGE_PATH = new RegExp(`^/gifs/(?:[A-Za-z0-9-]{0,200}-)?${ID}/?$`);
const EMBED_PATH = new RegExp(`^/embed/${ID}/?$`);
const MEDIA_HOST = /^media\d?\.giphy\.com$/;
const MEDIA_PATH = new RegExp(`^/media/${ID}/giphy\\.(?:gif|webp|mp4)$`);
const WRAPPER =
  /^width:\s*100%;\s*height:\s*0;\s*padding-bottom:\s*(\d{1,3}(?:\.\d{1,4})?)%;\s*position:\s*relative;?$/;

function gif(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'giphy',
    kind: 'video',
    url: `https://giphy.com/gifs/${id}`,
    id,
    variant: 'iframe',
  };
}

function idOf(url: ParsedUrl | null): string | undefined {
  if (!url) return undefined;
  if (PAGE_HOSTS.has(url.host))
    return (PAGE_PATH.exec(url.path) ?? EMBED_PATH.exec(url.path))?.[1];
  if (MEDIA_HOST.test(url.host)) return MEDIA_PATH.exec(url.path)?.[1];
  return undefined;
}

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

export const giphy: PlatformParser = {
  platform: 'giphy',
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    const found = fromIframe(iframe);
    if (!found) return null;
    return withSize({ ...found, options: {} }, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: () => false,
  isOwnExtra: isCredit,
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...gif(id), options: {} };
  },
};
