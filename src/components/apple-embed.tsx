import { appleMusicPlan, applePodcastsPlan } from '../core/plans/apple';
import { applemusic } from '../parser/platforms/applemusic';
import { applepodcasts } from '../parser/platforms/applepodcasts';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type AppleMusicEmbedProps = EmbedSource & FrameProps;
export type ApplePodcastsEmbedProps = EmbedSource & FrameProps;

/** A fixed height: the `height` prop, else the embed code's, else 175px for a song and 450px for the rest. */
export function AppleMusicEmbed(props: AppleMusicEmbedProps) {
  const [plan, frame] = usePlan(props, applemusic, [], appleMusicPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}

/** A fixed height: the `height` prop, else the embed code's, else 160px for an episode and 450px for a show. */
export function ApplePodcastsEmbed(props: ApplePodcastsEmbedProps) {
  const [plan, frame] = usePlan(props, applepodcasts, [], applePodcastsPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
