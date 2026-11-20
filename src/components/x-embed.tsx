import { xPlan, type XOptions } from '../core/plans/x';
import { useReportError } from './hooks';
import { ScriptEmbed } from './script-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { XOptions };

export type XEmbedProps = EmbedSource &
  Omit<SharedProps, keyof XOptions> &
  XOptions;

export function XEmbed(props: XEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    theme,
    conversation,
    cards,
    align,
    lang,
    dnt,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, 'x');
  const plan = embed
    ? xPlan(embed, { theme, conversation, cards, align, lang, dnt })
    : undefined;
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
