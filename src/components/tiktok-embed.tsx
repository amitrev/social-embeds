import { tiktokPlan, type TikTokOptions } from '../core/plans/tiktok';
import { tiktok } from '../parser/platforms/tiktok';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { TikTokOptions };

export type TikTokEmbedProps = EmbedSource &
  Omit<FrameProps, keyof TikTokOptions> &
  TikTokOptions;

const TIKTOK_OPTIONS = [
  'controls',
  'progressBar',
  'playButton',
  'volumeControl',
  'fullscreenButton',
  'timestamp',
  'loop',
  'autoplay',
  'musicInfo',
  'description',
  'rel',
  'nativeContextMenu',
  'closedCaption',
  'forceMuted',
] as const;

/** At most 325px wide by default, the size of TikTok's own embed code (docs/decisions.md D40). */
export function TikTokEmbed(props: TikTokEmbedProps) {
  const [plan, frame] = usePlan(props, tiktok, TIKTOK_OPTIONS, tiktokPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
