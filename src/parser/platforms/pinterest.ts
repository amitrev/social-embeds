import { attributeOptions, type PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';

// Widget code and oEmbed iframe code both render through the widget
// (docs/decisions.md D51).

const HOST =
  /^(?:(?:www|[a-z]{2})\.)?pinterest\.(?:[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/;
const PIN_PATH = /^\/pin\/(?:[A-Za-z0-9-]{0,200}--)?(\d{1,25})\/?$/;
const PIN_ID = /^\d{1,25}$/;
const SCRIPT =
  /^(?:https?:)?\/\/assets\.pinterest\.com\/js\/pinit(?:_main)?\.js$/;

const OPTION_ATTRIBUTES = [
  ['data-pin-width', 'width'],
  ['data-pin-lang', 'lang'],
  ['data-pin-terse', 'terse'],
] as const;

function pin(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'pinterest',
    kind: 'post',
    url: `https://www.pinterest.com/pin/${id}/`,
    id,
    variant: 'sdk',
  };
}

function pinOf(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOST.test(url.host)) return null;
  const [, id] = PIN_PATH.exec(url.path) ?? [];
  return id === undefined ? null : pin(id);
}

export const pinterest: PlatformParser = {
  platform: 'pinterest',
  parse(root) {
    if (root.tag === 'a') {
      if (root.attrs.get('data-pin-do') !== 'embedPin') return null;
      if (root.children.some((child) => child.type === 'element')) return null;
      const found = pinOf(parseUrl(root.attrs.get('href') ?? ''));
      return (
        found && {
          ...found,
          options: attributeOptions(root, OPTION_ATTRIBUTES, coerce),
        }
      );
    }

    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (src?.host !== 'assets.pinterest.com' || src.path !== '/ext/embed.html')
      return null;
    const id = src.query.get('id');
    return id !== undefined && PIN_ID.test(id)
      ? { ...pin(id), options: {} }
      : null;
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const found = pinOf(url);
    return found && { ...found, options: {} };
  },
};
