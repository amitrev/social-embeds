import { hasClass, rebuild, type Whitelist } from '../html';
import {
  attributeOptions,
  type Options,
  type PlatformParser,
  sizeOf,
  withSize,
} from '../platform';
import type { ParsedEmbed } from '../types';
import { coerce, parseUrl, type ParsedUrl } from '../url';

// Rendering rules (brief §5.4, docs/decisions.md D10): posts always use the SDK, video
// embed code keeps its iframe, video URLs use the SDK.

const HOSTS = new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com']);
const PLUGIN_HOSTS = new Set(['facebook.com', 'www.facebook.com']);
const BASE = 'https://www.facebook.com';

// URL shapes verified against plugins/post.php and plugins/video.php (decisions.md D21).
const NAME = '[A-Za-z0-9.\\-]{1,80}';
const POST_ID = '(?:\\d{1,25}|pfbid[A-Za-z0-9]{10,120})';
const POSTS_PATH = new RegExp(`^/(${NAME})/posts/(${POST_ID})/?$`);
const PHOTOS_PATH = new RegExp(
  `^/(${NAME})/photos/([A-Za-z0-9.]{1,40})/(\\d{1,25})/?$`,
);
const VIDEOS_PATH = new RegExp(
  `^/(${NAME})/videos/(?:[^/]{1,200}/)?(\\d{1,25})/?$`,
);
const REEL_PATH = /^\/reel\/(\d{1,25})\/?$/;
const STORY_PATHS = new Set(['/permalink.php', '/story.php']);
const PHOTO_PATHS = new Set(['/photo.php', '/photo/', '/photo']);
const STORY_ID = new RegExp(`^${POST_ID}$`);
const NUMERIC_ID = /^\d{1,25}$/;
const SCRIPT =
  /^(?:https?:)?\/\/connect\.facebook\.net\/([a-z]{2,3}_[A-Z]{2})\/sdk\.js(?:[?#].*)?$/;

const OPTION_ATTRIBUTES = [
  ['data-width', 'width'],
  ['data-show-text', 'showText'],
  ['data-lazy', 'lazy'],
  ['data-allowfullscreen', 'allowfullscreen'],
  ['data-autoplay', 'autoplay'],
  ['data-show-captions', 'showCaptions'],
] as const;

const PARSE_IGNORE = { name: 'class', value: /^fb-xfbml-parse-ignore$/ };
const FALLBACK: Whitelist = new Map([
  ['div', [PARSE_IGNORE]],
  ['blockquote', ['cite', PARSE_IGNORE]],
  ['a', ['href']],
  ['p', []],
]);

type Target = { kind: ParsedEmbed['kind']; id: string; url: string };

function target(url: ParsedUrl | null): Target | null {
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

function embed(
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

export const facebook: PlatformParser = {
  platform: 'facebook',
  fallback: FALLBACK,
  parse(root) {
    if (root.tag === 'div') {
      const kind = hasClass(root, 'fb-post')
        ? 'post'
        : hasClass(root, 'fb-video')
          ? 'video'
          : null;
      const found = target(parseUrl(root.attrs.get('data-href') ?? ''));
      if (!kind || !found) return null;
      return {
        ...embed(
          found,
          kind,
          'sdk',
          attributeOptions(root, OPTION_ATTRIBUTES, coerce),
        ),
        fallbackHtml: rebuild(root.children, FALLBACK),
      };
    }

    if (root.tag !== 'iframe') return null;
    const src = parseUrl(root.attrs.get('src') ?? '');
    if (!src || !PLUGIN_HOSTS.has(src.host)) return null;
    const found = target(parseUrl(src.query.get('href') ?? ''));
    if (!found) return null;

    if (src.path === '/plugins/post.php') {
      // The post iframe's height only fits its width, so posts render through the SDK;
      // the iframe parameters that the SDK also understands carry over.
      const options: Options = {};
      const showText = src.query.get('show_text');
      const width = src.query.get('width');
      if (showText !== undefined) options.showText = coerce(showText);
      if (width !== undefined) options.width = coerce(width);
      return embed(found, 'post', 'sdk', options);
    }
    if (src.path === '/plugins/video.php') {
      // Kept as the iframe that came in: every parameter except href, as given.
      const options: Options = Object.fromEntries(
        [...src.query]
          .filter(([key]) => key !== 'href')
          .map(([key, value]) => [key, coerce(value)]),
      );
      return withSize(embed(found, 'video', 'iframe', options), sizeOf(root));
    }
    return null;
  },
  isOwnScript: (src) => SCRIPT.test(src),
  scriptOptions(src): Options {
    const [, locale] = SCRIPT.exec(src) ?? [];
    return locale === undefined ? {} : { locale };
  },
  allowsFbRoot: true,
  match(url) {
    const found = target(url);
    return found && embed(found, found.kind, 'sdk', {});
  },
};
