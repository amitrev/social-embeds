import type { ParsedEmbed } from '../../parser';
import type { Plan, PlanError } from '../plan';

// The values in Apple's own embed code (docs/decisions.md D72, D73).
const ALLOW = 'autoplay *; encrypted-media *; fullscreen *; clipboard-write';
const SANDBOX =
  'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation';
const SINGLE_HEIGHT = 175; // a song
const EPISODE_HEIGHT = 160;
const FULL_HEIGHT = 450; // an album, playlist or show

/** A fixed height: the embed code's, else 175px for a song and 450px for the rest. */
export function appleMusicPlan(embed: ParsedEmbed): Plan | PlanError {
  const path = embed.url.slice('https://music.apple.com'.length);
  const single = path.includes('/song/') || path.includes('?i=');
  return {
    kind: 'iframe',
    src: `https://embed.music.apple.com${path}`,
    title: 'Apple Music player',
    allow: ALLOW,
    sandbox: SANDBOX,
    ratio: { width: 16, height: 9 },
    height: embed.size?.height ?? (single ? SINGLE_HEIGHT : FULL_HEIGHT),
    maxWidth: 660,
  };
}

/** A fixed height: the embed code's, else 160px for an episode and 450px for a show. */
export function applePodcastsPlan(embed: ParsedEmbed): Plan | PlanError {
  const path = embed.url.slice('https://podcasts.apple.com'.length);
  return {
    kind: 'iframe',
    src: `https://embed.podcasts.apple.com${path}`,
    title: 'Apple Podcasts player',
    allow: ALLOW,
    sandbox: SANDBOX,
    ratio: { width: 16, height: 9 },
    height:
      embed.size?.height ??
      (path.includes('?i=') ? EPISODE_HEIGHT : FULL_HEIGHT),
    maxWidth: 640,
  };
}
