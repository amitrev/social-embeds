import {
  type Options,
  type PlatformParser,
  sizeOf,
  unwrapRatio,
  withSize,
} from '../platform';
import type { HtmlElement } from '../html';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import { streamableFrame } from '../frames';

// Two wrapper styles and one stray `</div>` are accepted (docs/decisions.md D96).

const ID = '([a-z0-9]{4,8})';
const PAGE_HOSTS = new Set(['streamable.com', 'www.streamable.com']);
const PLAYER_PATH = new RegExp(`^/[eo]/${ID}$`);
const PAGE_PATH = new RegExp(`^/${ID}/?$`);
// Short paths on streamable.com that are pages, not videos.
const NOT_VIDEOS = new Set([
  'about',
  'login',
  'signup',
  'terms',
  'privacy',
  'pricing',
  'upload',
  'help',
  'apps',
  'blog',
  'jobs',
  'press',
  'tools',
  'embed',
  'plans',
  'contact',
  'support',
  'videos',
  'account',
  'profile',
]);
const WRAPPER =
  /^width:\s*100%;\s*height:\s*0(?:px)?;\s*position:\s*relative;\s*padding-bottom:\s*(\d{1,3}(?:\.\d{1,4})?)%;?$/;
const KEPT = new Set(['loop', 'autoplay', 'nocontrols', 'hd', 'muted']);
const STRAY_END = /<\/div\s*>$/i;

function video(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'streamable',
    kind: 'video',
    url: `https://streamable.com/${id}`,
    id,
    variant: 'iframe',
  };
}

function validId(id: string | undefined): id is string {
  return id !== undefined && !NOT_VIDEOS.has(id);
}

function fromIframe(iframe: HtmlElement): ParsedEmbed | null {
  if (iframe.tag !== 'iframe') return null;
  const src = parseUrl(iframe.attrs.get('src') ?? '');
  if (!src || src.host !== 'streamable.com') return null;
  const [, id] = PLAYER_PATH.exec(src.path) ?? [];
  if (!validId(id)) return null;
  const options: Options = Object.fromEntries(
    [...src.query]
      .filter(([key]) => KEPT.has(key))
      .map(([key, value]) => [key, coerce(value)]),
  );
  return { ...video(id), options };
}

function idOf(url: ParsedUrl | null): string | undefined {
  if (!url || !PAGE_HOSTS.has(url.host)) return undefined;
  const id = (PLAYER_PATH.exec(url.path) ?? PAGE_PATH.exec(url.path))?.[1];
  return validId(id) ? id : undefined;
}

export const streamable: PlatformParser = {
  platform: 'streamable',
  name: 'Streamable',
  shapes: ['video iframe'],
  parse(root) {
    const wrapped = unwrapRatio(root, WRAPPER);
    const iframe = wrapped?.iframe ?? root;
    const found = fromIframe(iframe);
    if (!found) return null;
    return withSize(found, wrapped?.size ?? sizeOf(iframe));
  },
  isOwnScript: () => false,
  // The player's "Copy embed code" closes a `div` it never opened.
  repair(html) {
    // Trimmed first: a `\s*` before the tag would backtrack across long whitespace runs.
    const code = html.trimEnd();
    const end = STRAY_END.exec(code);
    if (!end) return null;
    const trimmed = code.slice(0, end.index).trimEnd();
    return /^\s*<iframe[\s>]/i.test(trimmed) ? trimmed : null;
  },
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...video(id), options: {} };
  },
  ownsFrame: streamableFrame,
};
