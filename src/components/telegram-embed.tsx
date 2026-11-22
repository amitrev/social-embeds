import { telegramPlan, type TelegramOptions } from '../core/plans/telegram';
import { telegram } from '../parser/platforms/telegram';
import { useReportError } from './hooks';
import { IframeEmbed, planProps } from './iframe-embed';
import { type EmbedSource, resolveEmbed, type SharedProps } from './shared';

export type { TelegramOptions };

export type TelegramEmbedProps = EmbedSource &
  Omit<SharedProps, keyof TelegramOptions> &
  TelegramOptions;

/** At most 500px wide by default, the widest the post renders (docs/decisions.md D49). */
export function TelegramEmbed(props: TelegramEmbedProps) {
  const {
    url,
    embed: given,
    onError,
    maxWidth,
    userpic,
    color,
    dark,
    darkColor,
    ...shared
  } = props;
  const { embed, error } = resolveEmbed(url, given, telegram);
  const plan = embed
    ? telegramPlan(embed, { userpic, color, dark, darkColor })
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
