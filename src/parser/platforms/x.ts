import { descendants, hasClass, rebuild, type Whitelist } from '../html';
import { attributeOptions, type PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';

const HOSTS = new Set([
  'x.com',
  'www.x.com',
  'mobile.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
]);
const STATUS_PATH = /^\/([A-Za-z0-9_]{1,15})\/status\/(\d{1,20})\/?$/;
const SCRIPT = /^(?:https?:)?\/\/platform\.(?:x|twitter)\.com\/widgets\.js$/;

// publish.x.com emits a plain `align` attribute; `data-align` is the documented spelling.
const OPTION_ATTRIBUTES = [
  ['data-theme', 'theme'],
  ['data-conversation', 'conversation'],
  ['data-cards', 'cards'],
  ['data-align', 'align'],
  ['align', 'align'],
  ['data-lang', 'lang'],
  ['data-dnt', 'dnt'],
  ['data-width', 'width'],
] as const;

const FALLBACK: Whitelist = new Map([
  ['p', ['lang', 'dir']],
  ['a', ['href']],
  ['br', []],
]);

function post(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, user, id] = STATUS_PATH.exec(url.path) ?? [];
  if (user === undefined || id === undefined) return null;
  return {
    platform: 'x',
    kind: 'post',
    url: `https://x.com/${user}/status/${id}`,
    id,
    variant: 'sdk',
  };
}

export const x: PlatformParser = {
  platform: 'x',
  fallback: FALLBACK,
  parse(root) {
    if (root.tag !== 'blockquote' || !hasClass(root, 'twitter-tweet'))
      return null;
    // The status link is the last link in the blockquote; earlier ones belong to the text.
    const status = descendants(root.children)
      .reverse()
      .map((element) =>
        element.tag === 'a'
          ? post(parseUrl(element.attrs.get('href') ?? ''))
          : null,
      )
      .find((found) => found !== null);
    if (!status) return null;
    return {
      ...status,
      options: attributeOptions(root, OPTION_ATTRIBUTES, coerce),
      fallbackHtml: rebuild(root.children, FALLBACK),
    };
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const status = post(url);
    return status && { ...status, options: {} };
  },
};
