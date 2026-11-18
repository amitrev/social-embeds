import { descendants, hasClass } from '../html';
import { type PlatformParser, withSize } from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, pixels, type ParsedUrl } from '../url';

// Every type renders as the iframe at `{url}/embed` (docs/decisions.md D50).

const HOSTS = new Set(['snapchat.com', 'www.snapchat.com']);
const USER = '([A-Za-z][A-Za-z0-9._-]{1,29})';
const SPOTLIGHT = new RegExp(
  `^(?:/@${USER})?/spotlight/([A-Za-z0-9_-]{20,120})$`,
);
const PROFILE = new RegExp(`^/(?:@|add/)${USER}$`);
const LENS = /^\/lens\/([0-9a-f]{32}|\d{1,20})$/;
const HIGHLIGHT = new RegExp(
  `^/@${USER}/highlight/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$`,
);
const SCRIPT = /^(?:https?:)?\/\/www\.snapchat\.com\/embed\.js$/;

type Content = Omit<ParsedEmbed, 'options'>;

function content(url: ParsedUrl | null): Content | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const path = url.path.replace(/\/$/, '');
  const base = { platform: 'snapchat', variant: 'iframe' } as const;

  const [, spotlightUser, spotlightId] = SPOTLIGHT.exec(path) ?? [];
  if (spotlightId !== undefined) {
    const prefix = spotlightUser === undefined ? '' : `/@${spotlightUser}`;
    return {
      ...base,
      kind: 'video',
      url: `https://www.snapchat.com${prefix}/spotlight/${spotlightId}`,
      id: spotlightId,
    };
  }
  const [, user] = PROFILE.exec(path) ?? [];
  if (user !== undefined) {
    return {
      ...base,
      kind: 'post',
      url: `https://www.snapchat.com/@${user}`,
      id: user,
    };
  }
  const [, lens] = LENS.exec(path) ?? [];
  if (lens !== undefined) {
    return {
      ...base,
      kind: 'post',
      url: `https://www.snapchat.com/lens/${lens}`,
      id: lens,
    };
  }
  const [, owner, highlight] = HIGHLIGHT.exec(path) ?? [];
  if (owner !== undefined && highlight !== undefined) {
    return {
      ...base,
      kind: 'post',
      url: `https://www.snapchat.com/@${owner}/highlight/${highlight}`,
      id: highlight,
    };
  }
  return null;
}

export const snapchat: PlatformParser = {
  platform: 'snapchat',
  parse(root) {
    if (root.tag !== 'blockquote' || !hasClass(root, 'snapchat-embed'))
      return null;
    const embedUrl = parseUrl(root.attrs.get('data-snapchat-embed-url') ?? '');
    if (!embedUrl?.path.endsWith('/embed')) return null;
    const found = content({ ...embedUrl, path: embedUrl.path.slice(0, -6) });
    if (!found) return null;
    // The links name the same content as the iframe.
    const links = descendants(root.children).filter((el) => el.tag === 'a');
    const sameContent = links.every((link) => {
      const linked = content(parseUrl(link.attrs.get('href') ?? ''));
      return linked?.kind === found.kind && linked.id === found.id;
    });
    if (!sameContent) return null;

    const title = root.attrs.get('data-snapchat-embed-title');
    const width = pixels(root.attrs.get('data-snapchat-embed-width'));
    const height = pixels(root.attrs.get('data-snapchat-embed-height'));
    return withSize(
      { ...found, options: title === undefined ? {} : { title } },
      width === undefined || height === undefined
        ? undefined
        : { width, height },
    );
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const found = content(url);
    return found && { ...found, options: {} };
  },
};
