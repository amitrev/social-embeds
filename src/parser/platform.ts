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
  isOwnScript: (src: string) => boolean;
  scriptOptions?: (src: string) => Options;
  allowsFbRoot?: boolean;
  match: (url: ParsedUrl) => ParsedEmbed | null;
};

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
