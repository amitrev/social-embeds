import { stravaPlan, type StravaOptions } from '../core/plans/strava';
import { strava } from '../parser/platforms/strava';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { StravaOptions };

export type StravaEmbedProps = EmbedSource &
  Omit<SharedProps, keyof StravaOptions> &
  StravaOptions;

/** At most 554px wide by default, as `embed.js` makes the frame; a full-width route has no maximum (docs/decisions.md D97). */
export function StravaEmbed(props: StravaEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    embedStyle,
    fullWidth,
    mapHash,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, strava);
  const plan = embed
    ? stravaPlan(embed, { embedStyle, fullWidth, mapHash })
    : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'iframe') return null;

  return (
    <IframeEmbed
      {...shared}
      {...planProps(plan)}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
    />
  );
}
