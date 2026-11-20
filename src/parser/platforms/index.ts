import type { PlatformParser } from '../platform';
import { applemusic } from './applemusic';
import { applepodcasts } from './applepodcasts';
import { dailymotion } from './dailymotion';
import { facebook } from './facebook';
import { instagram } from './instagram';
import { linkedin } from './linkedin';
import { pinterest } from './pinterest';
import { reddit } from './reddit';
import { snapchat } from './snapchat';
import { soundcloud } from './soundcloud';
import { spotify } from './spotify';
import { telegram } from './telegram';
import { threads } from './threads';
import { tiktok } from './tiktok';
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
];
