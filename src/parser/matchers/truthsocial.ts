import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { truthsocialFrame } from '../frames';
import type { PlatformMatcher } from '../platform';

// Video code (`truthsocial-video` class) is recorded as the option `video: true`, which only sets the height rule (docs/decisions.md D93).

const HOSTS = /* @__PURE__ */ new Set([
  'truthsocial.com',
  'www.truthsocial.com',
]);
export const USER = '(@[A-Za-z0-9_.-]{1,64})';
export const ID = '(\\d{1,25})';
const POST_PATH = /* @__PURE__ */ new RegExp(`^/${USER}/(?:posts/)?${ID}/?$`);

export function post(user: string, id: string): Omit<ParsedEmbed, 'options'> {
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

export const truthsocialMatcher: PlatformMatcher = {
  platform: 'truthsocial',
  name: 'Truth Social',
  shapes: ['post iframe'],
  match(url) {
    const found = fromUrl(url);
    return found && { ...found, options: {} };
  },
  ownsFrame: truthsocialFrame,
};
