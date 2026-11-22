import { threadsPlan, type ThreadsOptions } from '../core/plans/threads';
import { threads } from '../parser/platforms/threads';
import { useReportError } from './hooks';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { ThreadsOptions };

export type ThreadsEmbedProps = EmbedSource &
  Omit<SharedProps, keyof ThreadsOptions> &
  ThreadsOptions;

export function ThreadsEmbed(props: ThreadsEmbedProps) {
  const { url, embed: given, onError, maxWidth, theme, ...shared } = props;
  const { embed, error } = resolveEmbed(url, given, threads);
  const plan = embed ? threadsPlan(embed, { theme }) : undefined;
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
