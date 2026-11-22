import type { HtmlElement } from '../html';
import {
  type PlatformParser,
  sizeOf,
  unwrapRatio,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';
import { GIPHY_PAGE_HOSTS as PAGE_HOSTS, giphyFrame } from '../frames';

// Giphy's code ends with a "via GIPHY" credit, accepted and dropped (docs/decisions.md D76).

const ID = '([A-Za-z0-9]{6,40})';
const PAGE_PATH = new RegExp(
  `^/(?:gifs|stickers)/(?:[A-Za-z0-9-]{0,200}-)?${ID}/?$`,
);
const EMBED_PATH = new RegExp(`^/embed/${ID}/?$`);
const MEDIA_HOST = /^(?:media\d?|i)\.giphy\.com$/;
const FILE_TYPE = '\\.(?:gif|webp|mp4)';
// "Copy GIF link" puts a `v1.{base64}` segment before the id; the file is any rendition.
const MEDIA_PATH = new RegExp(
  `^/media/(?:v1\\.[A-Za-z0-9_-]{1,500}/)?${ID}/[A-Za-z0-9_-]{1,40}${FILE_TYPE}$`,
);
const SHORT_MEDIA_PATH = new RegExp(`^/${ID}${FILE_TYPE}$`);
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
  if (!MEDIA_HOST.test(url.host)) return undefined;
  const found =
    MEDIA_PATH.exec(url.path) ??
    (url.host === 'i.giphy.com' ? SHORT_MEDIA_PATH.exec(url.path) : null);
  return found?.[1];
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
  name: 'Giphy',
  shapes: ['video iframe'],
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
  ownsFrame: giphyFrame,
};
