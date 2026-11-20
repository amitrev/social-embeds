import type { ParsedEmbed } from '../../parser';
import { optionsWithout, query } from '../params';
import type { Plan, PlanError } from '../plan';

export type DailymotionOptions = {
  /** The publisher's Player ID from Dailymotion Studio. Replaces the embed code's own. */
  playerId?: string;
  mute?: boolean;
  /** Start time in seconds. */
  startTime?: number;
  loop?: boolean;
};

const PLAYER_ID = /^x[a-z0-9]{3,12}$/;
// The value in Dailymotion's own embed code.
const ALLOW = 'autoplay; fullscreen; picture-in-picture; web-share';

/**
 * Dailymotion refuses embeds without a Player ID: one from the embed code or the `playerId`
 * option, never another account's (docs/decisions.md D63).
 */
export function dailymotionPlan(
  embed: ParsedEmbed,
  options: DailymotionOptions,
): Plan | PlanError {
  const { playerId, mute, startTime, loop } = options;
  const { playerId: parsedPlayer, ...parsed } = embed.options;
  const player = playerId ?? parsedPlayer;
  if (player === undefined)
    return {
      kind: 'error',
      message:
        'social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed',
    };
  if (typeof player !== 'string' || !PLAYER_ID.test(player))
    return {
      kind: 'error',
      message: `social-embeds: not a Dailymotion Player ID: ${String(player)}`,
    };

  const params: [string, string | number][] = [];
  if (mute !== undefined) params.push(['mute', String(mute)]);
  if (startTime !== undefined) params.push(['startTime', startTime]);
  if (loop !== undefined) params.push(['loop', String(loop)]);
  return {
    kind: 'iframe',
    src: `https://geo.dailymotion.com/player/${player}.html${query(
      [['video', embed.id]],
      optionsWithout(parsed, ['video', 'playlist']),
      params,
    )}`,
    title: 'Dailymotion video player',
    allow: ALLOW,
    ratio: { width: 16, height: 9 },
    size: embed.size,
  };
}
