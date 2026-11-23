import {
  descendants,
  type HtmlNode,
  parseHtml,
  rebuildsAs,
  type Whitelist,
} from '../html';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';
import type { PlatformMatcher } from '../platform';

const HOSTS = /* @__PURE__ */ new Set([
  'x.com',
  'www.x.com',
  'mobile.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
]);
const STATUS_PATH = /^\/([A-Za-z0-9_]{1,15})\/status\/(\d{1,20})\/?$/;
// URL input only: the media viewer's `/photo/{n}` and `/video/{n}`, and `/i/web/`, which names no author.
const LINK_PATH =
  /^\/(?:([A-Za-z0-9_]{1,15})|i\/web)\/status\/(\d{1,20})(?:\/(?:photo|video)\/[1-4])?\/?$/;

export const FALLBACK: Whitelist = /* @__PURE__ */ new Map([
  ['p', ['lang', 'dir']],
  ['a', ['href']],
  ['br', []],
]);

function post(
  url: ParsedUrl | null,
  path = STATUS_PATH,
): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  // `/i/status/{id}` is X's own URL for a post without its author.
  const [, user = 'i', id] = path.exec(url.path) ?? [];
  if (id === undefined) return null;
  return {
    platform: 'x',
    kind: 'post',
    url: `https://x.com/${user}/status/${id}`,
    id,
    variant: 'sdk',
  };
}

// widgets.js renders the post that the blockquote's last status link names; earlier links belong to the text.
export function lastStatus(
  nodes: readonly HtmlNode[],
): Omit<ParsedEmbed, 'options'> | null {
  return (
    descendants(nodes)
      .reverse()
      .map((element) =>
        element.tag === 'a'
          ? post(parseUrl(element.attrs.get('href') ?? ''))
          : null,
      )
      .find((found) => found !== null) ?? null
  );
}

function fallbackNamesPost(html: string, id: string): boolean {
  return lastStatus(parseHtml(html) ?? [])?.id === id;
}

export const xMatcher: PlatformMatcher = {
  platform: 'x',
  name: 'X',
  shapes: ['post sdk'],
  trustsFallback: (html, embed) =>
    rebuildsAs(html, FALLBACK) && fallbackNamesPost(html, embed.id),
  match(url) {
    const status = post(url, LINK_PATH);
    return status && { ...status, options: {} };
  },
};
