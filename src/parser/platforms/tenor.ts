import { rebuild, type HtmlElement, hasClass } from '../html';
import { sizeOf, withSize, type PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl } from '../url';
import { gif, ID, FALLBACK, tenorMatcher } from '../matchers/tenor';

const FRAME_PATH = new RegExp(`^/embed/${ID}$`);
const SCRIPT = /^(?:https?:)?\/\/tenor\.com\/embed\.js$/;
// Tenor writes some ratios unrounded: `2.3380281690140845`.
const RATIO = /^\d{1,3}(?:\.\d{1,20})?$/;
const DEFAULT_RATIO = 1.33;

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
  ...tenorMatcher,
  parse(root) {
    if (root.tag === 'div') return fromDiv(root);
    return root.tag === 'iframe' ? fromIframe(root) : null;
  },
  isOwnScript: (src) => SCRIPT.test(src),
};
