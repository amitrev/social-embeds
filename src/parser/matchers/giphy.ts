import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { GIPHY_PAGE_HOSTS as PAGE_HOSTS, giphyFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// Giphy's code ends with a "via GIPHY" credit, accepted and dropped (docs/decisions.md D76).

const ID = '([A-Za-z0-9]{6,40})';
export const PAGE_PATH = /* @__PURE__ */ new RegExp(
  `^/(?:gifs|stickers)/(?:[A-Za-z0-9-]{0,200}-)?${ID}/?$`,
);
export const EMBED_PATH = /* @__PURE__ */ new RegExp(`^/embed/${ID}/?$`);
const MEDIA_HOST = /^(?:media\d?|i)\.giphy\.com$/;
const FILE_TYPE = '\\.(?:gif|webp|mp4)';
// "Copy GIF link" puts a `v1.{base64}` segment before the id; the file is any rendition.
const MEDIA_PATH = /* @__PURE__ */ new RegExp(
  `^/media/(?:v1\\.[A-Za-z0-9_-]{1,500}/)?${ID}/[A-Za-z0-9_-]{1,40}${FILE_TYPE}$`,
);
const SHORT_MEDIA_PATH = /* @__PURE__ */ new RegExp(`^/${ID}${FILE_TYPE}$`);

export function gif(id: string): Omit<ParsedEmbed, 'options'> {
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

export const giphyMatcher: PlatformMatcher = {
  platform: 'giphy',
  name: 'Giphy',
  shapes: ['video iframe'],
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...gif(id), options: {} };
  },
  ownsFrame: giphyFrame,
};
