import {
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl } from '../url';

// Activity URNs embed the same post as share URNs (docs/decisions.md D53).

const HOST = /^(?:www\.|[a-z]{2}\.)?linkedin\.com$/;
const URN = '(activity|share|ugcPost):(\\d{19})';
const UPDATE_PATH = new RegExp(`^(?:/embed)?/feed/update/urn:li:${URN}/?$`);
const POSTS_PATH = new RegExp(
  `^/posts/[^/]{1,300}-(activity|share|ugcPost)-(\\d{19})-[A-Za-z0-9_-]{1,8}/?$`,
);
const EMBED_PATH = new RegExp(`^/embed/feed/update/urn:li:${URN}$`);

function post(type: string, id: string, options: Options = {}): ParsedEmbed {
  const urn = `urn:li:${type}:${id}`;
  return {
    platform: 'linkedin',
    kind: 'post',
    url: `https://www.linkedin.com/feed/update/${urn}/`,
    id: urn,
    variant: 'iframe',
    options,
  };
}

const decodeColons = (path: string) => path.replace(/%3A/gi, ':');

export const linkedin: PlatformParser = {
  platform: 'linkedin',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (src?.host !== 'www.linkedin.com') return null;
    const [, type, id] = EMBED_PATH.exec(src.path) ?? [];
    if (type === undefined || id === undefined) return null;
    const options: Options = Object.fromEntries(
      [...src.query].map(([key, value]) => [key, coerce(value)]),
    );
    return withSize(post(type, id, options), sizeOf(root));
  },
  isOwnScript: () => false,
  match(url) {
    if (!HOST.test(url.host)) return null;
    const path = decodeColons(url.path);
    const [, type, id] = UPDATE_PATH.exec(path) ?? POSTS_PATH.exec(path) ?? [];
    return type === undefined || id === undefined ? null : post(type, id);
  },
};
