import { instagramPlan, type InstagramOptions } from '../core/plans/instagram';
import { instagram } from '../parser/platforms/instagram';
import { useReportError } from './hooks';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { InstagramOptions };

export type InstagramEmbedProps = EmbedSource &
  Omit<SharedProps, keyof InstagramOptions> &
  InstagramOptions;

export function InstagramEmbed(props: InstagramEmbedProps) {
  const { url, embed: given, onError, maxWidth, captioned, ...shared } = props;
  const { embed, error } = resolveEmbed(url, given, instagram);
  const plan = embed ? instagramPlan(embed, { captioned }) : undefined;
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
