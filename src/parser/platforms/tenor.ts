import {
  rebuild,
  type HtmlElement,
  hasClass,
  type Whitelist,
  rebuildsAs,
} from '../html';
import { type PlatformParser, sizeOf, withSize } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';
import { tenorFrame } from '../frames';

// The default ratio, 1.33, is embed.js's own (docs/decisions.md D95); a URL carries no size here.

const HOSTS = new Set(['tenor.com', 'www.tenor.com']);
const ID = '(\\d{1,20})';
const PAGE_PATH = new RegExp(
  `^/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?/)?view/(?:[A-Za-z0-9%_.~-]{1,300}-gif-)?${ID}/?$`,
);
const FRAME_PATH = new RegExp(`^/embed/${ID}$`);
const SCRIPT = /^(?:https?:)?\/\/tenor\.com\/embed\.js$/;
// Tenor writes some ratios unrounded: `2.3380281690140845`.
const RATIO = /^\d{1,3}(?:\.\d{1,20})?$/;
const DEFAULT_RATIO = 1.33;
const FALLBACK: Whitelist = new Map([['a', ['href']]]);

function gif(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'tenor',
    kind: 'video',
    url: `https://tenor.com/view/${id}`,
    id,
    variant: 'iframe',
  };
}

function idOf(url: ParsedUrl | null): string | undefined {
  return url && HOSTS.has(url.host) ? PAGE_PATH.exec(url.path)?.[1] : undefined;
}

/** To four decimals, from 1:100 to 100:1. */
function ratioSize(ratio: number): ParsedEmbed['size'] {
  const width = Math.round(ratio * 10_000);
  if (!(width >= 100 && width <= 1_000_000)) return undefined;
  const divisor = gcd(width, 10_000);
  return { width: width / divisor, height: 10_000 / divisor };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function fromDiv(root: HtmlElement): ParsedEmbed | null {
  if (!hasClass(root, 'tenor-gif-embed')) return null;
  const id = root.attrs.get('data-postid') ?? '';
  if (!new RegExp(`^${ID}$`).test(id)) return null;
  const given = root.attrs.get('data-aspect-ratio');
  if (given !== undefined && !RATIO.test(given)) return null;
  const size = ratioSize(given === undefined ? DEFAULT_RATIO : Number(given));
  if (!size) return null;
  return withSize(
    {
      ...gif(id),
      options: {},
      fallbackHtml: rebuild(root.children, FALLBACK),
    },
    size,
  );
}

function fromIframe(root: HtmlElement): ParsedEmbed | null {
  const src = parseUrl(root.attrs.get('src') ?? '');
  if (!src || src.host !== 'tenor.com') return null;
  const [, id] = FRAME_PATH.exec(src.path) ?? [];
  return id === undefined
    ? null
    : withSize({ ...gif(id), options: {} }, sizeOf(root));
}

export const tenor: PlatformParser = {
  platform: 'tenor',
  name: 'Tenor',
  shapes: ['video iframe'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  parse(root) {
    if (root.tag === 'div') return fromDiv(root);
    return root.tag === 'iframe' ? fromIframe(root) : null;
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const id = idOf(url);
    return id === undefined ? null : { ...gif(id), options: {} };
  },
  ownsFrame: tenorFrame,
};
