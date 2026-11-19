import { useReportError } from './hooks';
import { IframeEmbed } from './iframe-embed';
import {
  type EmbedSource,
  type FrameProps,
  query,
  resolveEmbed,
} from './shared';

export type DailymotionOptions = {
  /** The publisher's Player ID from Dailymotion Studio. Replaces the embed code's own. */
  playerId?: string;
  mute?: boolean;
  /** Start time in seconds. */
  startTime?: number;
  loop?: boolean;
};

export type DailymotionEmbedProps = EmbedSource &
  Omit<FrameProps, keyof DailymotionOptions> &
  DailymotionOptions;

const PLAYER_ID = /^x[a-z0-9]{3,12}$/;
// The value in Dailymotion's own embed code.
const ALLOW = 'autoplay; fullscreen; picture-in-picture; web-share';

/**
 * Dailymotion refuses embeds without a Player ID: one from the embed code or the `playerId`
 * prop, never another account's (docs/decisions.md D63).
 */
export function DailymotionEmbed(props: DailymotionEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    playerId,
    mute,
    startTime,
    loop,
    ...frame
  } = props;
  const resolved = resolveEmbed(url, given, 'dailymotion');
  const { playerId: parsedPlayer, ...parsed } = resolved.embed?.options ?? {};
  const player = playerId ?? parsedPlayer;
  const error =
    resolved.error ??
    (player === undefined
      ? 'social-embeds: a Dailymotion embed needs a Player ID: pass playerId to DailymotionEmbed'
      : typeof player !== 'string' || !PLAYER_ID.test(player)
        ? `social-embeds: not a Dailymotion Player ID: ${String(player)}`
        : undefined);
  useReportError(error, onError);
  const { embed } = resolved;
  if (!embed || error) return null;

  const params: [string, string | number][] = [];
  if (mute !== undefined) params.push(['mute', String(mute)]);
  if (startTime !== undefined) params.push(['startTime', startTime]);
  if (loop !== undefined) params.push(['loop', String(loop)]);

  return (
    <IframeEmbed
      {...frame}
      src={`https://geo.dailymotion.com/player/${String(player)}.html${query(
        [['video', embed.id]],
        Object.entries(parsed),
        params,
      )}`}
      title="Dailymotion video player"
      allow={ALLOW}
      ratio={{ width: 16, height: 9 }}
      size={embed.size}
    />
  );
}
