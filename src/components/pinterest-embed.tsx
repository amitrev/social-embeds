import { pinterestPlan, type PinterestOptions } from '../core/plans/pinterest';
import { pinterest } from '../parser/platforms/pinterest';
import { useReportError } from './hooks';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { PinterestOptions };

export type PinterestEmbedProps = EmbedSource &
  Omit<SharedProps, keyof PinterestOptions> &
  PinterestOptions;

export function PinterestEmbed(props: PinterestEmbedProps) {
  const { url, embed: given, onError, maxWidth, pinWidth, ...shared } = props;
  const { embed, error } = resolveEmbed(url, given, pinterest);
  const plan = embed ? pinterestPlan(embed, { pinWidth }) : undefined;
  useReportError(
    error ?? (plan?.kind === 'error' ? plan.message : undefined),
    onError,
  );
  if (plan?.kind !== 'script') return null;

  return (
    <ScriptEmbed
      key={plan.key}
      {...shared}
      onError={onError}
      maxWidth={maxWidth ?? plan.maxWidth}
      driver={plan.driver}
      markup={plan.markup}
      hasFallback={plan.hasFallback}
      minHeight={plan.minHeight}
      label={plan.label}
    />
  );
}
