import type { ParsedEmbed } from '../../parser';
import { playerParams, query } from '../params';
import type { Plan, PlanError } from '../plan';

/** The player parameters YouTube documents (developers.google.com/youtube/player_parameters). */
export type YouTubeOptions = {
  autoplay?: boolean;
  ccLangPref?: string;
  ccLoadPolicy?: boolean;
  color?: 'red' | 'white';
  controls?: boolean;
  disablekb?: boolean;
  enablejsapi?: boolean;
  end?: number;
  fs?: boolean;
  hl?: string;
  ivLoadPolicy?: 1 | 3;
  list?: string;
  listType?: 'playlist' | 'user_uploads';
  loop?: boolean;
  origin?: string;
  playlist?: string;
  playsinline?: boolean;
  rel?: boolean;
  start?: number;
  widgetReferrer?: string;
  /** Privacy-enhanced mode: play from youtube-nocookie.com. */
  nocookie?: boolean;
};

const PARAMS: Record<Exclude<keyof YouTubeOptions, 'nocookie'>, string> = {
  autoplay: 'autoplay',
  ccLangPref: 'cc_lang_pref',
  ccLoadPolicy: 'cc_load_policy',
  color: 'color',
  controls: 'controls',
  disablekb: 'disablekb',
  enablejsapi: 'enablejsapi',
  end: 'end',
  fs: 'fs',
  hl: 'hl',
  ivLoadPolicy: 'iv_load_policy',
  list: 'list',
  listType: 'listType',
  loop: 'loop',
  origin: 'origin',
  playlist: 'playlist',
  playsinline: 'playsinline',
  rel: 'rel',
  start: 'start',
  widgetReferrer: 'widget_referrer',
};

// The value in YouTube's own embed code.
const ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

export function youtubePlan(
  embed: ParsedEmbed,
  options: YouTubeOptions,
): Plan | PlanError {
  const { nocookie, ...rest } = options;
  const { nocookie: parsedNocookie, ...parsed } = embed.options;
  const host =
    (nocookie ?? parsedNocookie === true)
      ? 'https://www.youtube-nocookie.com'
      : 'https://www.youtube.com';
  const params = playerParams(rest, PARAMS);
  return {
    kind: 'iframe',
    src: `${host}/embed/${embed.id}${query(Object.entries(parsed), params)}`,
    title: 'YouTube video player',
    allow: ALLOW,
    referrerPolicy: 'strict-origin-when-cross-origin',
    // Shorts are vertical; a Shorts URL is the only input that says so.
    ratio: embed.url.includes('/shorts/')
      ? { width: 9, height: 16 }
      : { width: 16, height: 9 },
    size: embed.size,
  };
}
