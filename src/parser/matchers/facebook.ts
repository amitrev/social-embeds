import { type Whitelist, rebuildsAs } from '../html';
import type { Options, PlatformMatcher } from '../platform';
import type { ParsedEmbed } from '../types';
import type { ParsedUrl } from '../url';
import { facebookFrame } from '../frames';

// Which input renders through the SDK and which as an iframe: docs/decisions.md D10, D22, D44.

const HOSTS = /* @__PURE__ */ new Set([
  'facebook.com',
  'www.facebook.com',
  'web.facebook.com',
  'm.facebook.com',
]);
const BASE = 'https://www.facebook.com';

// URL shapes: docs/decisions.md D21.
const NAME = '[A-Za-z0-9.\\-]{1,80}';
const POST_ID = '(?:\\d{1,25}|pfbid[A-Za-z0-9]{10,120})';
const POSTS_PATH = /* @__PURE__ */ new RegExp(
  `^/(${NAME})/posts/(${POST_ID})/?$`,
);
const PHOTOS_PATH = /* @__PURE__ */ new RegExp(
  `^/(${NAME})/photos/([A-Za-z0-9.\\-]{1,80})/(\\d{1,25})/?$`,
);
const VIDEOS_PATH = /* @__PURE__ */ new RegExp(
  `^/(${NAME})/videos/(?:[^/]{1,200}/)?(\\d{1,25})/?$`,
);
const REEL_PATH = /^\/reel\/(\d{1,25})\/?$/;
const STORY_PATHS = /* @__PURE__ */ new Set(['/permalink.php', '/story.php']);
const PHOTO_PATHS = /* @__PURE__ */ new Set([
  '/photo.php',
  '/photo/',
  '/photo',
]);
const STORY_ID = /* @__PURE__ */ new RegExp(`^${POST_ID}$`);
const NUMERIC_ID = /^\d{1,25}$/;

const PARSE_IGNORE = { name: 'class', value: /^fb-xfbml-parse-ignore$/ };
export const FALLBACK: Whitelist = /* @__PURE__ */ new Map([
  ['div', [PARSE_IGNORE]],
  ['blockquote', ['cite', PARSE_IGNORE]],
  ['a', ['href']],
  ['p', []],
]);

type Target = { kind: ParsedEmbed['kind']; id: string; url: string };

export function target(url: ParsedUrl | null): Target | null {
  if (!url || !HOSTS.has(url.host)) return null;
  const { path, query } = url;

  const [, name, postId] = POSTS_PATH.exec(path) ?? [];
  if (name !== undefined && postId !== undefined) {
    return { kind: 'post', id: postId, url: `${BASE}/${name}/posts/${postId}` };
  }
  if (STORY_PATHS.has(path)) {
    const storyId = query.get('story_fbid');
    if (storyId === undefined || !STORY_ID.test(storyId)) return null;
    const owner = query.get('id');
    const ownerQuery =
      owner !== undefined && NUMERIC_ID.test(owner) ? `&id=${owner}` : '';
    return {
      kind: 'post',
      id: storyId,
      url: `${BASE}${path}?story_fbid=${storyId}${ownerQuery}`,
    };
  }
  if (PHOTO_PATHS.has(path)) {
    const fbid = query.get('fbid');
    if (fbid === undefined || !NUMERIC_ID.test(fbid)) return null;
    return { kind: 'post', id: fbid, url: `${BASE}${path}?fbid=${fbid}` };
  }
  const [, owner, album, photoId] = PHOTOS_PATH.exec(path) ?? [];
  if (owner !== undefined && album !== undefined && photoId !== undefined) {
    return {
      kind: 'post',
      id: photoId,
      url: `${BASE}/${owner}/photos/${album}/${photoId}/`,
    };
  }

  const [, page, videoId] = VIDEOS_PATH.exec(path) ?? [];
  if (page !== undefined && videoId !== undefined) {
    return {
      kind: 'video',
      id: videoId,
      url: `${BASE}/${page}/videos/${videoId}/`,
    };
  }
  if (path === '/watch' || path === '/watch/' || path === '/video.php') {
    const v = query.get('v');
    if (v === undefined || !NUMERIC_ID.test(v)) return null;
    const canonicalPath = path === '/video.php' ? path : '/watch/';
    return { kind: 'video', id: v, url: `${BASE}${canonicalPath}?v=${v}` };
  }
  const [, reelId] = REEL_PATH.exec(path) ?? [];
  if (reelId !== undefined) {
    return { kind: 'video', id: reelId, url: `${BASE}/reel/${reelId}` };
  }
  return null;
}

export function embed(
  found: Target,
  kind: ParsedEmbed['kind'],
  variant: ParsedEmbed['variant'],
  options: Options,
): ParsedEmbed {
  return {
    platform: 'facebook',
    kind,
    url: found.url,
    id: found.id,
    variant,
    options,
  };
}

export const facebookMatcher: PlatformMatcher = {
  platform: 'facebook',
  name: 'Facebook',
  shapes: ['post sdk', 'video sdk', 'video iframe'],
  trustsFallback: (html) => rebuildsAs(html, FALLBACK),
  match(url) {
    const found = target(url);
    return found && embed(found, found.kind, 'sdk', {});
  },
  ownsFrame: facebookFrame,
};
