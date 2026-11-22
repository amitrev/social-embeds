import { stravaPlan, type StravaOptions } from '../core/plans/strava';
import { strava } from '../parser/platforms/strava';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { StravaOptions };

export type StravaEmbedProps = EmbedSource &
  Omit<SharedProps, keyof StravaOptions> &
  StravaOptions;

const STRAVA_OPTIONS = ['embedStyle', 'fullWidth', 'mapHash'] as const;

/** At most 554px wide by default, as `embed.js` makes the frame; a full-width route has no maximum (docs/decisions.md D97). */
export function StravaEmbed(props: StravaEmbedProps) {
  const [plan, frame] = usePlan(props, strava, STRAVA_OPTIONS, stravaPlan);
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
