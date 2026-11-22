import {
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';
import { rumbleFrame } from '../frames';

// Iframe code only: the embedJS player has no iframe, and a page URL holds another id (docs/decisions.md D99).

const PATH = /^\/embed\/(v[a-z0-9]{1,12})\/?$/;
const HOSTS = new Set(['rumble.com', 'www.rumble.com']);

function video(id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'rumble',
    kind: 'video',
    url: `https://rumble.com/embed/${id}/`,
    id,
    variant: 'iframe',
  };
}

function idOf(url: ParsedUrl | null, hosts: ReadonlySet<string>) {
  return url && hosts.has(url.host) ? PATH.exec(url.path)?.[1] : undefined;
}

export const rumble: PlatformParser = {
  platform: 'rumble',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    const id = idOf(src, new Set(['rumble.com']));
    if (id === undefined || !src) return null;
    const options: Options = {};
    const pub = src.query.get('pub');
    if (pub) options.pub = coerce(pub);
    return withSize({ ...video(id), options }, sizeOf(root));
  },
  isOwnScript: () => false,
  match(url) {
    const id = idOf(url, HOSTS);
    return id === undefined ? null : { ...video(id), options: {} };
  },
  ownsFrame: rumbleFrame,
};
