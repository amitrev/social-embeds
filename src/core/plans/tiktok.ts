import type { ParsedEmbed } from '../../parser';
import { playerParams, query } from '../params';
import type { Plan, PlanError } from '../plan';

/** The Embed Player parameters TikTok documents (developers.tiktok.com/doc/embed-player). */
export type TikTokOptions = {
  controls?: boolean;
  progressBar?: boolean;
  playButton?: boolean;
  volumeControl?: boolean;
  fullscreenButton?: boolean;
  timestamp?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  musicInfo?: boolean;
  description?: boolean;
  rel?: boolean;
  nativeContextMenu?: boolean;
  closedCaption?: boolean;
  forceMuted?: boolean;
};

const PARAMS: Record<keyof TikTokOptions, string> = {
  controls: 'controls',
  progressBar: 'progress_bar',
  playButton: 'play_button',
  volumeControl: 'volume_control',
  fullscreenButton: 'fullscreen_button',
  timestamp: 'timestamp',
  loop: 'loop',
  autoplay: 'autoplay',
  musicInfo: 'music_info',
  description: 'description',
  rel: 'rel',
  nativeContextMenu: 'native_context_menu',
  closedCaption: 'closed_caption',
  forceMuted: 'force_muted',
};

// The value in TikTok's own embed code.
const ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';

/** At most 325px wide by default, the size of TikTok's own embed code (docs/decisions.md D40). */
export function tiktokPlan(
  embed: ParsedEmbed,
  options: TikTokOptions,
): Plan | PlanError {
  const params = playerParams(options, PARAMS);
  return {
    kind: 'iframe',
    src: `https://www.tiktok.com/player/v1/${embed.id}${query(Object.entries(embed.options), params)}`,
    title: 'TikTok video player',
    allow: ALLOW,
    ratio: { width: 9, height: 16 },
    size: embed.size,
    maxWidth: 325,
  };
}
