import type { ParsedEmbed } from '../../parser';
import { optionsWithout, query } from '../params';
import type { Plan, PlanError } from '../plan';

/** SoundCloud's player parameters, in camelCase. */
export type SoundCloudOptions = {
  /** The large-artwork player; `false` for the classic one. */
  visual?: boolean;
  /** Accent colour, such as `'#ff5500'`. */
  color?: string;
  autoPlay?: boolean;
  hideRelated?: boolean;
  showComments?: boolean;
  showUser?: boolean;
  showReposts?: boolean;
  showTeaser?: boolean;
  showArtwork?: boolean;
};

const PARAMS: Record<keyof SoundCloudOptions, string> = {
  visual: 'visual',
  color: 'color',
  autoPlay: 'auto_play',
  hideRelated: 'hide_related',
  showComments: 'show_comments',
  showUser: 'show_user',
  showReposts: 'show_reposts',
  showTeaser: 'show_teaser',
  showArtwork: 'show_artwork',
};

// The value in SoundCloud's own embed code.
const ALLOW = 'autoplay; encrypted-media';
// A URL gets the visual player at oEmbed's height (docs/decisions.md D71).
const URL_HEIGHT = 400;

/** A fixed height: the embed code's, else 400px for the visual player. */
export function soundcloudPlan(
  embed: ParsedEmbed,
  options: SoundCloudOptions,
): Plan | PlanError {
  const fromOptions: [string, string | boolean][] = [];
  for (const [option, name] of Object.entries(PARAMS)) {
    const value = options[option as keyof SoundCloudOptions];
    if (value !== undefined) fromOptions.push([name, value]);
  }
  const fromUrl = embed.size === undefined;
  return {
    kind: 'iframe',
    src: `https://w.soundcloud.com/player/${query(
      [['url', embed.url]],
      fromUrl ? [['visual', true]] : undefined,
      optionsWithout(embed.options, ['url', 'secret_token']),
      fromOptions,
    )}`,
    title: 'SoundCloud player',
    allow: ALLOW,
    scrolling: 'no',
    ratio: { width: 16, height: 9 },
    height: embed.size?.height ?? URL_HEIGHT,
  };
}
