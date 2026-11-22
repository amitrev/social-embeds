import type { PlatformParser } from '../platform';
import type { Platform } from '../types';
import { applemusic } from './applemusic';
import { applepodcasts } from './applepodcasts';
import { bluesky } from './bluesky';
import { dailymotion } from './dailymotion';
import { facebook } from './facebook';
import { flickr } from './flickr';
import { giphy } from './giphy';
import { imgur } from './imgur';
import { instagram } from './instagram';
import { kick } from './kick';
import { linkedin } from './linkedin';
import { pinterest } from './pinterest';
import { reddit } from './reddit';
import { snapchat } from './snapchat';
import { soundcloud } from './soundcloud';
import { rumble } from './rumble';
import { spotify } from './spotify';
import { strava } from './strava';
import { streamable } from './streamable';
import { telegram } from './telegram';
import { tenor } from './tenor';
import { threads } from './threads';
import { tiktok } from './tiktok';
import { truthsocial } from './truthsocial';
import { tumblr } from './tumblr';
import { twitch } from './twitch';
import { vimeo } from './vimeo';
import { x } from './x';
import { youtube } from './youtube';

export const platforms: readonly PlatformParser[] = [
  x,
  instagram,
  facebook,
  threads,
  tiktok,
  youtube,
  telegram,
  snapchat,
  linkedin,
  reddit,
  pinterest,
  spotify,
  vimeo,
  twitch,
  dailymotion,
  soundcloud,
  applemusic,
  applepodcasts,
  kick,
  giphy,
  tenor,
  streamable,
  rumble,
  truthsocial,
  imgur,
  strava,
  flickr,
  bluesky,
  tumblr,
];

export function parserFor(platform: Platform): PlatformParser | undefined {
  return platforms.find((parser) => parser.platform === platform);
}
