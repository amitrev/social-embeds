import { hasClass } from '../html';
import {
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { parseUrl, type ParsedUrl } from '../url';
import { truthsocialFrame } from '../frames';

// Video code (`truthsocial-video` class) is recorded as the option `video: true`, which only sets the height rule (docs/decisions.md D93).

const HOSTS = new Set(['truthsocial.com', 'www.truthsocial.com']);
const USER = '(@[A-Za-z0-9_.-]{1,64})';
const ID = '(\\d{1,25})';
const POST_PATH = new RegExp(`^/${USER}/(?:posts/)?${ID}/?$`);
const FRAME_PATH = new RegExp(`^/${USER}/${ID}/embed$`);
const SCRIPT = /^(?:https?:)?\/\/truthsocial\.com\/embed\.js$/;

function post(user: string, id: string): Omit<ParsedEmbed, 'options'> {
  return {
    platform: 'truthsocial',
    kind: 'post',
    url: `https://truthsocial.com/${user}/posts/${id}`,
    id,
    variant: 'iframe',
  };
}

function fromUrl(url: ParsedUrl | null): Omit<ParsedEmbed, 'options'> | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const [, user, id] = POST_PATH.exec(url.path) ?? [];
  return user === undefined || id === undefined ? null : post(user, id);
}

export const truthsocial: PlatformParser = {
  platform: 'truthsocial',
  parse(root) {
    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (!src || src.host !== 'truthsocial.com') return null;
    const [, user, id] = FRAME_PATH.exec(src.path) ?? [];
    if (user === undefined || id === undefined) return null;
    const options: Options = hasClass(root, 'truthsocial-video')
      ? { video: true }
      : {};
    return withSize({ ...post(user, id), options }, sizeOf(root));
  },
  isOwnScript: (src) => SCRIPT.test(src),
  match(url) {
    const found = fromUrl(url);
    return found && { ...found, options: {} };
  },
  ownsFrame: truthsocialFrame,
};
