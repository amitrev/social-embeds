import type { PlatformParser } from '../platform';
import { facebook } from './facebook';
import { instagram } from './instagram';
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
];
