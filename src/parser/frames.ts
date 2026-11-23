import { underPath } from './platform';
import type { ParsedUrl } from './url';

// Apart from the parsers, so the generic iframe check bundles none of them (docs/decisions.md D110).

export const YOUTUBE_HOSTS = /* @__PURE__ */ new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
]);
export const YOUTUBE_NOCOOKIE_HOSTS = /* @__PURE__ */ new Set([
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
export const DAILYMOTION_HOSTS = /* @__PURE__ */ new Set([
  'dailymotion.com',
  'www.dailymotion.com',
]);
export const DAILYMOTION_PLAYER_HOST = 'geo.dailymotion.com';
export const DAILYMOTION_SHORT_HOST = 'dai.ly';
export const TIKTOK_HOSTS = /* @__PURE__ */ new Set([
  'tiktok.com',
  'www.tiktok.com',
]);
export const TWITCH_PLAYER_HOST = 'player.twitch.tv';
export const TWITCH_CLIPS_HOST = 'clips.twitch.tv';
export const VIMEO_PLAYER_HOST = 'player.vimeo.com';
export const FACEBOOK_PLUGIN_HOSTS = /* @__PURE__ */ new Set([
  'facebook.com',
  'www.facebook.com',
  'web.facebook.com',
]);
export const GIPHY_PAGE_HOSTS = /* @__PURE__ */ new Set([
  'giphy.com',
  'www.giphy.com',
]);
export const KICK_PLAYER_HOSTS = /* @__PURE__ */ new Set(['player.kick.com']);
export const LINKEDIN_FRAME_HOST = 'www.linkedin.com';
export const PINTEREST_FRAME_HOST = 'assets.pinterest.com';
export const APPLE_MUSIC_FRAME_HOST = 'embed.music.apple.com';
export const APPLE_PODCASTS_FRAME_HOST = 'embed.podcasts.apple.com';
export const SOUNDCLOUD_WIDGET_HOST = 'w.soundcloud.com';
export const SPOTIFY_HOST = 'open.spotify.com';

type Owner = (src: ParsedUrl) => boolean;

export const youtubeFrame: Owner = (src) =>
  YOUTUBE_NOCOOKIE_HOSTS.has(src.host) ||
  (YOUTUBE_HOSTS.has(src.host) && underPath(src.path, '/embed'));
export const dailymotionFrame: Owner = (src) =>
  src.host === DAILYMOTION_PLAYER_HOST ||
  src.host === DAILYMOTION_SHORT_HOST ||
  (DAILYMOTION_HOSTS.has(src.host) &&
    (underPath(src.path, '/embed') || underPath(src.path, '/video')));
export const tiktokFrame: Owner = (src) =>
  TIKTOK_HOSTS.has(src.host) && underPath(src.path, '/player');
export const twitchFrame: Owner = (src) =>
  src.host === TWITCH_PLAYER_HOST ||
  (src.host === TWITCH_CLIPS_HOST && underPath(src.path, '/embed'));
export const vimeoFrame: Owner = (src) => src.host === VIMEO_PLAYER_HOST;
export const facebookFrame: Owner = (src) =>
  FACEBOOK_PLUGIN_HOSTS.has(src.host) && underPath(src.path, '/plugins');
export const giphyFrame: Owner = (src) =>
  GIPHY_PAGE_HOSTS.has(src.host) && underPath(src.path, '/embed');
export const kickFrame: Owner = (src) => KICK_PLAYER_HOSTS.has(src.host);
export const linkedinFrame: Owner = (src) =>
  src.host === LINKEDIN_FRAME_HOST && underPath(src.path, '/embed');
export const pinterestFrame: Owner = (src) => src.host === PINTEREST_FRAME_HOST;
export const appleMusicFrame: Owner = (src) =>
  src.host === APPLE_MUSIC_FRAME_HOST;
export const applePodcastsFrame: Owner = (src) =>
  src.host === APPLE_PODCASTS_FRAME_HOST;
export const soundcloudFrame: Owner = (src) =>
  src.host === SOUNDCLOUD_WIDGET_HOST;
export const spotifyFrame: Owner = (src) =>
  src.host === SPOTIFY_HOST && underPath(src.path, '/embed');
export const rumbleFrame: Owner = (src) =>
  src.host === 'rumble.com' && underPath(src.path, '/embed');
export const streamableFrame: Owner = (src) =>
  src.host === 'streamable.com' &&
  (underPath(src.path, '/e') || underPath(src.path, '/o'));
export const tenorFrame: Owner = (src) =>
  src.host === 'tenor.com' && underPath(src.path, '/embed');
export const truthsocialFrame: Owner = (src) =>
  src.host === 'truthsocial.com' && src.path.startsWith('/@');

/** True for a frame a named platform serves, which the generic iframe path must refuse. */
export function ownedFrame(src: ParsedUrl): boolean {
  return [
    youtubeFrame,
    dailymotionFrame,
    tiktokFrame,
    twitchFrame,
    vimeoFrame,
    facebookFrame,
    giphyFrame,
    kickFrame,
    linkedinFrame,
    pinterestFrame,
    appleMusicFrame,
    applePodcastsFrame,
    soundcloudFrame,
    spotifyFrame,
    rumbleFrame,
    streamableFrame,
    tenorFrame,
    truthsocialFrame,
  ].some((owns) => owns(src));
}
