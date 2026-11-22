import { telegramPlan, type TelegramOptions } from '../core/plans/telegram';
import { telegram } from '../parser/platforms/telegram';
import type { EmbedSource, SharedProps } from './shared';
import { usePlan } from './use-plan';
import { frameOf } from './iframe-embed';

export type { TelegramOptions };

export type TelegramEmbedProps = EmbedSource &
  Omit<SharedProps, keyof TelegramOptions> &
  TelegramOptions;

const TELEGRAM_OPTIONS = ['userpic', 'color', 'dark', 'darkColor'] as const;

/** At most 500px wide by default, the widest the post renders (docs/decisions.md D49). */
export function TelegramEmbed(props: TelegramEmbedProps) {
  const [plan, frame] = usePlan(
    props,
    telegram,
    TELEGRAM_OPTIONS,
    telegramPlan,
  );
  return plan?.kind === 'iframe' ? frameOf(plan, frame) : null;
}
