import { hasClass, rebuild, type Whitelist } from '../html';
import { attributeOptions, type PlatformParser } from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';

const HOSTS = new Set([
  'threads.com',
  'www.threads.com',
  'threads.net',
  'www.threads.net',
]);
const POST_PATH =
  /^\/(?:@[A-Za-z0-9._]{1,30}\/post|t)\/([A-Za-z0-9_-]{1,64})\/?$/;
const SCRIPT = /^(?:https?:)?\/\/www\.threads\.(?:com|net)\/embed\.js$/;

const OPTION_ATTRIBUTES = [
  ['data-theme', 'theme'],
  ['data-text-post-version', 'version'],
] as const;

const FALLBACK: Whitelist = new Map([
  ['a', ['href']],
  ['div', []],
]);

// Threads' own embed code links every post as /t/{code}, whatever URL it was given.
function post(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, code] = POST_PATH.exec(url.path) ?? [];
  if (code === undefined) return null;
  return {
    platform: 'threads',
    kind: 'post',
    url: `https://www.threads.com/t/${code}`,
    id: code,
    variant: 'sdk',
  };
}

export const threads: PlatformParser = {
  parse(root) {
    if (root.tag !== 'blockquote' || !hasClass(root, 'text-post-media'))
      return null;
    const found = post(
      parseUrl(root.attrs.get('data-text-post-permalink') ?? ''),
    );
    if (!found) return null;
    const elementId = root.attrs.get('id');
    if (elementId !== undefined && elementId !== `ig-tp-${found.id}`)
      return null;
    return {
      ...found,
      options: attributeOptions(root, OPTION_ATTRIBUTES, coerce),
      fallbackHtml: rebuild(root.children, FALLBACK),
    };
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const found = post(url);
    return found && { ...found, options: {} };
  },
};
