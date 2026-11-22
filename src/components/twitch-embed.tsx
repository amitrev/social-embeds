import { twitchPlan, type TwitchOptions } from '../core/plans/twitch';
import { twitchMatcher as twitch } from '../parser/matchers/twitch';
import type { EmbedSource, FrameProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { TwitchOptions };

export type TwitchEmbedProps = EmbedSource &
  Omit<FrameProps, keyof TwitchOptions> &
  TwitchOptions;

const TWITCH_OPTIONS = ['autoplay', 'muted', 'time'] as const;

/** `parent` is the page's own host, added on the client (docs/decisions.md D62, D65). */
export function TwitchEmbed(props: TwitchEmbedProps) {
  const [plan, frame] = usePlan(props, twitch, TWITCH_OPTIONS, twitchPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
