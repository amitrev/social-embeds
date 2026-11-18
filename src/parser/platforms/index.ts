import type { PlatformParser } from '../platform';
import { facebook } from './facebook';
import { instagram } from './instagram';
import { linkedin } from './linkedin';
import { pinterest } from './pinterest';
import { reddit } from './reddit';
import { snapchat } from './snapchat';
import { telegram } from './telegram';
import { threads } from './threads';
import { tiktok } from './tiktok';
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
];
