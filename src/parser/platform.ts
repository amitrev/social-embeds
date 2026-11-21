import type { HtmlElement, Whitelist } from './html';
import type { ParsedEmbed, Platform } from './types';
import { pixels, type ParsedUrl } from './url';

export type Options = ParsedEmbed['options'];

export type PlatformParser = {
  platform: Platform;
  /** Elements and attributes allowed in `fallbackHtml`. */
  fallback?: Whitelist;
  /** The embed element (blockquote, div or iframe) of the platform's own embed code. */
  parse: (root: HtmlElement) => ParsedEmbed | null;
  /** Embed code that is a single `<script>` tag, as Telegram's is. */
  parseScript?: (script: HtmlElement) => ParsedEmbed | null;
  isOwnScript: (src: string) => boolean;
  scriptOptions?: (src: string) => Options;
  allowsFbRoot?: boolean;
  /** A sibling element after the embed that is the platform's own markup, such as a credit; it is dropped. */
  isOwnExtra?: (element: HtmlElement, embed: ParsedEmbed) => boolean;
  match: (url: ParsedUrl) => ParsedEmbed | null;
  /** True also for frames `parse` rejects, so generic iframe code never bypasses the platform's checks. */
  ownsFrame?: (src: ParsedUrl) => boolean;
};

/** `/embed` holds `/embed` and `/embed/…`, never `/embedded`. */
export function underPath(path: string, folder: string): boolean {
  return path === folder || path.startsWith(`${folder}/`);
}

/** The first attribute present for a key wins. */
export function attributeOptions(
  element: HtmlElement,
  mapping: readonly (readonly [attribute: string, key: string])[],
  coerceValue: (value: string) => string | number | boolean,
): Options {
  const options: Options = {};
  for (const [attribute, key] of mapping) {
    const value = element.attrs.get(attribute);
    if (value !== undefined && !(key in options))
      options[key] = coerceValue(value);
  }
  return options;
}

export function sizeOf(element: HtmlElement): ParsedEmbed['size'] {
  const width = pixels(element.attrs.get('width'));
  const height = pixels(element.attrs.get('height'));
  if (width === undefined && height === undefined) return undefined;
  return {
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
  };
}

/** Adds `size` only when known, so results stay free of `undefined` properties. */
export function withSize(
  embed: ParsedEmbed,
  size: ParsedEmbed['size'],
): ParsedEmbed {
  return size ? { ...embed, size } : embed;
}

/**
 * A platform's own responsive wrapper: a `div` whose only attribute is a `style` that `pattern`
 * matches, around one iframe. The padding percentage it captures is the video's ratio.
 */
export function unwrapRatio(
  root: HtmlElement,
  pattern: RegExp,
): { iframe: HtmlElement; size: { width: number; height: number } } | null {
  if (root.tag !== 'div' || root.attrs.size !== 1) return null;
  const [, percent] = pattern.exec(root.attrs.get('style') ?? '') ?? [];
  if (percent === undefined) return null;
  let iframe: HtmlElement | undefined;
  for (const child of root.children) {
    if (child.type === 'text' && /^\s*$/.test(child.raw)) continue;
    if (child.type !== 'element' || child.tag !== 'iframe' || iframe)
      return null;
    iframe = child;
  }
  const height = Math.round(Number(percent) * 100);
  if (!iframe || !(height > 0 && height <= 100_000)) return null;
  const divisor = gcd(10_000, height);
  return {
    iframe,
    size: { width: 10_000 / divisor, height: height / divisor },
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
